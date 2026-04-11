// Simulates what the app does: fetchMentorsFromSheet -> getResumeMentors
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1ToJhCD6UGT74vpUq-b2yLRYbuWVMuF4vHWuGx1Fbjf4/export?format=csv&gid=537171012';
const CSV_URL2 = 'https://docs.google.com/spreadsheets/d/1ToJhCD6UGT74vpUq-b2yLRYbuWVMuF4vHWuGx1Fbjf4/export?format=csv&gid=2098157141';
const RESUME_MENTOR_NAMES = ['성재훈', '송하정', '강요셉/최우희'];

function parseCSV(csv) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const cells = [];
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (inQuotes && csv[i + 1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim()); current = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && csv[i + 1] === '\n') i++;
      cells.push(current.trim());
      if (cells.some(c => c.length > 0)) rows.push([...cells]);
      cells.length = 0; current = '';
    } else { current += ch; }
  }
  cells.push(current.trim());
  if (cells.some(c => c.length > 0)) rows.push([...cells]);
  return rows;
}

function parseJobField(raw) {
  const parts = raw.split('/').map(s => s.trim());
  if (parts.length >= 2) return { field: parts[0], jobTitle: parts.slice(1).join(' / ') };
  return { field: raw, jobTitle: raw };
}

async function main() {
  const [res1, res2] = await Promise.all([fetch(CSV_URL), fetch(CSV_URL2)]);
  const [csv1, csv2] = await Promise.all([res1.text(), res2.text()]);
  
  const rows1 = parseCSV(csv1);
  const rows2 = parseCSV(csv2);
  
  // Build sheet2 map
  const sheet2Map = new Map();
  for (let i = 1; i < rows2.length; i++) {
    const row = rows2[i];
    if (!row || row.length < 2) continue;
    const name = (row[1] || '').trim();
    if (!name) continue;
    sheet2Map.set(name, {
      jobPosition: (row[2] || '').trim(),
      major: (row[3] || '').trim(),
      oneLiner: (row[4] || '').trim(),
      careerCalling: (row[5] || '').trim(),
      topics: (row[6] || '').trim(),
      keywords: (row[7] || '').trim(),
    });
  }

  // Build all mentors from sheet1
  const mentors = [];
  for (let i = 1; i < rows1.length; i++) {
    const row = rows1[i];
    if (!row || row.length < 5) continue;
    const name = (row[2] || '').trim();
    if (!name) continue;
    const jobRaw = (row[4] || '').trim();
    const { field, jobTitle } = parseJobField(jobRaw);
    const extra = sheet2Map.get(name);
    mentors.push({ id: `mentor-${i}`, name, job: jobRaw, field, jobTitle, keywords: extra?.keywords, jobPosition: extra?.jobPosition, oneLiner: extra?.oneLiner, topics: extra?.topics, careerCalling: extra?.careerCalling, major: extra?.major });
  }

  // Filter resume mentors
  const resumeMentors = mentors.filter(m => RESUME_MENTOR_NAMES.includes(m.name));
  console.log('Resume mentors found:', resumeMentors.length);
  resumeMentors.forEach(m => {
    console.log('\n===', m.name, '===');
    console.log('  job:', m.job);
    console.log('  jobPosition:', m.jobPosition ? m.jobPosition.substring(0, 100) : '(MISSING)');
    console.log('  keywords:', m.keywords || '(MISSING)');
    console.log('  oneLiner:', m.oneLiner || '(MISSING)');
    console.log('  topics:', m.topics || '(MISSING)');
    console.log('  careerCalling:', m.careerCalling ? m.careerCalling.substring(0, 80) : '(MISSING)');
    console.log('  major:', m.major || '(MISSING)');
  });
}

main();
