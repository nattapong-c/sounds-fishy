# Phase 1: Backend - Core Room Infrastructure

**Status:** ⏳ Not Started  
**Created:** 2026-03-19  
**Target:** 2026-03-20  
**Total Tasks:** 8

## Overview

Set up the backend foundation for room management including room creation, joining, player connection handling, and leaving. This creates a stable foundation before implementing gameplay features.

**Key Features:**
- Room creation with unique codes
- Player join with deviceId-based identity
- WebSocket connection management
- Player leave/disconnect handling
- MongoDB persistence

## Tasks

### Completed ✅
- None yet

### In Progress 🔄
- None yet

### Pending ⏳

#### T1. Set up MongoDB Connection
- **Dependencies:** None
- **Agent:** backend-bun-expert
- **Estimated:** 30 minutes
- **Files:** `service/src/lib/database.ts`, `service/.env`
- **Description:** Configure MongoDB connection with Mongoose, add environment variables
- **Acceptance Criteria:**
  - ✅ MongoDB connects successfully
  - ✅ Environment variable MONGODB_URI configured
  - ✅ Connection logging works
  - ✅ Error handling for connection failures

#### T2. Create GameRoom Model
- **Dependencies:** T1
- **Agent:** backend-bun-expert
- **Estimated:** 1 hour
- **Files:** `service/src/models/game-room.ts`, `service/src/models/index.ts`
- **Description:** Define MongoDB schema for game rooms with player subdocuments, include deviceId field
- **Acceptance Criteria:**
  - ✅ Room schema with roomCode, hostId, players array
  - ✅ Player schema with deviceId, name, isHost, isOnline, score, isReady
  - ✅ Index on roomCode for fast lookups
  - ✅ Index on deviceId for player lookups
  - ✅ TypeScript interfaces exported

#### T3. Create Room Service
- **Dependencies:** T2
- **Agent:** backend-bun-expert
- **Estimated:** 1.5 hours
- **Files:** `service/src/services/room-service.ts`
- **Description:** Business logic for room operations (create, join, leave, toggle ready)
- **Acceptance Criteria:**
  - ✅ createRoom() - creates room with host
  - ✅ joinRoom() - adds player to room (handles reconnection)
  - ✅ leaveRoom() - removes player or marks offline
  - ✅ toggleReady() - toggles player ready status
  - ✅ generateUniqueRoomCode() - generates 6-char codes
  - ✅ All methods include proper error handling

#### T4. Create Room Controller (REST API)
- **Dependencies:** T3
- **Agent:** backend-bun-expert
- **Estimated:** 1.5 hours
- **Files:** `service/src/controllers/room-controller.ts`
- **Description:** REST endpoints for room operations
- **Acceptance Criteria:**
  - ✅ POST /api/rooms - Create room
  - ✅ GET /api/rooms/:roomCode - Get room details
  - ✅ POST /api/rooms/:roomCode/join - Join room
  - ✅ POST /api/rooms/:roomCode/leave - Leave room
  - ✅ POST /api/rooms/:roomCode/ready - Toggle ready
  - ✅ All endpoints return consistent response format
  - ✅ Proper error responses (404, 400, 500)

#### T5. Create WebSocket Controller
- **Dependencies:** T2, T4
- **Agent:** backend-bun-expert
- **Estimated:** 2 hours
- **Files:** `service/src/controllers/ws-controller.ts`
- **Description:** WebSocket handlers for real-time events
- **Acceptance Criteria:**
  - ✅ Query param authentication (roomId, deviceId)
  - ✅ Open handler - subscribe to room, mark online, broadcast room_updated
  - ✅ Close handler - mark offline, broadcast room_updated
  - ✅ Message handler - route to join_room, leave_room, ready_up
  - ✅ Pub/Sub broadcasting to room participants
  - ✅ Connection tracking with roomConnections Map

#### T6. Create Logger Utility
- **Dependencies:** None
- **Agent:** backend-bun-expert
- **Estimated:** 30 minutes
- **Files:** `service/src/lib/logger.ts`
- **Description:** Structured logging utility with colored output
- **Acceptance Criteria:**
  - ✅ logger.info(), logger.warn(), logger.error()
  - ✅ Colored console output
  - ✅ Log level configuration
  - ✅ Context object support

#### T7. Create Error Classes
- **Dependencies:** None
- **Agent:** backend-bun-expert
- **Estimated:** 30 minutes
- **Files:** `service/src/lib/errors.ts`
- **Description:** Custom error classes for consistent error handling
- **Acceptance Criteria:**
  - ✅ NotFoundError (404)
  - ✅ BadRequestError (400)
  - ✅ CustomAppError base class
  - ✅ Proper status code setting

#### T8. Set up Main Entry Point
- **Dependencies:** T4, T5, T6
- **Agent:** backend-bun-expert
- **Estimated:** 30 minutes
- **Files:** `service/src/index.ts`, `service/package.json`, `service/.env`
- **Description:** Main ElysiaJS application entry point
- **Acceptance Criteria:**
  - ✅ ElysiaJS app configured with CORS
  - ✅ Room controller mounted
  - ✅ WebSocket controller mounted
  - ✅ Database connection on startup
  - ✅ Health check endpoint
  - ✅ Server listens on PORT from env

## Progress

- **Completed:** 0/8 (0%)
- **Last Updated:** 2026-03-19

## Dependencies

```
T1 → T2 → T3 → T4 → T5 → T8
            ↓
           T6 ──→ T8
            ↓
           T7
```

## Notes

- Follow patterns from Outsider project (see `reports/outsider-study.md`)
- Use deviceId for player identity (see `DEVICE_IDENTITY_PATTERN.md`)
- MongoDB is single source of truth (no in-memory state)
- WebSocket connections are transient
- Same deviceId = same player (reconnection support)
- All state changes broadcast via WebSocket

## Testing Checklist

- [ ] MongoDB connection works
- [ ] Room creation returns unique code
- [ ] Player can join room
- [ ] Reconnection with same deviceId works
- [ ] Player leave removes from room
- [ ] Disconnect marks player offline
- [ ] WebSocket broadcasts work
- [ ] Error handling returns proper codes
