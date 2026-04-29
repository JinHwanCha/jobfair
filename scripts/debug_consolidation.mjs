import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://icrroxeoukubhavctwdu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcnJveGVvdWt1YmhhdmN0d2R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA0Nzc5MSwiZXhwIjoyMDkwNjIzNzkxfQ.TPR8wS0Pj75mreAR8uCfEQ0jvZjmbZ-H7kL_fsaiDSQ'
);

// 멘토 이름으로 ID 찾기
async function findMentorByName(name) {
  const { data } = await supabase.from('assignments').select('*').limit(500);
  const mentors = new Map();
  for (const row of data || []) {
    for (let t = 1; t <= 4; t++) {
      const slot = row[`time${t}`];
      if (slot && slot.mentorName === name) {
        mentors.set(slot.mentorId, name);
      }
    }
  }
  return mentors;
}

async function checkAssignmentsForMentor(mentorName) {
  const { data: allAssignments } = await supabase.from('assignments').select('*');
  if (!allAssignments) return;

  const result = [];
  for (const row of allAssignments) {
    const times = [];
    for (let t = 1; t <= 4; t++) {
      const slot = row[`time${t}`];
      if (slot && slot.mentorName === mentorName) {
        times.push(t);
      }
    }
    if (times.length > 0) {
      result.push({ name: row.applicant_name, id: row.applicant_id, times });
    }
  }
  return result;
}

async function checkApplicant(nameOrKeyword) {
  const { data } = await supabase
    .from('applicants')
    .select('id, name, is_foreigner, language_group, choice1, choice2, choice3, choice4, choice5, choice6');
  
  const found = (data || []).filter(r => r.name.includes(nameOrKeyword) || r.id.includes(nameOrKeyword));
  return found;
}

async function checkAssignmentForApplicant(nameKeyword) {
  const { data } = await supabase
    .from('assignments')
    .select('*');

  return (data || []).filter(r => r.applicant_name.includes(nameKeyword));
}

async function getMentorIdMap() {
  const { data } = await supabase.from('assignments').select('*').limit(500);
  const map = new Map();
  for (const row of data || []) {
    for (let t = 1; t <= 4; t++) {
      const slot = row[`time${t}`];
      if (slot) map.set(slot.mentorId, slot.mentorName);
    }
  }
  return map;
}

console.log('=== 배정 통합(consolidation) 디버깅 ===\n');

// 1. 서성구 멘토 배정 상태
console.log('--- [1] 서성구 멘토 배정 현황 ---');
const seongguAssignees = await checkAssignmentsForMentor('서성구');
for (const a of seongguAssignees || []) {
  console.log(`  ${a.name} (ID: ${a.id}) → 타임: ${a.times.join(', ')}`);
}

console.log('\n--- [2] 류웬리 신청자 정보 ---');
const luApplicants = await checkApplicant('류웬리');
for (const a of luApplicants) {
  console.log(`  ID: ${a.id}, 외국인: ${a.is_foreigner}, 언어: ${a.language_group}`);
  console.log(`  지망: ${[a.choice1,a.choice2,a.choice3,a.choice4,a.choice5,a.choice6].filter(Boolean).join(' | ')}`);
}
const luAssignments = await checkAssignmentForApplicant('류웬리');
for (const a of luAssignments) {
  console.log('  배정 결과:');
  for (let t = 1; t <= 4; t++) {
    const slot = a[`time${t}`];
    if (slot) console.log(`    time${t}: ${slot.mentorName} (isOriginal: ${slot.isOriginalChoice})`);
  }
}

console.log('\n--- [3] André 신청자 정보 ---');
const andreApplicants = await checkApplicant('André');
for (const a of andreApplicants) {
  console.log(`  ID: ${a.id}, 외국인: ${a.is_foreigner}, 언어: ${a.language_group}`);
  console.log(`  지망: ${[a.choice1,a.choice2,a.choice3,a.choice4,a.choice5,a.choice6].filter(Boolean).join(' | ')}`);
}
const andreAssignments = await checkAssignmentForApplicant('André');
for (const a of andreAssignments) {
  console.log('  배정 결과:');
  for (let t = 1; t <= 4; t++) {
    const slot = a[`time${t}`];
    if (slot) console.log(`    time${t}: ${slot.mentorName} (isOriginal: ${slot.isOriginalChoice})`);
  }
}

