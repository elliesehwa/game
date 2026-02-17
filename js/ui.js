// ========================================
// 식재료 카드 게임 - UI 렌더링 & 앱 컨트롤러
// ========================================

class GameUI {
  constructor() {
    this.game = new Game();
    this.ai = new AIPlayer(this.game);
    this.selectedTokens = [];
    this.actionMode = null; // 'take_different', 'take_same', null
    this.discardMode = false;
    this.discardCount = 0;
    this.discardSelections = {};
    this.aiThinking = false;

    this.game.onStateChange = () => this.render();
    this.game.onMessage = (msg) => this.addLog(msg);
  }

  // ========================================
  // 게임 시작
  // ========================================
  startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    this.game.init();
    this.render();
  }

  // ========================================
  // 전체 렌더링
  // ========================================
  render() {
    if (!this.game.state) return;

    this.renderTokenPool();
    this.renderChefCards();
    this.renderBoard();
    this.renderPlayerInfo(0);
    this.renderOpponentInfo(1);
    this.renderTurnInfo();
    this.renderActionButtons();

    if (this.game.state.phase === 'ended') {
      this.showGameOver();
    }
  }

  // ========================================
  // 토큰 풀 렌더링
  // ========================================
  renderTokenPool() {
    const container = document.getElementById('token-pool');
    const tokens = this.game.state.tokens;
    container.innerHTML = '';

    for (const type of INGREDIENT_KEYS) {
      const info = INGREDIENT_TYPES[type];
      const token = document.createElement('div');
      token.className = `token-item ${this.selectedTokens.includes(type) ? 'selected' : ''} ${tokens[type] === 0 ? 'empty' : ''}`;
      token.innerHTML = `
        <div class="token-circle" style="background: ${info.color}">
          <span class="token-emoji">${info.emoji}</span>
        </div>
        <div class="token-name">${info.name}</div>
        <div class="token-count">${tokens[type]}</div>
      `;
      token.onclick = () => this.onTokenClick(type);
      container.appendChild(token);
    }

    // 만능 토큰
    const wildToken = document.createElement('div');
    wildToken.className = 'token-item wild-token';
    wildToken.innerHTML = `
      <div class="token-circle" style="background: linear-gradient(135deg, #FFD700, #FFA500)">
        <span class="token-emoji">⭐</span>
      </div>
      <div class="token-name">만능</div>
      <div class="token-count">${tokens.wild}</div>
    `;
    container.appendChild(wildToken);
  }

  // ========================================
  // 셰프 카드 렌더링
  // ========================================
  renderChefCards() {
    const container = document.getElementById('chef-cards');
    container.innerHTML = '';

    for (const chef of this.game.state.chefCards) {
      const card = document.createElement('div');
      card.className = 'chef-card';
      const reqHtml = Object.entries(chef.requirement)
        .map(([type, count]) => `<span class="chef-req" style="color: ${INGREDIENT_TYPES[type].color}">${INGREDIENT_TYPES[type].emoji}${count}</span>`)
        .join(' ');
      card.innerHTML = `
        <div class="chef-emoji">${chef.emoji}</div>
        <div class="chef-name">${chef.name}</div>
        <div class="chef-points">${chef.points}점</div>
        <div class="chef-requirements">${reqHtml}</div>
      `;
      container.appendChild(card);
    }
  }

  // ========================================
  // 보드 카드 렌더링
  // ========================================
  renderBoard() {
    for (const tier of ['tier1', 'tier2', 'tier3']) {
      const row = document.getElementById(`board-${tier}`);
      const deck = this.game.state.decks[tier];
      row.innerHTML = '';

      // 덱 표시
      const deckCard = document.createElement('div');
      deckCard.className = `deck-indicator ${tier}`;
      const tierLabel = tier === 'tier1' ? '기본' : tier === 'tier2' ? '중급' : '고급';
      const tierStars = tier === 'tier1' ? '★' : tier === 'tier2' ? '★★' : '★★★';
      deckCard.innerHTML = `
        <div class="deck-stars">${tierStars}</div>
        <div class="deck-label">${tierLabel}</div>
        <div class="deck-count">${deck.length}장</div>
      `;
      row.appendChild(deckCard);

      // 카드 4장
      for (let i = 0; i < 4; i++) {
        const card = this.game.state.board[tier][i];
        const cardEl = this.createCardElement(card, tier, i);
        row.appendChild(cardEl);
      }
    }
  }

  // 카드 엘리먼트 생성
  createCardElement(card, tier, index) {
    const el = document.createElement('div');

    if (!card) {
      el.className = 'recipe-card empty-slot';
      el.innerHTML = '<div class="empty-text">빈 자리</div>';
      return el;
    }

    const player = this.game.state.players[0];
    const canBuy = this.game.canAfford(card, player);
    const isCurrentPlayer = this.game.state.currentPlayer === 0;
    const bonusInfo = INGREDIENT_TYPES[card.bonus];
    const { cost } = this.game.getEffectiveCost(card, player);

    el.className = `recipe-card ${tier} ${canBuy && isCurrentPlayer ? 'affordable' : ''} ${!isCurrentPlayer ? 'disabled' : ''}`;

    const costHtml = Object.entries(card.cost)
      .filter(([, v]) => v > 0)
      .map(([type, count]) => {
        const info = INGREDIENT_TYPES[type];
        const effective = cost[type];
        const hasEnough = player.tokens[type] + player.bonuses[type] >= (card.cost[type] || 0);
        return `<span class="cost-badge ${hasEnough ? 'satisfied' : ''}" style="background: ${info.color}">${info.emoji} ${effective > 0 ? effective : '✓'}</span>`;
      })
      .join('');

    el.innerHTML = `
      <div class="card-header">
        <span class="card-bonus" style="background: ${bonusInfo.colorLight}; color: ${bonusInfo.color}">${bonusInfo.emoji}</span>
        ${card.points > 0 ? `<span class="card-points">${card.points}</span>` : ''}
      </div>
      <div class="card-name">${card.name}</div>
      <div class="card-calories">${card.calories} kcal</div>
      <div class="card-cost">${costHtml}</div>
    `;

    if (isCurrentPlayer && this.game.state.phase !== 'ended') {
      el.onclick = () => this.onCardClick(tier, index, card, canBuy);
    }

    return el;
  }

  // ========================================
  // 플레이어 정보 렌더링
  // ========================================
  renderPlayerInfo(playerIndex) {
    const player = this.game.state.players[playerIndex];
    const container = document.getElementById('player-info');
    const isActive = this.game.state.currentPlayer === playerIndex;

    container.className = `player-panel ${isActive ? 'active' : ''}`;

    // 토큰 표시
    const tokensHtml = INGREDIENT_KEYS.map(type => {
      const info = INGREDIENT_TYPES[type];
      const bonus = player.bonuses[type];
      return `
        <div class="player-token">
          <div class="mini-token" style="background: ${info.color}">${info.emoji}</div>
          <span class="player-token-count">${player.tokens[type]}</span>
          ${bonus > 0 ? `<span class="bonus-badge">+${bonus}</span>` : ''}
        </div>
      `;
    }).join('');

    // 만능 토큰
    const wildHtml = player.tokens.wild > 0 ?
      `<div class="player-token">
        <div class="mini-token" style="background: linear-gradient(135deg, #FFD700, #FFA500)">⭐</div>
        <span class="player-token-count">${player.tokens.wild}</span>
      </div>` : '';

    // 예약 카드
    const reservedHtml = player.reserved.map((card, i) => {
      const canBuy = this.game.canAfford(card, player);
      const bonusInfo = INGREDIENT_TYPES[card.bonus];
      return `
        <div class="reserved-card ${canBuy ? 'affordable' : ''}" onclick="ui.onReservedClick(${i}, ${canBuy})">
          <span class="card-bonus mini" style="background: ${bonusInfo.colorLight}; color: ${bonusInfo.color}">${bonusInfo.emoji}</span>
          <span class="reserved-name">${card.name}</span>
          ${card.points > 0 ? `<span class="card-points mini">${card.points}</span>` : ''}
        </div>
      `;
    }).join('');

    // 획득한 셰프 카드
    const chefsHtml = player.chefs.map(chef =>
      `<span class="chef-badge" title="${chef.name}">${chef.emoji}</span>`
    ).join('');

    container.innerHTML = `
      <div class="player-header">
        <h3>👨‍🍳 ${player.name}</h3>
        <div class="player-score">${player.points}점</div>
      </div>
      <div class="player-stats">
        <span>📋 레시피 ${player.recipes.length}개</span>
        <span>🔥 ${player.totalCalories} kcal</span>
        ${chefsHtml ? `<span>${chefsHtml}</span>` : ''}
      </div>
      <div class="player-tokens">${tokensHtml}${wildHtml}</div>
      ${player.reserved.length > 0 ? `
        <div class="reserved-section">
          <h4>📌 예약 (${player.reserved.length}/3)</h4>
          <div class="reserved-list">${reservedHtml}</div>
        </div>
      ` : ''}
    `;
  }

  // ========================================
  // 상대(AI) 정보 렌더링
  // ========================================
  renderOpponentInfo(playerIndex) {
    const player = this.game.state.players[playerIndex];
    const container = document.getElementById('opponent-info');
    const isActive = this.game.state.currentPlayer === playerIndex;

    container.className = `opponent-panel ${isActive ? 'active' : ''}`;

    const tokensHtml = INGREDIENT_KEYS.map(type => {
      const info = INGREDIENT_TYPES[type];
      const bonus = player.bonuses[type];
      return `
        <div class="player-token mini">
          <div class="mini-token small" style="background: ${info.color}">${info.emoji}</div>
          <span>${player.tokens[type]}</span>
          ${bonus > 0 ? `<span class="bonus-badge small">+${bonus}</span>` : ''}
        </div>
      `;
    }).join('');

    const wildHtml = player.tokens.wild > 0 ?
      `<div class="player-token mini">
        <div class="mini-token small" style="background: linear-gradient(135deg, #FFD700, #FFA500)">⭐</div>
        <span>${player.tokens.wild}</span>
      </div>` : '';

    const chefsHtml = player.chefs.map(chef =>
      `<span class="chef-badge" title="${chef.name}">${chef.emoji}</span>`
    ).join('');

    container.innerHTML = `
      <div class="player-header">
        <h3>🤖 ${player.name}</h3>
        <div class="player-score">${player.points}점</div>
      </div>
      <div class="player-stats">
        <span>📋 ${player.recipes.length}개</span>
        <span>🔥 ${player.totalCalories} kcal</span>
        <span>📌 ${player.reserved.length}/3</span>
        ${chefsHtml ? `<span>${chefsHtml}</span>` : ''}
      </div>
      <div class="player-tokens mini-row">${tokensHtml}${wildHtml}</div>
    `;
  }

  // ========================================
  // 턴 정보
  // ========================================
  renderTurnInfo() {
    const info = document.getElementById('turn-info');
    const currentPlayer = this.game.getCurrentPlayer();
    const phase = this.game.state.phase;

    let text = `라운드 ${this.game.state.turn}`;
    if (phase === 'last_round') {
      text += ' (마지막 라운드!)';
    }
    text += ` — ${currentPlayer.name}의 차례`;

    if (this.aiThinking) {
      text = `🤖 AI 셰프가 생각 중...`;
    }

    info.textContent = text;
  }

  // ========================================
  // 행동 버튼 렌더링
  // ========================================
  renderActionButtons() {
    const container = document.getElementById('action-buttons');
    const isPlayerTurn = this.game.state.currentPlayer === 0 && this.game.state.phase !== 'ended';

    if (!isPlayerTurn || this.aiThinking) {
      container.innerHTML = '';
      return;
    }

    if (this.discardMode) {
      this.renderDiscardUI(container);
      return;
    }

    const pool = this.game.state.tokens;
    const availableDiff = INGREDIENT_KEYS.filter(t => pool[t] > 0);
    const availableSame = INGREDIENT_KEYS.filter(t => pool[t] >= 4);

    let html = '<div class="action-bar">';

    if (this.actionMode === 'take_different') {
      html += `
        <div class="action-instruction">서로 다른 재료를 ${Math.min(3, availableDiff.length)}개 선택하세요 (${this.selectedTokens.length}/${Math.min(3, availableDiff.length)} 선택됨)</div>
        <button class="btn btn-confirm" onclick="ui.confirmTakeTokens()" ${this.selectedTokens.length === 0 ? 'disabled' : ''}>
          확인 (${this.selectedTokens.length}개 가져가기)
        </button>
        <button class="btn btn-cancel" onclick="ui.cancelAction()">취소</button>
      `;
    } else if (this.actionMode === 'take_same') {
      html += `
        <div class="action-instruction">같은 재료 2개를 가져갈 종류를 선택하세요</div>
        <div class="same-token-choices">
          ${availableSame.map(type => {
            const info = INGREDIENT_TYPES[type];
            return `<button class="btn btn-token" style="background: ${info.colorLight}; border-color: ${info.color}; color: ${info.color}" onclick="ui.takeSameTokens('${type}')">${info.emoji} ${info.name} ×2</button>`;
          }).join('')}
        </div>
        <button class="btn btn-cancel" onclick="ui.cancelAction()">취소</button>
      `;
    } else {
      html += `
        <button class="btn btn-action" onclick="ui.setActionMode('take_different')" ${availableDiff.length === 0 ? 'disabled' : ''}>
          🎯 재료 가져오기 (3종)
        </button>
        <button class="btn btn-action" onclick="ui.setActionMode('take_same')" ${availableSame.length === 0 ? 'disabled' : ''}>
          🎯 같은 재료 ×2
        </button>
        <span class="action-hint">카드를 클릭하여 구매 또는 예약</span>
      `;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // 토큰 초과 시 버리기 UI
  renderDiscardUI(container) {
    const player = this.game.state.players[0];
    const excess = this.game.getPlayerTokenCount(player) - MAX_TOKENS_IN_HAND;

    const allTypes = [...INGREDIENT_KEYS, 'wild'];
    const tokensHtml = allTypes.map(type => {
      if (player.tokens[type] <= 0) return '';
      const info = type === 'wild'
        ? { name: '만능', emoji: '⭐', color: '#FFD700' }
        : INGREDIENT_TYPES[type];
      const discarded = this.discardSelections[type] || 0;
      return `
        <div class="discard-token">
          <div class="mini-token" style="background: ${info.color}">${info.emoji}</div>
          <span>${info.name}: ${player.tokens[type]}</span>
          <div class="discard-controls">
            <button onclick="ui.adjustDiscard('${type}', -1)" ${discarded <= 0 ? 'disabled' : ''}>−</button>
            <span class="discard-count">${discarded}</span>
            <button onclick="ui.adjustDiscard('${type}', 1)" ${discarded >= player.tokens[type] ? 'disabled' : ''}>+</button>
          </div>
        </div>
      `;
    }).join('');

    const totalDiscard = Object.values(this.discardSelections).reduce((s, v) => s + v, 0);

    container.innerHTML = `
      <div class="discard-panel">
        <h4>⚠️ 토큰이 10개를 초과했습니다! ${excess}개를 버려주세요.</h4>
        <div class="discard-tokens">${tokensHtml}</div>
        <button class="btn btn-confirm" onclick="ui.confirmDiscard()" ${totalDiscard !== excess ? 'disabled' : ''}>
          ${totalDiscard}/${excess}개 버리기
        </button>
      </div>
    `;
  }

  // ========================================
  // 이벤트 핸들러
  // ========================================

  onTokenClick(type) {
    if (this.game.state.currentPlayer !== 0 || this.game.state.phase === 'ended') return;

    if (this.actionMode === 'take_different') {
      const idx = this.selectedTokens.indexOf(type);
      if (idx >= 0) {
        this.selectedTokens.splice(idx, 1);
      } else if (this.selectedTokens.length < 3 && this.game.state.tokens[type] > 0) {
        this.selectedTokens.push(type);
      }
      this.renderTokenPool();
      this.renderActionButtons();
    } else if (!this.actionMode) {
      this.setActionMode('take_different');
      if (this.game.state.tokens[type] > 0) {
        this.selectedTokens = [type];
      }
      this.renderTokenPool();
      this.renderActionButtons();
    }
  }

  onCardClick(tier, index, card, canBuy) {
    if (this.game.state.currentPlayer !== 0 || this.game.state.phase === 'ended' || this.actionMode) return;

    this.showCardModal(card, tier, index, canBuy);
  }

  onReservedClick(index, canBuy) {
    if (this.game.state.currentPlayer !== 0 || this.game.state.phase === 'ended' || this.actionMode) return;

    const card = this.game.state.players[0].reserved[index];
    this.showReservedModal(card, index, canBuy);
  }

  // 카드 상세 모달
  showCardModal(card, tier, index, canBuy) {
    const player = this.game.state.players[0];
    const { cost } = this.game.getEffectiveCost(card, player);
    const bonusInfo = INGREDIENT_TYPES[card.bonus];

    const costDetailHtml = Object.entries(card.cost)
      .filter(([, v]) => v > 0)
      .map(([type, count]) => {
        const info = INGREDIENT_TYPES[type];
        const effective = cost[type];
        const has = player.tokens[type] + player.bonuses[type];
        return `
          <div class="cost-detail">
            <span style="color: ${info.color}">${info.emoji} ${info.name}</span>
            <span>${effective > 0 ? effective : '✓'} / ${count} (보유: ${has})</span>
          </div>
        `;
      }).join('');

    const modal = document.getElementById('card-modal');
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="ui.closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-card-header" style="background: ${bonusInfo.colorLight}">
            <span class="modal-bonus">${bonusInfo.emoji} ${bonusInfo.name} 보너스</span>
            ${card.points > 0 ? `<span class="modal-points">${card.points}점</span>` : ''}
          </div>
          <h3>${card.name}</h3>
          <p class="modal-calories">${card.calories} kcal</p>
          <div class="modal-costs">${costDetailHtml}</div>
          <div class="modal-actions">
            <button class="btn btn-buy ${canBuy ? '' : 'disabled'}" onclick="ui.purchaseCard('${tier}', ${index})" ${canBuy ? '' : 'disabled'}>
              ${canBuy ? '🍳 요리하기' : '❌ 재료 부족'}
            </button>
            <button class="btn btn-reserve" onclick="ui.reserveCard('${tier}', ${index})" ${player.reserved.length >= 3 ? 'disabled' : ''}>
              📌 예약하기 ${player.reserved.length >= 3 ? '(최대)' : ''}
            </button>
            <button class="btn btn-cancel" onclick="ui.closeModal()">닫기</button>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'block';
  }

  // 예약 카드 모달
  showReservedModal(card, index, canBuy) {
    const player = this.game.state.players[0];
    const { cost } = this.game.getEffectiveCost(card, player);
    const bonusInfo = INGREDIENT_TYPES[card.bonus];

    const costDetailHtml = Object.entries(card.cost)
      .filter(([, v]) => v > 0)
      .map(([type, count]) => {
        const info = INGREDIENT_TYPES[type];
        const effective = cost[type];
        const has = player.tokens[type] + player.bonuses[type];
        return `
          <div class="cost-detail">
            <span style="color: ${info.color}">${info.emoji} ${info.name}</span>
            <span>${effective > 0 ? effective : '✓'} / ${count} (보유: ${has})</span>
          </div>
        `;
      }).join('');

    const modal = document.getElementById('card-modal');
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="ui.closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-card-header" style="background: ${bonusInfo.colorLight}">
            <span class="modal-bonus">${bonusInfo.emoji} ${bonusInfo.name} 보너스</span>
            ${card.points > 0 ? `<span class="modal-points">${card.points}점</span>` : ''}
          </div>
          <h3>${card.name} <span class="reserved-tag">예약됨</span></h3>
          <p class="modal-calories">${card.calories} kcal</p>
          <div class="modal-costs">${costDetailHtml}</div>
          <div class="modal-actions">
            <button class="btn btn-buy ${canBuy ? '' : 'disabled'}" onclick="ui.purchaseReserved(${index})" ${canBuy ? '' : 'disabled'}>
              ${canBuy ? '🍳 요리하기' : '❌ 재료 부족'}
            </button>
            <button class="btn btn-cancel" onclick="ui.closeModal()">닫기</button>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'block';
  }

  closeModal() {
    document.getElementById('card-modal').style.display = 'none';
  }

  // ========================================
  // 행동 실행
  // ========================================

  setActionMode(mode) {
    this.actionMode = mode;
    this.selectedTokens = [];
    this.renderActionButtons();
    this.renderTokenPool();
  }

  cancelAction() {
    this.actionMode = null;
    this.selectedTokens = [];
    this.renderActionButtons();
    this.renderTokenPool();
  }

  confirmTakeTokens() {
    if (this.selectedTokens.length === 0) return;
    const result = this.game.takeDifferentTokens(this.selectedTokens);
    this.actionMode = null;
    this.selectedTokens = [];

    if (result.needDiscard) {
      this.enterDiscardMode(result.excess);
      return;
    }

    if (!result.success) {
      this.showToast(result.message);
      return;
    }

    this.afterPlayerTurn();
  }

  takeSameTokens(type) {
    const result = this.game.takeSameTokens(type);
    this.actionMode = null;

    if (result.needDiscard) {
      this.enterDiscardMode(result.excess);
      return;
    }

    if (!result.success) {
      this.showToast(result.message);
      return;
    }

    this.afterPlayerTurn();
  }

  purchaseCard(tier, index) {
    this.closeModal();
    const result = this.game.purchaseCard(tier, index);
    if (!result.success) {
      this.showToast(result.message);
      return;
    }
    this.afterPlayerTurn();
  }

  purchaseReserved(index) {
    this.closeModal();
    const result = this.game.purchaseReserved(index);
    if (!result.success) {
      this.showToast(result.message);
      return;
    }
    this.afterPlayerTurn();
  }

  reserveCard(tier, index) {
    this.closeModal();
    const result = this.game.reserveCard(tier, index);

    if (result.needDiscard) {
      this.enterDiscardMode(result.excess);
      return;
    }

    if (!result.success) {
      this.showToast(result.message);
      return;
    }
    this.afterPlayerTurn();
  }

  // 토큰 버리기 모드
  enterDiscardMode(excess) {
    this.discardMode = true;
    this.discardCount = excess;
    this.discardSelections = {};
    this.render();
  }

  adjustDiscard(type, delta) {
    if (!this.discardSelections[type]) this.discardSelections[type] = 0;
    this.discardSelections[type] += delta;
    if (this.discardSelections[type] < 0) this.discardSelections[type] = 0;
    this.renderActionButtons();
  }

  confirmDiscard() {
    const result = this.game.discardTokens(this.discardSelections);
    if (result.success) {
      this.discardMode = false;
      this.discardSelections = {};
      this.afterPlayerTurn();
    } else {
      this.showToast(result.message);
    }
  }

  // 플레이어 턴 이후 AI 턴 실행
  afterPlayerTurn() {
    if (this.game.state.phase === 'ended') {
      this.render();
      return;
    }

    if (this.game.state.currentPlayer === 1) {
      this.aiThinking = true;
      this.render();
      setTimeout(() => this.executeAITurn(), 1200);
    }
  }

  executeAITurn() {
    const result = this.ai.playTurn();

    // AI 토큰 초과 시 자동 버리기
    if (result && result.needDiscard) {
      const aiPlayer = this.game.state.players[1];
      const excess = this.game.getPlayerTokenCount(aiPlayer) - MAX_TOKENS_IN_HAND;
      if (excess > 0) {
        // 가장 많은 토큰부터 버리기
        const discards = {};
        let remaining = excess;
        const sorted = [...INGREDIENT_KEYS, 'wild'].sort((a, b) => aiPlayer.tokens[b] - aiPlayer.tokens[a]);
        for (const type of sorted) {
          if (remaining <= 0) break;
          const toDiscard = Math.min(remaining, aiPlayer.tokens[type]);
          if (toDiscard > 0) {
            discards[type] = toDiscard;
            remaining -= toDiscard;
          }
        }
        this.game.discardTokens(discards);
      }
    }

    this.aiThinking = false;

    if (this.game.state.phase !== 'ended' && this.game.state.currentPlayer === 1) {
      // AI가 행동 불가 시 강제 턴 종료 (무한루프 방지)
      if (result && !result.success && !result.needDiscard) {
        this.game.endTurn();
      } else {
        setTimeout(() => this.executeAITurn(), 800);
      }
    }

    this.render();
  }

  // ========================================
  // 게임 종료 화면
  // ========================================
  showGameOver() {
    const winner = this.game.state.winner;
    const p1 = this.game.state.players[0];
    const p2 = this.game.state.players[1];

    const modal = document.getElementById('card-modal');
    modal.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content game-over">
          <h2>🏆 게임 종료!</h2>
          <div class="winner-announce">
            ${winner.isAI ? '🤖' : '👨‍🍳'} ${winner.name} 승리!
          </div>
          <div class="final-scores">
            <div class="score-row ${!p1.isAI && winner === p1 ? 'winner' : ''}">
              <span>👨‍🍳 ${p1.name}</span>
              <span>${p1.points}점 | 레시피 ${p1.recipes.length}개 | ${p1.totalCalories} kcal</span>
            </div>
            <div class="score-row ${p2.isAI && winner === p2 ? 'winner' : ''}">
              <span>🤖 ${p2.name}</span>
              <span>${p2.points}점 | 레시피 ${p2.recipes.length}개 | ${p2.totalCalories} kcal</span>
            </div>
          </div>
          <button class="btn btn-action" onclick="ui.restartGame()">🔄 다시 시작</button>
        </div>
      </div>
    `;
    modal.style.display = 'block';
  }

  restartGame() {
    this.closeModal();
    this.actionMode = null;
    this.selectedTokens = [];
    this.discardMode = false;
    document.getElementById('game-log').innerHTML = '';
    this.game.init();
    this.render();
  }

  // ========================================
  // 유틸리티
  // ========================================

  addLog(message) {
    const log = document.getElementById('game-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
}

// 전역 인스턴스
let ui;
document.addEventListener('DOMContentLoaded', () => {
  ui = new GameUI();
});
