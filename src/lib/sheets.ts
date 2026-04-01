import { Mentor } from '@/types';

const SHEET_ID = '1ToJhCD6UGT74vpUq-b2yLRYbuWVMuF4vHWuGx1Fbjf4';
const GID = '537171012';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

// CSV 파싱 (따옴표 + 줄바꿈 처리)
function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  const cells: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];

    if (char === '"') {
      if (inQuotes && csv[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && csv[i + 1] === '\n') i++; // CRLF
      cells.push(current.trim());
      if (cells.some(c => c.length > 0)) rows.push([...cells]);
      cells.length = 0;
      current = '';
    } else {
      current += char;
    }
  }
  // 마지막 행
  cells.push(current.trim());
  if (cells.some(c => c.length > 0)) rows.push([...cells]);

  return rows;
}

/**
 * 시트 컬럼 구조:
 * 0: 타임스탬프 (제외)
 * 1: 소속 (제외)
 * 2: 성함
 * 3: 휴대폰 번호 (제외 - 개인정보)
 * 4: 분야와 직업
 * 5: 경력
 * 6: 부르심의 영역 (카테고리)
 * 7: 멘토링 방식
 * 8: 사전모임 참석 여부 (제외)
 * 9: 하나님 말씀/성경 구절
 * 10: 학생들에게 조언
 */

function parseJobField(raw: string): { field: string; jobTitle: string } {
  // "디자인 / UX 디자이너" 형태 파싱
  const parts = raw.split('/').map(s => s.trim());
  if (parts.length >= 2) {
    return { field: parts[0], jobTitle: parts.slice(1).join(' / ') };
  }
  return { field: raw, jobTitle: raw };
}

let cachedMentors: Mentor[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 1000; // 1분 캐시

export async function fetchMentorsFromSheet(): Promise<Mentor[]> {
  if (cachedMentors && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedMentors;
  }

  try {
    const response = await fetch(CSV_URL, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error('Google Sheets fetch failed:', response.statusText);
      return cachedMentors || [];
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      console.error('시트에 데이터가 없습니다.');
      return cachedMentors || [];
    }

    // 첫 행은 헤더 → 스킵
    const mentors: Mentor[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 5) continue;

      const name = (row[2] || '').trim();
      if (!name) continue;

      const jobRaw = (row[4] || '').trim();
      const { field, jobTitle } = parseJobField(jobRaw);
      const experience = (row[5] || '').trim();
      const category = (row[6] || '').trim();
      const mentoringType = (row[7] || '').trim();
      const bibleVerse = (row[9] || '').trim();
      const advice = (row[10] || '').trim();

      mentors.push({
        id: `mentor-${i}`,
        name,
        job: jobRaw,
        field,
        jobTitle,
        category: category || '기타',
        experience,
        mentoringType,
        bibleVerse: bibleVerse || undefined,
        advice: advice || undefined,
        location: `장소${i}`,
        maxCapacity: 3,
      });
    }

    cachedMentors = mentors;
    cacheTime = Date.now();

    console.log(`${mentors.length}명의 멘토를 Google Sheets에서 로드했습니다.`);
    return mentors;
  } catch (error) {
    console.error('Google Sheets 데이터 로드 오류:', error);
    return cachedMentors || [];
  }
}

// 캐시 무효화
export function invalidateMentorCache() {
  cachedMentors = null;
  cacheTime = 0;
}
