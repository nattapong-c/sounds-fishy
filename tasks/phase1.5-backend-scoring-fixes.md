# Phase 1.5 Backend: Scoring Logic Fixes

**Status:** ✅ Completed
**Created:** 2026-03-23
**Updated:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 2

## Overview

Fix critical scoring logic bugs in the Sounds Fishy game:
1. End round should reset ALL scores (new game), while next round should continue accumulating points
2. When Blue Fish is eliminated, only NON-eliminated Red Fish should get points (eliminated Red Fish should NOT get points)

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Fix End Round vs Next Round Scoring**
  - **Dependencies:** None
  - **Effort:** M (2-3h)
  - **Files to Modify:** `service/src/controllers/ws-controller.ts`, `service/src/game/scoring.ts`
  - **Description:** Currently `end_round` resets game state but doesn't clear accumulated scores. Need to clarify the difference:
    - `end_round` = End current game, reset ALL scores to 0, return to lobby (starts fresh game)
    - `next_round` = Continue game, keep accumulated scores, rotate Guesser
  - **Acceptance Criteria:**
    - ✅ `end_round` clears all scores (totalPoints = 0 for all players)
    - ✅ `end_round` resets room to lobby state
    - ✅ `next_round` preserves accumulated scores
    - ✅ `next_round` continues game with new Guesser
    - ✅ Clear documentation of the difference between the two actions

- [ ] **T2. Backend: Fix Red Fish Points on Blue Fish Elimination**
  - **Dependencies:** None
  - **Effort:** M (3-4h)
  - **Files to Modify:** `service/src/game/scoring.ts`, `service/src/controllers/ws-controller.ts`
  - **Description:** When Guesser eliminates Blue Fish (wrong guess), currently ALL Red Fish get 1 point. This is incorrect. Only Red Fish who were NOT eliminated should get points.
    
    Current behavior (WRONG):
    - Red Fish eliminated in round → Gets 1 point when Blue Fish eliminated
    - Red Fish still in game → Gets 1 point when Blue Fish eliminated
    
    Correct behavior:
    - Red Fish eliminated in round → Gets 0 points (already out)
    - Red Fish still in game → Gets 1 point (survival bonus)
    
  - **Acceptance Criteria:**
    - ✅ Track which Red Fish were eliminated BEFORE Blue Fish was eliminated
    - ✅ Only NON-eliminated Red Fish receive 1 point
    - ✅ Eliminated Red Fish receive 0 points
    - ✅ Points breakdown shows correct recipients
    - ✅ Update `awardRoundPoints()` to accept eliminated Red Fish list
    - ✅ Update `generatePointsBreakdown()` to show correct reasons

---

## Progress

- **Completed:** 0/2 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 ──→ (independent)
T2 ──→ (independent)
```

## Recommended Order

1. **T1** - Backend: Fix End Round vs Next Round Scoring (2-3h)
2. **T2** - Backend: Fix Red Fish Points on Blue Fish Elimination (3-4h)

**Total Estimated Effort:** 5-7 hours (M)

## Notes

### Issue 1: End Round vs Next Round
- `end_round` should be "End Game" - reset everything including scores
- `next_round` should be "Continue Game" - keep scores, rotate roles
- Consider renaming `end_round` to `end_game` for clarity
- Or add a flag to distinguish "reset scores" vs "keep scores"

### Issue 2: Red Fish Points
- Need to track eliminatedPlayers BEFORE Blue Fish elimination
- Only Red Fish who survive until Blue Fish elimination get points
- This rewards Red Fish who successfully bluffed without getting caught

## Testing Checklist

- [ ] End round resets all scores to 0
- [ ] Next round preserves accumulated scores
- [ ] When Blue Fish eliminated, only surviving Red Fish get points
- [ ] Eliminated Red Fish get 0 points
- [ ] Points breakdown shows correct reasons for each player
- [ ] Game flow works correctly (lobby → playing → guessing → round_end → completed)
