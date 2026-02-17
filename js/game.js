// ========================================
// 식재료 카드 게임 - 게임 엔진
// ========================================

class Game {
  constructor() {
    this.state = null;
    this.onStateChange = null;
    this.onMessage = null;
    this.turnHistory = [];
  }

  // 게임 초기화
  init(playerNames = ['플레이어', 'AI 셰프']) {
    const tier1 = this.shuffle([...TIER1_RECIPES]);
    const tier2 = this.shuffle([...TIER2_RECIPES]);
    const tier3 = this.shuffle([...TIER3_RECIPES]);

    // 셰프 카드 중 무작위 5장 선택
    const chefCards = this.shuffle([...CHEF_CARDS]).slice(0, 5);

    this.state = {
      tokens: { ...INITIAL_TOKENS },
      decks: {
        tier1: tier1.slice(4),
        tier2: tier2.slice(4),
        tier3: tier3.slice(4),
      },
      board: {
        tier1: tier1.slice(0, 4),
        tier2: tier2.slice(0, 4),
        tier3: tier3.slice(0, 4),
      },
      chefCards: chefCards,
      players: playerNames.map((name, i) => ({
        name,
        isAI: i === 1,
        tokens: { protein: 0, carb: 0, fat: 0, vitamin: 0, mineral: 0, wild: 0 },
        bonuses: { protein: 0, carb: 0, fat: 0, vitamin: 0, mineral: 0 },
        recipes: [],
        reserved: [],
        chefs: [],
        points: 0,
        totalCalories: 0,
      })),
      currentPlayer: 0,
      turn: 1,
      phase: 'playing', // 'playing', 'last_round', 'ended'
      winner: null,
      lastRoundStartPlayer: null,
    };

    this.turnHistory = [];
    this.notify();
    return this.state;
  }

  // 현재 플레이어 가져오기
  getCurrentPlayer() {
    return this.state.players[this.state.currentPlayer];
  }

  // 플레이어의 총 토큰 수
  getPlayerTokenCount(player) {
    return Object.values(player.tokens).reduce((sum, v) => sum + v, 0);
  }

  // 카드 구매 시 실제 필요한 비용 계산 (보너스 차감)
  getEffectiveCost(card, player) {
    const cost = {};
    let totalNeeded = 0;
    for (const type of INGREDIENT_KEYS) {
      const required = (card.cost[type] || 0) - (player.bonuses[type] || 0);
      cost[type] = Math.max(0, required);
      totalNeeded += cost[type];
    }
    return { cost, totalNeeded };
  }

  // 플레이어가 카드를 살 수 있는지 확인
  canAfford(card, player) {
    const { cost } = this.getEffectiveCost(card, player);
    let wildNeeded = 0;
    for (const type of INGREDIENT_KEYS) {
      const shortage = cost[type] - player.tokens[type];
      if (shortage > 0) wildNeeded += shortage;
    }
    return wildNeeded <= player.tokens.wild;
  }

  // ========================================
  // 행동 1: 재료 토큰 가져오기 (서로 다른 3개)
  // ========================================
  takeDifferentTokens(types) {
    const player = this.getCurrentPlayer();
    const pool = this.state.tokens;

    // 유효성 검사
    if (types.length > 3 || types.length === 0) {
      return { success: false, message: '1~3개의 서로 다른 재료를 선택하세요.' };
    }
    if (new Set(types).size !== types.length) {
      return { success: false, message: '서로 다른 재료를 선택해야 합니다.' };
    }
    for (const type of types) {
      if (!INGREDIENT_KEYS.includes(type)) {
        return { success: false, message: '올바르지 않은 재료입니다.' };
      }
      if (pool[type] <= 0) {
        return { success: false, message: `${INGREDIENT_TYPES[type].name}이(가) 부족합니다.` };
      }
    }

    // 토큰 가져가기
    for (const type of types) {
      pool[type]--;
      player.tokens[type]++;
    }

    this.addHistory(`${player.name}이(가) ${types.map(t => INGREDIENT_TYPES[t].name).join(', ')}을(를) 획득했습니다.`);

    // 10개 초과 확인은 UI에서 처리
    if (this.getPlayerTokenCount(player) > MAX_TOKENS_IN_HAND) {
      return { success: true, needDiscard: true, excess: this.getPlayerTokenCount(player) - MAX_TOKENS_IN_HAND };
    }

    this.endTurn();
    return { success: true };
  }

