// ========================================
// 식재료 카드 게임 - 게임 데이터
// ========================================

const INGREDIENT_TYPES = {
  protein: { name: '단백질', emoji: '🥩', color: '#E74C3C', colorLight: '#FADBD8' },
  carb: { name: '탄수화물', emoji: '🌾', color: '#F39C12', colorLight: '#FEF5E7' },
  fat: { name: '지방', emoji: '🧈', color: '#E67E22', colorLight: '#FDEBD0' },
  vitamin: { name: '비타민', emoji: '🥬', color: '#27AE60', colorLight: '#D5F5E3' },
  mineral: { name: '미네랄', emoji: '🧂', color: '#3498DB', colorLight: '#D6EAF8' },
};

const INGREDIENT_KEYS = ['protein', 'carb', 'fat', 'vitamin', 'mineral'];

// 초기 재료 토큰 수 (2인 기준)
const INITIAL_TOKENS = {
  protein: 4,
  carb: 4,
  fat: 4,
  vitamin: 4,
  mineral: 4,
  wild: 5, // 만능 토큰
};

const MAX_TOKENS_IN_HAND = 10;
const WINNING_SCORE = 15;

// ========================================
// Tier 1 레시피 카드 (기본 요리, 0~1점)
// ========================================
const TIER1_RECIPES = [
  // 단백질 보너스 카드들
  { id: 't1_01', name: '삶은 달걀', bonus: 'protein', points: 0, cost: { carb: 1, fat: 1, vitamin: 1 }, calories: 80 },
  { id: 't1_02', name: '닭가슴살 구이', bonus: 'protein', points: 0, cost: { fat: 2, vitamin: 1 }, calories: 165 },
  { id: 't1_03', name: '두부 스테이크', bonus: 'protein', points: 0, cost: { carb: 1, fat: 1, mineral: 1, vitamin: 1 }, calories: 120 },
  { id: 't1_04', name: '연어 회', bonus: 'protein', points: 1, cost: { fat: 2, mineral: 1, vitamin: 1 }, calories: 200 },
  { id: 't1_05', name: '새우 볶음', bonus: 'protein', points: 0, cost: { fat: 3 }, calories: 150 },
  { id: 't1_06', name: '계란 프라이', bonus: 'protein', points: 0, cost: { fat: 1, mineral: 2 }, calories: 90 },
  { id: 't1_07', name: '소고기 장조림', bonus: 'protein', points: 0, cost: { carb: 2, mineral: 1 }, calories: 180 },
  { id: 't1_08', name: '참치 샐러드', bonus: 'protein', points: 0, cost: { vitamin: 2, mineral: 1 }, calories: 140 },

  // 탄수화물 보너스 카드들
  { id: 't1_09', name: '흰 쌀밥', bonus: 'carb', points: 0, cost: { mineral: 1, vitamin: 1, protein: 1 }, calories: 210 },
  { id: 't1_10', name: '식빵 토스트', bonus: 'carb', points: 0, cost: { fat: 2, mineral: 1 }, calories: 160 },
  { id: 't1_11', name: '감자 샐러드', bonus: 'carb', points: 0, cost: { protein: 1, fat: 1, vitamin: 1, mineral: 1 }, calories: 180 },
  { id: 't1_12', name: '옥수수 구이', bonus: 'carb', points: 1, cost: { fat: 1, vitamin: 2, mineral: 1 }, calories: 155 },
  { id: 't1_13', name: '우동면', bonus: 'carb', points: 0, cost: { protein: 3 }, calories: 230 },
  { id: 't1_14', name: '고구마 구이', bonus: 'carb', points: 0, cost: { vitamin: 2, fat: 1 }, calories: 170 },
  { id: 't1_15', name: '볶음밥', bonus: 'carb', points: 0, cost: { protein: 1, fat: 2 }, calories: 250 },
  { id: 't1_16', name: '떡', bonus: 'carb', points: 0, cost: { mineral: 2, protein: 1 }, calories: 200 },

  // 지방 보너스 카드들
  { id: 't1_17', name: '버터 구이', bonus: 'fat', points: 0, cost: { protein: 1, carb: 1, mineral: 1 }, calories: 120 },
  { id: 't1_18', name: '아보카도 토스트', bonus: 'fat', points: 0, cost: { carb: 2, vitamin: 1 }, calories: 190 },
  { id: 't1_19', name: '치즈 플레이트', bonus: 'fat', points: 0, cost: { protein: 1, carb: 1, mineral: 1, vitamin: 1 }, calories: 200 },
  { id: 't1_20', name: '올리브유 드레싱', bonus: 'fat', points: 1, cost: { vitamin: 2, mineral: 1, carb: 1 }, calories: 130 },
  { id: 't1_21', name: '견과류 믹스', bonus: 'fat', points: 0, cost: { vitamin: 3 }, calories: 170 },
  { id: 't1_22', name: '크림 소스', bonus: 'fat', points: 0, cost: { protein: 2, carb: 1 }, calories: 110 },
  { id: 't1_23', name: '참기름 양념', bonus: 'fat', points: 0, cost: { mineral: 1, carb: 2 }, calories: 100 },
  { id: 't1_24', name: '마요네즈', bonus: 'fat', points: 0, cost: { protein: 2, vitamin: 1 }, calories: 95 },

  // 비타민 보너스 카드들
  { id: 't1_25', name: '과일 샐러드', bonus: 'vitamin', points: 0, cost: { carb: 1, fat: 1, protein: 1 }, calories: 90 },
  { id: 't1_26', name: '시금치 나물', bonus: 'vitamin', points: 0, cost: { mineral: 2, protein: 1 }, calories: 60 },
  { id: 't1_27', name: '당근 스틱', bonus: 'vitamin', points: 0, cost: { carb: 1, fat: 1, protein: 1, mineral: 1 }, calories: 50 },
  { id: 't1_28', name: '레몬 주스', bonus: 'vitamin', points: 1, cost: { carb: 2, mineral: 1, fat: 1 }, calories: 30 },
  { id: 't1_29', name: '토마토 슬라이스', bonus: 'vitamin', points: 0, cost: { mineral: 3 }, calories: 40 },
  { id: 't1_30', name: '오이 무침', bonus: 'vitamin', points: 0, cost: { carb: 1, mineral: 2 }, calories: 35 },
  { id: 't1_31', name: '브로콜리 데침', bonus: 'vitamin', points: 0, cost: { protein: 1, fat: 2 }, calories: 55 },
  { id: 't1_32', name: '파프리카 볶음', bonus: 'vitamin', points: 0, cost: { fat: 1, carb: 2 }, calories: 45 },

  // 미네랄 보너스 카드들
  { id: 't1_33', name: '미역 국', bonus: 'mineral', points: 0, cost: { protein: 1, vitamin: 1, fat: 1 }, calories: 70 },
  { id: 't1_34', name: '소금구이', bonus: 'mineral', points: 0, cost: { protein: 2, fat: 1 }, calories: 150 },
  { id: 't1_35', name: '멸치 볶음', bonus: 'mineral', points: 0, cost: { protein: 1, carb: 1, fat: 1, vitamin: 1 }, calories: 110 },
  { id: 't1_36', name: '된장 양념', bonus: 'mineral', points: 1, cost: { protein: 2, carb: 1, vitamin: 1 }, calories: 80 },
  { id: 't1_37', name: '김 구이', bonus: 'mineral', points: 0, cost: { carb: 3 }, calories: 30 },
  { id: 't1_38', name: '조개 맑은탕', bonus: 'mineral', points: 0, cost: { protein: 1, vitamin: 2 }, calories: 90 },
  { id: 't1_39', name: '두부 조림', bonus: 'mineral', points: 0, cost: { protein: 2, carb: 1 }, calories: 100 },
  { id: 't1_40', name: '우유 한 잔', bonus: 'mineral', points: 0, cost: { fat: 1, vitamin: 2 }, calories: 130 },
];

