import { createClient } from '@supabase/supabase-js';
const sb = createClient(
  'https://icrroxeoukubhavctwdu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcnJveGVvdWt1YmhhdmN0d2R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA0Nzc5MSwiZXhwIjoyMDkwNjIzNzkxfQ.TPR8wS0Pj75mreAR8uCfEQ0jvZjmbZ-H7kL_fsaiDSQ'
);

// André & 류웬리 신청자 조회
const { data: applicants } = await sb.from('applicants')
  .select('id, name, is_foreigner, language_group, choice1, choice2, choice3, choice4, choice5, choice6, updated_at')
  .or('name.ilike.%ndr%,name.ilike.%웬리%');

console.log('=== 신청자 choices ===');
for (const a of applicants || []) {
  console.log(`\n[${a.name}] foreigner=${a.is_foreigner} lang=${a.language_group}`);
  console.log(`  choices: ${[a.choice1,a.choice2,a.choice3,a.choice4,a.choice5,a.choice6].join(' | ')}`);
  console.log(`  updatedAt: ${a.updated_at}`);
}

// 배정 결과 조회
const { data: asgn } = await sb.from('assignments')
  .select('applicant_name, time1, time2, time3, time4')
  .or('applicant_name.ilike.%ndr%,applicant_name.ilike.%웬리%');

console.log('\n=== 배정 결과 ===');
for (const a of asgn || []) {
  console.log(`\n[${a.applicant_name}]`);
  for (const t of [1,2,3,4]) {
    const slot = a[`time${t}`];
    if (slot) console.log(`  time${t}: ${slot.mentorName} (original=${slot.isOriginalChoice})`);
    else console.log(`  time${t}: -`);
  }
}
