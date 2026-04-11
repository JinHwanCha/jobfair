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
  maxCapacity: number;   // 타임당 최대 수용 인원 (기본 4명)
  // Sheet 2 추가 데이터
  jobPosition?: string;  // 현재 직무 / 회사
  major?: string;        // 전공
  oneLiner?: string;     // 나를 한 문장으로 표현한다면?
  careerCalling?: string; // 나의 커리어 또는 Calling 여정
  keywords?: string;     // 나를 설명하는 키워드
  topics?: string;       // 멘토링 주제 (이야기 나눌 주제)
  phone4?: string;       // 전화번호 뒷자리 4자리 (멘토 인증용)
}

// 신청자 타입 정의
// 외국인 언어권 타입
export type ForeignLanguageGroup = 'english' | 'chinese';

export interface Applicant {
  id: string;
  name: string;
  birthDate: string; // YYMMDD 형식
  phone4: string; // 전화번호 뒷자리 4자리
  isForeigner: boolean; // 외국인 여부
  languageGroup?: ForeignLanguageGroup; // 언어권 (영어권/중화권)
  // 멘티 프로필 정보
  department?: string; // 학과
  birthYear?: string; // 년생 (예: 00)
  currentStatus?: string; // 대학교학년 or 현재상황 (예: 3학년, 취준생)
  desiredField?: string; // 희망직군
  interestTopics?: MentoringTopic[]; // 멘토에게 듣고싶은 내용 (진로/취업/면접)
  choice1: string; // 1지망 멘토 ID
  choice2: string; // 2지망 멘토 ID
  choice3: string; // 3지망 멘토 ID
  choice4: string; // 4지망 멘토 ID
  choice5: string; // 5지망 멘토 ID
  choice6: string; // 6지망 멘토 ID
  message1?: string; // 1지망 멘토에게 하고싶은 말
  message2?: string; // 2지망 멘토에게 하고싶은 말
  message3?: string; // 3지망 멘토에게 하고싶은 말
  message4?: string; // 4지망 멘토에게 하고싶은 말
  message5?: string; // 5지망 멘토에게 하고싶은 말
  message6?: string; // 6지망 멘토에게 하고싶은 말
  agreedToTerms: boolean;
  createdAt: string;
  updatedAt: string;
}

// 배정 결과 타입
export interface Assignment {
  applicantId: string;
  applicantName: string;
  phone4: string;
  time1: AssignmentSlot | null;
  time2: AssignmentSlot | null;
  time3: AssignmentSlot | null;
  time4: AssignmentSlot | null;
}

export interface AssignmentSlot {
  mentorId: string;
  mentorName: string;
  mentorJob: string;
  location: string;
  isOriginalChoice: boolean; // 희망했던 멘토인지 여부
  originalChoice?: string; // 원래 희망했던 멘토명 (다른 경우)
  originalMessage?: string; // 원래 멘토에게 하고싶었던 말 (대체 배정 시)
  message?: string; // 해당 멘토에게 하고싶은 말 (원래 지망 시)
}

// 멘토별 타임 슬롯 현황
export interface MentorSlot {
  mentorId: string;
  time1: string[];
  time2: string[];
  time3: string[];
  time4: string[];
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

// 멘토링 관심 주제 타입
export type MentoringTopic = 'career' | 'employment' | 'interview';

// 신청 폼 데이터
export interface ApplyFormData {
  name: string;
  birthDate: string;
  phone4: string;
  isForeigner: boolean;
  languageGroup: ForeignLanguageGroup | '';
  // 멘티 프로필
  department: string;
  birthYear: string;
  currentStatus: string;
  desiredField: string;
  interestTopics: MentoringTopic[];
  choice1: string;
  choice2: string;
  choice3: string;
  choice4: string;
  choice5: string;
  choice6: string;
  message1: string;
  message2: string;
  message3: string;
  message4: string;
  message5: string;
  message6: string;
  agreedToTerms: boolean;
}

// 조회 폼 데이터
export interface LookupFormData {
  name: string;
  phone4: string;
}

// 지향 기업 유형
export type CompanyType = 'large' | 'public' | 'private';

// 자소서 첨삭 신청자 타입
export interface ResumeApplicant {
  id: string;
  name: string;
  birthDate: string;
  phone4: string;
  department: string;
  birthYear: string;
  currentStatus: string;
  desiredField: string;
  companyType: CompanyType[]; // 대기업/공기업/사기업
  reviewGoal: string; // 첨삭을 통해 원하는 바
  resumeText: string;
  queueNumber: number; // 순번
  agreedToTerms: boolean;
  createdAt: string;
  updatedAt: string;
}

// 자소서 첨삭 폼 데이터
export interface ResumeApplyFormData {
  name: string;
  birthDate: string;
  phone4: string;
  department: string;
  birthYear: string;
  currentStatus: string;
  desiredField: string;
  companyType: CompanyType[];
  reviewGoal: string;
  resumeText: string;
  agreedToTerms: boolean;
}

// 자소서 첨삭 멘토 이름 목록 (시트에서 필터링용)
export const RESUME_MENTOR_NAMES = ['성재훈', '송하정', '강요셉/최우희'];