// ========================================
// Tier 2 레시피 카드 (중급 요리, 1~3점)
// ========================================
const TIER2_RECIPES = [
  // 단백질 보너스
  { id: 't2_01', name: '불고기', bonus: 'protein', points: 1, cost: { carb: 3, fat: 2, mineral: 2 }, calories: 350 },
  { id: 't2_02', name: '치킨 커틀렛', bonus: 'protein', points: 1, cost: { carb: 2, fat: 3, vitamin: 1 }, calories: 380 },
  { id: 't2_03', name: '연어 스테이크', bonus: 'protein', points: 2, cost: { fat: 4, mineral: 2 }, calories: 420 },
  { id: 't2_04', name: '갈비찜', bonus: 'protein', points: 2, cost: { carb: 2, fat: 2, vitamin: 1, mineral: 1 }, calories: 450 },
  { id: 't2_05', name: '해물탕', bonus: 'protein', points: 2, cost: { vitamin: 3, mineral: 2, fat: 1 }, calories: 300 },
  { id: 't2_06', name: '제육볶음', bonus: 'protein', points: 3, cost: { carb: 3, fat: 3, vitamin: 2 }, calories: 400 },

  // 탄수화물 보너스
  { id: 't2_07', name: '비빔밥', bonus: 'carb', points: 1, cost: { protein: 2, vitamin: 3, mineral: 2 }, calories: 500 },
  { id: 't2_08', name: '파스타', bonus: 'carb', points: 1, cost: { protein: 3, fat: 2, vitamin: 1 }, calories: 450 },
  { id: 't2_09', name: '김밥', bonus: 'carb', points: 2, cost: { protein: 4, mineral: 2 }, calories: 380 },
  { id: 't2_10', name: '리조또', bonus: 'carb', points: 2, cost: { protein: 2, fat: 2, mineral: 1, vitamin: 1 }, calories: 420 },
  { id: 't2_11', name: '잡채', bonus: 'carb', points: 2, cost: { protein: 2, vitamin: 3, fat: 1 }, calories: 350 },
  { id: 't2_12', name: '떡볶이', bonus: 'carb', points: 3, cost: { protein: 3, fat: 2, mineral: 3 }, calories: 480 },

  // 지방 보너스
  { id: 't2_13', name: '크림 파스타', bonus: 'fat', points: 1, cost: { protein: 2, carb: 3, mineral: 2 }, calories: 520 },
  { id: 't2_14', name: '그라탕', bonus: 'fat', points: 1, cost: { carb: 3, vitamin: 2, protein: 1 }, calories: 480 },
  { id: 't2_15', name: '치즈 피자', bonus: 'fat', points: 2, cost: { carb: 4, protein: 2 }, calories: 550 },
  { id: 't2_16', name: '돈까스', bonus: 'fat', points: 2, cost: { protein: 2, carb: 2, vitamin: 1, mineral: 1 }, calories: 500 },
  { id: 't2_17', name: '크로켓', bonus: 'fat', points: 2, cost: { carb: 3, mineral: 2, vitamin: 1 }, calories: 400 },
  { id: 't2_18', name: '치킨 윙', bonus: 'fat', points: 3, cost: { protein: 3, carb: 3, mineral: 2 }, calories: 580 },

  // 비타민 보너스
  { id: 't2_19', name: '녹즙 스무디', bonus: 'vitamin', points: 1, cost: { carb: 2, mineral: 3, fat: 2 }, calories: 150 },
  { id: 't2_20', name: '샐러드 보울', bonus: 'vitamin', points: 1, cost: { fat: 3, mineral: 2, protein: 1 }, calories: 200 },
  { id: 't2_21', name: '채소 볶음', bonus: 'vitamin', points: 2, cost: { fat: 4, carb: 2 }, calories: 180 },
  { id: 't2_22', name: '냉면', bonus: 'vitamin', points: 2, cost: { carb: 2, protein: 2, mineral: 1, fat: 1 }, calories: 380 },
  { id: 't2_23', name: '월남쌈', bonus: 'vitamin', points: 2, cost: { protein: 3, fat: 2, mineral: 1 }, calories: 250 },
  { id: 't2_24', name: '과일 타르트', bonus: 'vitamin', points: 3, cost: { carb: 3, fat: 3, protein: 2 }, calories: 320 },

  // 미네랄 보너스
  { id: 't2_25', name: '된장찌개', bonus: 'mineral', points: 1, cost: { protein: 3, vitamin: 2, fat: 2 }, calories: 280 },
  { id: 't2_26', name: '김치찌개', bonus: 'mineral', points: 1, cost: { protein: 3, vitamin: 2, carb: 1 }, calories: 300 },
  { id: 't2_27', name: '순두부찌개', bonus: 'mineral', points: 2, cost: { protein: 4, vitamin: 2 }, calories: 250 },
  { id: 't2_28', name: '매운탕', bonus: 'mineral', points: 2, cost: { protein: 2, vitamin: 2, fat: 1, carb: 1 }, calories: 280 },
  { id: 't2_29', name: '미역국밥', bonus: 'mineral', points: 2, cost: { protein: 2, carb: 3, vitamin: 1 }, calories: 350 },
  { id: 't2_30', name: '설렁탕', bonus: 'mineral', points: 3, cost: { protein: 3, carb: 2, fat: 3 }, calories: 450 },
];

