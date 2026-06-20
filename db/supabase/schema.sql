-- ============================================================
-- Supabase 테이블 생성 기본 틀
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 RUN
-- ============================================================
-- 컬럼은 아래에 직접 추가하세요.

create table if not exists mytable (
  id          bigint generated always as identity primary key,  -- 자동 증가 ID
  created_at  timestamptz not null default now()                -- 생성 시각

  -- 여기에 컬럼을 추가하세요. 예시:
  -- , name   text
  -- , age    integer
  -- , price  numeric
  -- , active boolean default true
);
