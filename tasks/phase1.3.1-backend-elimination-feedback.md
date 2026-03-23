# Phase 1.3.1 Backend: Elimination Feedback & Score Display

**Status:** ✅ Completed
**Created:** 2026-03-20
**Updated:** 2026-03-23  
**Target:** 2026-03-21  
**Total Tasks:** 3

## Overview

Backend enhancements for elimination flow: reveal eliminated player's role, allow continued elimination, display temp points during round, show detailed points breakdown at round end.

---

## Tasks

### Completed ✅

- [x] **T1. Backend: Enhanced Guess Result Payload**
  - **Dependencies:** None
  - **Effort:** S (1h)
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Update submit_guess handler to include eliminated player's role in broadcast payload.
  - **Acceptance Criteria:**
    - ✅ Broadcast includes `eliminatedPlayerRole` field
    - ✅ Broadcast includes `eliminatedPlayerName` field
    - ✅ Broadcast includes `isRoundOver` boolean
    - ✅ Broadcast includes `pointsAwarded` (if round ended)
    - ✅ Frontend receives complete elimination result

- [x] **T2. Backend: Temp Points Display in Room State**
  - **Dependencies:** None
  - **Effort:** S (1h)
  - **Files to Create/Modify:** `service/src/models/room.ts`
  - **Description:** Ensure `currentTempPoints` is included in room.toJSON() output for frontend display.
  - **Acceptance Criteria:**
    - ✅ currentTempPoints visible in room.toJSON()
    - ✅ Frontend can access temp points from room state
    - ✅ Temp points included in guess_submitted broadcast

- [x] **T3. Backend: Round End Points Summary**
  - **Dependencies:** T1, T2
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Enhance round_end broadcast to include detailed points breakdown for each player.
  - **Acceptance Criteria:**
    - ✅ Broadcast includes `pointsBreakdown` array
    - ✅ Each player's points change shown (playerId, playerName, pointsEarned, reason)
    - ✅ Includes temp points converted to total (for Guesser)
    - ✅ Includes bonus points (Blue Fish survival: 1pt, Red Fish survival: 1pt)
    - ✅ Includes total points after round

---

## Progress

- **Completed:** 0/3 (0%)
- **Last Updated:** 2026-03-20

## Dependencies

```
T1 ──→ T3
       ↑
T2 ────┘
```

## Recommended Order

1. **T1** - Backend: Enhanced Guess Result Payload (1h)
2. **T2** - Backend: Temp Points Display (1h)
3. **T3** - Backend: Round End Points Summary (1-2h)

**Total Estimated Effort:** 3-4 hours (S)

## Notes

- Reference AGENTS.md for scoring rules
- Temp points accumulate for each correct Red Fish elimination
- Temp points reset to 0 if Blue Fish is eliminated
- All Red Fish eliminated: Guesser keeps temp points + Blue Fish gets 1pt
- Blue Fish eliminated: Remaining Red Fish each get 1pt

## Testing Checklist

- [ ] Elimination payload includes eliminatedPlayerRole
- [ ] Elimination payload includes eliminatedPlayerName
- [ ] Elimination payload includes isRoundOver flag
- [ ] Temp points visible in room.toJSON()
- [ ] Temp points included in guess_submitted broadcast
- [ ] Round end includes pointsBreakdown array
- [ ] Points breakdown shows each player's earnings
- [ ] Points breakdown shows reasons (temp points, survival bonus)
