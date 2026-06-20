# 견종 점수 / 필드 설명 가이드

`data/breeds.json` 의 각 필드 의미와 점수 기준 문서입니다.
**데이터(JSON)에는 값만 넣고, 그 의미는 여기서 관리**합니다.

---

## 1. 기본 정보 (화면에 보이는 부분)

| 필드 | 뜻 | 예시 |
|------|----|------|
| `id` | 고유 식별자 (slug, 소문자+하이픈) | `beagle` |
| `name_en` | 영어 이름 | `Beagle` |
| `name_ko` | 한국어 이름 | `비글` |
| `image` | 이미지 경로 (규칙: `images/{id}.png`) | `images/beagle.png` |
| `summary` | 한두 줄 요약 (목록/카드용) | `온순하고 사람을 잘 따르는...` |
| `basics.origin` | 원산지 | `England` |
| `basics.size` | 크기 | `Small` |
| `basics.life_expectancy` | 기대 수명 | `10-15 years` |
| `basics.weight` | 체중 | `약 9-13kg` |
| `basics.popularity` | AKC 인기순위(2025) | `7` |
| `common_diseases` | 잘 걸리는 질병 1~3개 | `["고관절 이형성증", ...]` |
| `description` | 상세 설명 (상세 페이지용) | 긴 문단 |
| `group` | 변종 묶음 (없으면 `null`) | `{"id":"poodle","name_ko":"푸들","variant":"toy","variant_ko":"토이"}` |

### group (변종 묶음)
푸들(토이/미니어처/스탠다드)처럼 한 견종의 변종을 묶을 때 사용.
- 각 변종은 **별도 항목**(별도 매칭 가능)으로 두되, `group.id` 가 같으면 한 가족.
- "푸들 하나로 보기" = `group.id == "poodle"` 인 항목들을 모으면 됨.
- 단일 견종(비글 등)은 `null`.

> ⚠️ `common_diseases`는 AKC 원본에 정리된 목록이 없어(줄글뿐) 직접/AI로 채웁니다.
> `tests_pipe_delimited_list`(Hip Evaluation 등)는 "권장 검사 항목"이지 질병이 아님!

---

## 2. traits — 매칭 계산 + 화면 표시 (모두 1~5 점수)

> AKC 원본 traits의 score를 그대로 사용. 매칭 가중치 공식에 바로 투입 가능.
> 한국 거주환경(아파트 多)에선 ⭐ 표시 항목이 특히 중요.

| 필드 | 1 (낮음) | 5 (높음) | 비고 |
|------|----------|----------|------|
| `train_difficulty` | 매우 쉬움 | 매우 어려움 | 훈련 난이도 |
| `activity_level` | 거의 안 움직임 | 매우 활발 | 활동량 |
| `barking_level` ⭐ | 거의 안 짖음 | 매우 자주 짖음 | 아파트 매칭 핵심 |
| `shedding_level` ⭐ | 털 안 빠짐 | 털 많이 빠짐 | 알러지/청소 |
| `grooming_frequency` | 월 1회 | 매일 | 빗질/손질 빈도 |
| `good_with_children` ⭐ | 비권장 | 아이와 잘 어울림 | 자녀 가정 |
| `good_with_dogs` | 비권장 | 다른 개와 잘 지냄 | 다견 가정 |
| `adaptability` | 변화에 민감 | 적응 잘함 | 환경 적응력 |
| `affection` | 독립적 | 매우 다정 | 애정 표현 |
| `openness_to_strangers` | 낯가림 심함 | 누구나 환영 | 낯선 사람 |
| `size_score` ⭐ | XSmall(1) | XLarge(5) | 크기 — 변종 구별 핵심 |
| `temperament` | — | — | 성격 키워드 배열 (영어 원본) |

### size_score 기준 (체중 kg 기준)
> AKC의 size 라벨(Small/Medium..)은 부정확해서(스탠다드 푸들을 Medium 취급) **체중으로 직접 계산**합니다.

| 점수 | 등급 | 체중 | 예시 |
|:---:|------|------|------|
| 1 | 초소형 | < 5kg | 토이 푸들, 치와와 |
| 2 | 소형 | 5–10kg | 미니 푸들, 셔틀랜드 쉽독 |
| 3 | 중형 | 10–25kg | 비글, 바센지 |
| 4 | 대형 | 25–40kg | 스탠다드 푸들 |
| 5 | 초대형 | > 40kg | 그레이트 데인, 마스티프 |

`basics.size`(한글 등급)와 `traits.size_score`(숫자)는 항상 이 표로 일치시킴.
변환기가 AKC 체중(파운드)을 자동 파싱해 계산합니다.

### temperament 키워드
AKC `temperament`("curious / friendly / merry")를 `/` 로 잘라 배열로 저장.
화면 표시 + 매칭 + (나중에) 성격 문장 생성 재료로 사용.

---

## 3. 데이터 작성 규칙

- 점수 필드는 **1~5 정수만** (0은 "미정/해당없음")
- 새 견종은 `breed-template.json` 복사 → `breeds.json` 배열에 추가
- 또는 AKC 원본이 있으면 `python data/convert_breed.py 파일.json` 으로 자동 변환
  (변환 후 `name_ko`, `common_diseases`, 한글 `summary`/`description`만 손보면 됨)
- 이미지 파일명은 `id` 와 똑같이 (`beagle.png`) → 자동화 용이
