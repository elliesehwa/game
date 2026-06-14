"""
============================================================
Supabase (SQL / PostgreSQL) 기본 틀 - Python (supabase-py)
============================================================
설치:  pip install supabase

Supabase는 PostgreSQL(관계형 DB)입니다.
- 표(table) 와 컬럼(column) 으로 데이터를 저장합니다.
- 표/컬럼 정의는 SQL로 먼저 만들어야 합니다
  (Supabase 대시보드 → SQL Editor 또는 Table Editor).
  아래 schema.sql 참고. 컬럼은 직접 채워 넣으세요.
- 데이터 추가/조회/수정/삭제는 이 파이썬 파일에서 합니다.
============================================================
"""

import os
from supabase import create_client, Client

# ------------------------------------------------------------
# 0. 연결 (앱 시작 시 1번)
# ------------------------------------------------------------
# 대시보드 → Project Settings → API 에서 복사
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://xxxx.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "your-anon-key")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TABLE = "mytable"   # 사용할 표 이름 (직접 수정)


# ------------------------------------------------------------
# [CREATE / POST] 1. 새 행(row) 1개 저장하기
# ------------------------------------------------------------
def create_one():
    row = {
        # 여기에 원하는 컬럼(키: 값)을 직접 채우세요
        # "name": "...",
        # "age": 0,
    }
    response = supabase.table(TABLE).insert(row).execute()
    print("저장됨:", response.data)
    return response.data


# ------------------------------------------------------------
# [CREATE / POST] 2. 여러 행 한 번에 저장
# ------------------------------------------------------------
def create_many():
    rows = [
        {},  # 첫 번째 행
        {},  # 두 번째 행
    ]
    response = supabase.table(TABLE).insert(rows).execute()
    print("저장된 개수:", len(response.data))
    return response.data


# ------------------------------------------------------------
# [READ / GET] 3. 조회
# ------------------------------------------------------------
def read():
    response = (
        supabase.table(TABLE)
        .select("*")             # 모든 컬럼
        # .eq("age", 20)         # WHERE age = 20
        # .order("id", desc=True)
        .limit(10)
        .execute()
    )
    return response.data


# ------------------------------------------------------------
# [UPDATE / PATCH] 4. 수정
# ------------------------------------------------------------
def update(row_id):
    response = (
        supabase.table(TABLE)
        .update({})              # 바꿀 값 (컬럼: 새 값)
        .eq("id", row_id)        # 어떤 행을 (조건)
        .execute()
    )
    return response.data


# ------------------------------------------------------------
# [DELETE] 5. 삭제
# ------------------------------------------------------------
def delete(row_id):
    supabase.table(TABLE).delete().eq("id", row_id).execute()


if __name__ == "__main__":
    # 간단 테스트
    create_one()