// ========================================
// Tier 3 레시피 카드 (고급 요리, 3~5점)
// ========================================
const TIER3_RECIPES = [
  // 단백질 보너스
  { id: 't3_01', name: '한우 스테이크', bonus: 'protein', points: 3, cost: { fat: 5, mineral: 3, vitamin: 3 }, calories: 650 },
  { id: 't3_02', name: '랍스터 요리', bonus: 'protein', points: 4, cost: { fat: 3, carb: 3, mineral: 3, vitamin: 3 }, calories: 500 },
  { id: 't3_03', name: '궁중 갈비', bonus: 'protein', points: 4, cost: { carb: 5, fat: 3, mineral: 3 }, calories: 700 },
  { id: 't3_04', name: '오마카세 초밥', bonus: 'protein', points: 5, cost: { carb: 4, fat: 4, mineral: 3, vitamin: 3 }, calories: 550 },

  // 탄수화물 보너스
  { id: 't3_05', name: '트러플 리조또', bonus: 'carb', points: 3, cost: { protein: 5, fat: 3, vitamin: 3 }, calories: 600 },
  { id: 't3_06', name: '궁중 떡볶이', bonus: 'carb', points: 4, cost: { protein: 3, fat: 3, vitamin: 3, mineral: 3 }, calories: 520 },
  { id: 't3_07', name: '나폴리 피자', bonus: 'carb', points: 4, cost: { protein: 5, fat: 3, mineral: 3 }, calories: 650 },
  { id: 't3_08', name: '한정식 밥상', bonus: 'carb', points: 5, cost: { protein: 4, fat: 3, vitamin: 4, mineral: 3 }, calories: 800 },

  // 지방 보너스
  { id: 't3_09', name: '프렌치 코스', bonus: 'fat', points: 3, cost: { protein: 3, carb: 5, mineral: 3 }, calories: 750 },
  { id: 't3_10', name: '웰링턴 스테이크', bonus: 'fat', points: 4, cost: { protein: 3, carb: 3, vitamin: 3, mineral: 3 }, calories: 800 },
  { id: 't3_11', name: '미슐랭 디저트', bonus: 'fat', points: 4, cost: { carb: 5, vitamin: 3, protein: 3 }, calories: 450 },
  { id: 't3_12', name: '풀코스 오믈렛', bonus: 'fat', points: 5, cost: { protein: 4, carb: 4, vitamin: 3, mineral: 3 }, calories: 680 },

  // 비타민 보너스
  { id: 't3_13', name: '지중해 샐러드', bonus: 'vitamin', points: 3, cost: { fat: 3, mineral: 5, carb: 3 }, calories: 300 },
  { id: 't3_14', name: '사찰 비빔밥', bonus: 'vitamin', points: 4, cost: { carb: 3, fat: 3, protein: 3, mineral: 3 }, calories: 380 },
  { id: 't3_15', name: '유기농 코스', bonus: 'vitamin', points: 4, cost: { mineral: 5, protein: 3, carb: 3 }, calories: 350 },
  { id: 't3_16', name: '디톡스 풀코스', bonus: 'vitamin', points: 5, cost: { carb: 3, fat: 4, mineral: 4, protein: 3 }, calories: 280 },

  // 미네랄 보너스
  { id: 't3_17', name: '전복죽 정식', bonus: 'mineral', points: 3, cost: { protein: 3, carb: 3, vitamin: 5 }, calories: 400 },
  { id: 't3_18', name: '해물 모둠탕', bonus: 'mineral', points: 4, cost: { protein: 3, carb: 3, fat: 3, vitamin: 3 }, calories: 500 },
  { id: 't3_19', name: '보양탕 정식', bonus: 'mineral', points: 4, cost: { protein: 5, vitamin: 3, carb: 3 }, calories: 600 },
  { id: 't3_20', name: '궁중 한상', bonus: 'mineral', points: 5, cost: { protein: 3, carb: 4, fat: 3, vitamin: 4 }, calories: 750 },
];

