# Phase 1.3 Backend: Elimination & Scoring

**Status:** ✅ Completed
**Created:** 2026-03-20
**Updated:** 2026-03-23  
**Target:** 2026-03-21  
**Total Tasks:** 6

## Overview

Backend implementation for elimination and scoring: handle Guesser's player selection, calculate scores (accumulative temp points, reset on wrong guess), manage round transitions, next round rotation, and game end logic.

---

## Tasks

### Completed ✅

- [x] **T1. Backend: Scoring System Service**
  - **Dependencies:** None
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `service/src/game/scoring.ts`
  - **Description:** Implement scoring logic: +1 temp point for correct Red Fish elimination, reset to 0 for Blue Fish selection, award points at round end.
  - **Acceptance Criteria:**
    - ✅ `calculateGuesserScore(isCorrect: boolean, currentTempPoints: number)` returns updated temp points
    - ✅ `awardPoints(scores: Map, roleResults: object)` distributes points at round end
    - ✅ Handles accumulative temp points correctly
    - ✅ Resets to 0 on wrong guess (Blue Fish)
    - ✅ Awards temp points to Guesser + 1 point to Blue Fish when all Red Fish eliminated
    - ✅ Awards 1 point to remaining Red Fish when Guesser picks Blue Fish

- [x] **T2. Backend: Room Model Update for Scoring**
  - **Dependencies:** None
  - **Effort:** S (1h)
  - **Files to Create/Modify:** `service/src/models/room.ts`
  - **Description:** Add scoring fields: eliminatedPlayers array, currentTempPoints, gameHistory for tracking rounds.
  - **Acceptance Criteria:**
    - ✅ eliminatedPlayers: array of playerIds already eliminated
    - ✅ currentTempPoints: number (Guesser's temporary points)
    - ✅ gameHistory: array of round results
    - ✅ allPlayersBeenGuesser: boolean or Set<string>

- [x] **T3. Backend: Elimination WebSocket Handler**
  - **Dependencies:** T1, T2
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Handle submit_guess WebSocket message: validate Guesser, check selected player role, update scores, broadcast result.
  - **Acceptance Criteria:**
    - ✅ Validates sender is current Guesser
    - ✅ Validates game is in 'guessing' phase
    - ✅ Checks selected player role (Red Fish or Blue Fish)
    - ✅ Calls scoring service to update points
    - ✅ Updates eliminatedPlayers array
    - ✅ Broadcasts guess_submitted with updated scores
    - ✅ Triggers round_end if Blue Fish selected or all Red Fish eliminated

- [x] **T4. Backend: Game State Management**
  - **Dependencies:** T2
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `service/src/game/state.ts`
  - **Description:** Manage game state transitions: playing → guessing → round_end → completed. Track which players have been Guesser.
  - **Acceptance Criteria:**
    - ✅ `transitionToGuessing(roomId)` - sets status to 'guessing'
    - ✅ `transitionToRoundEnd(roomId)` - sets status to 'round_end'
    - ✅ `transitionToCompleted(roomId)` - sets status to 'completed'
    - ✅ `getNextGuesser(players, lastGuesserId)` - rotates Guesser role
    - ✅ `allPlayersBeenGuesser(room)` - checks if game should end

- [x] **T5. Backend: Next Round Handler**
  - **Dependencies:** T4
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Handle next_round WebSocket message: reset game state, assign new Guesser, get new question, start new round.
  - **Acceptance Criteria:**
    - ✅ Validates admin permissions
    - ✅ Checks if all players have been Guesser
    - ✅ Resets room state (eliminatedPlayers, tempPoints, etc.)
    - ✅ Assigns new Guesser (rotation)
    - ✅ Gets new question from question bank
    - ✅ Broadcasts round_started with new roles

- [x] **T6. Backend: End Game Handler**
  - **Dependencies:** T4
  - **Effort:** S (2-3h)
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Handle end_game WebSocket message: calculate final scores, broadcast game_ended with rankings.
  - **Acceptance Criteria:**
    - ✅ Validates admin permissions
    - ✅ Calculates final scores for all players
    - ✅ Sets room status to 'completed'
    - ✅ Broadcasts game_ended with final scores
    - ✅ Includes player rankings (sorted by total points)

---

## Progress

- **Completed:** 0/6 (0%)
- **Last Updated:** 2026-03-20

## Dependencies

```
T1 ──→ T3
       ↑
T2 ────┘
       │
T4 ──→ T5 ──→ T6
```

## Recommended Order

1. **T1** - Backend: Scoring System Service (3-4h)
2. **T2** - Backend: Room Model Update (1h)
3. **T3** - Backend: Elimination Handler (3-4h)
4. **T4** - Backend: Game State Management (3-4h)
5. **T5** - Backend: Next Round Handler (3-4h)
6. **T6** - Backend: End Game Handler (2-3h)

**Total Estimated Effort:** 15-18 hours (L)

## Notes

- Reference AGENTS.md for scoring rules
- Follow Outsider project patterns for WebSocket event handling
- No timers needed - players proceed at their own pace
- Temp points accumulate for each correct Red Fish elimination
- Game ends when all players have been Guesser once

## Testing Checklist

- [ ] Scoring service calculates temp points correctly
- [ ] Scoring service resets to 0 on Blue Fish selection
- [ ] Scoring service awards points correctly at round end
- [ ] Room model has all scoring fields
- [ ] Elimination handler validates Guesser permissions
- [ ] Elimination handler updates scores correctly
- [ ] Game state transitions work (playing → guessing → round_end → completed)
- [ ] Next round rotates Guesser correctly
- [ ] End game calculates final scores correctly
- [ ] All players get turn as Guesser before game ends
