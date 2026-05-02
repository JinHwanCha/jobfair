import { Mentor, Applicant, Assignment, AssignmentSlot, MentorSlot, MentoringTopic } from '@/types';

const NUM_TIMES = 4; // 4개 타임 슬롯
const NUM_CHOICES = 6; // 6지망까지 선택

/**
 * 특정 멘티-멘토 쌍을 배정에서 영구 제외 (이름 기준)
 * 예) 두나린-장한솔: 개인적 친분으로 공식 멘토링 불필요
 * 형식: { applicantName, mentorName }
 */
const EXCLUDED_PAIRS_BY_NAME: { applicantName: string; mentorName: string }[] = [
  { applicantName: '두나린', mentorName: '장한솔' },
];

/** EXCLUDED_PAIRS_BY_NAME을 applicantId/mentorId 쌍으로 변환 */
function buildExcludedPairs(
  applicants: Applicant[],
  mentors: Mentor[]
): { applicantId: string; mentorId: string }[] {
  const result: { applicantId: string; mentorId: string }[] = [];
  for (const { applicantName, mentorName } of EXCLUDED_PAIRS_BY_NAME) {
    const applicant = applicants.find(a => a.name === applicantName);
    const mentor = mentors.find(m => m.name === mentorName);
    if (applicant && mentor) result.push({ applicantId: applicant.id, mentorId: mentor.id });
  }
  return result;
}

// 신청자의 나이 그룹 결정 (1-2학년 / 3-4학년·취준·기타)
type AgeGroup = 'junior' | 'senior';
function getApplicantAgeGroup(applicant: Applicant): AgeGroup {
  const status = applicant.currentStatus || '';
  if (status === '1학년' || status === '2학년') return 'junior';
  return 'senior'; // 3학년, 4학년, 취준생, 기타
}

// 신청자의 언어 그룹 결정
type LangGroup = 'korean' | 'english' | 'chinese';
function getApplicantLangGroup(applicant: Applicant): LangGroup {
  if (!applicant.isForeigner) return 'korean';
  if (applicant.languageGroup === 'english') return 'english';
  if (applicant.languageGroup === 'chinese') return 'chinese';
  return 'korean'; // fallback
}

/**
 * 멘토 타임 슬롯별 언어 그룹 추적
 * key: "mentorId:timeNum" → value: LangGroup | null (빈 슬롯)
 */
type SlotLangMap = Map<string, LangGroup | null>;

/**
 * 멘토 타임 슬롯별 관심 주제 추적
 * key: "mentorId:timeNum" → value: MentoringTopic[] (해당 슬롯에 배정된 신청자들의 주요 관심 주제)
 */
type SlotTopicMap = Map<string, MentoringTopic[]>;

/**
 * 멘토 타임 슬롯별 나이 그룹 추적
 * key: "mentorId:timeNum" → value: AgeGroup | null (빈 슬롯)
 */
type SlotAgeGroupMap = Map<string, AgeGroup | null>;

function slotLangKey(mentorId: string, timeNum: number): string {
  return `${mentorId}:${timeNum}`;
}

/**
 * 자동 멘토 배정 알고리즘
 *
 * 배정 규칙:
 * 1. 전체 신청자를 선착순으로 정렬, 관심 주제별로 그룹핑
 * 2. 6지망까지 선택하지만, 4개 타임 슬롯에 배정
 * 3. 1~4지망 먼저 배정 시도, 실패 시 5~6지망이 우선 대체
 * 4. 멘토당 타임별 4명 제한 (maxCapacity)
 * 5. 같은 타임 슬롯에는 같은 언어 그룹만 배정 (한국인/영어권/중화권 분리)
 *    - 빈 슬롯은 누구든 먼저 들어가는 사람의 그룹으로 확정
 * 6. 같은 타임 슬롯에는 관심 주제가 겹치는 신청자를 우선 배치
 * 7. 같은 타임 슬롯에는 같은 나이 그룹(1-2학년 / 3-4학년·취준·기타) 우선 배치
 * 8. 6지망까지 모두 실패 시 희망직군(desiredField) 기반으로 멘토 매칭
 * 9. 최후 수단으로 아무 멘토나 배정
 */