console.log('\n--- [4] 김소연 멘토 배정 현황 ---');
const kimAssignees = await checkAssignmentsForMentor('김소연');
for (const a of kimAssignees || []) {
  console.log(`  ${a.name} (ID: ${a.id}) → 타임: ${a.times.join(', ')}`);
}

console.log('\n--- [5] 마월 신청자 정보 ---');
const maApplicants = await checkApplicant('마월');
for (const a of maApplicants) {
  console.log(`  ID: ${a.id}, 외국인: ${a.is_foreigner}, 언어: ${a.language_group}`);
}
const maAssignments = await checkAssignmentForApplicant('마월');
for (const a of maAssignments) {
  console.log('  배정:');
  for (let t = 1; t <= 4; t++) {
    const slot = a[`time${t}`];
    if (slot) console.log(`    time${t}: ${slot.mentorName}`);
  }
}

console.log('\n--- [6] 장재명 신청자 정보 ---');
const jangApplicants = await checkApplicant('장재명');
for (const a of jangApplicants) {
  console.log(`  ID: ${a.id}, 외국인: ${a.is_foreigner}, 언어: ${a.language_group}`);
}
const jangAssignments = await checkAssignmentForApplicant('장재명');
for (const a of jangAssignments) {
  console.log('  배정:');
  for (let t = 1; t <= 4; t++) {
    const slot = a[`time${t}`];
    if (slot) console.log(`    time${t}: ${slot.mentorName}`);
  }
}

// 7. 외국어 그룹 분산 전체 현황
console.log('\n--- [7] 같은 멘토에 외국어 신청자가 다른 타임에 있는 케이스 ---');
const { data: allAssignments } = await supabase.from('assignments').select('*');
const { data: allApplicants } = await supabase.from('applicants').select('id, is_foreigner, language_group');

const applicantLangMap = new Map();
for (const a of allApplicants || []) {
  if (!a.is_foreigner) applicantLangMap.set(a.id, 'korean');
  else if (a.language_group === 'english') applicantLangMap.set(a.id, 'english');
  else if (a.language_group === 'chinese') applicantLangMap.set(a.id, 'chinese');
  else applicantLangMap.set(a.id, 'korean');
}

// mentorId → timeNum → [applicantId+lang]
const mentorTimeSlots = new Map();
for (const row of allAssignments || []) {
  const aLang = applicantLangMap.get(row.applicant_id);
  if (aLang === 'korean') continue;  // 한국인은 무시
  
  for (let t = 1; t <= 4; t++) {
    const slot = row[`time${t}`];
    if (!slot) continue;
    const key = slot.mentorId;
    if (!mentorTimeSlots.has(key)) mentorTimeSlots.set(key, { name: slot.mentorName, times: new Map() });
    const mData = mentorTimeSlots.get(key);
    if (!mData.times.has(t)) mData.times.set(t, []);
    mData.times.get(t).push({ id: row.applicant_id, name: row.applicant_name, lang: aLang });
  }
}

for (const [mentorId, mData] of mentorTimeSlots) {
  // 2개 이상의 타임에 외국어 신청자가 있는 경우
  const foreignTimes = [...mData.times.entries()].filter(([, ppl]) => ppl.some(p => p.lang !== 'korean'));
  if (foreignTimes.length <= 1) continue;
  
  // 같은 언어가 여러 타임에 분산된 경우
  const langTimesMap = new Map();
  for (const [t, ppl] of foreignTimes) {
    for (const p of ppl) {
      if (!langTimesMap.has(p.lang)) langTimesMap.set(p.lang, []);
      langTimesMap.get(p.lang).push({ t, person: p });
    }
  }
  
  for (const [lang, entries] of langTimesMap) {
    if (entries.length <= 1) continue;
    const timesSet = new Set(entries.map(e => e.t));
    if (timesSet.size <= 1) continue;
    
    console.log(`  [분산] 멘토: ${mData.name} (${mentorId}), 언어: ${lang}`);
    for (const e of entries) {
      console.log(`    time${e.t}: ${e.person.name} (${e.person.id})`);
    }
  }
}

console.log('\n=== 완료 ===');
