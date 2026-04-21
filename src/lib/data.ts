import { Mentor, Applicant, Assignment, MentorSlot, ForeignLanguageGroup, MentoringTopic, ResumeApplicant, CancelledApplicant, RESUME_MENTOR_NAMES } from '@/types';
import { fetchMentorsFromSheet } from '@/lib/sheets';
import { supabase } from '@/lib/supabase';

// Google Sheets에서 전체 멘토 데이터 가져오기
async function getAllMentorsFromSheet(): Promise<Mentor[]> {
  const mentors = await fetchMentorsFromSheet();
  if (mentors.length > 0) return mentors;
  return [];
}

// 멘토링 멘토만 (자소서 멘토 제외)
export async function getMentors(): Promise<Mentor[]> {
  const all = await getAllMentorsFromSheet();
  return all.filter(m => !RESUME_MENTOR_NAMES.includes(m.name));
}

// 자소서 첨삭 멘토만
export async function getResumeMentors(): Promise<Mentor[]> {
  const all = await getAllMentorsFromSheet();
  return all.filter(m => RESUME_MENTOR_NAMES.includes(m.name));
}

// 신청자 조회 (이름 + 전화번호 뒷자리 + 생년월일로)
export async function findApplicant(name: string, phone4: string, birthDate?: string): Promise<Applicant | undefined> {
  let query = supabase
    .from('applicants')
    .select('*')
    .eq('name', name)
    .eq('phone4', phone4);

  if (birthDate) {
    query = query.eq('birth_date', birthDate);
  }

  const { data } = await query.limit(1).single();

  if (!data) return undefined;
  return dbToApplicant(data);
}

// 이름 + 전화번호로 신청자 목록 조회 (생년월일 선택용)
export async function findApplicants(name: string, phone4: string): Promise<Applicant[]> {
  const { data } = await supabase
    .from('applicants')
    .select('*')
    .eq('name', name)
    .eq('phone4', phone4);

  if (!data) return [];
  return data.map(dbToApplicant);
}

