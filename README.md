# 직업박람회 멘토 매칭 웹앱

5월 9일 내수동교회에서 진행하는 직업박람회 멘토 매칭 서비스입니다.

## 기능

### 사용자 기능
- **멘토 리스트 조회** - 참여 멘토 정보 확인
- **멘토 신청** - 1/2/3지망으로 희망 멘토 신청
- **배정 결과 확인** - 이름과 전화번호로 본인 배정 확인

### 관리자 기능
- **신청자 목록** - 전체 신청자 현황 확인
- **자동 배정** - 알고리즘 기반 자동 멘토 배정
- **멘토별 현황** - 멘토별 신청 수 집계
- **데이터 내보내기** - JSON 형식 데이터 백업

## 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 메인 페이지 (행사 안내) |
| `/mentors` | 멘토 리스트 |
| `/apply` | 멘토 신청 |
| `/my` | 내 배정 확인 |
| `/seum-admin` | 관리자 페이지 |

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 데이터 연동

### 현재 구조
현재는 메모리 기반 데이터 저장을 사용하고 있습니다. 서버 재시작 시 데이터가 초기화됩니다.

### 데이터베이스 연동 (권장)
실제 운영을 위해 다음 옵션을 고려하세요:

#### 1. Vercel KV (Redis)
```bash
npm install @vercel/kv
```

#### 2. Supabase
```bash
npm install @supabase/supabase-js
```

#### 3. MongoDB
```bash
npm install mongodb
```

### Google Sheets 연동

멘토 데이터를 Google Sheets에서 가져오려면:

1. Google Cloud Console에서 프로젝트 생성
2. Sheets API 활성화
3. 서비스 계정 생성 및 키 다운로드
4. 환경 변수 설정:

```env
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_CREDENTIALS=your_credentials_json
```

5. `src/lib/data.ts`에서 아래 코드 활용:

```typescript
import { google } from 'googleapis';

export async function fetchMentorsFromSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range: 'Sheet1!A:F', // 멘토 데이터 범위
  });

  const rows = response.data.values || [];
  return rows.slice(1).map((row, index) => ({
    id: `mentor-${index + 1}`,
    name: row[0],
    job: row[1],
    category: row[2],
    description: row[3],
    location: row[4],
    maxCapacity: parseInt(row[5]) || 3,
  }));
}
```

## 배정 알고리즘

1. 신청 순서대로 배정 (선착순)
2. 1지망 → 2지망 → 3지망 순 배정 시도
3. 멘토당 타임별 최대 3명 제한
4. 초과 시 다음 타임으로 자동 배정
5. 모든 지망 실패 시 동일 카테고리 멘토로 대체 배정

## 배포 (Vercel)

1. Vercel에 프로젝트 연결
2. 환경 변수 설정 (필요시)
3. 배포

```bash
vercel deploy
```

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel

## 라이선스

MIT License
