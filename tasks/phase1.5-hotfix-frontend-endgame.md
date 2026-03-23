# Phase 1.5 Hotfix: Frontend End Game & Reset Flow

**Status:** ✅ Completed
**Created:** 2026-03-23
**Updated:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 3

## Overview

Frontend updates to support the new End Game → Show Rankings → Reset Lobby flow:
1. "End Game" button should transition to completed state and show rankings
2. "Go back to Lobby" button should reset all scores
3. Update UI to handle 'completed' status properly

---

## Tasks

### Pending ⏳

- [ ] **T3. Frontend: Update End Game Button Handler**
  - **Dependencies:** T1 (Backend: Separate End Game from Reset Lobby)
  - **Effort:** S (1-2h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Update the "End Game" button to send `end_game` event instead of `end_round`. This will transition to 'completed' status and show final rankings without resetting scores.
  - **Acceptance Criteria:**
    - ✅ "End Game" button sends `end_game` WebSocket event
    - ✅ Handler processes `game_ended` event from backend
    - ✅ Displays final rankings in completed view
    - ✅ Shows "Go back to Lobby" button after game ends

- [ ] **T4. Frontend: Add Reset Lobby Button Handler**
  - **Dependencies:** T1
  - **Effort:** S (1-2h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Update "Go back to Lobby" button to send `reset_lobby` event. This will clear all scores and return to lobby state.
  - **Acceptance Criteria:**
    - ✅ "Go back to Lobby" button sends `reset_lobby` WebSocket event
    - ✅ Handler processes `lobby_reset` event from backend
    - ✅ Clears rankings state
    - ✅ Returns to lobby view
    - ✅ Only visible to admin

- [ ] **T5. Frontend: Update Completed Status UI**
  - **Dependencies:** T3
  - **Effort:** S (2-3h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Ensure the 'completed' status view properly displays final rankings and the "Go back to Lobby" button. Add clear visual indication that game has ended.
  - **Acceptance Criteria:**
    - ✅ Completed view shows "Game Over!" header
    - ✅ Displays final rankings with medals
    - ✅ Shows all player scores
    - ✅ Admin sees "Go back to Lobby" button
    - ✅ Non-admin sees "Waiting for admin..." message
    - ✅ Mobile responsive

---

## Progress

- **Completed:** 0/3 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 (Backend) ──→ T3 (Frontend: End Game handler)
T1 (Backend) ──→ T4 (Frontend: Reset handler)
T3 ──→ T5 (Completed UI)
```

## Recommended Order

1. **T1** - Backend: Separate End Game from Reset (complete first)
2. **T3** - Frontend: Update End Game Button Handler (1-2h)
3. **T4** - Frontend: Add Reset Lobby Button Handler (1-2h)
4. **T5** - Frontend: Update Completed Status UI (2-3h)

**Total Estimated Effort:** 4-7 hours (M)

## Notes

### Current Flow (BROKEN)
```
Click "End Game" → Scores reset → Back to lobby (no rankings shown)
```

### Desired Flow (FIXED)
```
Click "End Game" → Show rankings (completed status) → Click "Go back to Lobby" → Scores reset → Lobby
```

### UI States
- **Playing**: Game in progress, elimination buttons visible
- **Round End**: Round complete, "Next Round" and "End Game" buttons visible
- **Completed**: Game over, rankings displayed, "Go back to Lobby" button (admin only)
- **Lobby**: Waiting for players, "Start Game" button (admin only)

## Testing Checklist

- [ ] "End Game" button shows on round end screen
- [ ] Clicking "End Game" transitions to completed view
- [ ] Final rankings displayed with all scores
- [ ] "Go back to Lobby" button visible to admin
- [ ] Clicking "Go back to Lobby" resets scores
- [ ] Returns to lobby view after reset
- [ ] Non-admin players see appropriate messages
- [ ] Mobile responsive on all views
