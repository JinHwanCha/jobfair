import { Mentor, Applicant, Assignment, MentorSlot } from '@/types';
import { fetchMentorsFromSheet } from '@/lib/sheets';
import { supabase } from '@/lib/supabase';

// Google Sheets에서 멘토 데이터 가져오기
export async function getMentors(): Promise<Mentor[]> {
  const mentors = await fetchMentorsFromSheet();
  if (mentors.length > 0) return mentors;
  return [];
}

// 신청자 조회 (이름 + 전화번호 뒷자리로)
export async function findApplicant(name: string, phone4: string): Promise<Applicant | undefined> {
  const { data } = await supabase
    .from('applicants')
    .select('*')
    .eq('name', name)
    .eq('phone4', phone4)
    .limit(1)
    .single();

  if (!data) return undefined;
  return dbToApplicant(data);
}

// 신청자 추가/수정
export async function upsertApplicant(input: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Applicant> {
  const existing = await findApplicant(input.name, input.phone4);

  if (existing) {
    const { data, error } = await supabase
      .from('applicants')
      .update({
        choice1: input.choice1,
        choice2: input.choice2,
        choice3: input.choice3,
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
  }));
}

// 배정 결과 조회 (개인)
export async function getMyAssignment(name: string, phone4: string): Promise<Assignment | undefined> {
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
export async function getMentorApplicationCounts(mentors: Mentor[]): Promise<Record<string, { choice1: number; choice2: number; choice3: number; total: number }>> {
  const counts: Record<string, { choice1: number; choice2: number; choice3: number; total: number }> = {};

  mentors.forEach(mentor => {
    counts[mentor.id] = { choice1: 0, choice2: 0, choice3: 0, total: 0 };
  });

  const applicants = await getAllApplicants();

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
  };
}
