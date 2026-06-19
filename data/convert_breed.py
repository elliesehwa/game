"""
============================================================
AKC 원본 JSON → 내 견종 스키마로 변환 (필요한 것만 골라 담기)
============================================================
사용법:
    python data/convert_breed.py 원본파일.json

원리:
    복잡한 akc_*, ads, colors, markings ... 를 "지우는" 게 아니라,
    내가 쓸 필드만 "골라서" 새 dict로 옮겨 담습니다. (화이트리스트 방식)
============================================================
"""

import json
import sys


def convert(raw):
    """AKC 원본 dict 1개 → 내 스키마 dict 1개"""
    bd = raw["settings"]["breed_data"]
    key = raw["settings"]["current_breed"]   # 예: "beagle"

    basics = bd["basics"][key]
    traits = bd["traits"][key]["traits"]
    desc = bd["description"][key]

    # temperament: "curious / friendly / merry" → ["curious", "friendly", "merry"]
    temperament = [w.strip() for w in bd["traits"][key]["temperament"].split("/") if w.strip()]

    return {
        "id": basics["breed_name_url"],          # slug (예: "beagle")
        "name_en": basics["breed_name"],          # "Beagle"
        "name_ko": "",                            # 직접 채우기 (한글 이름)
        "summary": desc.get("akc_org_blurb", ""), # 한두 줄 요약

        "traits": {
            # 1~5 점수는 AKC score 그대로 사용
            "train_difficulty": traits["trainability_level"]["score"],
            "activity_level":   traits["energy_level"]["score"],
            "temperament":      temperament,      # 성격 키워드 (원본 영어)
            "common_diseases": [],                # 원본엔 정리된 목록이 없음 → 직접/AI로 채우기
        },

        "description": desc.get("akc_org_about", ""),   # 상세 설명
    }


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "Beagle.json"
    with open(src, encoding="utf-8") as f:
        raw = json.load(f)

    result = convert(raw)
    print(json.dumps(result, ensure_ascii=False, indent=2))
