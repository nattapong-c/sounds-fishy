# Phase 2.7 Frontend: Remove Lie Suggestion UI

**Status:** ✅ Completed
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 2

## Overview
Remove the `lieSuggestion` (Storytelling Aid) from the frontend state, types, and UI.

## Tasks

### Completed ✅

- [x] **T2. Frontend: Update Game Types**
  - **Type:** Frontend
  - **Effort:** S (0.5h)
  - **Dependencies:** T1 (Backend)
  - **Files to Modify:** `app/src/types/game.ts`
  - **Description:** Remove the `lieSuggestion` field from `GamePayload` and `RoundStartPayload` interfaces.
  - **Acceptance Criteria:**
    - ✅ `GamePayload` interface is updated.
    - ✅ `RoundStartPayload` interface is updated.

- [x] **T3. Frontend: Remove lieSuggestion UI and State**
  - **Type:** Frontend
  - **Effort:** S (1h)
  - **Dependencies:** T2
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Remove `myLieSuggestion` state, its setters in WebSocket message handlers, and the "Storytelling Aid" UI component from the Red Fish view.
  - **Acceptance Criteria:**
    - ✅ `myLieSuggestion` state is removed.
    - ✅ WebSocket handlers (`game_started`, `round_started`, `lobby_reset`) no longer reference `lieSuggestion`.
    - ✅ Red Fish UI no longer displays the "Storytelling Aid" box.

## Progress
- **Completed:** 2/2 (100%)
- **Last Updated:** 2026-03-23
