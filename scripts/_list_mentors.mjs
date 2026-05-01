import { writeFileSync } from 'fs';
import { writeFileSync } from 'fs'; = 'https://docs.google.com/spreadsheets/d/1ToJhCD6UGT74vpUq-b2yLRYbuWVMuF4vHWuGx1Fbjf4/export?format=csv&gid=537171012';
const res = await fetch(CSV_URL);
const csv = await res.text();

function parseCSV(csv) {
  const rows = []; let current = ''; let inQuotes = false; const cells = [];
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') { if (inQuotes && csv[i+1] === '"') { current += '"'; i++; } else { inQuotes = !inQuotes; } }
    else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; }
    else if ((ch === '\n' || ch === '\r') && !inQuotes) { if (ch === '\r' && csv[i+1] === '\n') i++; cells.push(current.trim()); if (cells.some(c => c.length > 0)) rows.push([...cells]); cells.length = 0; current = ''; }
    else { current += ch; }
  }
  cells.push(current.trim()); if (cells.some(c => c.length > 0)) rows.push([...cells]); return rows;
}

import { writeFileSync } from 'fs';
const rows = parseCSV(csv);
let out = `총 ${rows.length - 1}명\n`;
for (let i = 1; i < rows.length; i++) {
  const name = (rows[i][2] || '').trim();
  if (name) out += `${i}: ${name}\n`;
}
writeFileSync('scripts/_mentors_out.txt', out, 'utf8');
console.log(out);
