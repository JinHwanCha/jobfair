const CSV_URL2 = 'https://docs.google.com/spreadsheets/d/1ToJhCD6UGT74vpUq-b2yLRYbuWVMuF4vHWuGx1Fbjf4/export?format=csv&gid=2098157141';

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

const res = await fetch(CSV_URL2);
const csv = await res.text();
const rows = parseCSV(csv);
console.log('Total parsed rows:', rows.length);

for (let i = 0; i < rows.length; i++) {
  const name = (rows[i][1] || '').trim();
  if (name.includes('강요셉') || name.includes('최우희') || name.includes('성재훈') || name.includes('송하정')) {
    console.log('\nRow', i, 'name:', JSON.stringify(name));
    console.log('  col2 (jobPosition):', JSON.stringify((rows[i][2] || '').substring(0,150)));
    console.log('  col3 (major):', JSON.stringify((rows[i][3] || '').substring(0,100)));
    console.log('  col4 (oneLiner):', JSON.stringify((rows[i][4] || '').substring(0,100)));
    console.log('  col5 (career):', JSON.stringify((rows[i][5] || '').substring(0,200)));
    console.log('  col6 (topics):', JSON.stringify((rows[i][6] || '').substring(0,150)));
    console.log('  col7 (keywords):', JSON.stringify((rows[i][7] || '').substring(0,100)));
    console.log('  total cols:', rows[i].length);
  }
}
