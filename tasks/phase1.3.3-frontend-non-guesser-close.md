# Phase 1.3.3 Frontend: Non-Guesser Close Button

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 2

## Overview

When a guess is submitted, all players see the elimination result modal. However, only the Guesser should see the "Continue Eliminating" button. Non-Guesser players (Blue Fish and Red Fish) should see a simple "Close" or "OK" button to dismiss the modal.

---

## Tasks

### Pending ⏳

- [ ] **T2. Frontend: Conditional Button Display in Elimination Modal**
  - **Dependencies:** T1 (Backend: Verify Elimination Broadcast to All Players)
  - **Effort:** M (2-3h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Update the EliminationModal component to show different buttons based on player role. Guesser sees "Continue Eliminating" (if round continues), non-Guesser players see "Close" or "OK" button.
  - **Acceptance Criteria:**
    - ✅ Guesser sees "Continue Eliminating" button when round continues
    - ✅ Guesser sees no button when round is over (auto-close or message)
    - ✅ Blue Fish sees "Close" / "OK" button
    - ✅ Red Fish sees "Close" / "OK" button
    - ✅ Button text is clear and appropriate for each role
    - ✅ Modal closes when non-Guesser clicks button

- [ ] **T3. Frontend: Auto-close Modal for Non-Guesser (Optional Polish)**
  - **Dependencies:** T2
  - **Effort:** S (1h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Add optional auto-close feature for non-Guesser players after viewing elimination result for a few seconds.
  - **Acceptance Criteria:**
    - ✅ Non-Guesser modal can auto-close after 3-5 seconds
    - ✅ Manual "Close" button still available
    - ✅ Guesser modal does NOT auto-close (needs manual interaction)
    - ✅ Smooth animation on auto-close

---

## Progress

- **Completed:** 0/2 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 (Backend verification)
 ↓
T2 (Conditional buttons)
 ↓
T3 (Auto-close - optional)
```

## Recommended Order

1. **T1** - Backend: Verify Elimination Broadcast to All Players (0.5h)
2. **T2** - Frontend: Conditional Button Display (2-3h)
3. **T3** - Frontend: Auto-close Modal (1h) - Optional polish

**Total Estimated Effort:** 3.5-4.5 hours (M)

## Notes

- Reference `myRole` state to determine current player's role
- Guesser role: `'guesser'`
- Non-Guesser roles: `'blueFish'` or `'redFish'`
- Use conditional rendering: `{myRole === 'guesser' ? ... : ...}`
- Keep button styling consistent with existing modal design
- Consider showing elimination info longer for non-Guessers (they're not making decisions)

## UI Design Suggestions

**Guesser Modal (Round Continues):**
```
┌─────────────────────────┐
│    ❌ John eliminated   │
│      Red Fish 🐠        │
│   🎉 Correct! +2 pts    │
│                         │
│  [Continue Eliminating] │
└─────────────────────────┘
```

**Non-Guesser Modal:**
```
┌─────────────────────────┐
│    ❌ John eliminated   │
│      Red Fish 🐠        │
│   🎉 Correct! +2 pts    │
│                         │
│        [Close]          │
└─────────────────────────┘
```

## Testing Checklist

- [ ] Guesser sees "Continue Eliminating" button (when round continues)
- [ ] Guesser sees round over message (when round ends)
- [ ] Blue Fish sees "Close" button
- [ ] Red Fish sees "Close" button
- [ ] Non-Guesser modal closes on button click
- [ ] Elimination result info visible to all players
- [ ] Modal styling consistent across roles
- [ ] Mobile responsive on modal buttons
- [ ] (Optional) Non-Guesser modal auto-closes after delay