export function runAutoAssignment(
  applicants: Applicant[],
  mentors: Mentor[],
  extraExcludePairs: { applicantId: string; mentorId: string }[] = []
): { assignments: Assignment[]; mentorSlots: MentorSlot[] } {
  // 하드코딩된 제외 쌍 + 호출자가 넘긴 추가 제외 쌍 합산
  const excludePairs = [...buildExcludedPairs(applicants, mentors), ...extraExcludePairs];
  // 멘토 슬롯 초기화 (4타임)
  const mentorSlots: MentorSlot[] = mentors.map(mentor => ({
    mentorId: mentor.id,
    time1: [], time2: [], time3: [], time4: [],
  }));

  // 타임 슬롯별 언어 그룹 추적 초기화 (전부 null = 빈 슬롯)
  const slotLangMap: SlotLangMap = new Map();
  // 타임 슬롯별 관심 주제 추적 초기화
  const slotTopicMap: SlotTopicMap = new Map();
  // 타임 슬롯별 나이 그룹 추적 초기화
  const slotAgeGroupMap: SlotAgeGroupMap = new Map();
  for (const mentor of mentors) {
    for (let t = 1; t <= NUM_TIMES; t++) {
      slotLangMap.set(slotLangKey(mentor.id, t), null);
      slotTopicMap.set(slotLangKey(mentor.id, t), []);
      slotAgeGroupMap.set(slotLangKey(mentor.id, t), null);
    }
  }

  // 전체 신청자를 선착순으로 정렬 후 관심 주제별 그룹핑
  const sortedApplicants = [...applicants].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );

  // 선착순 그대로 처리 (topic/age 그룹핑 제거)
  // 그룹핑은 그룹 간 선착순을 왜곡시켜 빠른 신청자가 밀리는 버그 유발
  // 관심주제·나이 선호는 tryAssignToMentor 내 scoring(topicOverlap, ageScore)으로 처리됨
  const groupedApplicants = sortedApplicants;

  const assignments: Assignment[] = [];
  const mentorMap = new Map(mentors.map(m => [m.id, m]));
  const categoryMentorsMap = new Map<string, Mentor[]>();

  mentors.forEach(mentor => {
    const existing = categoryMentorsMap.get(mentor.category) || [];
    categoryMentorsMap.set(mentor.category, [...existing, mentor]);
  });

  // 희망직군별 멘토 매핑 (desiredField fallback용)
  const fieldMentorsMap = new Map<string, Mentor[]>();
  mentors.forEach(mentor => {
    // 멘토의 field와 jobTitle을 기반으로 매핑
    const fields = [mentor.field, mentor.jobTitle, mentor.category].filter(Boolean);
    for (const field of fields) {
      const existing = fieldMentorsMap.get(field) || [];
      fieldMentorsMap.set(field, [...existing, mentor]);
    }
  });

  // 신청자 ID → 언어 그룹 맵 (후처리 통합 패스에 사용)
  const applicantLangByIdMap = new Map<string, LangGroup>(
    groupedApplicants.map(a => [a.id, getApplicantLangGroup(a)])
  );

  // excludePairs를 신청자별 제외 멘토 Set으로 변환
  const excludeByApplicant = new Map<string, Set<string>>();
  for (const { applicantId, mentorId } of excludePairs) {
    if (!excludeByApplicant.has(applicantId)) excludeByApplicant.set(applicantId, new Set());
    excludeByApplicant.get(applicantId)!.add(mentorId);
  }

  // 전체 신청자를 선착순으로 배정 (언어 그룹별 슬롯 분리)
  for (const applicant of groupedApplicants) {
    const langGroup = getApplicantLangGroup(applicant);
    const ageGroup = getApplicantAgeGroup(applicant);
    const excludedMentors = excludeByApplicant.get(applicant.id) ?? new Set<string>();
    const assignment = assignSingleApplicant(
      applicant, langGroup, ageGroup, mentors, mentorSlots, slotLangMap, slotTopicMap, slotAgeGroupMap, mentorMap, categoryMentorsMap, fieldMentorsMap, excludedMentors
    );
    assignments.push(assignment);
  }

  // 후처리: 같은 멘토에 배정된 동일 외국어 그룹 신청자를 같은 타임으로 통합
  runConsolidationPass(assignments, mentorSlots, slotLangMap, applicantLangByIdMap, mentors);

  return { assignments, mentorSlots };
}

/**
 * 단일 신청자 배정
 * - 6지망까지 선택하지만 4개 타임 슬롯에만 배정
 * - 1~4지망 우선, 5~6지망은 우선 대체
 * - 같은 언어 그룹의 슬롯만 배정 가능
 */
