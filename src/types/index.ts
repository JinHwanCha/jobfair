// 멘토 타입 정의
export interface Mentor {
  id: string;
  name: string;
  job: string;           // "분야 / 직업" 형태
  field: string;         // 분야 (예: 디자인)
  jobTitle: string;      // 직업명 (예: UX 디자이너)
  category: string;      // 부르심의 영역
  experience: string;    // 경력
  mentoringType: string; // 멘토링 방식
  bibleVerse?: string;   // 하나님 말씀/성경 구절
  advice?: string;       // 학생들에게 조언
  location?: string;
  maxCapacity: number;   // 타임당 최대 수용 인원 (기본 3명)
}

// 신청자 타입 정의
export interface Applicant {
  id: string;
  name: string;
  birthDate: string; // YYMMDD 형식
  phone4: string; // 전화번호 뒷자리 4자리
  choice1: string; // 1지망 멘토 ID
  choice2: string; // 2지망 멘토 ID
  choice3: string; // 3지망 멘토 ID
  agreedToTerms: boolean;
  createdAt: string;
  updatedAt: string;
}

// 배정 결과 타입
export interface Assignment {
  applicantId: string;
  applicantName: string;
  phone4: string;
  time1: AssignmentSlot | null; // 1타임 배정
  time2: AssignmentSlot | null; // 2타임 배정
  time3: AssignmentSlot | null; // 3타임 배정
}

export interface AssignmentSlot {
  mentorId: string;
  mentorName: string;
  mentorJob: string;
  location: string;
  isOriginalChoice: boolean; // 희망했던 멘토인지 여부
  originalChoice?: string; // 원래 희망했던 멘토명 (다른 경우)
}

// 멘토별 타임 슬롯 현황
export interface MentorSlot {
  mentorId: string;
  time1: string[]; // 배정된 신청자 ID 목록
  time2: string[];
  time3: string[];
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 카테고리 타입
export type Category = 
  | '의료/보건'
  | '교육'
  | 'IT/기술'
  | '예술/문화'
  | '비즈니스/경영'
  | '법률/행정'
  | '기타';

// 신청 폼 데이터
export interface ApplyFormData {
  name: string;
  birthDate: string;
  phone4: string;
  choice1: string;
  choice2: string;
  choice3: string;
  agreedToTerms: boolean;
}

// 조회 폼 데이터
export interface LookupFormData {
  name: string;
  phone4: string;
}
