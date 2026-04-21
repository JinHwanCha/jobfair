# 2026 직업박람회 — 멘토 매칭 & 자소서 첨삭 웹앱

내수동교회 직업박람회 멘토 매칭 및 자소서 첨삭 신청 서비스입니다.

## 기술 스택

| 기술 | 설명 |
|------|------|
| Next.js 14 | App Router, `'use client'` 컴포넌트 |
| React 18 | UI 라이브러리 |
| TypeScript 5 | 타입 안전성 |
| Supabase | PostgreSQL DB (서비스 키 접근) |
| Google Sheets | 멘토 데이터 소스 (CSV 실시간 연동) |
| Tailwind CSS 3 | 스타일링 |
| i18n | 한국어 / English / 中文 지원 |

---

## 페이지 구조

### 사용자 페이지

| URL | 설명 |
|-----|------|
| `/` | **메인 홈** — KV 이미지, 카운트다운, 멘토 미리보기, 행사 안내, 자소서 멘토 소개. 접속 시 공지 팝업 (오늘은 그만보기 지원) |
| `/mentors` | **멘토 리스트** — 카테고리별 필터, 이름/직업 검색, 멘토 상세 모달 |
| `/apply` | **멘토링 신청** — 4단계 폼 (기본정보 → 프로필 → 6지망 선택 → 확인). 카운트다운 오픈 시간 이후 접근 가능 |
| `/my` | **내 배정 확인** — 이름 + 전화번호 뒷자리로 조회. 동명이인 시 생년월일 선택 |
| `/resume/apply` | **자소서 첨삭 신청** — 4단계 폼 (기본정보 → 프로필/기업유형 → 섹션별 자소서 작성 → 확인). 선착순 12명 확정, 이후 예비번호 |
| `/mentor` | **멘토 대시보드** — 이름 + 전화번호로 로그인. 멘토링 멘토: 4타임 배정 멘티 확인. 자소서 멘토: 신청자 목록 확인 |
| `/resume/mentor` | **자소서 멘토 대시보드** — 자소서 멘토 전용. 신청자 자소서를 섹션별로 확인, 클릭 복사 지원 |

### 테스트 페이지

| URL | 설명 |
|-----|------|
| `/test` | 멘토링 신청 폼 미리보기 (카운트다운 없음) |
| `/resume/test` | 자소서 신청 폼 미리보기 (카운트다운 없음) |

### 관리자 페이지

| URL | 설명 |
|-----|------|
| `/admin` | **관리자 대시보드** — 코드 `0509`로 접근. 신청자 관리, 배정 실행/확인, 자소서 신청자 관리, 데이터 내보내기/삭제 |

