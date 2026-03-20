# Phase 1.1 Backend: Room Management & WebSocket

**Status:** ⏳ Not Started  
**Created:** 2026-03-20  
**Target:** 2026-03-21  
**Total Tasks:** 6

## Overview

Backend foundation for room lifecycle management: create rooms, join/rejoin with deviceId, leave rooms, and real-time WebSocket connections with admin controls. No game logic yet.

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Room Model & Schema**
  - **Dependencies:** None
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `service/src/models/room.ts`
  - **Description:** Create Mongoose schema for rooms with roomId (unique 6-char), status, players array (id, name, deviceId, isAdmin, isOnline), timestamps. Add indexes for fast lookups.
  - **Acceptance Criteria:**
    - ✅ Room schema with roomId (unique, 6-char uppercase)
    - ✅ Player subdocument with id, name, deviceId, isAdmin, isOnline
    - ✅ Index on roomId for fast lookups
    - ✅ TypeScript interface exported
    - ✅ Mongoose model compiles without errors

- [ ] **T2. Backend: Create Room API Endpoint**
  - **Dependencies:** T1
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `service/src/controllers/room-controller.ts`, `service/src/index.ts`
  - **Description:** Create POST `/rooms` endpoint that generates 6-char room ID, creates room in MongoDB, returns roomId to client.
  - **Acceptance Criteria:**
    - ✅ POST /rooms endpoint exists
    - ✅ Generates unique 6-char uppercase roomId
    - ✅ Saves room to MongoDB with status='lobby'
    - ✅ Returns { roomId: string }
    - ✅ Handles duplicate roomId (retry on collision)

- [ ] **T3. Backend: Join Room API Endpoint**
  - **Dependencies:** T1, T2
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `service/src/controllers/room-controller.ts`
  - **Description:** Create POST `/rooms/:roomId/join` endpoint that accepts deviceId and name. Handles new players and reconnections (same deviceId). First player becomes admin. Max 8 players.
  - **Acceptance Criteria:**
    - ✅ POST /rooms/:roomId/join endpoint exists
    - ✅ New player: adds to room, sets isAdmin if first
    - ✅ Reconnecting player: sets isOnline=true, updates name
    - ✅ Returns full room data
    - ✅ Validates room exists (404 if not)
    - ✅ Validates room not full (400 if 8 players)

- [ ] **T4. Backend: Leave Room API Endpoint**
  - **Dependencies:** T3
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `service/src/controllers/room-controller.ts`
  - **Description:** Create POST `/rooms/:roomId/leave` endpoint. Removes player by deviceId. Reassigns admin if leaving player was admin. Deletes room if last player leaves.
  - **Acceptance Criteria:**
    - ✅ POST /rooms/:roomId/leave endpoint exists
    - ✅ Removes player from room
    - ✅ Reassigns admin to first remaining player if needed
    - ✅ Deletes room if no players remain
    - ✅ Returns { success: true }

