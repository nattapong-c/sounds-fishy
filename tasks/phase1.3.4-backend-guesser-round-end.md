# Phase 1.3.4 Backend: Guesser Round End State

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 1

## Overview

Backend already sends `isRoundOver` flag in the `guess_submitted` payload. When the round ends, the Guesser should see a "Close" button instead of "Continue Eliminating". This task verifies the backend properly sends round end state to the Guesser.

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Verify Round End State for Guesser**
  - **Dependencies:** None
  - **Effort:** S (0.5h)
  - **Files to Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Verify that `guess_submitted` payload includes `isRoundOver: true` when round ends (either all Red Fish eliminated or Blue Fish eliminated). Ensure Guesser receives this state.
  - **Acceptance Criteria:**
    - ✅ `isRoundOver` is `true` when round ends
    - ✅ `isRoundOver` is `false` when round continues
    - ✅ Guesser receives `isRoundOver` flag in payload
    - ✅ `pointsBreakdown` included when round ends

---

## Progress

- **Completed:** 0/1 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 (Verify round end state)
```

## Recommended Order

1. **T1** - Backend: Verify Round End State for Guesser (0.5h)

**Total Estimated Effort:** 0.5 hours (S)

## Notes

- This is a verification task - backend should already send `isRoundOver`
- The `isRoundOver` flag is already in the elimination payload
- Main goal: confirm Guesser receives correct round state
- Frontend will use this to show "Close" button instead of "Continue"

## Testing Checklist

- [ ] `isRoundOver` flag present in `guess_submitted` payload
- [ ] `isRoundOver` is `true` when all Red Fish eliminated
- [ ] `isRoundOver` is `true` when Blue Fish eliminated
- [ ] `isRoundOver` is `false` when Red Fish eliminated (game continues)
- [ ] Guesser receives correct `isRoundOver` state
