const CSV_URL = 'https://docs.google.com/spreadsheets/d/1ToJhCD6UGT74vpUq-b2yLRYbuWVMuF4vHWuGx1Fbjf4/export?format=csv&gid=537171012';

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

const RESUME_MENTOR_NAMES = ['성재훈', '송하정', '강요셉/최우희'];

const res = await fetch(CSV_URL);
const csv = await res.text();
const rows = parseCSV(csv);
console.log('Sheet1 total parsed rows:', rows.length);

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  const name = (row[2] || '').trim();
  if (RESUME_MENTOR_NAMES.includes(name)) {
    const jobRaw = (row[4] || '').trim();
    const { field, jobTitle } = parseJobField(jobRaw);
    console.log('\nRow', i, 'name:', JSON.stringify(name));
    console.log('  job:', JSON.stringify(jobRaw));
    console.log('  field:', JSON.stringify(field), 'jobTitle:', JSON.stringify(jobTitle));
    console.log('  phone4 raw:', (row[3] || '').replace(/[^0-9]/g, '').slice(-4));
    console.log('  category:', JSON.stringify((row[6] || '').trim()));
  }
}
