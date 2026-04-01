import { Mentor, Applicant, Assignment, MentorSlot } from '@/types';
import { fetchMentorsFromSheet } from '@/lib/sheets';

// Google Sheets에서 멘토 데이터 가져오기
export async function getMentors(): Promise<Mentor[]> {
  const mentors = await fetchMentorsFromSheet();
  if (mentors.length > 0) return mentors;
  // 시트 접근 불가 시 폴백
  return fallbackMentors;
}

// 폴백 멘토 (시트 연결 안 될 때)
const fallbackMentors: Mentor[] = [];

// 메모리 저장소 (실제 배포 시 데이터베이스로 교체)
let applicants: Applicant[] = [];
let assignments: Assignment[] = [];
let mentorSlots: MentorSlot[] = [];

// 멘토 슬롯 초기화
export function initializeMentorSlots(mentors: Mentor[]): MentorSlot[] {
  return mentors.map(mentor => ({
    mentorId: mentor.id,
    time1: [],
    time2: [],
    time3: [],
  }));
}

// 신청자 조회 (이름 + 전화번호 뒷자리로)
export function findApplicant(name: string, phone4: string): Applicant | undefined {
  return applicants.find(a => a.name === name && a.phone4 === phone4);
}

// 신청자 추가/수정
export function upsertApplicant(data: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>): Applicant {
  const existing = findApplicant(data.name, data.phone4);
  
  if (existing) {
    // 수정
    const updated: Applicant = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    applicants = applicants.map(a => a.id === existing.id ? updated : a);
    return updated;
  } else {
    // 신규 추가
    const newApplicant: Applicant = {
      ...data,
      id: `applicant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    applicants.push(newApplicant);
    return newApplicant;
  }
}

// 모든 신청자 조회
export function getAllApplicants(): Applicant[] {
  return [...applicants];
}

// 모든 배정 결과 조회
export function getAllAssignments(): Assignment[] {
  return [...assignments];
}

// 배정 결과 저장
export function setAssignments(newAssignments: Assignment[]): void {
  assignments = newAssignments;
}

// 멘토 슬롯 저장
export function setMentorSlots(slots: MentorSlot[]): void {
  mentorSlots = slots;
}

// 멘토 슬롯 조회
export function getMentorSlots(): MentorSlot[] {
  return [...mentorSlots];
}

// 배정 결과 조회 (개인)
export function getMyAssignment(name: string, phone4: string): Assignment | undefined {
  return assignments.find(a => a.applicantName === name && a.phone4 === phone4);
}

// 멘토별 신청 수 집계
export function getMentorApplicationCounts(mentors: Mentor[]): Record<string, { choice1: number; choice2: number; choice3: number; total: number }> {
  const counts: Record<string, { choice1: number; choice2: number; choice3: number; total: number }> = {};
  
  mentors.forEach(mentor => {
    counts[mentor.id] = { choice1: 0, choice2: 0, choice3: 0, total: 0 };
  });
  
  applicants.forEach(applicant => {
    if (counts[applicant.choice1]) {
      counts[applicant.choice1].choice1++;
      counts[applicant.choice1].total++;
    }
    if (counts[applicant.choice2]) {
      counts[applicant.choice2].choice2++;
      counts[applicant.choice2].total++;
    }
    if (counts[applicant.choice3]) {
      counts[applicant.choice3].choice3++;
      counts[applicant.choice3].total++;
    }
  });
  
  return counts;
}

// 데이터 내보내기 (JSON)
export function exportData() {
  return {
    applicants,
    assignments,
    mentorSlots,
    exportedAt: new Date().toISOString(),
  };
}

// 데이터 가져오기 (JSON)
export function importData(data: { applicants: Applicant[]; assignments: Assignment[]; mentorSlots: MentorSlot[] }) {
  applicants = data.applicants || [];
  assignments = data.assignments || [];
  mentorSlots = data.mentorSlots || [];
}