function assignSingleApplicant(
  applicant: Applicant,
  langGroup: LangGroup,
  ageGroup: AgeGroup,
  mentors: Mentor[],
  mentorSlots: MentorSlot[],
  slotLangMap: SlotLangMap,
  slotTopicMap: SlotTopicMap,
  slotAgeGroupMap: SlotAgeGroupMap,
  mentorMap: Map<string, Mentor>,
  categoryMentorsMap: Map<string, Mentor[]>,
  fieldMentorsMap: Map<string, Mentor[]>,
  excludedMentors: Set<string> = new Set()
): Assignment {
  const assignment: Assignment = {
    applicantId: applicant.id,
    applicantName: applicant.name,
    phone4: applicant.phone4,
    time1: null, time2: null, time3: null, time4: null,
  };

  // 6지망까지 전부 수집 (제외 멘토 필터링)
  const choices: { choiceNum: number; mentorId: string }[] = [];
  for (let i = 1; i <= NUM_CHOICES; i++) {
    const mentorId = (applicant as unknown as Record<string, unknown>)[`choice${i}`] as string;
    if (mentorId && !excludedMentors.has(mentorId)) choices.push({ choiceNum: i, mentorId });
  }

  // 각 타임에 배정될 슬롯 추적
  const assignedTimes = new Set<number>();
  const applicantTopics = applicant.interestTopics || [];

  // 1~4지망과 5~6지망 분리
  const primaryChoices = choices.filter(c => c.choiceNum <= 4);
  const secondaryChoices = choices.filter(c => c.choiceNum > 4);

  // Phase 0~2 공통: 배정된 멘토 중복 방지 (같은 멘토를 두 타임에 배정하는 오류 방지)
  const earlyPhaseAssignedMentorIds = new Set<string>();

  // Phase 0 (외국어 전용): 이미 같은 언어 그룹 슬롯이 있는 멘토 우선 배정
  // 핵심: 통합 후보를 choiceNum 내림차순으로 처리 → 늦은 지망일수록 남은 time이 부족해지므로
  // 먼저 처리해야 통합 가능. (예: André choice1=이수지(english↑이윤영), choice6=서성구(english↑류웬리)
  //   → 이수지(choice1)보다 서성구(choice6)를 먼저 처리해야 André가 서성구 time1에 배정됨)
  if (langGroup !== 'korean') {
    // 통합 가능 후보: 이미 같은 언어 그룹 슬롯이 있는 멘토들만 수집
    const consolidationCandidates = choices.filter(({ mentorId }) => {
      for (let t = 1; t <= NUM_TIMES; t++) {
        if (slotLangMap.get(slotLangKey(mentorId, t)) === langGroup) return true;
      }
      return false;
    });
    // 높은 choiceNum 순 정렬: 나중 지망(늦게 처리 시 time 부족)을 먼저 해결
    consolidationCandidates.sort((a, b) => b.choiceNum - a.choiceNum);

    for (const { choiceNum, mentorId } of consolidationCandidates) {
      if (assignedTimes.size >= NUM_TIMES) break;
      if (earlyPhaseAssignedMentorIds.has(mentorId)) continue;

      const mentor = mentorMap.get(mentorId);
      if (!mentor) continue;
      const mentorSlot = mentorSlots.find(s => s.mentorId === mentorId);
      if (!mentorSlot) continue;

      const choiceMessage = (applicant as unknown as Record<string, unknown>)[`message${choiceNum}`] as string | undefined;

      const result = tryAssignToMentor(
        applicant.id, mentor, mentorSlot, assignedTimes, true, choiceMessage,
        langGroup, slotLangMap, applicantTopics, slotTopicMap, ageGroup, slotAgeGroupMap
      );
      if (result) {
        assignedTimes.add(result.timeNum);
        earlyPhaseAssignedMentorIds.add(mentorId);
        setAssignmentSlot(assignment, result.timeNum, result.slot);
      }
    }
  }

  // Phase 1: 1~4지망 우선 배정 (4개 타임 다 채울 때까지)
  for (const { choiceNum, mentorId } of primaryChoices) {
    if (assignedTimes.size >= NUM_TIMES) break;
    if (earlyPhaseAssignedMentorIds.has(mentorId)) continue; // Phase 0에서 이미 배정

    const mentor = mentorMap.get(mentorId);
    if (!mentor) continue;

    const mentorSlot = mentorSlots.find(s => s.mentorId === mentorId);
    if (!mentorSlot) continue;

    const choiceMessage = (applicant as unknown as Record<string, unknown>)[`message${choiceNum}`] as string | undefined;

    const result = tryAssignToMentor(
      applicant.id,
      mentor,
      mentorSlot,
      assignedTimes,
      true,
      choiceMessage,
      langGroup,
      slotLangMap,
      applicantTopics,
      slotTopicMap,
      ageGroup,
      slotAgeGroupMap
    );

    if (result) {
      assignedTimes.add(result.timeNum);
      earlyPhaseAssignedMentorIds.add(mentorId);
      setAssignmentSlot(assignment, result.timeNum, result.slot);
    }
  }

  // Phase 2: 5~6지망으로 남은 타임 보충
  for (const { choiceNum, mentorId } of secondaryChoices) {
    if (assignedTimes.size >= NUM_TIMES) break;
    if (earlyPhaseAssignedMentorIds.has(mentorId)) continue; // Phase 0에서 이미 배정

    const mentor = mentorMap.get(mentorId);
    if (!mentor) continue;

    const mentorSlot = mentorSlots.find(s => s.mentorId === mentorId);
    if (!mentorSlot) continue;

    const choiceMessage = (applicant as unknown as Record<string, unknown>)[`message${choiceNum}`] as string | undefined;

    const result = tryAssignToMentor(
      applicant.id,
      mentor,
      mentorSlot,
      assignedTimes,
      true,
      choiceMessage,
      langGroup,
      slotLangMap,
      applicantTopics,
      slotTopicMap,
      ageGroup,
      slotAgeGroupMap
    );

    if (result) {
      assignedTimes.add(result.timeNum);
      earlyPhaseAssignedMentorIds.add(mentorId);
      setAssignmentSlot(assignment, result.timeNum, result.slot);
    }
  }

  // Phase 3: 아직 빈 타임이 있으면 대체 배정
  const allTimes = Array.from({ length: NUM_TIMES }, (_, i) => i + 1);
  const unassignedTimes = allTimes.filter(t => !assignedTimes.has(t));

  const originalChoiceIds = choices.map(c => c.mentorId);

  // 이미 배정된 멘토 ID 추적 (중복 배정 방지)
  const assignedMentorIds = new Set<string>();
  for (const t of assignedTimes) {
    const key = `time${t}` as keyof Assignment;
    const slot = assignment[key] as AssignmentSlot | null;
    if (slot) assignedMentorIds.add(slot.mentorId);
  }

  // Phase 1~2에서 배정되지 못한 지망 목록 (timeNum과 choiceNum을 동일시하는 오류 방지)
  const phase1AssignedMentorIds = new Set<string>(assignedMentorIds);
  const remainingChoices = choices.filter(c => !phase1AssignedMentorIds.has(c.mentorId));
  let remainingChoiceIdx = 0;

  for (const timeNum of unassignedTimes) {
    // Phase 1~2에서 배정 못한 지망을 순서대로 "원래 희망" 표시용으로 사용
    const originalChoiceForTime = remainingChoices[remainingChoiceIdx++] ?? null;
    const originalChoiceName = originalChoiceForTime ? mentorMap.get(originalChoiceForTime.mentorId)?.name : undefined;
    const originalMessage = originalChoiceForTime
      ? ((applicant as unknown as Record<string, unknown>)[`message${originalChoiceForTime.choiceNum}`] as string | undefined)
      : undefined;

    let assigned = false;

    // 3-1: 원래 선택했지만 아직 배정되지 않은 멘토 다시 시도 (신청자 수 적은 순)
    const sortedChoices = [...choices].sort((a, b) => {
      const slotA = mentorSlots.find(s => s.mentorId === a.mentorId);
      const slotB = mentorSlots.find(s => s.mentorId === b.mentorId);
      return (slotA ? getTotalAssigned(slotA) : 0) - (slotB ? getTotalAssigned(slotB) : 0);
    });
    for (const { mentorId } of sortedChoices) {
      if (assignedMentorIds.has(mentorId)) continue;
      const mentor = mentorMap.get(mentorId);
      if (!mentor) continue;
      const mentorSlot = mentorSlots.find(s => s.mentorId === mentorId);
      if (!mentorSlot) continue;

      const result = tryAssignToMentorAtTime(
        applicant.id, mentor, mentorSlot, timeNum, true, undefined, undefined, langGroup, slotLangMap, applicantTopics, slotTopicMap, ageGroup, slotAgeGroupMap
      );
      if (result) {
        setAssignmentSlot(assignment, timeNum, result.slot);
        assignedMentorIds.add(mentorId);
        assigned = true;
        break;
      }
    }

    if (assigned) continue;

    // 3-2: 희망직군(desiredField)에 해당하는 멘토 우선 배정
    if (applicant.desiredField) {
      const fieldMentors = fieldMentorsMap.get(applicant.desiredField) || [];
      const fieldAlternatives = fieldMentors
        .filter(m => !assignedMentorIds.has(m.id))
        .sort((a, b) => {
          const slotA = mentorSlots.find(s => s.mentorId === a.id);
          const slotB = mentorSlots.find(s => s.mentorId === b.id);
          return (slotA ? getTotalAssigned(slotA) : 0) - (slotB ? getTotalAssigned(slotB) : 0);
        });

      for (const altMentor of fieldAlternatives) {
        const altSlot = mentorSlots.find(s => s.mentorId === altMentor.id);
        if (!altSlot) continue;

        const result = tryAssignToMentorAtTime(
          applicant.id, altMentor, altSlot, timeNum, false, originalChoiceName, originalMessage, langGroup, slotLangMap, applicantTopics, slotTopicMap, ageGroup, slotAgeGroupMap
        );
        if (result) {
          setAssignmentSlot(assignment, timeNum, result.slot);
          assignedMentorIds.add(altMentor.id);
          assigned = true;
          break;
        }
      }
    }

    if (assigned) continue;

    // 3-3: 같은 카테고리 대체 멘토
    const originalCategories = originalChoiceIds
      .map(id => mentorMap.get(id)?.category)
      .filter((c): c is string => !!c);
    const uniqueCategories = [...new Set(originalCategories)];

    for (const category of uniqueCategories) {
      if (assigned) break;

      const sameCategoryMentors = categoryMentorsMap.get(category) || [];
      const alternativeMentors = sameCategoryMentors
        .filter(m => !assignedMentorIds.has(m.id))
        .sort((a, b) => {
          const slotA = mentorSlots.find(s => s.mentorId === a.id);
          const slotB = mentorSlots.find(s => s.mentorId === b.id);
          return (slotA ? getTotalAssigned(slotA) : 0) - (slotB ? getTotalAssigned(slotB) : 0);
        });

      for (const altMentor of alternativeMentors) {
        const altSlot = mentorSlots.find(s => s.mentorId === altMentor.id);
        if (!altSlot) continue;

        const result = tryAssignToMentorAtTime(
          applicant.id,
          altMentor,
          altSlot,
          timeNum,
          false,
          originalChoiceName,
          originalMessage,
          langGroup,
          slotLangMap,
          applicantTopics,
          slotTopicMap,
          ageGroup,
          slotAgeGroupMap
        );

        if (result) {
          setAssignmentSlot(assignment, timeNum, result.slot);
          assignedMentorIds.add(altMentor.id);
          assigned = true;
          break;
        }
      }
    }

    // 3-4: 최후 수단 - 아무 멘토나 배정 (신청자 수 적은 순)
    if (!assigned) {
      const sortedMentors = [...mentors].sort((a, b) => {
        const slotA = mentorSlots.find(s => s.mentorId === a.id);
        const slotB = mentorSlots.find(s => s.mentorId === b.id);
        return (slotA ? getTotalAssigned(slotA) : 0) - (slotB ? getTotalAssigned(slotB) : 0);
      });
      for (const mentor of sortedMentors) {
        if (assignedMentorIds.has(mentor.id)) continue;
        const slot = mentorSlots.find(s => s.mentorId === mentor.id);
        if (!slot) continue;

        const result = tryAssignToMentorAtTime(
          applicant.id,
          mentor,
          slot,
          timeNum,
          false,
          originalChoiceName,
          originalMessage,
          langGroup,
          slotLangMap,
          applicantTopics,
          slotTopicMap,
          ageGroup,
          slotAgeGroupMap
        );

        if (result) {
          setAssignmentSlot(assignment, timeNum, result.slot);
          assignedMentorIds.add(mentor.id);
          break;
        }
      }
    }
  }

  return assignment;
}

