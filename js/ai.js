// ========================================
// 식재료 카드 게임 - AI 로직
// ========================================

class AIPlayer {
  constructor(game) {
    this.game = game;
  }

  // AI 턴 실행
  playTurn() {
    const state = this.game.state;
    const player = this.game.getCurrentPlayer();
    const actions = this.game.getAvailableActions(player);

    // 1순위: 고점수 카드 구매
    const purchaseAction = this.findBestPurchase(actions, player);
    if (purchaseAction) {
      return this.executePurchase(purchaseAction);
    }

    // 2순위: 거의 살 수 있는 카드를 위한 전략적 토큰 수집
    const strategicTokens = this.getStrategicTokens(player);
    if (strategicTokens) {
      return strategicTokens;
    }

    // 3순위: 상대가 곧 살 카드 예약 견제
    const reserveAction = this.findStrategicReserve(actions, player);
    if (reserveAction) {
      return reserveAction;
    }

    // 4순위: 일반 토큰 수집
    return this.collectTokens(actions, player);
  }

  // 최고 점수 구매 가능 카드 찾기
  findBestPurchase(actions, player) {
    const purchases = actions.filter(a => a.type === 'purchase' || a.type === 'purchase_reserved');

    if (purchases.length === 0) return null;

    // 점수, 셰프 카드 달성에 기여하는 보너스 순으로 정렬
    purchases.sort((a, b) => {
      const scoreA = this.evaluateCard(a.card, player);
      const scoreB = this.evaluateCard(b.card, player);
      return scoreB - scoreA;
    });

    return purchases[0];
  }

  // 카드 평가 점수 계산
  evaluateCard(card, player) {
    let score = card.points * 10;

    // 셰프 카드 요구조건에 기여하는 보너스 가산
    for (const chef of this.game.state.chefCards) {
      const req = chef.requirement[card.bonus] || 0;
      const current = player.bonuses[card.bonus] || 0;
      if (req > 0 && current < req) {
        score += 5;
      }
    }

    // 높은 티어 카드에 약간의 가산
    if (card.id.startsWith('t3')) score += 3;
    else if (card.id.startsWith('t2')) score += 1;

    // 비용 효율성 (보너스로 할인받는 양)
    const { totalNeeded } = this.game.getEffectiveCost(card, player);
    score -= totalNeeded;

    return score;
  }

  // 전략적 토큰 수집 (가장 가까운 카드를 위해)
  getStrategicTokens(player) {
    const pool = this.game.state.tokens;
    let bestTarget = null;
    let bestScore = Infinity;

    // 보드의 모든 카드 중 가장 적은 토큰으로 살 수 있는 카드 찾기
    for (const tier of ['tier3', 'tier2', 'tier1']) {
      for (const card of this.game.state.board[tier]) {
        if (!card) continue;
        const { cost, totalNeeded } = this.game.getEffectiveCost(card, player);

        // 필요한 토큰 유형별 부족량
        const shortages = {};
        let totalShortage = 0;
        for (const type of INGREDIENT_KEYS) {
          const shortage = Math.max(0, cost[type] - player.tokens[type]);
          if (shortage > 0) {
            shortages[type] = shortage;
            totalShortage += shortage;
          }
        }

        // 만능 토큰으로 커버 가능한 부분 고려
        const effectiveShortage = Math.max(0, totalShortage - player.tokens.wild);

        if (effectiveShortage < bestScore && effectiveShortage > 0) {
          bestScore = effectiveShortage;
          bestTarget = { card, shortages, tier };
        }
      }
    }

    if (!bestTarget || bestScore > 6) return null;

    // 부족한 재료 중 풀에 있는 것 선택
    const neededTypes = Object.entries(bestTarget.shortages)
      .filter(([type]) => pool[type] > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    if (neededTypes.length === 0) return null;

    // 같은 토큰 2개 가능한지 확인
    if (neededTypes.length > 0 && pool[neededTypes[0]] >= 4 && bestTarget.shortages[neededTypes[0]] >= 2) {
      const result = this.game.takeSameTokens(neededTypes[0]);
      if (result.success) return result;
    }

    // 서로 다른 토큰 3개
    const takeTypes = neededTypes.slice(0, 3);

    // 부족하면 다른 유용한 토큰으로 채우기
    if (takeTypes.length < 3) {
      for (const type of INGREDIENT_KEYS) {
        if (takeTypes.length >= 3) break;
        if (!takeTypes.includes(type) && pool[type] > 0) {
          takeTypes.push(type);
        }
      }
    }

    if (takeTypes.length > 0) {
      const result = this.game.takeDifferentTokens(takeTypes);
      if (result.success) return result;
    }

    return null;
  }

  // 전략적 예약 (상대 견제)
  findStrategicReserve(actions, player) {
    if (!actions.find(a => a.type === 'reserve')) return null;

    const opponent = this.game.state.players.find(p => !p.isAI);
    if (!opponent) return null;

    // 상대가 곧 살 수 있는 고점수 카드 찾기
    for (const tier of ['tier3', 'tier2']) {
      for (let i = 0; i < 4; i++) {
        const card = this.game.state.board[tier][i];
        if (!card) continue;

        const { totalNeeded } = this.game.getEffectiveCost(card, opponent);
        if (totalNeeded <= 2 && card.points >= 3) {
          const result = this.game.reserveCard(tier, i);
          if (result.success) return result;
        }
      }
    }

    return null;
  }

  // 일반 토큰 수집 (폴백)
  collectTokens(actions, player) {
    const pool = this.game.state.tokens;

    // 가장 부족한 토큰 우선
    const available = INGREDIENT_KEYS
      .filter(t => pool[t] > 0)
      .sort((a, b) => player.tokens[a] - player.tokens[b]);

    // 같은 토큰 2개 가능한지
    const doubleTypes = INGREDIENT_KEYS.filter(t => pool[t] >= 4);
    if (doubleTypes.length > 0 && available.length < 3) {
      const type = doubleTypes.sort((a, b) => player.tokens[a] - player.tokens[b])[0];
      const result = this.game.takeSameTokens(type);
      if (result.success) return result;
    }

    // 서로 다른 토큰 3개
    const takeTypes = available.slice(0, 3);
    if (takeTypes.length > 0) {
      const result = this.game.takeDifferentTokens(takeTypes);
      if (result.success) return result;
    }

    // 마지막 수단: 예약
    for (const tier of ['tier1', 'tier2', 'tier3']) {
      for (let i = 0; i < 4; i++) {
        if (this.game.state.board[tier][i] && player.reserved.length < 3) {
          const result = this.game.reserveCard(tier, i);
          if (result.success) return result;
        }
      }
    }

    return { success: false, message: 'AI가 행동할 수 없습니다.' };
  }
}
