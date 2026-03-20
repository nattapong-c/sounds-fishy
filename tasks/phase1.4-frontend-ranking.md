# Phase 1.4 Frontend: Ranking Score & Game End

**Status:** ⏳ Not Started  
**Created:** 2026-03-20  
**Updated:** 2026-03-20  
**Target:** 2026-03-21  
**Total Tasks:** 2

## Overview

Frontend implementation for final game rankings and lobby return: display player rankings with medals, admin "Go back to Lobby" button to reset game.

---

## Tasks

### Pending ⏳

- [ ] **T3. Frontend: Ranking Display Component**
  - **Dependencies:** None
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx` (inline component)
  - **Description:** Display player rankings with medals/trophies, sorted by score, showing each player's total points.
  - **Acceptance Criteria:**
    - ✅ Shows rankings sorted by total points (highest first)
    - ✅ Displays medal icons for top 3 (🥇🥈🥉)
    - ✅ Shows player name and total score
    - ✅ Highlights current user's ranking
    - ✅ Clean, celebratory design
    - ✅ Mobile responsive

- [ ] **T4. Frontend: Go back to Lobby Button**
  - **Dependencies:** T3
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Admin-only button to reset game to lobby state. Shows on game end screen.
  - **Acceptance Criteria:**
    - ✅ Shows only for admin user
    - ✅ Visible on game end/ranking screen
    - ✅ Calls reset_to_lobby WebSocket event
    - ✅ Shows loading state during reset
    - ✅ Redirects to lobby view after reset

---

## Progress

- **Completed:** 0/2 (0%)
- **Last Updated:** 2026-03-20

## Dependencies

```
T3 ──→ T4
```

## Recommended Order

1. **T3** - Frontend: Ranking Display Component (3-4h)
2. **T4** - Frontend: Go back to Lobby Button (1-2h)

**Total Estimated Effort:** 4-6 hours (M)

## Notes

- Reference AGENTS.md for UI/UX theme (minimal, clean, funny)
- Mobile-first responsive design
- Celebratory design for rankings (medals, colors)
- Clear visual feedback for admin button

## Testing Checklist

- [ ] Ranking display shows all players
- [ ] Rankings sorted correctly (highest score first)
- [ ] Medal icons show for top 3 (🥇🥈🥉)
- [ ] Current user's ranking highlighted
- [ ] "Go back to Lobby" button shows only for admin
- [ ] Button calls reset_to_lobby WebSocket event
- [ ] Loading state shows during reset
- [ ] Lobby view displays after reset
- [ ] Mobile responsive on ranking screen