/**
 * 후처리 통합 패스: 같은 멘토에 배정된 동일 외국어 그룹(영어권/중화권) 신청자가
 * 서로 다른 타임에 분산된 경우, 두 타임 배정을 swap하여 같은 타임으로 모음.
 *
 * Swap 조건:
 * - mentor M의 tA, tB 모두 같은 외국어 언어권으로 태깅되어 있을 것
 * - M의 tA에 여유 자리가 있을 것
 * - 신청자의 기존 tA 멘토(Y)의 tB가 언어 호환 + 여유 자리 있을 것
 * 변화가 없을 때까지 반복하여 여러 명 통합 가능
 */
function runConsolidationPass(
  assignments: Assignment[],
  mentorSlots: MentorSlot[],
  slotLangMap: SlotLangMap,
  applicantLangByIdMap: Map<string, LangGroup>,
  mentors: Mentor[]
): void {
  const assignmentById = new Map(assignments.map(a => [a.applicantId, a]));
  const mentorSlotById = new Map(mentorSlots.map(s => [s.mentorId, s]));
  const mentorById = new Map(mentors.map(m => [m.id, m]));

  let madeSwap = true;
  while (madeSwap) {
    madeSwap = false;

    outer:
    for (const mentor of mentors) {
      const mSlot = mentorSlotById.get(mentor.id);
      if (!mSlot) continue;

      for (let tA = 1; tA <= NUM_TIMES; tA++) {
        for (let tB = tA + 1; tB <= NUM_TIMES; tB++) {
          const langA = slotLangMap.get(slotLangKey(mentor.id, tA));
          const langB = slotLangMap.get(slotLangKey(mentor.id, tB));

          // 두 타임 모두 같은 외국어 그룹이어야 함 (korean 제외)
          if (!langA || !langB || langA === 'korean' || langB === 'korean') continue;
          if (langA !== langB) continue;

          const lang = langA;
          const tAArr = getSlotArray(mSlot, tA);
          const tBArr = getSlotArray(mSlot, tB);

          // tB 신청자를 tA로 이동 시도
          for (let i = tBArr.length - 1; i >= 0; i--) {
            const applicantId = tBArr[i];
            const applicantLang = applicantLangByIdMap.get(applicantId);
            if (!applicantLang || applicantLang === 'korean') continue;

            // M의 tA에 여유 자리 필요
            if (tAArr.length >= mentor.maxCapacity) break;

            // 신청자의 현재 tA 배정 멘토 Y 조회
            const asgn = assignmentById.get(applicantId);
            if (!asgn) continue;
            const slotAtTA = (asgn as unknown as Record<string, unknown>)[`time${tA}`] as AssignmentSlot | null;
            if (!slotAtTA) continue;
            // 이미 같은 멘토 M에 tA 배정된 경우 skip
            if (slotAtTA.mentorId === mentor.id) continue;

            const mentorY = mentorById.get(slotAtTA.mentorId);
            if (!mentorY) continue;
            const ySlot = mentorSlotById.get(mentorY.id);
            if (!ySlot) continue;

            const yTBArr = getSlotArray(ySlot, tB);
            const yLangAtTB = slotLangMap.get(slotLangKey(mentorY.id, tB));

            // Y의 tB: 언어 호환 + 여유 자리 필요
            if (yTBArr.length >= mentorY.maxCapacity) continue;
            if (yLangAtTB !== null && yLangAtTB !== undefined && yLangAtTB !== lang) continue;

            // === Swap 실행 ===
            // M: tB에서 제거 → tA에 추가
            tBArr.splice(i, 1);
            tAArr.push(applicantId);

            // Y: tA에서 제거 → tB에 추가
            const yTAArr = getSlotArray(ySlot, tA);
            const yIdx = yTAArr.indexOf(applicantId);
            if (yIdx >= 0) yTAArr.splice(yIdx, 1);
            yTBArr.push(applicantId);

            // 배정 레코드: tA ↔ tB 교환
            const rec = asgn as unknown as Record<string, unknown>;
            const oldTA = rec[`time${tA}`] as AssignmentSlot;
            const oldTB = rec[`time${tB}`] as AssignmentSlot;
            rec[`time${tA}`] = oldTB;
            rec[`time${tB}`] = oldTA;

            // slotLangMap 갱신
            if (!yLangAtTB) slotLangMap.set(slotLangKey(mentorY.id, tB), lang);
            if (tBArr.length === 0) slotLangMap.set(slotLangKey(mentor.id, tB), null);
            const hasForeignInYtA = yTAArr.some(id => {
              const l = applicantLangByIdMap.get(id);
              return l && l !== 'korean';
            });
            if (!hasForeignInYtA) slotLangMap.set(slotLangKey(mentorY.id, tA), null);

            madeSwap = true;
            break outer;
          }
        }
      }
    }
  }
}

