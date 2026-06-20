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
============================================================
"""

import json
import re
import sys


def clean(text):
    """AKC 원본의 깨진 글자(mojibake) 정리"""
    if not text:
        return ""
    text = text.replace("'", '"').replace("'¿", "'")
    text = re.sub(r"[-¿]", "", text)  # 남은 깨진 제어문자 제거
    text = text.replace("<p>", "").replace("</p>", "\n").replace("<br>", "")
    return text.strip()


def convert(raw):
    """AKC 원본 dict 1개 → 내 스키마 dict 1개"""
    bd = raw["settings"]["breed_data"]
    key = raw["settings"]["current_breed"]   # 예: "beagle"

    basics = bd["basics"][key]
    t = bd["traits"][key]["traits"]          # 1~5 점수들이 들어있는 곳
    desc = bd["description"][key]
    std = bd.get("standards", {}).get(key, {})

    # temperament: "curious / friendly / merry" → ["curious", "friendly", "merry"]
    temperament = [w.strip() for w in bd["traits"][key]["temperament"].split("/") if w.strip()]

    def score(name):
        return t.get(name, {}).get("score", 0)

    return {
        "id": basics["breed_name_url"],          # slug (예: "beagle")
        "name_en": basics["breed_name"],
        "name_ko": "",                            # 한글 이름 직접 채우기
        "image": f"images/{basics['breed_name_url']}.png",  # 규칙 기반 자동 경로
        "summary": clean(desc.get("akc_org_blurb", "")),

        # 화면 표시용 기본 정보 (계산 안 함)
        "basics": {
            "origin": basics.get("origin", ""),
            "size": clean(std.get("size", "")),
            "life_expectancy": basics.get("life_expectancy", ""),
            "weight": std.get("weight_display", ""),
            "popularity": basics.get("popularity_2025"),
        },

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

        "description": clean(desc.get("akc_org_about", "")),
    }


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "Beagle.json"
    with open(src, encoding="utf-8") as f:
        raw = json.load(f)
    print(json.dumps(convert(raw), ensure_ascii=False, indent=2))
