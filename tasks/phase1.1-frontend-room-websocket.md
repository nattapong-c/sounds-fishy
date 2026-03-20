# Phase 1.1 Frontend: Room Management & WebSocket

**Status:** ⏳ Not Started  
**Created:** 2026-03-20  
**Target:** 2026-03-21  
**Total Tasks:** 7

## Overview

Frontend implementation for room lifecycle: home page (create/join), room page with join flow, WebSocket integration, lobby UI with player list, and handling kicked/removed players.

---

## Tasks

### Pending ⏳

- [ ] **T7. Frontend: DeviceId Hook**
  - **Dependencies:** None
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `app/src/hooks/useDeviceId.ts`
  - **Description:** Create custom hook that generates UUID on first use, stores in localStorage, returns persistent deviceId across sessions.
  - **Acceptance Criteria:**
    - ✅ Generates UUID v4 if not exists
    - ✅ Stores in localStorage as 'sounds-fishy-deviceId'
    - ✅ Returns same deviceId on subsequent calls
    - ✅ Works in Next.js client components ('use client')

- [ ] **T8. Frontend: API Client Setup**
  - **Dependencies:** None
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `app/src/lib/api.ts`
  - **Description:** Create API client using fetch wrapper. Include methods: createRoom(), joinRoom(roomId, name, deviceId), leaveRoom(roomId, deviceId), getRoom(roomId).
  - **Acceptance Criteria:**
    - ✅ Base URL from NEXT_PUBLIC_API_URL env
    - ✅ createRoom() method
    - ✅ joinRoom() method
    - ✅ leaveRoom() method
    - ✅ getRoom() method
    - ✅ Proper error handling