---

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/mentors` | GET | 멘토링 멘토 목록 (Google Sheets 연동) |
| `/api/resume/mentors` | GET | 자소서 첨삭 멘토 목록 |
| `/api/apply` | POST | 멘토링 신청 (upsert + 전체 자동 재배정) |
| `/api/resume/apply` | POST | 자소서 첨삭 신청 (순번 부여) |
| `/api/my` | GET | 내 배정 결과 조회 |
| `/api/my` | DELETE | 내 신청 삭제 |
| `/api/mentor` | POST | 멘토 로그인 (멘토링 + 자소서 통합) |
| `/api/resume/mentor` | POST | 자소서 멘토 전용 로그인 |
| `/api/admin` | GET | 관리자 데이터 조회 |
| `/api/admin` | DELETE | 신청자 삭제 (관리자 코드 필요) |
| `/api/admin/assign` | POST | 자동 배정 실행 |
| `/api/admin/export` | GET | 전체 데이터 내보내기 |

---

## 핵심 비즈니스 로직

### 멘토링 신청 & 배정

1. **신청**: 이름 + 생년월일(YYMMDD) + 전화번호 뒷자리 4자리로 고유 식별. 6지망까지 멘토 선택 + 멘토별 메시지
2. **Upsert**: 동일인(이름+전화번호+생년월일) 재신청 시 기존 데이터 업데이트
3. **교차 차단**: 자소서 첨삭 신청자는 멘토링 신청 불가 (반대도 동일)
4. **자동 배정**: 신청할 때마다 전체 신청자 대상 재배정 실행

### 배정 알고리즘 (`src/lib/assignment.ts`)

1. 전체 신청자를 `updatedAt` 기준 선착순 정렬 → 관심 주제별 그룹핑
2. 6지망 중 **4개 타임 슬롯**에 배정
3. 1~4지망 우선 배정 → 5~6지망 대체 → 희망직군 유사 멘토 → 아무 멘토 (각 단계에서 **전체 배정 인원 적은 멘토 우선**)
4. **언어 그룹 분리**: 각 슬롯은 첫 배정자의 언어(한국/영어/중화권)로 고정
5. **관심 주제 우선**: 같은 주제 관심사 신청자를 같은 슬롯에 배치
6. **나이 그룹 우선**: 같은 나이 그룹(대학1-2학년 / 대학3-4학년·취준·기타) 신청자를 같은 슬롯에 배치
7. **멘토당 타임별 4명 제한** (`maxCapacity`)

### 자소서 첨삭 신청

1. **기업유형별 구조화 섹션**:
   - 대기업/사기업: 지원동기, 직무역량, 문제해결, 협업 (4개)
   - 공기업: 지원동기(공기업), 직무역량, 문제해결, 협업, 윤리/가치관 (5개)
2. **순번 시스템**: 신청 순서대로 번호 부여. 수정 시 맨 뒤로 이동
3. **선착순 12명 확정**, 13번 이후 예비번호
4. **순번 재정렬**: 삭제 시 빈 번호 없이 자동 리넘버링

### 교차 신청 차단

- 멘토링 신청자 → 자소서 신청 시 `CROSS_BLOCK_MENTORING` 오류
- 자소서 신청자 → 멘토링 신청 시 `CROSS_BLOCK_RESUME` 오류
- **한 사람은 멘토링 OR 자소서 중 하나만** 신청 가능

---

## 데이터베이스 (Supabase)

### 테이블

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|----------|
| `applicants` | 멘토링 신청자 | `id`, `name`, `birth_date`, `phone4`, `choice1`~`choice6`, `message1`~`message6`, `is_foreigner`, `language_group`, `department`, `interest_topics` (JSONB) |
| `assignments` | 배정 결과 | `applicant_id` (PK), `applicant_name`, `phone4`, `time1`~`time4` (JSONB) |
| `mentor_slots` | 멘토별 슬롯 현황 | `mentor_id` (PK), `time1`~`time4` (JSONB — 배정된 신청자 ID 배열) |
| `resume_applicants` | 자소서 신청자 | `id`, `name`, `birth_date`, `phone4`, `company_type` (JSONB), `resume_sections` (JSONB), `review_goal`, `queue_number` |

### 설정

```sql
-- supabase_setup.sql 실행 (테이블 생성 + 마이그레이션)
-- RLS 활성화, 서비스 키로 전체 접근
```

---

## 주요 파일

| 파일 | 역할 |
|------|------|
| `src/lib/data.ts` | Supabase CRUD (upsert, 조회, 삭제, 순번 재정렬) |
| `src/lib/assignment.ts` | 자동 배정 알고리즘 |
| `src/lib/sheets.ts` | Google Sheets CSV 파싱 → 멘토 데이터 |
| `src/lib/supabase.ts` | Supabase 클라이언트 |
| `src/lib/i18n.tsx` | 다국어 지원 (ko/en/zh) |
| `src/types/index.ts` | 타입 정의 + 상수 (`RESUME_MENTOR_NAMES`, `getResumeSections()`) |

### 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `Header.tsx` | 네비게이션 + 언어 전환 |
| `CountdownTimer.tsx` | 카운트다운 + `useIsOpen()` 훅 |
| `MentorCard.tsx` | 멘토 카드 |
| `MentorModal.tsx` | 멘토 상세 모달 |
| `MentorPreview.tsx` | 홈 멘토 미리보기 |
| `ApplyPreviewModal.tsx` | 멘토링 신청 미리보기 모달 |
| `ResumePreviewModal.tsx` | 자소서 신청 미리보기 모달 |

---

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_CREDENTIALS=your_credentials_json
```

## 시작하기

```bash
npm install     # 의존성 설치
npm run dev     # 개발 서버 (http://localhost:3000)
npm run build   # 프로덕션 빌드
npm start       # 프로덕션 실행
```

## 카운트다운 설정

신청 오픈 시간은 `src/components/CountdownTimer.tsx`의 `OPEN_TIME`에서 변경:

```typescript
const OPEN_TIME = '2026-04-19T18:00:00+09:00'; // KST
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

1. 전체 신청자를 `updatedAt` 기준 선착순 정렬 → 관심 주제 + 나이 그룹별 그룹핑
2. 6지망 중 **4개 타임 슬롯**에 배정
3. 1~4지망 우선 배정 → 5~6지망 대체 → 희망직군 유사 멘토 → 아무 멘토
4. **언어 그룹 분리**: 각 슬롯은 첫 배정자의 언어(한국/영어/중화권)로 고정
5. **관심 주제 우선**: 같은 주제 관심사 신청자를 같은 슬롯에 배치
6. **나이 그룹 우선**: 같은 나이 그룹(대학1-2학년 / 대학3-4학년·취준·기타) 신청자를 같은 슬롯에 배치
7. **멘토당 타임별 4명 제한** (`maxCapacity`)
8. Fallback 단계(희망직군·카테고리·전체)에서 **전체 배정 인원 합산이 적은 멘토 우선** 배정으로 부하 분산

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
