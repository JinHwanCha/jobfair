import { Mentor, Applicant, Assignment, AssignmentSlot, MentorSlot, MentoringTopic } from '@/types';

const NUM_TIMES = 4; // 4개 타임 슬롯
const NUM_CHOICES = 6; // 6지망까지 선택

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
 * 7. 6지망까지 모두 실패 시 희망직군(desiredField) 기반으로 멘토 매칭
 * 8. 최후 수단으로 아무 멘토나 배정
 */
export function runAutoAssignment(
  applicants: Applicant[],
  mentors: Mentor[]
): { assignments: Assignment[]; mentorSlots: MentorSlot[] } {
  // 멘토 슬롯 초기화 (4타임)
  const mentorSlots: MentorSlot[] = mentors.map(mentor => ({
    mentorId: mentor.id,
    time1: [], time2: [], time3: [], time4: [],
  }));

  // 타임 슬롯별 언어 그룹 추적 초기화 (전부 null = 빈 슬롯)
  const slotLangMap: SlotLangMap = new Map();
  // 타임 슬롯별 관심 주제 추적 초기화
  const slotTopicMap: SlotTopicMap = new Map();
  for (const mentor of mentors) {
    for (let t = 1; t <= NUM_TIMES; t++) {
      slotLangMap.set(slotLangKey(mentor.id, t), null);
      slotTopicMap.set(slotLangKey(mentor.id, t), []);
    }
  }

  // 전체 신청자를 선착순으로 정렬 후 관심 주제별 그룹핑
  const sortedApplicants = [...applicants].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );

  // 관심 주제별로 그룹핑 (같은 주제 신청자들이 연속 배정되도록)
  const topicGroups: Map<string, Applicant[]> = new Map();
  for (const applicant of sortedApplicants) {
    const topicKey = (applicant.interestTopics || []).slice().sort().join(',') || 'none';
    const group = topicGroups.get(topicKey) || [];
    group.push(applicant);
    topicGroups.set(topicKey, group);
  }
  // 그룹 내에서 선착순 유지하면서 그룹별로 묶어서 배정
  const groupedApplicants: Applicant[] = [];
  for (const group of topicGroups.values()) {
    groupedApplicants.push(...group);
  }

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

  // 전체 신청자를 관심 주제 그룹별로 배정 (언어 그룹별 슬롯 분리)
  for (const applicant of groupedApplicants) {
    const langGroup = getApplicantLangGroup(applicant);
    const assignment = assignSingleApplicant(
      applicant, langGroup, mentors, mentorSlots, slotLangMap, slotTopicMap, mentorMap, categoryMentorsMap, fieldMentorsMap
    );
    assignments.push(assignment);
  }

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
  mentors: Mentor[],
  mentorSlots: MentorSlot[],
  slotLangMap: SlotLangMap,
  slotTopicMap: SlotTopicMap,
  mentorMap: Map<string, Mentor>,
  categoryMentorsMap: Map<string, Mentor[]>,
  fieldMentorsMap: Map<string, Mentor[]>
): Assignment {
  const assignment: Assignment = {
    applicantId: applicant.id,
    applicantName: applicant.name,
    phone4: applicant.phone4,
    time1: null, time2: null, time3: null, time4: null,
  };

  // 6지망까지 전부 수집
  const choices: { choiceNum: number; mentorId: string }[] = [];
  for (let i = 1; i <= NUM_CHOICES; i++) {
    const mentorId = (applicant as unknown as Record<string, unknown>)[`choice${i}`] as string;
    if (mentorId) choices.push({ choiceNum: i, mentorId });
  }

  // 각 타임에 배정될 슬롯 추적
  const assignedTimes = new Set<number>();
  const applicantTopics = applicant.interestTopics || [];

  // Phase 1: 1~6지망 순서대로 빈 타임에 배정 시도 (4개 타임 다 채울 때까지)
  for (const { choiceNum, mentorId } of choices) {
    if (assignedTimes.size >= NUM_TIMES) break; // 4타임 다 찼으면 중단

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
      slotTopicMap
    );

    if (result) {
      assignedTimes.add(result.timeNum);
      setAssignmentSlot(assignment, result.timeNum, result.slot);
    }
  }

  // Phase 2: 아직 빈 타임이 있으면 대체 배정
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

  for (const timeNum of unassignedTimes) {
    // 해당 타임에 원래 어떤 지망을 선택했는지 추적 (대체 배정 시 표시용)
    const originalChoiceForTime = choices[timeNum - 1];
    const originalChoiceName = originalChoiceForTime ? mentorMap.get(originalChoiceForTime.mentorId)?.name : undefined;
    const originalMessage = originalChoiceForTime
      ? ((applicant as unknown as Record<string, unknown>)[`message${originalChoiceForTime.choiceNum}`] as string | undefined)
      : undefined;

    let assigned = false;

    // 2-1: 원래 선택했지만 아직 배정되지 않은 멘토 다시 시도
    for (const { mentorId } of choices) {
      if (assignedMentorIds.has(mentorId)) continue;
      const mentor = mentorMap.get(mentorId);
      if (!mentor) continue;
      const mentorSlot = mentorSlots.find(s => s.mentorId === mentorId);
      if (!mentorSlot) continue;

      const result = tryAssignToMentorAtTime(
        applicant.id, mentor, mentorSlot, timeNum, true, undefined, undefined, langGroup, slotLangMap, applicantTopics, slotTopicMap
      );
      if (result) {
        setAssignmentSlot(assignment, timeNum, result.slot);
        assignedMentorIds.add(mentorId);
        assigned = true;
        break;
      }
    }

    if (assigned) continue;

    // 2-2: 희망직군(desiredField)에 해당하는 멘토 우선 배정
    if (applicant.desiredField) {
      const fieldMentors = fieldMentorsMap.get(applicant.desiredField) || [];
      const fieldAlternatives = fieldMentors.filter(m => !assignedMentorIds.has(m.id));

      for (const altMentor of fieldAlternatives) {
        const altSlot = mentorSlots.find(s => s.mentorId === altMentor.id);
        if (!altSlot) continue;

        const result = tryAssignToMentorAtTime(
          applicant.id, altMentor, altSlot, timeNum, false, originalChoiceName, originalMessage, langGroup, slotLangMap, applicantTopics, slotTopicMap
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

    // 2-3: 같은 카테고리 대체 멘토
    const originalCategories = originalChoiceIds
      .map(id => mentorMap.get(id)?.category)
      .filter((c): c is string => !!c);
    const uniqueCategories = [...new Set(originalCategories)];

    for (const category of uniqueCategories) {
      if (assigned) break;

      const sameCategoryMentors = categoryMentorsMap.get(category) || [];
      const alternativeMentors = sameCategoryMentors.filter(
        m => !assignedMentorIds.has(m.id)
      );

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
          slotTopicMap
        );

        if (result) {
          setAssignmentSlot(assignment, timeNum, result.slot);
          assignedMentorIds.add(altMentor.id);
          assigned = true;
          break;
        }
      }
    }

    // 2-4: 최후 수단 - 아무 멘토나 배정
    if (!assigned) {
      for (const mentor of mentors) {
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
          slotTopicMap
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

// 멘토에게 배정 시도 (가능한 타임 자동 선택, 언어 그룹 + 관심 주제 체크)
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
  slotTopicMap: SlotTopicMap
): { timeNum: number; slot: AssignmentSlot } | null {
  const times = Array.from({ length: NUM_TIMES }, (_, i) => i + 1).filter(t => !excludeTimes.has(t));

  // 관심 주제 겹침이 많은 슬롯 우선 정렬
  const compatibleTimes = times.filter(t => {
    if (!isSlotCompatible(slotLangMap, mentor.id, t, langGroup)) return false;
    const slotArray = getSlotArray(mentorSlot, t);
    return slotArray.length < mentor.maxCapacity;
  });

  if (compatibleTimes.length === 0) return null;

  // 관심 주제 겹침 점수가 높은 타임 우선 선택
  compatibleTimes.sort((a, b) => {
    const scoreA = getTopicOverlapScore(slotTopicMap, mentor.id, a, applicantTopics);
    const scoreB = getTopicOverlapScore(slotTopicMap, mentor.id, b, applicantTopics);
    return scoreB - scoreA; // 높은 점수 우선
  });

  const timeNum = compatibleTimes[0];
  const slotArray = getSlotArray(mentorSlot, timeNum);
  slotArray.push(applicantId);
  markSlotLangGroup(slotLangMap, mentor.id, timeNum, langGroup);
  markSlotTopics(slotTopicMap, mentor.id, timeNum, applicantTopics);
  
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

// 특정 타임에 멘토 배정 시도 (언어 그룹 + 관심 주제 체크)
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
  slotTopicMap: SlotTopicMap
): { slot: AssignmentSlot } | null {
  // 언어 그룹 호환성 체크
  if (!isSlotCompatible(slotLangMap, mentor.id, timeNum, langGroup)) return null;

  const slotArray = getSlotArray(mentorSlot, timeNum);

  if (slotArray.length < mentor.maxCapacity) {
    slotArray.push(applicantId);
    markSlotLangGroup(slotLangMap, mentor.id, timeNum, langGroup);
    markSlotTopics(slotTopicMap, mentor.id, timeNum, applicantTopics);

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
