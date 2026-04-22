import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://icrroxeoukubhavctwdu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcnJveGVvdWt1YmhhdmN0d2R1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA0Nzc5MSwiZXhwIjoyMDkwNjIzNzkxfQ.TPR8wS0Pj75mreAR8uCfEQ0jvZjmbZ-H7kL_fsaiDSQ'
);

// phone4 6395로 조회
const { data, error } = await supabase
  .from('applicants')
  .select('id, name, phone4, birth_date')
  .eq('phone4', '6395');

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log(`\n=== phone4=6395 조회 결과 (${data.length}건) ===`);
for (const row of data) {
  const name = row.name;
  const nfc = name.normalize('NFC');
  const nfd = name.normalize('NFD');
  
  console.log(`\nID: ${row.id}`);
  console.log(`이름 (raw): ${JSON.stringify(name)}`);
  console.log(`이름 (표시): ${name}`);
  console.log(`NFC 길이: ${nfc.length}, NFD 길이: ${nfd.length}`);
  console.log(`저장 형식: ${name.length === nfc.length ? 'NFC' : name.length === nfd.length ? 'NFD' : '혼합'}`);
  console.log(`phone4: ${row.phone4}`);
  console.log(`birth_date: ${row.birth_date}`);
  
  // 코드포인트 확인
  console.log(`코드포인트: ${[...name].map(c => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')} (${c})`).join(', ')}`);
}

// assignments 테이블도 확인
const { data: asgn } = await supabase
  .from('assignments')
  .select('applicant_id, applicant_name, phone4')
  .eq('phone4', '6395');

console.log(`\n=== assignments phone4=6395 (${(asgn||[]).length}건) ===`);
for (const row of (asgn || [])) {
  const name = row.applicant_name;
  console.log(`applicant_id: ${row.applicant_id}`);
  console.log(`applicant_name (raw): ${JSON.stringify(name)}`);
  console.log(`코드포인트: ${[...name].map(c => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')} (${c})`).join(', ')}`);
}
