# Phase 1.3.2 Backend: Eliminated Player Status

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 1

## Overview

Backend already tracks eliminated players in `room.eliminatedPlayers` array. This task ensures the eliminated player data is properly included in WebSocket broadcasts so frontend can display eliminated state.

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Verify Eliminated Players in Broadcast**
  - **Dependencies:** None
  - **Effort:** S (0.5h)
  - **Files to Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Verify that `guess_submitted` broadcast includes `eliminatedPlayers` array and `room.toJSON()` properly serializes it.
  - **Acceptance Criteria:**
    - ✅ `eliminatedPlayers` array included in `guess_submitted` payload
    - ✅ `eliminatedPlayers` included in room state broadcast
    - ✅ Eliminated player IDs are correctly tracked
    - ✅ Already eliminated players cannot be selected again (validation exists)

---

## Progress

- **Completed:** 0/1 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 (Verify backend broadcast)
```

## Recommended Order

1. **T1** - Backend: Verify Eliminated Players in Broadcast (0.5h)

**Total Estimated Effort:** 0.5 hours (S)

## Notes

- This task is mostly verification - the backend already has `eliminatedPlayers` tracking
- The `eliminatedPlayers` array is already included in the `guess_submitted` payload
- Validation already exists to prevent selecting already eliminated players
- Main goal: ensure frontend receives the data correctly

## Testing Checklist

- [ ] `eliminatedPlayers` array present in `guess_submitted` WebSocket message
- [ ] Eliminated player IDs match actual eliminated players
- [ ] Backend rejects attempts to eliminate already eliminated players
- [ ] Room state includes `eliminatedPlayers` after each guess
