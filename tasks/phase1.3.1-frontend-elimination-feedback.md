# Phase 1.3.1 Frontend: Elimination Feedback & Score Display

**Status:** ✅ Completed
**Created:** 2026-03-20
**Updated:** 2026-03-23  
**Updated:** 2026-03-20  
**Target:** 2026-03-21  
**Total Tasks:** 3

## Overview

Frontend enhancements for elimination flow: show eliminated player's role reveal modal, display current temp points during gameplay, show detailed points breakdown at round end.

---

## Tasks

### Completed ✅

- [x] **T4. Frontend: Elimination Result Modal**
  - **Dependencies:** T1 (Backend: Enhanced Guess Result Payload)
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Show modal after each elimination revealing the player's role and allowing continuation or round end.
  - **Acceptance Criteria:**
    - ✅ Modal shows eliminated player name
    - ✅ Shows role revealed with icon (Red Fish 🐠 or Blue Fish 🐟)
    - ✅ Shows message: "Correct!" or "Wrong! Blue Fish eliminated"
    - ✅ If Red Fish eliminated: shows "Continue Eliminating" button
    - ✅ If Blue Fish eliminated: shows "Round Over" message
    - ✅ Shows temp points earned (if Red Fish eliminated)
    - ✅ Shows "Points reset to 0" (if Blue Fish eliminated)
    - ✅ Modal auto-closes when round ends

- [x] **T5. Frontend: Temp Points Display**
  - **Dependencies:** T2 (Backend: Temp Points Display in Room State)
  - **Effort:** S (2-3h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Display current temp points for Guesser during gameplay.
  - **Acceptance Criteria:**
    - ✅ Shows "Temp Points: X" badge/counter for Guesser
    - ✅ Updates in real-time after each elimination
    - ✅ Visible in Guesser view (can be visible to all players)
    - ✅ Clear visual indicator (prominent badge or counter)
    - ✅ Shows "+1" animation when points increase (optional polish)

- [x] **T6. Frontend: Round End Score Summary**
  - **Dependencies:** T3 (Backend: Round End Points Summary)
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Enhanced round end view showing detailed points breakdown for all players.
  - **Acceptance Criteria:**
    - ✅ Shows "Round Complete!" header
    - ✅ Shows each player's name
    - ✅ Shows points earned this round for each player
    - ✅ Shows reason for points (e.g., "Guesser: 3 temp points", "Blue Fish: 1 survival bonus")
    - ✅ Shows total points (accumulated across rounds)
    - ✅ Highlights Guesser's temp points conversion
    - ✅ Clean, readable layout with player cards
    - ✅ Admin sees "Next Round" and "End Game" buttons

---

## Progress

- **Completed:** 0/3 (0%)
- **Last Updated:** 2026-03-20

## Dependencies

```
T4 (Elimination Modal)
T5 (Temp Points Display)
T6 (Round End Score Summary)
```

## Recommended Order

1. **T4** - Frontend: Elimination Result Modal (3-4h)
2. **T5** - Frontend: Temp Points Display (2-3h)
3. **T6** - Frontend: Round End Score Summary (3-4h)

**Total Estimated Effort:** 8-10 hours (M)

## Notes

- Reference AGENTS.md for UI/UX theme (minimal, clean, funny)
- Modal should be clear and exciting (role reveal moment!)
- Temp points display should be prominent but not distracting
- Score summary should be easy to read at a glance
- Mobile-first responsive design

## Testing Checklist

- [ ] Elimination modal appears after each guess
- [ ] Modal shows correct eliminated player name
- [ ] Modal shows correct role (Red Fish or Blue Fish)
- [ ] "Continue Eliminating" button works (if Red Fish)
- [ ] "Round Over" message shows (if Blue Fish)
- [ ] Temp points display visible for Guesser
- [ ] Temp points update after each elimination
- [ ] Round end summary shows all players
- [ ] Round end summary shows points earned and reasons
- [ ] Round end summary shows total points
- [ ] Mobile responsive on all views