// 신청자 추가/수정
export async function upsertApplicant(input: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Applicant> {
  const existing = await findApplicant(input.name, input.phone4, input.birthDate);

  if (existing) {
    const { data, error } = await supabase
      .from('applicants')
      .update({
        choice1: input.choice1,
        choice2: input.choice2,
        choice3: input.choice3,
        choice4: input.choice4,
        choice5: input.choice5,
        choice6: input.choice6,
        message1: input.message1 || '',
        message2: input.message2 || '',
        message3: input.message3 || '',
        message4: input.message4 || '',
        message5: input.message5 || '',
        message6: input.message6 || '',
        is_foreigner: input.isForeigner || false,
        language_group: input.languageGroup || '',
        department: input.department || '',
        birth_year: input.birthYear || '',
        current_status: input.currentStatus || '',
        desired_field: input.desiredField || '',
        interest_topics: input.interestTopics || [],
        agreed_to_terms: input.agreedToTerms,
        birth_date: input.birthDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return dbToApplicant(data);
  } else {
    const id = `applicant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('applicants')
      .insert({
        id,
        name: input.name,
        birth_date: input.birthDate,
        phone4: input.phone4,
        choice1: input.choice1,
        choice2: input.choice2,
        choice3: input.choice3,
        choice4: input.choice4,
        choice5: input.choice5,
        choice6: input.choice6,
        message1: input.message1 || '',
        message2: input.message2 || '',
        message3: input.message3 || '',
        message4: input.message4 || '',
        message5: input.message5 || '',
        message6: input.message6 || '',
        is_foreigner: input.isForeigner || false,
        language_group: input.languageGroup || '',
        department: input.department || '',
        birth_year: input.birthYear || '',
        current_status: input.currentStatus || '',
        desired_field: input.desiredField || '',
        interest_topics: input.interestTopics || [],
        agreed_to_terms: input.agreedToTerms,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return dbToApplicant(data);
  }
}

// 모든 신청자 조회
export async function getAllApplicants(): Promise<Applicant[]> {
  const { data, error } = await supabase
    .from('applicants')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(dbToApplicant);
}

// 모든 배정 결과 조회
export async function getAllAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*');

  if (error) throw error;
  return (data || []).map(dbToAssignment);
}

// 배정 결과 저장 (전체 교체)
export async function setAssignments(assignments: Assignment[]): Promise<void> {
  // 기존 배정 전부 삭제
  await supabase.from('assignments').delete().neq('applicant_id', '');

  if (assignments.length === 0) return;

  const rows = assignments.map(a => ({
    applicant_id: a.applicantId,
    applicant_name: a.applicantName,
    phone4: a.phone4,
    time1: a.time1,
    time2: a.time2,
    time3: a.time3,
    time4: a.time4,
  }));

  const { error } = await supabase.from('assignments').insert(rows);
  if (error) throw error;
}

// 멘토 슬롯 저장 (전체 교체)
export async function setMentorSlots(slots: MentorSlot[]): Promise<void> {
  await supabase.from('mentor_slots').delete().neq('mentor_id', '');

  if (slots.length === 0) return;

  const rows = slots.map(s => ({
    mentor_id: s.mentorId,
    time1: s.time1,
    time2: s.time2,
    time3: s.time3,
    time4: s.time4,
  }));

  const { error } = await supabase.from('mentor_slots').insert(rows);
  if (error) throw error;
}

// 멘토 슬롯 조회
export async function getMentorSlots(): Promise<MentorSlot[]> {
  const { data, error } = await supabase
    .from('mentor_slots')
    .select('*');

  if (error) throw error;
  return (data || []).map(row => ({
    mentorId: row.mentor_id,
    time1: row.time1 || [],
    time2: row.time2 || [],
    time3: row.time3 || [],
    time4: row.time4 || [],
  }));
}

// 배정 결과 조회 (개인)
export async function getMyAssignment(name: string, phone4: string, birthDate?: string): Promise<Assignment | undefined> {
  if (birthDate) {
    // birthDate가 주어지면 신청자 조회 후 applicantId로 배정 검색
    const applicant = await findApplicant(name, phone4, birthDate);
    if (!applicant) return undefined;
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('applicant_id', applicant.id)
      .limit(1)
      .single();
    if (!data) return undefined;
    return dbToAssignment(data);
  }

  const { data } = await supabase
    .from('assignments')
    .select('*')
    .eq('applicant_name', name)
    .eq('phone4', phone4)
    .limit(1)
    .single();

  if (!data) return undefined;
  return dbToAssignment(data);
}

// 멘토별 신청 수 집계
export async function getMentorApplicationCounts(mentors: Mentor[]): Promise<Record<string, { choice1: number; choice2: number; choice3: number; choice4: number; choice5: number; choice6: number; total: number }>> {
  const counts: Record<string, { choice1: number; choice2: number; choice3: number; choice4: number; choice5: number; choice6: number; total: number }> = {};

  mentors.forEach(mentor => {
    counts[mentor.id] = { choice1: 0, choice2: 0, choice3: 0, choice4: 0, choice5: 0, choice6: 0, total: 0 };
  });

  const applicants = await getAllApplicants();

  applicants.forEach(applicant => {
    for (let i = 1; i <= 6; i++) {
      const key = `choice${i}` as keyof typeof applicant;
      const choiceId = applicant[key] as string;
      if (choiceId && counts[choiceId]) {
        (counts[choiceId] as Record<string, number>)[`choice${i}`]++;
        counts[choiceId].total++;
      }
    }
  });

  return counts;
}

// 데이터 내보내기 (JSON)
export async function exportData() {
  const applicants = await getAllApplicants();
  const assignments = await getAllAssignments();
  const mentorSlots = await getMentorSlots();

  return {
    applicants,
    assignments,
    mentorSlots,
    exportedAt: new Date().toISOString(),
  };
}

// 데이터 가져오기 (JSON)
export async function importData(data: { applicants: Applicant[]; assignments: Assignment[]; mentorSlots: MentorSlot[] }) {
  // 신청자 upsert
  if (data.applicants?.length) {
    const rows = data.applicants.map(a => ({
      id: a.id,
      name: a.name,
      birth_date: a.birthDate,
      phone4: a.phone4,
      choice1: a.choice1,
      choice2: a.choice2,
      choice3: a.choice3,
      choice4: a.choice4,
      choice5: a.choice5,
      choice6: a.choice6,
      message1: a.message1 || '',
      message2: a.message2 || '',
      message3: a.message3 || '',
      message4: a.message4 || '',
      message5: a.message5 || '',
      message6: a.message6 || '',
      is_foreigner: a.isForeigner || false,
      language_group: a.languageGroup || '',
      department: a.department || '',
      birth_year: a.birthYear || '',
      current_status: a.currentStatus || '',
      desired_field: a.desiredField || '',
      interest_topics: a.interestTopics || [],
      agreed_to_terms: a.agreedToTerms,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
    }));
    await supabase.from('applicants').upsert(rows);
  }
  if (data.assignments?.length) {
    await setAssignments(data.assignments);
  }
  if (data.mentorSlots?.length) {
    await setMentorSlots(data.mentorSlots);
  }
}

// 전체 데이터 삭제 (신청자 + 배정 + 멘토슬롯)
export async function deleteAllData(): Promise<void> {
  await supabase.from('assignments').delete().neq('applicant_id', '');
  await supabase.from('mentor_slots').delete().neq('mentor_id', '');
  await supabase.from('applicants').delete().neq('id', '');
}

// 개별 신청자 삭제 (관리자용 - 취소 기록 없이 강제 삭제)
export async function deleteApplicant(applicantId: string): Promise<void> {
  await supabase.from('assignments').delete().eq('applicant_id', applicantId);
  await supabase.from('applicants').delete().eq('id', applicantId);
}

// 신청 취소 (취소 기록 저장 후 삭제)
export async function cancelApplicant(applicant: Applicant): Promise<void> {
  const cancelId = `cancel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await supabase.from('cancelled_applicants').insert({
    id: cancelId,
    name: applicant.name,
    birth_date: applicant.birthDate,
    phone4: applicant.phone4,
    choice1: applicant.choice1 || '',
    choice2: applicant.choice2 || '',
    choice3: applicant.choice3 || '',
    applied_at: applicant.createdAt,
    cancelled_at: new Date().toISOString(),
  });
  await supabase.from('assignments').delete().eq('applicant_id', applicant.id);
  await supabase.from('applicants').delete().eq('id', applicant.id);
}

// 취소자 전체 조회
export async function getAllCancelledApplicants(): Promise<CancelledApplicant[]> {
  const { data, error } = await supabase
    .from('cancelled_applicants')
    .select('*')
    .order('cancelled_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    birthDate: row.birth_date,
    phone4: row.phone4,
    choice1: row.choice1 || '',
    choice2: row.choice2 || '',
    choice3: row.choice3 || '',
    appliedAt: row.applied_at,
    cancelledAt: row.cancelled_at,
  }));
}

// 자소서 신청자 삭제
export async function deleteResumeApplicant(resumeApplicantId: string): Promise<void> {
  await supabase.from('resume_applicants').delete().eq('id', resumeApplicantId);
  await recompactResumeQueue();
}

// --- DB row ↔ App type 변환 ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToApplicant(row: any): Applicant {
  return {
    id: row.id,
    name: row.name,
    birthDate: row.birth_date,
    phone4: row.phone4,
    choice1: row.choice1,
    choice2: row.choice2,
    choice3: row.choice3,
    choice4: row.choice4 || '',
    choice5: row.choice5 || '',
    choice6: row.choice6 || '',
    message1: row.message1 || '',
    message2: row.message2 || '',
    message3: row.message3 || '',
    message4: row.message4 || '',
    message5: row.message5 || '',
    message6: row.message6 || '',
    isForeigner: row.is_foreigner || false,
    languageGroup: (row.language_group as ForeignLanguageGroup) || undefined,
    department: row.department || '',
    birthYear: row.birth_year || '',
    currentStatus: row.current_status || '',
    desiredField: row.desired_field || '',
    interestTopics: (row.interest_topics as MentoringTopic[]) || [],
    agreedToTerms: row.agreed_to_terms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToAssignment(row: any): Assignment {
  return {
    applicantId: row.applicant_id,
    applicantName: row.applicant_name,
    phone4: row.phone4,
    time1: row.time1 || null,
    time2: row.time2 || null,
    time3: row.time3 || null,
    time4: row.time4 || null,
  };
}

// 멘토링 신청자 존재 여부 확인 (cross-check용)
export async function hasApplicant(name: string, phone4: string, birthDate: string): Promise<boolean> {
  const { data } = await supabase
    .from('applicants')
    .select('id')
    .eq('name', name)
    .eq('phone4', phone4)
    .eq('birth_date', birthDate)
    .limit(1)
    .single();
  return !!data;
}

// 자소서 신청자 존재 여부 확인 (cross-check용)
export async function hasResumeApplicant(name: string, phone4: string, birthDate: string): Promise<boolean> {
  const { data } = await supabase
    .from('resume_applicants')
    .select('id')
    .eq('name', name)
    .eq('phone4', phone4)
    .eq('birth_date', birthDate)
    .limit(1)
    .single();
  return !!data;
}

// ============================================
// 자소서 첨삭 관련 함수
// ============================================

const RESUME_MAX_APPLICANTS = 12;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToResumeApplicant(row: any): ResumeApplicant {
  return {
    id: row.id,
    name: row.name,
    birthDate: row.birth_date,
    phone4: row.phone4,
    department: row.department || '',
    birthYear: row.birth_year || '',
    currentStatus: row.current_status || '',
    desiredField: row.desired_field || '',
    companyType: row.company_type || [],
    reviewGoal: row.review_goal || '',
    resumeText: row.resume_text || '',
    resumeSections: row.resume_sections || {},
    jobPostingUrls: row.job_posting_urls || [],
    queueNumber: row.queue_number || 0,
    agreedToTerms: row.agreed_to_terms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 자소서 신청자 수 조회
export async function getResumeApplicantCount(): Promise<number> {
  const { count, error } = await supabase
    .from('resume_applicants')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

// 자소서 신청자 전체 조회 (순번순)
export async function getAllResumeApplicants(): Promise<ResumeApplicant[]> {
  const { data, error } = await supabase
    .from('resume_applicants')
    .select('*')
    .order('queue_number', { ascending: true });
  if (error) throw error;
  return (data || []).map(dbToResumeApplicant);
}

// 자소서 신청자 추가 (예비번호 포함, 제한 없음)
export async function addResumeApplicant(input: Omit<ResumeApplicant, 'id' | 'createdAt' | 'updatedAt' | 'queueNumber'>): Promise<ResumeApplicant> {
  // 중복 확인
  const { data: existing } = await supabase
    .from('resume_applicants')
    .select('id')
    .eq('name', input.name)
    .eq('phone4', input.phone4)
    .eq('birth_date', input.birthDate)
    .limit(1)
    .single();

  if (existing) {
    // 기존 신청 업데이트 → 순번 맨 뒤로 밀려남
    const maxQ = await getMaxQueueNumber();
    const { data, error } = await supabase
      .from('resume_applicants')
      .update({
        department: input.department || '',
        birth_year: input.birthYear || '',
        current_status: input.currentStatus || '',
        desired_field: input.desiredField || '',
        company_type: input.companyType || [],
        review_goal: input.reviewGoal || '',
        resume_text: input.resumeText,
        resume_sections: input.resumeSections || {},
        job_posting_urls: input.jobPostingUrls || [],
        agreed_to_terms: input.agreedToTerms,
        queue_number: maxQ + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    await recompactResumeQueue();
    return dbToResumeApplicant(data);
  }

  const maxQ = await getMaxQueueNumber();
  const id = `resume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('resume_applicants')
    .insert({
      id,
      name: input.name,
      birth_date: input.birthDate,
      phone4: input.phone4,
      department: input.department || '',
      birth_year: input.birthYear || '',
      current_status: input.currentStatus || '',
      desired_field: input.desiredField || '',
      company_type: input.companyType || [],
      review_goal: input.reviewGoal || '',
      resume_text: input.resumeText,
      resume_sections: input.resumeSections || {},
      job_posting_urls: input.jobPostingUrls || [],
      agreed_to_terms: input.agreedToTerms,
      queue_number: maxQ + 1,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return dbToResumeApplicant(data);
}

// 현재 최대 순번 조회
async function getMaxQueueNumber(): Promise<number> {
  const { data } = await supabase
    .from('resume_applicants')
    .select('queue_number')
    .order('queue_number', { ascending: false })
    .limit(1)
    .single();
  return data?.queue_number || 0;
}

// 순번 재정렬 (삭제/수정 후 빈 번호 없이 1부터 연속)
async function recompactResumeQueue(): Promise<void> {
  const { data, error } = await supabase
    .from('resume_applicants')
    .select('id, queue_number')
    .order('queue_number', { ascending: true });
  if (error || !data) return;

  for (let i = 0; i < data.length; i++) {
    const newNum = i + 1;
    if (data[i].queue_number !== newNum) {
      await supabase
        .from('resume_applicants')
        .update({ queue_number: newNum })
        .eq('id', data[i].id);
    }
  }
}
