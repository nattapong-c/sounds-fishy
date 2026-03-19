# Phase 1: Frontend - Core Room Infrastructure

**Status:** ⏳ Not Started  
**Created:** 2026-03-19  
**Target:** 2026-03-20  
**Total Tasks:** 9

## Overview

Set up the frontend foundation for room management including home page, room creation, joining rooms, and real-time updates via WebSocket. This creates a stable UI foundation before implementing gameplay features.

**Key Features:**
- Home page with create/join room
- Room lobby with player list
- DeviceId-based identity
- WebSocket real-time updates
- Responsive mobile-first design

## Tasks

### Completed ✅
- None yet

### In Progress 🔄
- None yet

### Pending ⏳

#### T1. Set up Next.js Project
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 30 minutes
- **Files:** `app/package.json`, `app/tsconfig.json`, `app/next.config.mjs`
- **Description:** Initialize Next.js 16 project with App Router, configure for React 19
- **Acceptance Criteria:**
  - ✅ Next.js 16 installed
  - ✅ App Router configured
  - ✅ TypeScript configured
  - ✅ Bun runtime compatible
  - ✅ Dev server starts successfully

#### T2. Set up TailwindCSS v4
- **Dependencies:** T1
- **Agent:** frontend-nextjs-expert
- **Estimated:** 30 minutes
- **Files:** `app/tailwind.config.ts`, `app/src/app/globals.css`, `app/postcss.config.js`
- **Description:** Configure TailwindCSS v4 with ocean theme colors
- **Acceptance Criteria:**
  - ✅ TailwindCSS v4 installed
  - ✅ Ocean color palette configured (50-700)
  - ✅ Global styles set up
  - ✅ Utility classes working

#### T3. Create API Client
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 30 minutes
- **Files:** `app/src/lib/api.ts`, `app/.env.local`
- **Description:** Axios API client with base configuration
- **Acceptance Criteria:**
  - ✅ Axios instance created
  - ✅ Base URL from environment
  - ✅ Request/response interceptors (optional)
  - ✅ TypeScript types for responses

#### T4. Create Room API Service
- **Dependencies:** T3
- **Agent:** frontend-nextjs-expert
- **Estimated:** 45 minutes
- **Files:** `app/src/services/api.ts`
- **Description:** Room API methods (create, join, leave, ready)
- **Acceptance Criteria:**
  - ✅ createRoom() method
  - ✅ getRoom() method
  - ✅ joinRoom() method
  - ✅ leaveRoom() method
  - ✅ toggleReady() method
  - ✅ All methods return typed responses

#### T5. Create useDeviceId Hook
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 30 minutes
- **Files:** `app/src/hooks/useDeviceId.ts`
- **Description:** Persistent device identity via localStorage
- **Acceptance Criteria:**
  - ✅ Generates UUID on first visit
  - ✅ Stores in localStorage
  - ✅ Returns same deviceId on subsequent visits
  - ✅ Survives page refresh

#### T6. Create useSocket Hook
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 1.5 hours
- **Files:** `app/src/hooks/useSocket.ts`
- **Description:** WebSocket connection management with reconnection
- **Acceptance Criteria:**
  - ✅ Connects to WebSocket with deviceId in query params
  - ✅ Exponential backoff reconnection (1s, 2s, 4s, 8s, 10s)
  - ✅ Max 5 reconnection attempts
  - ✅ Subscribe/unsubscribe to events
  - ✅ Send messages
  - ✅ Connection state tracking
  - ✅ Clean up on unmount

#### T7. Create useRoom Hook
- **Dependencies:** T4, T6
- **Agent:** frontend-nextjs-expert
- **Estimated:** 1 hour
- **Files:** `app/src/hooks/useRoom.ts`
- **Description:** Room state management with WebSocket integration
- **Acceptance Criteria:**
  - ✅ Fetches initial room data
  - ✅ Subscribes to room_updated events
  - ✅ Subscribes to player_joined/left events
  - ✅ Subscribes to player_disconnected/reconnected events
  - ✅ joinRoom() via WebSocket
  - ✅ leaveRoom() via WebSocket
  - ✅ toggleReady() via WebSocket
  - ✅ Updates room state on events

#### T8. Create UI Components
- **Dependencies:** T2
- **Agent:** frontend-nextjs-expert
- **Estimated:** 2 hours
- **Files:** 
  - `app/src/components/ui/Button.tsx`
  - `app/src/components/ui/Input.tsx`
  - `app/src/components/ui/Card.tsx`
  - `app/src/components/ui/Toast.tsx`
  - `app/src/components/players/PlayerList.tsx`
  - `app/src/components/players/PlayerCard.tsx`
- **Description:** Reusable UI components with TailwindCSS
- **Acceptance Criteria:**
  - ✅ Button - primary, secondary, ghost variants, loading state
  - ✅ Input - with label, error state
  - ✅ Card - with shadow, rounded corners
  - ✅ Toast - success, error, info variants
  - ✅ PlayerList - shows list of players
  - ✅ PlayerCard - shows player info with ready status
  - ✅ All components responsive
  - ✅ All components accessible

#### T9. Create Pages
- **Dependencies:** T5, T7, T8
- **Agent:** frontend-nextjs-expert
- **Estimated:** 2 hours
- **Files:** 
  - `app/src/app/page.tsx` (Home)
  - `app/src/app/room/[roomCode]/page.tsx` (Lobby)
- **Description:** Main pages for room flow
- **Acceptance Criteria:**
  - ✅ Home page - create room form, join room form
  - ✅ Lobby page - player list, ready button, leave button
  - ✅ Both pages use deviceId for identity
  - ✅ Both pages responsive on mobile
  - ✅ Proper loading states
  - ✅ Proper error states
  - ✅ Navigation works correctly

## Progress

- **Completed:** 0/9 (0%)
- **Last Updated:** 2026-03-19

## Dependencies

```
T1 → T2 → T8 → T9
      ↓
T3 → T4 → T7 → T9
      ↓
      T5 ──→ T7
      ↓
      T6 ──→ T7
```

## Notes

- Follow patterns from Outsider project (see `reports/outsider-study.md`)
- Use deviceId for player identity (see `DEVICE_IDENTITY_PATTERN.md`)
- Mobile-first responsive design
- Modern & Minimal theme with ocean colors
- Client components for all interactive features ('use client')
- No auto-commit - wait for user instruction

## Testing Checklist

- [ ] Home page loads
- [ ] Create room works
- [ ] Join room works
- [ ] DeviceId persists across refresh
- [ ] WebSocket connects successfully
- [ ] Player list updates in real-time
- [ ] Ready button works
- [ ] Leave room works
- [ ] Mobile responsive
- [ ] Error states display correctly

## Integration Points

**Backend Dependencies:**
- POST /api/rooms (T4 Backend)
- GET /api/rooms/:code (T4 Backend)
- POST /api/rooms/:code/join (T4 Backend)
- WebSocket /ws (T5 Backend)

**Must complete backend T4 and T5 before frontend T9 can be fully tested**