/**
 * 슬롯이 해당 언어 그룹과 호환되는지 확인
 * - 빈 슬롯(null): 누구든 OK
 * - 이미 그룹이 정해진 슬롯: 같은 그룹만 OK
 */
function isSlotCompatible(
  slotLangMap: SlotLangMap,
  mentorId: string,
  timeNum: number,
  langGroup: LangGroup
): boolean {
  const current = slotLangMap.get(slotLangKey(mentorId, timeNum));
  return current === null || current === undefined || current === langGroup;
}

/**
 * 슬롯에 언어 그룹 태그 설정
 */
function markSlotLangGroup(
  slotLangMap: SlotLangMap,
  mentorId: string,
  timeNum: number,
  langGroup: LangGroup
): void {
  slotLangMap.set(slotLangKey(mentorId, timeNum), langGroup);
}

/**
 * 슬롯에 관심 주제 추가
 */
function markSlotTopics(
  slotTopicMap: SlotTopicMap,
  mentorId: string,
  timeNum: number,
  topics: MentoringTopic[]
): void {
  const key = slotLangKey(mentorId, timeNum);
  const existing = slotTopicMap.get(key) || [];
  slotTopicMap.set(key, [...existing, ...topics]);
}

/**
 * 슬롯의 관심 주제와 신청자 주제 겹침 점수 계산 (높을수록 좋음)
 */
