import { Mentor, Applicant, Assignment, AssignmentSlot, MentorSlot } from '@/types';

/**
 * 자동 멘토 배정 알고리즘
 * 
 * 배정 규칙:
 * 1. 1지망 → 2지망 → 3지망 순으로 배정 시도
 * 2. 멘토당 타임별 3명 제한 (maxCapacity)
 * 3. 초과 시 다음 타임으로 자동 배정
 * 4. 모든 지망 실패 시 동일 카테고리 멘토로 배정
 * 5. 신청 순서(createdAt)가 빠른 순으로 우선 배정
 */
export function runAutoAssignment(
  applicants: Applicant[],
  mentors: Mentor[]
): { assignments: Assignment[]; mentorSlots: MentorSlot[] } {
  // 멘토 슬롯 초기화
  const mentorSlots: MentorSlot[] = mentors.map(mentor => ({
    mentorId: mentor.id,
    time1: [],
    time2: [],
    time3: [],
  }));

  // 신청 순서대로 정렬
  const sortedApplicants = [...applicants].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const assignments: Assignment[] = [];
  const mentorMap = new Map(mentors.map(m => [m.id, m]));
  const categoryMentorsMap = new Map<string, Mentor[]>();
  
  // 카테고리별 멘토 맵 생성
  mentors.forEach(mentor => {
    const existing = categoryMentorsMap.get(mentor.category) || [];
    categoryMentorsMap.set(mentor.category, [...existing, mentor]);
  });

  // 각 신청자에 대해 배정 수행
  for (const applicant of sortedApplicants) {
    const assignment: Assignment = {
      applicantId: applicant.id,
      applicantName: applicant.name,
      phone4: applicant.phone4,
      time1: null,
      time2: null,
      time3: null,
    };

    // 지망 순서대로 처리
    const choices = [
      { choiceNum: 1, mentorId: applicant.choice1 },
      { choiceNum: 2, mentorId: applicant.choice2 },
      { choiceNum: 3, mentorId: applicant.choice3 },
    ];

    // 각 타임에 배정될 슬롯 추적
    const assignedTimes = new Set<number>();

    for (const { choiceNum, mentorId } of choices) {
      const mentor = mentorMap.get(mentorId);
      if (!mentor) continue;

      const mentorSlot = mentorSlots.find(s => s.mentorId === mentorId);
      if (!mentorSlot) continue;

      // 아직 배정되지 않은 타임 중에서 빈 슬롯 찾기
      const result = tryAssignToMentor(
        applicant.id,
        mentor,
        mentorSlot,
        assignedTimes,
        true // 원래 선택한 멘토임
      );

      if (result) {
        assignedTimes.add(result.timeNum);
        setAssignmentSlot(assignment, result.timeNum, result.slot);
      }
    }

    // 배정되지 않은 타임이 있으면 동일 카테고리 멘토로 대체 배정
    const unassignedTimes = [1, 2, 3].filter(t => !assignedTimes.has(t));
    
    for (const timeNum of unassignedTimes) {
      // 원래 선택한 멘토들의 카테고리 우선 순위로 대체 멘토 찾기
      const originalChoices = [applicant.choice1, applicant.choice2, applicant.choice3];
      const originalCategories = originalChoices
        .map(id => mentorMap.get(id)?.category)
        .filter((c): c is string => !!c);

      // 중복 제거하면서 순서 유지
      const uniqueCategories = [...new Set(originalCategories)];

      let assigned = false;
      for (const category of uniqueCategories) {
        if (assigned) break;

        const sameCategoryMentors = categoryMentorsMap.get(category) || [];
        // 원래 선택하지 않은 멘토 중에서 찾기
        const alternativeMentors = sameCategoryMentors.filter(
          m => !originalChoices.includes(m.id)
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
            mentorMap.get(originalChoices[timeNum - 1])?.name
          );

          if (result) {
            setAssignmentSlot(assignment, timeNum, result.slot);
            assigned = true;
            break;
          }
        }
      }

      // 같은 카테고리에서도 못 찾으면, 아무 멘토나 배정
      if (!assigned) {
        for (const mentor of mentors) {
          const slot = mentorSlots.find(s => s.mentorId === mentor.id);
          if (!slot) continue;

          const result = tryAssignToMentorAtTime(
            applicant.id,
            mentor,
            slot,
            timeNum,
            false,
            mentorMap.get(originalChoices[timeNum - 1])?.name
          );

          if (result) {
            setAssignmentSlot(assignment, timeNum, result.slot);
            break;
          }
        }
      }
    }

    assignments.push(assignment);
  }

  return { assignments, mentorSlots };
}

// 멘토에게 배정 시도 (가능한 타임 자동 선택)
function tryAssignToMentor(
  applicantId: string,
  mentor: Mentor,
  mentorSlot: MentorSlot,
  excludeTimes: Set<number>,
  isOriginalChoice: boolean
): { timeNum: number; slot: AssignmentSlot } | null {
  const times = [1, 2, 3].filter(t => !excludeTimes.has(t));

  for (const timeNum of times) {
    const slotArray = getSlotArray(mentorSlot, timeNum);
    
    if (slotArray.length < mentor.maxCapacity) {
      slotArray.push(applicantId);
      
      return {
        timeNum,
        slot: {
          mentorId: mentor.id,
          mentorName: mentor.name,
          mentorJob: mentor.job,
          location: mentor.location || `장소${mentor.id}`,
          isOriginalChoice,
        },
      };
    }
  }

  return null;
}

// 특정 타임에 멘토 배정 시도
function tryAssignToMentorAtTime(
  applicantId: string,
  mentor: Mentor,
  mentorSlot: MentorSlot,
  timeNum: number,
  isOriginalChoice: boolean,
  originalChoiceName?: string
): { slot: AssignmentSlot } | null {
  const slotArray = getSlotArray(mentorSlot, timeNum);

  if (slotArray.length < mentor.maxCapacity) {
    slotArray.push(applicantId);

    return {
      slot: {
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorJob: mentor.job,
        location: mentor.location || `장소${mentor.id}`,
        isOriginalChoice,
        originalChoice: isOriginalChoice ? undefined : originalChoiceName,
      },
    };
  }

  return null;
}

// 타임 번호에 해당하는 슬롯 배열 가져오기
function getSlotArray(mentorSlot: MentorSlot, timeNum: number): string[] {
  switch (timeNum) {
    case 1:
      return mentorSlot.time1;
    case 2:
      return mentorSlot.time2;
    case 3:
      return mentorSlot.time3;
    default:
      return [];
  }
}

// 배정 결과에 슬롯 설정
function setAssignmentSlot(
  assignment: Assignment,
  timeNum: number,
  slot: AssignmentSlot
): void {
  switch (timeNum) {
    case 1:
      assignment.time1 = slot;
      break;
    case 2:
      assignment.time2 = slot;
      break;
    case 3:
      assignment.time3 = slot;
      break;
  }
}