// ========================================
// 셰프 카드 (명성 보너스, 자동 획득)
// ========================================
const CHEF_CARDS = [
  { id: 'chef_01', name: '한식 대가', points: 3, requirement: { protein: 3, carb: 3, mineral: 3 }, emoji: '👨‍🍳' },
  { id: 'chef_02', name: '양식 마스터', points: 3, requirement: { carb: 3, fat: 3, vitamin: 3 }, emoji: '👩‍🍳' },
  { id: 'chef_03', name: '영양학 박사', points: 3, requirement: { vitamin: 4, mineral: 4 }, emoji: '🎓' },
  { id: 'chef_04', name: '파워 셰프', points: 3, requirement: { protein: 4, fat: 4 }, emoji: '💪' },
  { id: 'chef_05', name: '균형 요리사', points: 3, requirement: { protein: 3, carb: 3, vitamin: 3 }, emoji: '⚖️' },
  { id: 'chef_06', name: '디저트 장인', points: 3, requirement: { carb: 4, fat: 3, vitamin: 2 }, emoji: '🍰' },
  { id: 'chef_07', name: '건강식 전문가', points: 3, requirement: { protein: 3, vitamin: 3, mineral: 3 }, emoji: '🥗' },
  { id: 'chef_08', name: '퓨전 셰프', points: 3, requirement: { fat: 3, vitamin: 3, mineral: 3 }, emoji: '🌏' },
  { id: 'chef_09', name: '미슐랭 스타', points: 3, requirement: { protein: 3, carb: 3, fat: 3 }, emoji: '⭐' },
  { id: 'chef_10', name: '철인 셰프', points: 3, requirement: { protein: 4, carb: 4 }, emoji: '🏆' },
];