function getTopicOverlapScore(
  slotTopicMap: SlotTopicMap,
  mentorId: string,
  timeNum: number,
  applicantTopics: MentoringTopic[]
): number {
  const key = slotLangKey(mentorId, timeNum);
  const slotTopics = slotTopicMap.get(key) || [];
  if (slotTopics.length === 0 || applicantTopics.length === 0) return 0;
  return applicantTopics.filter(t => slotTopics.includes(t)).length;
}

/**
 * 슬롯의 나이 그룹 일치 점수 (1 = 일치, 0 = 빈 슬롯, -1 = 불일치)
 */
function getAgeGroupScore(
  slotAgeGroupMap: SlotAgeGroupMap,
  mentorId: string,
  timeNum: number,
  ageGroup: AgeGroup
): number {
  const current = slotAgeGroupMap.get(slotLangKey(mentorId, timeNum));
  if (current === null || current === undefined) return 0; // 빈 슬롯
  return current === ageGroup ? 1 : -1;
}

/**
 * 슬롯에 나이 그룹 태그 설정 (처음 배정된 사람의 그룹으로 확정)
 */
function markSlotAgeGroup(
  slotAgeGroupMap: SlotAgeGroupMap,
  mentorId: string,
  timeNum: number,
  ageGroup: AgeGroup
): void {
  const key = slotLangKey(mentorId, timeNum);
  if (slotAgeGroupMap.get(key) === null || slotAgeGroupMap.get(key) === undefined) {
    slotAgeGroupMap.set(key, ageGroup);
  }
}

