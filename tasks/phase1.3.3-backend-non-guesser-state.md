# Phase 1.3.3 Backend: Non-Guesser Elimination State

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 1

## Overview

Backend already broadcasts elimination results to all players. Non-Guesser players (Blue Fish and Red Fish) should receive the elimination information but cannot make guesses. This task verifies the backend properly handles elimination broadcasts for all players.

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Verify Elimination Broadcast to All Players**
  - **Dependencies:** None
  - **Effort:** S (0.5h)
  - **Files to Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Verify that `guess_submitted` is broadcast to ALL players in the room (not just the Guesser) using `ws.publish()`. Ensure non-Guesser players receive elimination state updates.
  - **Acceptance Criteria:**
    - ✅ `guess_submitted` broadcast uses `ws.publish()` (not just `ws.send()`)
    - ✅ All players receive elimination updates
    - ✅ Room state includes `eliminatedPlayers` for all players
    - ✅ Non-Guesser players can see elimination results

---

## Progress

- **Completed:** 0/1 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 (Verify broadcast to all players)
```

## Recommended Order

1. **T1** - Backend: Verify Elimination Broadcast to All Players (0.5h)

**Total Estimated Effort:** 0.5 hours (S)

## Notes

- This is a verification task - the backend should already broadcast to all players
- The `ws.publish()` method broadcasts to all subscribers in the room channel
- Non-Guesser players don't need special data, just the elimination state
- Main goal: ensure all players see who has been eliminated

## Testing Checklist

- [ ] `ws.publish()` is used to broadcast `guess_submitted`
- [ ] All players in room receive elimination updates
- [ ] Non-Guesser players see `eliminatedPlayers` in room state
- [ ] Elimination modal/data is available for all players
