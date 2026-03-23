# Phase 1.3.4 Frontend: Close Button for Guesser When Round Ends

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 2

## Overview

When the round ends (all Red Fish eliminated OR Blue Fish eliminated), the Guesser should see a "Close" button instead of "Continue Eliminating". This provides clear UX that the round is complete and no more eliminations can be made.

---

## Tasks

### Pending ⏳

- [ ] **T2. Frontend: Show Close Button for Guesser When Round Ends**
  - **Dependencies:** T1 (Backend: Verify Round End State for Guesser)
  - **Effort:** S (1-2h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Update EliminationModal to show "Close" button for Guesser when `isRoundOver` is true. Replace "Continue Eliminating" button with "Close" button when round ends.
  - **Acceptance Criteria:**
    - ✅ Guesser sees "Continue Eliminating" when `!isRoundOver`
    - ✅ Guesser sees "Close" button when `isRoundOver`
    - ✅ Button text changes based on round state
    - ✅ Button styling consistent (blue gradient for both)
    - ✅ Modal closes when button clicked

- [ ] **T3. Frontend: Add Round End Message for Guesser**
  - **Dependencies:** T2
  - **Effort:** S (1h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Add contextual message above the Close button to inform Guesser why the round ended (e.g., "All Red Fish eliminated!" or "Blue Fish eliminated - points reset").
  - **Acceptance Criteria:**
    - ✅ Shows "All Red Fish eliminated!" when Guesser wins round
    - ✅ Shows "Blue Fish eliminated - points reset" when wrong guess
    - ✅ Message includes points awarded (if any)
    - ✅ Clear, encouraging tone
    - ✅ Mobile responsive

---

## Progress

- **Completed:** 0/2 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 (Backend verification)
 ↓
T2 (Close button)
 ↓
T3 (Round end message - optional polish)
```

## Recommended Order

1. **T1** - Backend: Verify Round End State for Guesser (0.5h)
2. **T2** - Frontend: Show Close Button for Guesser When Round Ends (1-2h)
3. **T3** - Frontend: Add Round End Message for Guesser (1h) - Optional polish

**Total Estimated Effort:** 2.5-3.5 hours (S-M)

## Notes

- Reference `eliminationResult.isRoundOver` to determine button display
- Reference `eliminationResult.isCorrect` to determine why round ended
- Use `eliminationResult.pointsAwarded` for points message
- Keep button styling consistent with existing design
- Message should be encouraging even when Guesser loses points

## UI Design Suggestions

**Guesser Modal (Round Continues):**
```
┌─────────────────────────┐
│    ❌ John eliminated   │
│      Red Fish 🐠        │
│   🎉 Correct! +2 pts    │
│                         │
│  [Continue Eliminating] │ ← Blue button
└─────────────────────────┘
```

**Guesser Modal (Round End - Win):**
```
┌─────────────────────────┐
│    ❌ Jane eliminated   │
│      Red Fish 🐠        │
│   🎉 Correct! +3 pts    │
│                         │
│  ✅ All Red Fish out!   │
│     +3 points earned    │
│                         │
│         [Close]         │ ← Blue button
└─────────────────────────┘
```

**Guesser Modal (Round End - Loss):**
```
┌─────────────────────────┐
│    ❌ Bob eliminated    │
│     Blue Fish 🐟        │
│   ❌ Wrong! Points: 0   │
│                         │
│   ❌ Blue Fish eliminated│
│      Points reset       │
│                         │
│         [Close]         │ ← Blue button
└─────────────────────────┘
```

## Testing Checklist

- [ ] Guesser sees "Continue Eliminating" when round continues
- [ ] Guesser sees "Close" button when round ends (all Red Fish)
- [ ] Guesser sees "Close" button when round ends (Blue Fish)
- [ ] Button closes modal when clicked
- [ ] Round end message shows correct reason
- [ ] Points message shows correct amount
- [ ] Modal styling consistent across states
- [ ] Mobile responsive on modal buttons
- [ ] Non-Guesser modal unchanged (still shows Close + auto-close)