// 멘토에게 배정 시도 (가능한 타임 자동 선택, 언어 그룹 + 관심 주제 + 나이 그룹 체크)
function tryAssignToMentor(
  applicantId: string,
  mentor: Mentor,
  mentorSlot: MentorSlot,
  excludeTimes: Set<number>,
  isOriginalChoice: boolean,
  message: string | undefined,
  langGroup: LangGroup,
  slotLangMap: SlotLangMap,
  applicantTopics: MentoringTopic[],
  slotTopicMap: SlotTopicMap,
  ageGroup: AgeGroup,
  slotAgeGroupMap: SlotAgeGroupMap
): { timeNum: number; slot: AssignmentSlot } | null {
  const times = Array.from({ length: NUM_TIMES }, (_, i) => i + 1).filter(t => !excludeTimes.has(t));

  // 관심 주제 겹침이 많은 슬롯 우선 정렬
  const compatibleTimes = times.filter(t => {
    if (!isSlotCompatible(slotLangMap, mentor.id, t, langGroup)) return false;
    const slotArray = getSlotArray(mentorSlot, t);
    return slotArray.length < mentor.maxCapacity;
  });

  if (compatibleTimes.length === 0) return null;

  // 언어 그룹 통합(consolidation) + 관심 주제 겹침 + 나이 그룹 일치 점수가 높은 타임 우선 선택
  // consolidation 보너스: 이미 같은 언어 그룹으로 태깅된 슬롯을 빈 슬롯보다 우선 (같은 언어권 묶기)
  compatibleTimes.sort((a, b) => {
    const langA = slotLangMap.get(slotLangKey(mentor.id, a));
    const langB = slotLangMap.get(slotLangKey(mentor.id, b));
    // 이미 같은 언어로 태깅된 슬롯 +2 보너스 (ageScore 페널티 -1 을 극복할 수 있도록)
    const consolidationA = (langA !== null && langA !== undefined) ? 2 : 0;
    const consolidationB = (langB !== null && langB !== undefined) ? 2 : 0;
    const topicScoreA = getTopicOverlapScore(slotTopicMap, mentor.id, a, applicantTopics);
    const topicScoreB = getTopicOverlapScore(slotTopicMap, mentor.id, b, applicantTopics);
    const ageScoreA = getAgeGroupScore(slotAgeGroupMap, mentor.id, a, ageGroup);
    const ageScoreB = getAgeGroupScore(slotAgeGroupMap, mentor.id, b, ageGroup);
    const totalA = consolidationA + topicScoreA + ageScoreA;
    const totalB = consolidationB + topicScoreB + ageScoreB;
    return totalB - totalA;
  });

  const timeNum = compatibleTimes[0];
  const slotArray = getSlotArray(mentorSlot, timeNum);
  slotArray.push(applicantId);
  markSlotLangGroup(slotLangMap, mentor.id, timeNum, langGroup);
  markSlotTopics(slotTopicMap, mentor.id, timeNum, applicantTopics);
  markSlotAgeGroup(slotAgeGroupMap, mentor.id, timeNum, ageGroup);
  
  return {
    timeNum,
    slot: {
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorJob: mentor.job,
      location: mentor.location || `장소${mentor.id}`,
      isOriginalChoice,
      message: message || undefined,
    },
  };
}