- [ ] **T9. Frontend: Home Page (Create/Join)**
  - **Dependencies:** T7, T8
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/page.tsx`
  - **Description:** Create home page with two actions: "Create New Room" button and "Join Room" form (room ID input + button). Handle loading states and errors.
  - **Acceptance Criteria:**
    - ✅ Create button calls createRoom(), redirects to /roomId
    - ✅ Join form validates 6-char input
    - ✅ Join button navigates to /roomId
    - ✅ Loading state during create
    - ✅ Error display for failures
    - ✅ Mobile responsive

- [ ] **T10. Frontend: Room Page - Join Flow**
  - **Dependencies:** T7, T8, T9
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Create room page that checks if user has joined. If not, show nickname form. On submit, call joinRoom(), then connect WebSocket. Handle auto-reconnect on page load.
  - **Acceptance Criteria:**
    - ✅ Shows join form if not joined
    - ✅ Nickname input with validation
    - ✅ Calls joinRoom API on submit
    - ✅ Auto-reconnects if deviceId already in room
    - ✅ Connects WebSocket after successful join
    - ✅ Redirects to home if room not found

- [ ] **T11. Frontend: WebSocket Integration**
  - **Dependencies:** T10
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Implement WebSocket connection in room page. Handle connection (auto-detect ws:// vs wss://), listen for room_state_update, update local state. Handle disconnect gracefully.
  - **Acceptance Criteria:**
    - ✅ Connects to ws://localhost:3001/ws/rooms/:roomId?deviceId=:id
    - ✅ Auto-detects wss:// for production
    - ✅ Listens for room_state_update events
    - ✅ Updates room state on events
    - ✅ Handles disconnect (console log, no crash)
    - ✅ Cleanup on unmount

- [ ] **T12. Frontend: Room Page - Lobby UI**
  - **Dependencies:** T11
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Display lobby view with player list (names, admin badge, online status), "You" indicator, copy room ID button, leave button. Show admin controls (kick, start game stub).
  - **Acceptance Criteria:**
    - ✅ Player list with names
    - ✅ Admin crown badge (👑)
    - ✅ Online/offline indicator
    - ✅ "You" badge for current player
    - ✅ Copy room ID button (copies URL)
    - ✅ Leave button calls leave API
    - ✅ Admin sees kick buttons
    - ✅ Mobile responsive

- [ ] **T13. Frontend: Handle Kicked/Removed Players**
  - **Dependencies:** T11, T12
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Detect if player is removed from room (kicked or room deleted). Redirect to home page with appropriate message.
  - **Acceptance Criteria:**
    - ✅ Monitors roomState.players for deviceId
    - ✅ Redirects to home if deviceId not found
    - ✅ Shows "You were kicked" message if applicable
    - ✅ Handles room deletion gracefully

---

## Progress

- **Completed:** 7/7 (100%) ✅
- **Last Updated:** 2026-03-20

## Completed Tasks ✅

- [x] **T7. Frontend: DeviceId Hook**
  - **Completed:** 2026-03-20
  - **Files:** `app/src/hooks/useDeviceId.ts`
  - **Notes:** Generates UUID v4, stores in localStorage, persists across sessions.

- [x] **T8. Frontend: API Client Setup**
  - **Completed:** 2026-03-20 (Updated 2026-03-20)
  - **Files:** `app/src/lib/api.ts`
  - **Notes:** Updated to use axios with interceptors pattern (aligned with reference).
    - Axios instance with baseURL, headers, timeout
    - Request interceptor for future auth
    - Response interceptor for error handling
    - Installed axios package

- [x] **T9. Frontend: Home Page (Create/Join)**
  - **Completed:** 2026-03-20
  - **Files:** `app/src/app/page.tsx`
  - **Notes:** Create button, join form, error handling, mobile responsive.
    - Fixed text visibility (text-gray-900, darker borders)

- [x] **T10. Frontend: Room Page - Join Flow**
  - **Completed:** 2026-03-20
  - **Files:** `app/src/app/[roomId]/page.tsx`
  - **Notes:** Nickname form, auto-reconnect, WebSocket connection after join.
    - Fixed text visibility in inputs and labels
    - Enhanced WebSocket message type handling

- [x] **T11. Frontend: WebSocket Integration**
  - **Completed:** 2026-03-20
  - **Files:** `app/src/app/[roomId]/page.tsx`
  - **Notes:** Auto-detect ws/wss, room_state_update handler, cleanup on unmount.
    - Message type switch statement for better handling
    - Error message display from WebSocket

- [x] **T12. Frontend: Room Page - Lobby UI**
  - **Completed:** 2026-03-20
  - **Files:** `app/src/app/[roomId]/page.tsx`
  - **Notes:** Player list, admin badge, kick button, copy room ID, start game.
    - Player names now dark text (text-gray-900) for readability

- [x] **T13. Frontend: Handle Kicked/Removed Players**
  - **Completed:** 2026-03-20
  - **Files:** `app/src/app/[roomId]/page.tsx`
  - **Notes:** Monitors deviceId in players, redirects to home if kicked.

## Dependencies

```
T7 ──→ T8 ──→ T9 ──→ T10 ──→ T11 ──→ T12 ──→ T13
```

## Recommended Order

1. **T7** - Frontend: DeviceId Hook (1-2h) - *Can be done in parallel with backend*
2. **T8** - Frontend: API Client (1-2h)
3. **T9** - Frontend: Home Page (3-4h)
4. **T10** - Frontend: Room Page - Join Flow (3-4h)
5. **T11** - Frontend: WebSocket Integration (3-4h)
6. **T12** - Frontend: Room Page - Lobby UI (3-4h)
7. **T13** - Frontend: Handle Kicked Players (1-2h)

**Total Estimated Effort:** 16-22 hours (L-XL)

## Notes

- Reference AGENTS.md for project structure and tech stack
- Follow Outsider project patterns for room/WebSocket flow
- Use deviceId for player identity (no user accounts)
- Mobile-first responsive design
- No timers needed - players proceed at their own pace
- **Reference:** `docs/homepage-flow.md` for home page UI and user flow
- **Reference:** `docs/room-page-flow.md` for room page UI, WebSocket integration, and state management

### Code Quality Updates
- **API Client:** Updated to axios with interceptors (aligned with reference)
- **Error Handling:** Response interceptor for centralized error logging
- **Type Safety:** Axios types exported for reuse

### Bug Fixes
- Text visibility: Input text now dark gray-900 (was too light)
- Player names: Dark text for readability
- Input borders: Darker gray-300 for better visibility
- Labels: Darker gray-700 for readability
- WebSocket messages: Enhanced type handling with switch statement

## Testing Checklist

- [ ] DeviceId persists across page refresh
- [ ] Create room from home page works
- [ ] Join room with valid ID works
- [ ] Join room with invalid ID shows error
- [ ] Nickname form validates input
- [ ] Auto-reconnect on page refresh works
- [ ] WebSocket connects successfully
- [ ] Player list updates in real-time
- [ ] Admin badge shows for admin
- [ ] Kick button works (admin only)
- [ ] Leave room redirects to home
- [ ] Copy room ID copies full URL
- [ ] Kicked player redirects to home
- [ ] Mobile responsive layout works
