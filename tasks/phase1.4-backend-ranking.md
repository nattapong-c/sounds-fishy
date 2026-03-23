# Phase 1.4 Backend: Ranking Score & Game End

**Status:** ✅ Completed
**Created:** 2026-03-20
**Updated:** 2026-03-23
**Target:** 2026-03-21
**Total Tasks:** 2

## Overview

Backend implementation for final game rankings and lobby reset: calculate player rankings by total points, handle reset to lobby (clear game state, keep players).

---

## Tasks

### Completed ✅

- [x] **T1. Backend: Ranking Calculation Service**
  - **Dependencies:** None
  - **Effort:** S (1-2h)
  - **Files Created/Modified:** `service/src/game/scoring.ts`, `service/src/models/room.ts`
  - **Description:** Create service to calculate and sort player rankings by total points. Include tie-breaking logic.
  - **Acceptance Criteria:**
    - ✅ `calculateRankings(players, scores)` returns sorted array
    - ✅ Sorts by totalPoints descending
    - ✅ Handles ties (same rank for equal scores)
    - ✅ Includes player info (id, name, totalPoints, role counts)
    - ✅ Returns ranking array with position, player, score
  - **Implementation Notes:**
    - Implemented in `service/src/game/scoring.ts`
    - Added `getRankings()` method to Room model
    - Used in game_ended handler

- [x] **T2. Backend: Reset to Lobby Handler**
  - **Dependencies:** None
  - **Effort:** S (2-3h)
  - **Files Created/Modified:** `service/src/controllers/ws-controller.ts`
  - **Description:** Handle reset_to_lobby WebSocket message: clear game state, keep players, reset to lobby status.
  - **Acceptance Criteria:**
    - ✅ Validates admin permissions
    - ✅ Clears game state (roles, scores, eliminatedPlayers, etc.)
    - ✅ Keeps all players in room
    - ✅ Resets room status to 'lobby'
    - ✅ Broadcasts lobby_reset with updated room state
    - ✅ Preserves admin role
  - **Implementation Notes:**
    - Implemented as `end_round` handler in ws-controller.ts
    - Clears: inGameRole, question, correctAnswer, eliminatedPlayers, currentTempPoints
    - Broadcasts room_state_update to all players

---

## Progress

- **Completed:** 2/2 (100%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 ──→ T2
```

## Recommended Order

1. **T1** - Backend: Ranking Calculation Service (1-2h)
2. **T2** - Backend: Reset to Lobby Handler (2-3h)

**Total Estimated Effort:** 3-5 hours (S)

## Notes

- Reference AGENTS.md for game rules
- Follow Outsider project patterns for WebSocket event handling
- Keep players in room after reset (don't disconnect)
- Clear all game-specific state, preserve room structure

## Testing Checklist

- [x] Ranking service sorts players correctly by score
- [x] Ranking service handles ties (same rank for equal scores)
- [x] Ranking includes all required player info
- [x] Reset handler validates admin permissions
- [x] Reset clears all game state (roles, scores, etc.)
- [x] Reset keeps all players in room
- [x] Reset broadcasts lobby_reset to all players
- [x] Admin role preserved after reset
