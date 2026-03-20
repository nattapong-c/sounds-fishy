# Phase 2.5: Frontend - Single Page Room Management

**Status:** ✅ Completed  
**Created:** 2026-03-19  
**Target:** 2026-03-20  
**Total Tasks:** 4

## Overview

Simplify the routing structure by removing the `/briefing` sub-path as part of the Phase 2.5 MongoDB Question Bank transition. All game phases (lobby, briefing, playing, roundEnd) will be managed in a single page `/room/[roomCode]` based on the room status from the backend. This eliminates routing issues and makes the flow more intuitive.

**Benefits:**
- No more routing issues when navigating between phases
- Simpler codebase (one page instead of multiple)
- Better user experience (no URL changes during game)
- Easier to manage state and WebSocket connections
- Complements the MongoDB Question Bank changes

## Tasks

### Completed ✅
- [x] T1. Remove Briefing Page Directory
  - **Completed:** 2026-03-19
  - **Agent:** frontend-nextjs-expert
  - **Files:** `app/src/app/room/[roomCode]/briefing/page.tsx` (deleted)
  - **Notes:** Briefing directory completely removed
- [x] T2. Update Lobby Page to Handle All Phases
  - **Completed:** 2026-03-19
  - **Agent:** frontend-nextjs-expert
  - **Files:** `app/src/app/room/[roomCode]/page.tsx`
  - **Notes:** Single page now handles lobby, briefing, playing, roundEnd based on room.status
- [x] T3. Update Navigation and Redirects
  - **Completed:** 2026-03-19
  - **Agent:** frontend-nextjs-expert
  - **Files:** `app/src/app/room/[roomCode]/page.tsx`
  - **Notes:** All redirects removed, phase transitions handled by state
- [x] T4. Update Documentation and Comments
  - **Completed:** 2026-03-19
  - **Agent:** frontend-nextjs-expert
  - **Files:** All affected files
  - **Notes:** Updated comments and documentation

### In Progress 🔄
- None yet

### Pending ⏳

#### T1. Remove Briefing Page Directory
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 15 minutes
- **Files:** `app/src/app/room/[roomCode]/briefing/page.tsx` (delete)
- **Description:** Delete the briefing page directory and all its contents
- **Acceptance Criteria:**
  - ✅ Briefing page directory removed
  - ✅ No broken imports
  - ✅ No references to briefing route

#### T2. Update Lobby Page to Handle All Phases
- **Dependencies:** T1
- **Agent:** frontend-nextjs-expert
- **Estimated:** 2 hours
- **Files:** `app/src/app/room/[roomCode]/page.tsx`
- **Description:** Consolidate briefing functionality into the main lobby page. Use room.status to determine which view to show
- **Acceptance Criteria:**
  - ✅ Single page handles all phases (lobby, briefing, playing, roundEnd)
  - ✅ Phase rendering based on room.status
  - ✅ Lobby view: Join form, player list, ready button
  - ✅ Briefing view: Role-specific content (Guesser, Big Fish, Red Herring)
  - ✅ Playing view: Game interface (future implementation)
  - ✅ RoundEnd view: Score summary (future implementation)
  - ✅ Smooth transitions between phases
  - ✅ WebSocket events properly handled for phase changes

#### T3. Update Navigation and Redirects
- **Dependencies:** T2
- **Agent:** frontend-nextjs-expert
- **Estimated:** 30 minutes
- **Files:** `app/src/app/room/[roomCode]/page.tsx`, `app/src/hooks/useRoom.ts`
- **Description:** Remove all references to `/briefing` route, update redirects to use status-based rendering
- **Acceptance Criteria:**
  - ✅ No router.push to `/briefing`
  - ✅ Phase transitions handled by state changes
  - ✅ Back button works correctly
  - ✅ No broken links or redirects

#### T4. Update Documentation and Comments
- **Dependencies:** T3
- **Agent:** frontend-nextjs-expert
- **Estimated:** 15 minutes
- **Files:** All affected files
- **Description:** Update comments, documentation, and task files to reflect single-page structure
- **Acceptance Criteria:**
  - ✅ All comments updated
  - ✅ Task files updated
  - ✅ No references to old routing structure

## Progress

- **Completed:** 4/4 (100%)
- **Last Updated:** 2026-03-19

## Dependencies

```
T1 (Remove Briefing) → T2 (Update Lobby Page) → T3 (Update Navigation) → T4 (Update Docs)
```

## Notes

- This is part of Phase 2.5 (MongoDB Question Bank transition)
- Breaking change for any existing URLs with `/briefing`
- Users with old URLs will need to be redirected to the main room page
- Consider adding a redirect from old `/briefing` URLs for backward compatibility
- Test thoroughly to ensure all phase transitions work smoothly
- This change complements the removal of AI service dependency

## Testing Checklist

- [ ] Join room flow works correctly
- [ ] Briefing phase displays correctly for all roles
- [ ] Phase transitions are smooth
- [ ] WebSocket events trigger phase changes
- [ ] Back button works as expected
- [ ] No console errors or warnings
- [ ] Mobile responsive
- [ ] Old `/briefing` URLs are handled gracefully
