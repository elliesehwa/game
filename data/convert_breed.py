"""
============================================================
AKC 원본 JSON → 내 견종 스키마로 변환 (필요한 것만 골라 담기)
============================================================
사용법:
    python data/convert_breed.py 원본파일.json

원리:
    복잡한 ads, colors, markings, 연도별 인기순위 ... 를 "지우는" 게 아니라,
    내가 쓸 필드만 "골라서" 새 dict로 옮겨 담습니다. (화이트리스트 방식)

매칭에 쓸 1~5 점수는 AKC traits 안에 이미 다 있어서 그대로 가져옵니다.
description은 성격·건강·운동·훈련·미용 섹션에서 각 첫 문장을 영어 그대로 뽑아 합칩니다.
============================================================
"""

import json
import re
import sys


def clean(text):
    """AKC 원본의 깨진 글자(mojibake)·HTML 정리"""
    if not text:
        return ""
    text = re.sub(r"[-¿]", "", text)  # 깨진 제어문자 제거
    text = text.replace("<p>", "").replace("</p>", " ").replace("<br>", " ")
    return re.sub(r"\s+", " ", text).strip()


def first_sentence(html):
    """문단에서 첫 문장만 뽑기 (영어)"""
    txt = clean(html)
    parts = re.split(r"(?<=[.!?])\s+", txt)
    return parts[0].strip() if parts and parts[0] else ""


def build_description(desc_block, health_block):
    """성격·건강·운동·훈련·미용 섹션에서 각 첫 문장을 뽑아 영어로 합침"""
    lines = [
        first_sentence(desc_block.get("akc_org_about", "")),       # 성격/개요
        first_sentence(health_block.get("akc_org_health", "")),    # 건강
        first_sentence(health_block.get("akc_org_exercise", "")),  # 운동
        first_sentence(health_block.get("akc_org_training", "")),  # 훈련
        first_sentence(health_block.get("akc_org_grooming", "")),  # 미용
    ]
    return " ".join(l for l in lines if l)


def convert(raw):
    """AKC 원본 dict 1개 → 내 스키마 dict 1개"""
    bd = raw["settings"]["breed_data"]
    key = raw["settings"]["current_breed"]   # 예: "beagle"

    basics = bd["basics"][key]
    t = bd["traits"][key]["traits"]          # 1~5 점수들이 들어있는 곳
    desc = bd["description"][key]
    health = bd["health"][key]

    # temperament: "curious / friendly / merry" → ["curious", "friendly", "merry"]
    temperament = [w.strip() for w in bd["traits"][key]["temperament"].split("/") if w.strip()]

    def score(name):
        return t.get(name, {}).get("score", 0)

    return {
        "id": basics["breed_name_url"],          # slug (예: "beagle")
        "name_en": basics["breed_name"],
        "name_ko": "",                            # 한글 이름 직접 채우기
        "image": f"images/{basics['breed_name_url']}.png",  # 규칙 기반 자동 경로
        "summary": "",                            # 한글 요약 직접 작성
        "group": None,                            # 변종 묶음(푸들 등). 단일견종은 None
        "origin": basics.get("origin", ""),       # 원산지 (유일하게 남긴 기본 정보)

        # 매칭 계산 + 화면 표시 (전부 1~5 점수)
        "traits": {
            "train_difficulty":     score("trainability_level"),
            "activity_level":       score("energy_level"),
            "barking_level":        score("barking_level"),
            "shedding_level":       score("shedding_level"),
            "grooming_frequency":   score("coat_grooming_frequency"),
            "good_with_children":   score("good_with_young_children"),
            "good_with_dogs":       score("good_with_other_dogs"),
            "adaptability":         score("adaptability_level"),
            "affection":            score("affectionate_with_family"),
            "openness_to_strangers": score("openness_to_strangers"),
            "temperament":          temperament,
        },

        # 원본엔 정리된 질병 목록이 없음(줄글뿐) → 직접/AI로 채우기
        "common_diseases": [],

        # 성격·건강·운동·훈련·미용 첫 문장을 영어 그대로 합침
        "description": build_description(desc, health),
    }


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "Beagle.json"
    with open(src, encoding="utf-8") as f:
        raw = json.load(f)
    print(json.dumps(convert(raw), ensure_ascii=False, indent=2))