  // ========================================
  // 행동 2: 같은 재료 토큰 2개 가져오기
  // ========================================
  takeSameTokens(type) {
    const player = this.getCurrentPlayer();
    const pool = this.state.tokens;

    if (!INGREDIENT_KEYS.includes(type)) {
      return { success: false, message: '올바르지 않은 재료입니다.' };
    }
    if (pool[type] < 4) {
      return { success: false, message: `${INGREDIENT_TYPES[type].name}이(가) 4개 이상 있어야 합니다.` };
    }

    pool[type] -= 2;
    player.tokens[type] += 2;

    this.addHistory(`${player.name}이(가) ${INGREDIENT_TYPES[type].name} 2개를 획득했습니다.`);

    if (this.getPlayerTokenCount(player) > MAX_TOKENS_IN_HAND) {
      return { success: true, needDiscard: true, excess: this.getPlayerTokenCount(player) - MAX_TOKENS_IN_HAND };
    }

    this.endTurn();
    return { success: true };
  }

  // ========================================
  // 행동 3: 레시피 카드 예약 (만능 토큰 획득)
  // ========================================
  reserveCard(tier, index) {
    const player = this.getCurrentPlayer();

    if (player.reserved.length >= 3) {
      return { success: false, message: '예약은 최대 3장까지 가능합니다.' };
    }

    const boardRow = this.state.board[tier];
    if (!boardRow[index]) {
      return { success: false, message: '해당 카드가 없습니다.' };
    }

    const card = boardRow[index];
    player.reserved.push(card);

    // 덱에서 새 카드 보충
    const deck = this.state.decks[tier];
    boardRow[index] = deck.length > 0 ? deck.pop() : null;

    // 만능 토큰 지급
    if (this.state.tokens.wild > 0) {
      this.state.tokens.wild--;
      player.tokens.wild++;
    }

    this.addHistory(`${player.name}이(가) "${card.name}"을(를) 예약했습니다.`);

    if (this.getPlayerTokenCount(player) > MAX_TOKENS_IN_HAND) {
      return { success: true, needDiscard: true, excess: this.getPlayerTokenCount(player) - MAX_TOKENS_IN_HAND };
    }

    this.endTurn();
    return { success: true };
  }

  // ========================================
  // 행동 4: 레시피 카드 구매
  // ========================================
  purchaseCard(tier, index) {
    const player = this.getCurrentPlayer();
    const boardRow = this.state.board[tier];

    if (!boardRow[index]) {
      return { success: false, message: '해당 카드가 없습니다.' };
    }

    const card = boardRow[index];
    return this._doPurchase(card, player, () => {
      const deck = this.state.decks[tier];
      boardRow[index] = deck.length > 0 ? deck.pop() : null;
    });
  }

  // 예약된 카드 구매
  purchaseReserved(index) {
    const player = this.getCurrentPlayer();

    if (!player.reserved[index]) {
      return { success: false, message: '해당 예약 카드가 없습니다.' };
    }

    const card = player.reserved[index];
    return this._doPurchase(card, player, () => {
      player.reserved.splice(index, 1);
    });
  }

  _doPurchase(card, player, onSuccess) {
    if (!this.canAfford(card, player)) {
      return { success: false, message: '재료가 부족합니다.' };
    }

    const { cost } = this.getEffectiveCost(card, player);
    let wildUsed = 0;

    // 토큰 지불
    for (const type of INGREDIENT_KEYS) {
      const pay = Math.min(cost[type], player.tokens[type]);
      player.tokens[type] -= pay;
      this.state.tokens[type] += pay;
      const remaining = cost[type] - pay;
      if (remaining > 0) {
        player.tokens.wild -= remaining;
        this.state.tokens.wild += remaining;
        wildUsed += remaining;
      }
    }

    // 카드 효과 적용
    player.recipes.push(card);
    player.bonuses[card.bonus]++;
    player.points += card.points;
    player.totalCalories += card.calories;

    onSuccess();

    this.addHistory(`${player.name}이(가) "${card.name}"을(를) 완성했습니다! (+${card.points}점)`);

    // 셰프 카드 확인
    this.checkChefCards(player);

    // 승리 조건 확인
    if (player.points >= WINNING_SCORE) {
      if (this.state.phase === 'playing') {
        this.state.phase = 'last_round';
        this.state.lastRoundStartPlayer = this.state.currentPlayer;
      }
    }

    this.endTurn();
    return { success: true };
  }

