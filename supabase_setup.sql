-- Supabase SQL: 직업박람회 테이블 생성
-- Supabase Dashboard > SQL Editor 에서 실행하세요.

-- 신청자 테이블
CREATE TABLE IF NOT EXISTS applicants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  phone4 TEXT NOT NULL,
  choice1 TEXT NOT NULL,
  choice2 TEXT NOT NULL,
  choice3 TEXT NOT NULL,
  choice4 TEXT NOT NULL DEFAULT '',
  choice5 TEXT NOT NULL DEFAULT '',
  choice6 TEXT NOT NULL DEFAULT '',
  message1 TEXT DEFAULT '',
  message2 TEXT DEFAULT '',
  message3 TEXT DEFAULT '',
  message4 TEXT DEFAULT '',
  message5 TEXT DEFAULT '',
  message6 TEXT DEFAULT '',
  is_foreigner BOOLEAN DEFAULT FALSE,
  language_group TEXT DEFAULT '',
  department TEXT DEFAULT '',
  birth_year TEXT DEFAULT '',
  current_status TEXT DEFAULT '',
  desired_field TEXT DEFAULT '',
  interest_topics JSONB DEFAULT '[]'::JSONB,
  agreed_to_terms BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 배정 결과 테이블
CREATE TABLE IF NOT EXISTS assignments (
  applicant_id TEXT PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  phone4 TEXT NOT NULL,
  time1 JSONB,
  time2 JSONB,
  time3 JSONB,
  time4 JSONB,
  time5 JSONB,
  time6 JSONB
);

-- 멘토 슬롯 테이블
CREATE TABLE IF NOT EXISTS mentor_slots (
  mentor_id TEXT PRIMARY KEY,
  time1 JSONB DEFAULT '[]'::JSONB,
  time2 JSONB DEFAULT '[]'::JSONB,
  time3 JSONB DEFAULT '[]'::JSONB,
  time4 JSONB DEFAULT '[]'::JSONB,
  time5 JSONB DEFAULT '[]'::JSONB,
  time6 JSONB DEFAULT '[]'::JSONB
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_applicants_name_phone4 ON applicants (name, phone4);
CREATE INDEX IF NOT EXISTS idx_assignments_name_phone4 ON assignments (applicant_name, phone4);

-- RLS 비활성화 (서버 사이드 서비스 키 사용)
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_slots ENABLE ROW LEVEL SECURITY;

-- 서비스 키 전체 접근 정책
CREATE POLICY "Service role full access" ON applicants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON mentor_slots FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 기존 테이블 마이그레이션 (이미 테이블이 있는 경우)
-- ============================================
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS choice4 TEXT NOT NULL DEFAULT '';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS choice5 TEXT NOT NULL DEFAULT '';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS choice6 TEXT NOT NULL DEFAULT '';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS message1 TEXT DEFAULT '';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS message2 TEXT DEFAULT '';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS message3 TEXT DEFAULT '';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS message4 TEXT DEFAULT '';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS message5 TEXT DEFAULT '';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS message6 TEXT DEFAULT '';
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS is_foreigner BOOLEAN DEFAULT FALSE;
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS language_group TEXT DEFAULT '';

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS time4 JSONB;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS time5 JSONB;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS time6 JSONB;

ALTER TABLE mentor_slots ADD COLUMN IF NOT EXISTS time4 JSONB DEFAULT '[]'::JSONB;
ALTER TABLE mentor_slots ADD COLUMN IF NOT EXISTS time5 JSONB DEFAULT '[]'::JSONB;
ALTER TABLE mentor_slots ADD COLUMN IF NOT EXISTS time6 JSONB DEFAULT '[]'::JSONB;

-- ============================================
-- 자소서 첨삭 신청자 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS resume_applicants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  phone4 TEXT NOT NULL,
  department TEXT DEFAULT '',
  birth_year TEXT DEFAULT '',
  current_status TEXT DEFAULT '',
  desired_field TEXT DEFAULT '',
  resume_text TEXT NOT NULL DEFAULT '',
  agreed_to_terms BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_applicants_name_phone4 ON resume_applicants (name, phone4);

ALTER TABLE resume_applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON resume_applicants FOR ALL USING (true) WITH CHECK (true);
