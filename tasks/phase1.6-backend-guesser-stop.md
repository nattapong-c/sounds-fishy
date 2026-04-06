# Phase 1.6 Backend: Guesser Stop Option & Scoring

**Status:** ✅ Completed
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 2

## Overview
Implement the backend logic for the Guesser to voluntarily stop eliminating to secure their points.

## Tasks

### Completed ✅

- [x] **T1. Backend: Add stop_guessing WebSocket Handler**
  - **Type:** Backend
  - **Effort:** S (1h)
  - **Files to Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Implement a new message type `stop_guessing`. Validate that the sender is the Guesser and the game is in the `playing` status. Transition the room to `round_end`.
  - **Acceptance Criteria:**
    - ✅ `stop_guessing` action recognized by backend.
    - ✅ Only current Guesser can trigger it.
    - ✅ Room status changes to `round_end`.

- [x] **T2. Backend: Implement "Stopped Round" Scoring Logic**
  - **Type:** Backend
  - **Effort:** S (1h)
  - **Dependencies:** T1
  - **Files to Modify:** `service/src/game/scoring.ts`, `service/src/controllers/ws-controller.ts`
  - **Description:** Handle scoring for voluntary stop:
    - Guesser gets `currentTempPoints`.
    - Every non-eliminated fish (Blue Fish and remaining Red Fish) gets exactly 1 point.
  - **Acceptance Criteria:**
    - ✅ Guesser total points increase by their current temp points.
    - ✅ Remaining fish (not in `eliminatedPlayers`) get +1 point.
    - ✅ Points breakdown correctly generated.

## Progress
- **Completed:** 2/2 (100%)
- **Last Updated:** 2026-03-23
