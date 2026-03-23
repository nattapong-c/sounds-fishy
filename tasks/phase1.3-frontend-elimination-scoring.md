# Phase 1.3 Frontend: Elimination & Scoring

**Status:** ✅ Completed
**Created:** 2026-03-20
**Updated:** 2026-03-23  
**Updated:** 2026-03-20  
**Target:** 2026-03-21  
**Total Tasks:** 7

## Overview

Frontend implementation for elimination and scoring: "Go Eliminate!" button for Guesser, player selection with confirmation modal, score display, round end view, game end view with rankings, admin controls for next round/end game.

---

## Tasks

### Completed ✅

- [x] **T7. Frontend: Game State Types Update**
  - **Dependencies:** None
  - **Effort:** S (1h)
  - **Files to Create/Modify:** `app/src/types/game.ts`
  - **Description:** Add types for elimination phase, scoring, game results.
  - **Acceptance Criteria:**
    - ✅ EliminationState interface
    - ✅ Score interface (totalPoints, tempPoints, roundsAsGuesser, etc.)
    - ✅ GameResult interface
    - ✅ PlayerRanking interface

- [x] **T8. Frontend: Guesser Elimination View**
  - **Dependencies:** T7
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Guesser view with "Go Eliminate!" button, shows player list with answers for deduction.
  - **Acceptance Criteria:**
    - ✅ Shows "Go Eliminate!" button prominently
    - ✅ On click: displays all players with their answers
    - ✅ Shows each player's answer (Red Fish answers visible for deduction)
    - ✅ Clickable player cards for selection
    - ✅ Clean, minimal design

- [x] **T9. Frontend: Confirmation Modal**
  - **Dependencies:** T8
  - **Effort:** S (2-3h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx` (inline component)
  - **Description:** Modal dialog confirming player elimination selection.
  - **Acceptance Criteria:**
    - ✅ Shows selected player name
    - ✅ Shows "Are you sure?" message
    - ✅ "Confirm" button (submits guess)
    - ✅ "Cancel" button (closes modal)
    - ✅ Modal overlay with click-to-close

- [x] **T10. Frontend: Score Display Component**
  - **Dependencies:** T7
  - **Effort:** S (2-3h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx` (inline component)
  - **Description:** Display current scores for all players, including temp points for Guesser.
  - **Acceptance Criteria:**
    - ✅ Shows all players with total points
    - ✅ Highlights current Guesser's temp points
    - ✅ Updates in real-time via WebSocket
    - ✅ Clean, readable layout

- [x] **T11. Frontend: Round End View**
  - **Dependencies:** T7, T10
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Display round results: points awarded, who was Guesser/Blue Fish/Red Fish, updated scores.
  - **Acceptance Criteria:**
    - ✅ Shows round summary
    - ✅ Shows points awarded to each player
    - ✅ Shows updated total scores
    - ✅ Shows who will be next Guesser
    - ✅ Admin sees "Next Round" or "End Game" button

- [x] **T12. Frontend: Game End View**
  - **Dependencies:** T11
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Display final game results: final scores, winner announcement, player rankings.
  - **Acceptance Criteria:**
    - ✅ Shows "Game Over" message
    - ✅ Shows final scores for all players
    - ✅ Shows winner (highest score)
    - ✅ Shows player rankings (sorted by points)
    - ✅ Clean, celebratory design

- [x] **T13. Frontend: Admin Controls (Next Round / End Game)**
  - **Dependencies:** T11, T12
  - **Effort:** S (2-3h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Admin-only buttons: "Next Round" (if players haven't been Guesser) or "End Game" (if all have been Guesser).
  - **Acceptance Criteria:**
    - ✅ Shows only for admin
    - ✅ "Next Round" button visible if not all players been Guesser
    - ✅ "End Game" button visible if all players been Guesser
    - ✅ Buttons call respective WebSocket events
    - ✅ Disabled state during transitions

---

## Progress

- **Completed:** 0/7 (0%)
- **Last Updated:** 2026-03-20

## Dependencies

```
T7 ──→ T8 ──→ T9
 │     │
 │     └──→ T10 ──→ T11 ──→ T12
 │                        │
 └────────────────────────┴──→ T13
```

## Recommended Order

1. **T7** - Frontend: Game State Types Update (1h)
2. **T8** - Frontend: Guesser Elimination View (3-4h)
3. **T9** - Frontend: Confirmation Modal (2-3h)
4. **T10** - Frontend: Score Display (2-3h)
5. **T11** - Frontend: Round End View (3-4h)
6. **T12** - Frontend: Game End View (3-4h)
7. **T13** - Frontend: Admin Controls (2-3h)

**Total Estimated Effort:** 16-22 hours (L-XL)

## Notes

- Reference AGENTS.md for UI/UX theme (minimal, clean, funny)
- Mobile-first responsive design
- Tap-to-reveal prevents accidental exposure when sharing screen
- Keep UI simple and focused on gameplay
- Admin controls only visible to admin user

## Testing Checklist

- [ ] TypeScript types compile without errors
- [ ] "Go Eliminate!" button shows only for Guesser
- [ ] Player list with answers displays correctly
- [ ] Confirmation modal appears on player selection
- [ ] Confirm button submits guess via WebSocket
- [ ] Cancel button closes modal without action
- [ ] Score display updates in real-time
- [ ] Round end view shows correct point awards
- [ ] Game end view shows final rankings
- [ ] Admin sees correct button (Next Round or End Game)
- [ ] Mobile responsive on all views