// 특정 타임에 멘토 배정 시도 (언어 그룹 + 관심 주제 + 나이 그룹 체크)
function tryAssignToMentorAtTime(
  applicantId: string,
  mentor: Mentor,
  mentorSlot: MentorSlot,
  timeNum: number,
  isOriginalChoice: boolean,
  originalChoiceName: string | undefined,
  originalMessage: string | undefined,
  langGroup: LangGroup,
  slotLangMap: SlotLangMap,
  applicantTopics: MentoringTopic[],
  slotTopicMap: SlotTopicMap,
  ageGroup: AgeGroup,
  slotAgeGroupMap: SlotAgeGroupMap
): { slot: AssignmentSlot } | null {
  // 언어 그룹 호환성 체크
  if (!isSlotCompatible(slotLangMap, mentor.id, timeNum, langGroup)) return null;

  const slotArray = getSlotArray(mentorSlot, timeNum);

  if (slotArray.length < mentor.maxCapacity) {
    slotArray.push(applicantId);
    markSlotLangGroup(slotLangMap, mentor.id, timeNum, langGroup);
    markSlotTopics(slotTopicMap, mentor.id, timeNum, applicantTopics);
    markSlotAgeGroup(slotAgeGroupMap, mentor.id, timeNum, ageGroup);

    return {
      slot: {
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorJob: mentor.job,
        location: mentor.location || `장소${mentor.id}`,
        isOriginalChoice,
        originalChoice: isOriginalChoice ? undefined : originalChoiceName,
        originalMessage: isOriginalChoice ? undefined : originalMessage,
      },
    };
  }

  return null;
}

// 멘토의 전체 타임 슬롯 합산 배정 인원수 계산
function getTotalAssigned(mentorSlot: MentorSlot): number {
  return mentorSlot.time1.length + mentorSlot.time2.length + mentorSlot.time3.length + mentorSlot.time4.length;
}

// 타임 번호에 해당하는 슬롯 배열 가져오기
function getSlotArray(mentorSlot: MentorSlot, timeNum: number): string[] {
  const key = `time${timeNum}` as keyof MentorSlot;
  return mentorSlot[key] as string[];
}

// 배정 결과에 슬롯 설정
function setAssignmentSlot(
  assignment: Assignment,
  timeNum: number,
  slot: AssignmentSlot
): void {
  const key = `time${timeNum}` as keyof Assignment;
  (assignment as unknown as Record<string, unknown>)[key] = slot;
}
