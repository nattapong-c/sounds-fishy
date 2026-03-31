# Phase 2.7 Backend: Remove Lie Suggestion Distribution

**Status:** ✅ Completed
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 1

## Overview
Remove the logic that distributes `lieSuggestion` (hints from other players) to Red Fish players.

## Tasks

### Completed ✅

- [x] **T1. Backend: Remove lieSuggestion Logic**
  - **Type:** Backend
  - **Effort:** S (1h)
  - **Files to Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Remove the logic that selects a hint from another Red Fish's distribution. Stop sending `lieSuggestion` in `start_game`, `next_round`, and reconnection payloads.
  - **Acceptance Criteria:**
    - ✅ Logic calculating `lieSuggestion` is removed.
    - ✅ `playerDataMap` no longer includes `lieSuggestion`.
    - ✅ Reconnection payload no longer includes `lieSuggestion`.

## Progress
- **Completed:** 1/1 (100%)
- **Last Updated:** 2026-03-23
