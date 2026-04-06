# Phase 1.6 Frontend: Guesser Stop Button & UI

**Status:** ✅ Completed
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 2

## Overview
Add the "Stop & Collect" button for the Guesser and update the points breakdown UI.

## Tasks

### Completed ✅

- [x] **T3. Frontend: Add "Stop & Collect" Button to Guesser View**
  - **Type:** Frontend
  - **Effort:** S (1h)
  - **Dependencies:** T1 (Backend)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Update the Guesser's role card to include a "Stop & Collect Points" button. Visible only when `tempPoints > 0`.
  - **Acceptance Criteria:**
    - ✅ Button appears only when Guesser has at least 1 temp point.
    - ✅ Clicking button sends `stop_guessing` via WebSocket.

- [x] **T4. Frontend: Update Points Breakdown for Survivor Bonus**
  - **Type:** Frontend
  - **Effort:** S (0.5h)
  - **Dependencies:** T2 (Backend)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Ensure the `PointsBreakdownView` correctly displays the +1 point for survivors.
  - **Acceptance Criteria:**
    - ✅ Surviving players see their +1 point in the breakdown.
    - ✅ Reason clearly states "Survivor Bonus".

## Progress
- **Completed:** 2/2 (100%)
- **Last Updated:** 2026-03-23