- [ ] **T5. Backend: WebSocket Connection Handler**
  - **Dependencies:** T3
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`, `service/src/index.ts`
  - **Description:** Set up WebSocket endpoint at `/ws/rooms/:roomId?deviceId=:id`. Handle open (mark player online, broadcast), close (mark offline, broadcast), and message events. Use pub/sub pattern with `room:{roomId}` channels.
  - **Acceptance Criteria:**
    - ✅ WebSocket endpoint at /ws/rooms/:roomId
    - ✅ Accepts deviceId via query parameter
    - ✅ On open: subscribes to room channel, marks player online
    - ✅ On close: marks player offline
    - ✅ Broadcasts room_state_update to all players
    - ✅ Validates player exists in room

- [ ] **T6. Backend: WebSocket Admin Actions**
  - **Dependencies:** T5
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Handle admin WebSocket commands: `kick_player` (remove player), `start_game` (stub - just validate admin for now). Validate admin permissions before executing.
  - **Acceptance Criteria:**
    - ✅ kick_player: removes target player, broadcasts update
    - ✅ start_game: validates admin, logs (no game logic yet)
    - ✅ Only admin can execute these commands
    - ✅ Returns error to non-admin users
    - ✅ Broadcasts changes to all players

---

## Progress

- **Completed:** 6/6 (100%) ✅
- **Last Updated:** 2026-03-20

## Completed Tasks ✅

- [x] **T1. Backend: Room Model & Schema**
  - **Completed:** 2026-03-20
  - **Files:** `service/src/models/room.ts`, `service/src/lib/db.ts`, `service/src/lib/logger.ts`
  - **Notes:** Created Mongoose schema with roomId, players array, indexes. Added DB connection utility.
    - Exported RoomSchema and PlayerType for controller validation
    - Added toJSON() method for Map conversion
    - Fixed duplicate index warning (removed explicit roomId index)

- [x] **T2. Backend: Create Room API Endpoint**
  - **Completed:** 2026-03-20
  - **Files:** `service/src/controllers/room-controller.ts`
  - **Notes:** POST /rooms endpoint with 6-char roomId generation.
    - Updated to use Elysia route grouping pattern
    - Type validation with t.Object schemas

- [x] **T3. Backend: Join Room API Endpoint**
  - **Completed:** 2026-03-20 (Updated 2026-03-20)
  - **Files:** `service/src/controllers/room-controller.ts`
  - **Notes:** Handles new players and reconnections, first player is admin, max 8 players.
    - Aligned with Outsider reference pattern
    - Proper type validation for params and body

- [x] **T4. Backend: Leave Room API Endpoint**
  - **Completed:** 2026-03-20
  - **Files:** `service/src/controllers/room-controller.ts`
  - **Notes:** Removes player, reassigns admin, deletes room if empty.
    - Updated to match reference implementation

- [x] **T5. Backend: WebSocket Connection Handler**
  - **Completed:** 2026-03-20 (Updated 2026-03-20)
  - **Files:** `service/src/controllers/ws-controller.ts`, `service/src/index.ts`
  - **Notes:** WebSocket at /ws/rooms/:roomId, pub/sub pattern, marks online/offline.
    - Updated to use Elysia WS with prefix pattern, query validation (deviceId)
    - Server instance stored globally for pub/sub broadcasting
    - Proper message parsing and error handling

- [x] **T6. Backend: WebSocket Admin Actions**
  - **Completed:** 2026-03-20 (Updated 2026-03-20)
  - **Files:** `service/src/controllers/ws-controller.ts`
  - **Notes:** kick_player and start_game (stub) with admin validation.
    - Aligned with Outsider reference: admin actions in message handler
    - Phase 2 stubs for submit_guess

## Dependencies

```
T1 ──→ T2 ──→ T3 ──→ T4
              │
              └──→ T5 ──→ T6
```

## Recommended Order

1. **T1** - Backend: Room Model & Schema (1-2h)
2. **T2** - Backend: Create Room API (1-2h)
3. **T3** - Backend: Join Room API (3-4h)
4. **T4** - Backend: Leave Room API (1-2h)
5. **T5** - Backend: WebSocket Handler (3-4h)
6. **T6** - Backend: WebSocket Admin Actions (3-4h)

**Total Estimated Effort:** 12-18 hours (L)

## Notes

- Follow Outsider project patterns for room/WebSocket flow
- Use deviceId for player identity (no user accounts)
- No timers needed - players proceed at their own pace
- start_game is a stub for now (no game logic in Phase 1.1)
- **Reference:** `docs/room-page-flow.md` for WebSocket events and room state flow

### Code Quality Updates
- **Controller Pattern:** Updated to Elysia route grouping with prefix
- **Type Validation:** Using t.Object for params and body validation
- **Response Types:** Removed complex Mongoose types from validation
- **Server Instance:** Stored globally for pub/sub broadcasting

### Bug Fixes
- CORS import: Changed from `import { cors } from 'elysia'` to `import { cors } from '@elysiajs/cors'`
- Added `@elysiajs/cors` package to service dependencies
- Duplicate index warning: Removed explicit `index({ roomId: 1 })` (unique: true handles it)
- Text visibility: Fixed input and player list text colors (gray-900)
- Player list updates: Broadcasting on join via REST API

## Testing Checklist

- [ ] Create room returns valid 6-char roomId
- [ ] Join room works for new player
- [ ] Reconnect with same deviceId works
- [ ] Room full at 8 players
- [ ] Leave room removes player
- [ ] Admin reassignment on admin leave
- [ ] Room deleted when last player leaves
- [ ] WebSocket connects with deviceId
- [ ] WebSocket broadcasts to all players
- [ ] Admin kick works
- [ ] Non-admin cannot kick
