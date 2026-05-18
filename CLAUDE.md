# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Kitchen Master** (식재료 카드 게임) — a single-page browser game inspired by Splendor, where the player collects ingredient tokens to buy recipe cards (which grant permanent bonuses) and chase chef titles. Korean is the user-facing language; UI strings, log messages, comments, and card data are all in Korean.

## Commands

- `npm start` — serves the site locally via `npx serve .` (no install step needed; everything is vanilla HTML/CSS/JS).
- There is **no build, lint, test, or typecheck step**. Open `index.html` through the dev server and verify changes manually in the browser.

## Architecture

Four script files are loaded in order by `index.html` and share global scope — there is no module system, no bundler, no transpilation. Each later file depends on globals defined by earlier ones:

```
data.js  →  game.js  →  ai.js  →  ui.js
```

- **`js/data.js`** — pure data: `INGREDIENT_TYPES`, `INGREDIENT_KEYS`, `INITIAL_TOKENS`, `MAX_TOKENS_IN_HAND`, `WINNING_SCORE`, and the three recipe decks (`TIER1_RECIPES`, `TIER2_RECIPES`, `TIER3_RECIPES`) plus `CHEF_CARDS`. Card IDs follow the convention `t{tier}_{nn}` (e.g. `t3_04`); `ai.js` uses the `t1`/`t2`/`t3` prefix to weight tier in card evaluation.
- **`js/game.js`** — `Game` class: the single source of truth for game state. Owns `state` (tokens, decks, board, players, currentPlayer, turn, phase, winner) and the four player actions: `takeDifferentTokens`, `takeSameTokens`, `reserveCard`, `purchaseCard` / `purchaseReserved`. Action methods return `{ success, message?, needDiscard?, excess? }`. After every state change, `endTurn()` advances the turn and calls `notify()`, which fires `onStateChange`. `addHistory()` fires `onMessage`. The Game knows nothing about the DOM or the AI.
- **`js/ai.js`** — `AIPlayer` class: holds a reference to the `Game` and implements a priority-ordered strategy (`playTurn`): (1) best affordable purchase, (2) strategic token collection toward the nearest reachable card, (3) defensive reserve of a card the opponent could soon buy, (4) generic token collection. It mutates state by calling the same `Game` methods the human player uses.
- **`js/ui.js`** — `GameUI` class: the only DOM-aware layer. Instantiates `Game` and `AIPlayer`, wires `game.onStateChange` → `render()`, and re-renders the entire DOM on every state change (no diffing, no framework). Exposes a single global `ui` (assigned in `DOMContentLoaded`) so inline `onclick="ui.method(...)"` handlers in both `index.html` and generated HTML can call into it. **All event handlers go through `ui.*`** — if you add a new interaction, add a method on `GameUI` and call it via inline `onclick`.

### State flow

```
user click → ui.<handler> → game.<action> → game.notify() → ui.render()
                                          → game.addHistory() → ui.addLog()
```

After a human turn, `ui.afterPlayerTurn()` schedules `executeAITurn()` on a timeout to simulate AI "thinking" (`aiThinking` flag drives the spinner text). The AI loop re-schedules itself while `currentPlayer === 1` and `phase !== 'ended'`, with a fallback `game.endTurn()` if `playTurn` returns no successful action (prevents infinite loops).

### Cross-cutting rules baked into the engine

- **Bonus discounts**: `Game.getEffectiveCost(card, player)` subtracts `player.bonuses[type]` from each cost before the affordability check. Always go through this helper rather than reading `card.cost` directly when computing what a player owes.
- **Wild tokens**: `Game.canAfford` and `_doPurchase` cover any shortage from `player.tokens.wild`. Reserving a card grants one wild if the pool has any.
- **10-token limit**: any action that pushes a player above `MAX_TOKENS_IN_HAND` returns `{ success: true, needDiscard: true, excess }` **without** ending the turn. The UI must enter discard mode (`enterDiscardMode`) and call `game.discardTokens` before the turn advances. The AI mirrors this with an auto-discard in `ui.executeAITurn`.
- **Last round / win**: hitting `WINNING_SCORE` flips `phase` to `'last_round'` and records `lastRoundStartPlayer`; the game ends when play returns to that seat. Tiebreaker: fewer recipes wins.
- **Chef cards**: `checkChefCards` runs after every purchase, awards any chef whose `requirement` is met by `player.bonuses`, and removes it from the pool (one-shot per chef across the whole game).

## Conventions

- Keep Korean in user-facing strings and log messages — mixing English breaks the tone and existing styles around emoji prefixes.
- Don't introduce a framework, bundler, or `import`/`export`. Everything relies on script-tag global scope and the load order above; adding modules would require restructuring `index.html` and every inline `onclick`.
- When adding new recipe cards, follow the `t{tier}_{nn}` id convention and keep entries inside the matching `TIERn_RECIPES` array — `Game.init` slices the first 4 onto the board and the rest become the deck.
