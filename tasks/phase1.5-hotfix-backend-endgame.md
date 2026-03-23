# Phase 1.5 Hotfix: End Game & Lobby Reset

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 2

## Overview

Hotfix for critical user flow issues:
1. "End Game" button should show final rankings/points before returning to lobby
2. "Go back to Lobby" button should reset all scores and game state

Currently:
- "End Game" immediately resets without showing final results
- "Go back to Lobby" may not properly reset all scores

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Separate End Game from Reset Lobby**
  - **Dependencies:** None
  - **Effort:** M (2-3h)
  - **Files to Modify:** `service/src/controllers/ws-controller.ts`, `service/src/models/room.ts`
  - **Description:** Currently `end_round` both ends the game AND resets to lobby. Need to separate these into two distinct actions:
    - `end_game` = Calculate final rankings, transition to 'completed' status, show results
    - `reset_lobby` = Clear all scores and game state, return to 'lobby' status
    
  - **Acceptance Criteria:**
    - ✅ New `end_game` handler that transitions to 'completed' status
    - ✅ `end_game` calculates and broadcasts final rankings
    - ✅ `end_game` does NOT reset scores (preserves for display)
    - ✅ New `reset_lobby` handler (or update `end_round`) that clears all scores
    - ✅ `reset_lobby` transitions to 'lobby' status
    - ✅ Clear WebSocket events for both actions

- [ ] **T2. Backend: Update Room Status Flow**
  - **Dependencies:** T1
  - **Effort:** S (1-2h)
  - **Files to Modify:** `service/src/models/room.ts`
  - **Description:** Update room schema to support the new flow:
    - lobby → playing → round_end → playing → ... → completed → lobby
    
  - **Acceptance Criteria:**
    - ✅ Room status includes 'completed' state
    - ✅ Rankings preserved in 'completed' state
    - ✅ Reset clears rankings and scores
    - ✅ Documentation of status flow

---

## Progress

- **Completed:** 0/2 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 ──→ T2
```

## Recommended Order

1. **T1** - Backend: Separate End Game from Reset Lobby (2-3h)
2. **T2** - Backend: Update Room Status Flow (1-2h)

**Total Estimated Effort:** 3-5 hours (M)

## Notes

### Current Flow (BROKEN)
```
Playing → end_round → Lobby (scores reset immediately, no final results shown)
```

### Desired Flow (FIXED)
```
Playing → end_game → Completed (show rankings) → reset_lobby → Lobby (scores cleared)
```

### WebSocket Events
- `end_game` (client → server): Admin ends game, show final rankings
- `game_ended` (server → client): Broadcast final rankings
- `reset_lobby` (client → server): Admin resets to lobby
- `lobby_reset` (server → client): Broadcast lobby state with cleared scores

## Testing Checklist

- [ ] End game shows final rankings with all player scores
- [ ] Rankings persist until reset
- [ ] Reset lobby clears all scores to 0
- [ ] Reset lobby returns to lobby state
- [ ] All players see final rankings before reset
- [ ] Admin can reset after viewing rankings
