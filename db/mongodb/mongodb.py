"""
============================================================
MongoDB (NoSQL) 기본 틀 - Python (pymongo)
============================================================
설치:  pip install pymongo

MongoDB는 "표"가 아니라 "문서(document, dict와 비슷)"로 저장합니다.
- database  : 데이터베이스 (가장 큰 단위)
- collection: 표(table)에 해당. 문서들이 모인 곳
- document  : 행(row)에 해당. 파이썬 dict 그대로 저장

컬럼(=문서의 키)은 자유롭게 직접 채워 넣으면 됩니다.
============================================================
"""

import os
from pymongo import MongoClient

# ------------------------------------------------------------
# 0. 연결 (앱 시작 시 1번)
# ------------------------------------------------------------
# MONGODB_URI 예: mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")

client = MongoClient(MONGODB_URI)
db = client["mydatabase"]          # 데이터베이스 이름 (직접 수정)
collection = db["mycollection"]    # 컬렉션(표) 이름 (직접 수정)


# ------------------------------------------------------------
# [CREATE / POST] 1. 새 문서 1개 저장하기
# ------------------------------------------------------------
def create_one():
    document = {
        # 여기에 원하는 컬럼(키: 값)을 직접 채우세요
        # "name": "...",
        # "age": 0,
    }
    result = collection.insert_one(document)
    print("저장됨, _id =", result.inserted_id)
    return result.inserted_id


# ------------------------------------------------------------
# [CREATE / POST] 2. 여러 문서 한 번에 저장
# ------------------------------------------------------------
def create_many():
    documents = [
        {},  # 첫 번째 문서
        {},  # 두 번째 문서
    ]
    result = collection.insert_many(documents)
    print("저장된 개수:", len(result.inserted_ids))
    return result.inserted_ids


# ------------------------------------------------------------
# [READ / GET] 3. 조회
# ------------------------------------------------------------
def read():
    one = collection.find_one({})                 # 조건에 맞는 1개
    many = list(collection.find({}).limit(10))    # 여러 개 (조건은 dict로)
    # 예: collection.find({"age": {"$gte": 20}})  # age >= 20
    return one, many


# ------------------------------------------------------------
# [UPDATE / PATCH] 4. 수정
# ------------------------------------------------------------
def update():
    collection.update_one(
        {},                       # 어떤 문서를 (조건)
        {"$set": {}},             # 어떻게 바꿀지 ($set: 값 설정, $inc: 숫자 증가)
    )


# ------------------------------------------------------------
# [DELETE] 5. 삭제
# ------------------------------------------------------------
def delete():
    collection.delete_one({})     # 조건에 맞는 1개 삭제


if __name__ == "__main__":
    # 간단 테스트
    create_one()