  // 토큰 버리기 (10개 초과 시)
  discardTokens(discards) {
    const player = this.getCurrentPlayer();
    for (const [type, amount] of Object.entries(discards)) {
      if (amount > 0 && player.tokens[type] >= amount) {
        player.tokens[type] -= amount;
        if (type !== 'wild') {
          this.state.tokens[type] += amount;
        } else {
          this.state.tokens.wild += amount;
        }
      }
    }

    if (this.getPlayerTokenCount(player) <= MAX_TOKENS_IN_HAND) {
      this.endTurn();
      return { success: true };
    }
    return { success: false, message: '토큰이 아직 10개를 초과합니다.' };
  }

  // 셰프 카드 획득 확인
  checkChefCards(player) {
    const remaining = [];
    for (const chef of this.state.chefCards) {
      let qualifies = true;
      for (const [type, required] of Object.entries(chef.requirement)) {
        if ((player.bonuses[type] || 0) < required) {
          qualifies = false;
          break;
        }
      }
      if (qualifies) {
        player.chefs.push(chef);
        player.points += chef.points;
        this.addHistory(`${player.name}이(가) 셰프 칭호 "${chef.name}"을(를) 획득했습니다! (+${chef.points}점)`);
      } else {
        remaining.push(chef);
      }
    }
    this.state.chefCards = remaining;
  }

  // 턴 종료 처리
  endTurn() {
    const nextPlayer = (this.state.currentPlayer + 1) % this.state.players.length;

    // 마지막 라운드 확인
    if (this.state.phase === 'last_round' && nextPlayer === this.state.lastRoundStartPlayer) {
      this.state.phase = 'ended';
      // 최고 점수 플레이어 결정
      let maxPoints = -1;
      let winner = null;
      for (const p of this.state.players) {
        if (p.points > maxPoints) {
          maxPoints = p.points;
          winner = p;
        } else if (p.points === maxPoints && winner) {
          // 동점이면 레시피 수가 적은 쪽이 승리
          if (p.recipes.length < winner.recipes.length) {
            winner = p;
          }
        }
      }
      this.state.winner = winner;
      this.addHistory(`🏆 ${winner.name}이(가) ${winner.points}점으로 승리했습니다!`);
    }

    if (nextPlayer === 0) {
      this.state.turn++;
    }

    this.state.currentPlayer = nextPlayer;
    this.notify();
  }

  // 가능한 행동 목록 확인
  getAvailableActions(player) {
    const actions = [];
    const pool = this.state.tokens;

    // 서로 다른 토큰 3개 가져오기
    const availableTypes = INGREDIENT_KEYS.filter(t => pool[t] > 0);
    if (availableTypes.length >= 1) {
      actions.push({ type: 'take_different', availableTypes });
    }

    // 같은 토큰 2개 가져오기
    const doubleTypes = INGREDIENT_KEYS.filter(t => pool[t] >= 4);
    if (doubleTypes.length > 0) {
      actions.push({ type: 'take_same', availableTypes: doubleTypes });
    }

    // 카드 예약 (최대 3장)
    if (player.reserved.length < 3) {
      actions.push({ type: 'reserve' });
    }

    // 카드 구매
    for (const tier of ['tier1', 'tier2', 'tier3']) {
      for (let i = 0; i < 4; i++) {
        const card = this.state.board[tier][i];
        if (card && this.canAfford(card, player)) {
          actions.push({ type: 'purchase', tier, index: i, card });
        }
      }
    }

    // 예약 카드 구매
    for (let i = 0; i < player.reserved.length; i++) {
      if (this.canAfford(player.reserved[i], player)) {
        actions.push({ type: 'purchase_reserved', index: i, card: player.reserved[i] });
      }
    }

    return actions;
  }

  // 유틸리티
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  addHistory(msg) {
    this.turnHistory.push({ turn: this.state.turn, message: msg });
    if (this.onMessage) this.onMessage(msg);
  }

  notify() {
    if (this.onStateChange) this.onStateChange(this.state);
  }
}
