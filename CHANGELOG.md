# Changelog

All notable changes to Sounds Fishy project.

---

## [Unreleased] - 2026-03

### Major Refactoring

**Architecture Simplification:**
- Removed `components/` directory (all components now inline)
- Removed `services/` directory (API client inline)
- Removed `types/` directory (types inline)
- Removed `hooks/useRoom.ts`, `hooks/useSocket.ts`, `hooks/useBriefing.ts`
- Moved all UI components to page files
- Created inline `useBriefing` hook in room page
- Only `useDeviceId.ts` remains as shared hook

**API Integration:**
- Integrated axios for all API requests
- Configured axios with baseURL from environment
- Fixed response handling (`response.data.success`)
- Fixed TypeScript typing for axios responses

**Feature Changes:**
- Removed lie generation feature
- Red Herrings now use bluff suggestions from MongoDB
- Removed ready button feature
- Host has full control over game start

**Bug Fixes:**
- Fixed WebSocket null reference (useState → useRef)
- Fixed player reconnection status display
- Fixed ready status not updating for self
- Fixed API URL routing (port 3001)
- Fixed TypeScript errors with axios responses
- Fixed build cache issues

**Code Quality:**
- Fixed all TypeScript errors
- Build compiles successfully
- Cleaner, more maintainable code
- -1462 lines net change

**Files Changed:** 22 files  
**Insertions:** +485  
**Deletions:** -1947

---

## [2.0] - 2026-03 (Phase 2.5)

### Backend Changes

**Removed:**
- `isReady` field from player schema
- `toggleReadyAndCheck()` function
- `checkAllPlayersReady()` function
- `ready_up` WebSocket handler
- AI service dependency for lie generation

**Updated:**
- `ws-controller.ts` - Fixed reconnection broadcast
- `game-service.ts` - Uses question bank only
- `game-room.ts` - Removed isReady field

### Frontend Changes

**Removed:**
- Lie generator component
- Ready button UI
- generateLie API endpoint usage

**Updated:**
- `page.tsx` (room) - Inline components, axios, useBriefing
- `page.tsx` (home) - Inline components, axios
- RedHerringView - Simplified (no AI button)

---

## [1.0] - 2026-03 (Phase 1 & 2)

### Initial Implementation

**Backend:**
- ElysiaJS setup
- MongoDB integration
- Room management (create, join, leave)
- WebSocket real-time updates
- Game briefing logic
- Question bank with MongoDB

**Frontend:**
- Next.js setup
- TailwindCSS styling
- Device-based identity
- Home page (create/join room)
- Lobby page (player list)
- Briefing page (role-specific views)
- WebSocket integration

**Features:**
- Room creation with unique codes
- Player join with deviceId
- Real-time player list updates
- Role assignment (Guesser, Big Fish, Red Herring)
- Bluff suggestions from MongoDB
- Tap-to-reveal for Big Fish

---

## Key Decisions

### Architecture
- **Inline Components:** Simpler than component library for this project size
- **Axios:** Better than fetch for API requests
- **useRef for WebSocket:** Persists across re-renders
- **MongoDB Only:** No Redis, no in-memory state

### Features
- **No Ready Button:** Host controls game start
- **No Lie Generation:** Use pre-defined bluff suggestions
- **Device Identity:** No user accounts needed

### Patterns
- **Query Param Auth:** WebSocket authentication via deviceId
- **Room Pub/Sub:** Broadcast to room participants only
- **Single Source:** MongoDB is single source of truth

---

**Repository:** git@github.com:nattapong-c/sounds-fishy.git  
**Last Updated:** March 2026
