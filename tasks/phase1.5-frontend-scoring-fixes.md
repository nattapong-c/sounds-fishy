# Phase 1.5 Frontend: Scoring Logic Fixes

**Status:** ✅ Completed
**Created:** 2026-03-23
**Updated:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 2

## Overview

Frontend updates to support backend scoring logic fixes:
1. Update UI to reflect end game (reset scores) vs next round (continue scores)
2. Update points breakdown to show which Red Fish survived and got points

---

## Tasks

### Pending ⏳

- [ ] **T3. Frontend: Update End Game Button Labeling**
  - **Dependencies:** T1 (Backend: Fix End Round vs Next Round Scoring)
  - **Effort:** S (1-2h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Clarify the difference between "End Round" and "End Game" in the UI. Update button labels and confirmations to make it clear:
    - "End Game" = Reset all scores, return to lobby (fresh game)
    - "Next Round" = Continue game, keep scores, rotate Guesser
  - **Acceptance Criteria:**
    - ✅ Button labeled "End Game" (not "End Round")
    - ✅ Confirmation modal explains "This will reset all scores and return to lobby"
    - ✅ "Next Round" button explains "Continue to next round with current scores"
    - ✅ Clear visual distinction between the two actions

- [ ] **T4. Frontend: Update Points Breakdown Display**
  - **Dependencies:** T2 (Backend: Fix Red Fish Points on Blue Fish Elimination)
  - **Effort:** S (2-3h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Update points breakdown to clearly show which Red Fish survived and earned points. Update the reason text to be more specific.
  - **Acceptance Criteria:**
    - ✅ Shows "Red Fish: 1 survival bonus" for surviving Red Fish
    - ✅ Shows "Red Fish: Eliminated (no points)" for eliminated Red Fish
    - ✅ Clear visual distinction between survivors and eliminated
    - ✅ Points breakdown sorted correctly (survivors first)
    - ✅ Mobile responsive

---

## Progress

- **Completed:** 0/2 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 (Backend) ──→ T3 (Frontend: Button labeling)
T2 (Backend) ──→ T4 (Frontend: Points breakdown)
```

## Recommended Order

1. **T1** - Backend: Fix End Round vs Next Round (complete first)
2. **T2** - Backend: Fix Red Fish Points (complete first)
3. **T3** - Frontend: Update End Game Button Labeling (1-2h)
4. **T4** - Frontend: Update Points Breakdown Display (2-3h)

**Total Estimated Effort:** 3-5 hours (S-M)

## Notes

### UI/UX Considerations
- Use clear, action-oriented language
- Confirm destructive actions (ending game resets scores)
- Show current scores prominently before asking to end game
- Consider adding a warning icon for "End Game" button

### Points Breakdown Display
- Group by role (Guesser, Blue Fish, Red Fish)
- Within Red Fish, show survivors first (got points), then eliminated (no points)
- Use color coding: green for points earned, gray for no points

## Testing Checklist

- [ ] "End Game" button clearly labeled
- [ ] Confirmation modal explains score reset
- [ ] "Next Round" button explains score continuation
- [ ] Points breakdown shows correct reasons
- [ ] Surviving Red Fish shown first
- [ ] Eliminated Red Fish shown separately
- [ ] Mobile responsive on all views
