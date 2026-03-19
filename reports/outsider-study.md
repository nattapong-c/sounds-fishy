# Outsider Project Study - Comprehensive Analysis

**Date:** March 19, 2026  
**Purpose:** Analyze the Outsider project architecture and patterns to inform Sounds Fishy implementation  
**Repository:** `git@github.com:nattapong-c/outsider.git` (inferred from workspace)

---

## Table of Contents

1. [Project Structure Overview](#1-project-structure-overview)
2. [Room Creation Flow](#2-room-creation-flow)
3. [Join Room Flow](#3-join-room-flow)
4. [WebSocket Connection Handling](#4-websocket-connection-handling)
5. [Player Connection Management](#5-player-connection-management)
6. [App Structure](#6-app-structure)
7. [Service Structure](#7-service-structure)
8. [Key Takeaways & Patterns to Adopt](#8-key-takeaways--patterns-to-adopt)
9. [Recommendations for Sounds Fishy](#9-recommendations-for-sounds-fishy)

---

## 1. Project Structure Overview

### High-Level Architecture

```
outsider/
├── app/                          # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── [roomId]/         # Dynamic room route
│   │   │   │   └── page.tsx      # Main game room page
│   │   │   ├── globals.css       # Global styles (Pixel Art theme)
│   │   │   ├── layout.tsx        # Root layout
│   │   │   └── page.tsx          # Home page (create/join room)
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useDeviceId.ts    # Persistent identity via localStorage
│   │   ├── lib/                  # Utilities
│   │   │   └── api.ts            # Axios API client
│   │   └── components/           # (Empty - all components in page.tsx)
│   ├── .env.example              # Environment template
│   ├── .env.local                # Local environment
│   ├── next.config.ts            # Next.js configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tailwind.config.ts        # TailwindCSS configuration
│   └── package.json
│
├── service/                      # Backend (ElysiaJS)
│   ├── src/
│   │   ├── controllers/          # Route & WebSocket handlers
│   │   │   ├── room-controller.ts    # REST endpoints
│   │   │   ├── ws-controller.ts      # WebSocket handlers
│   │   │   └── word-controller.ts    # Word bank API
│   │   ├── models/               # MongoDB schemas
│   │   │   ├── room.ts           # Room & player schema
│   │   │   └── word.ts           # Word bank schema
│   │   ├── services/             # Business logic
│   │   │   └── word-service.ts   # Word selection logic
│   │   ├── lib/                  # Utilities
│   │   │   ├── db.ts             # MongoDB connection
│   │   │   ├── logger.ts         # Pino logger
│   │   │   └── seed-words.ts     # Initial word seeding
│   │   └── index.ts              # Elysia entry point
│   ├── .env                      # Environment variables
│   ├── tsconfig.json             # TypeScript configuration
│   └── package.json
│
├── BACKEND.md                    # Backend documentation
├── FRONTEND.md                   # Frontend documentation
├── DEPLOYMENT.md                 # Deployment guide
├── GEMINI.md                     # Main project overview
└── QWEN.md                       # Project context & quick reference
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Bun | JavaScript runtime for both frontend and backend |
| Frontend | Next.js 16 (App Router) + React 19 | UI framework |
| Frontend Styling | TailwindCSS v4 | Utility-first CSS |
| Backend | ElysiaJS | Fast, TypeScript-first web framework |
| Database | MongoDB (Mongoose ODM) | Persistent storage |
| Real-time | ElysiaJS WebSocket (built-in) | Pub/Sub communication |
| Type Safety | @elysiajs/eden (Eden Treaty) | End-to-end type inference |
| Logging | Pino | Structured logging |
| Hosting | Vercel (frontend) + Render (backend) | Deployment platforms |

### Key Configuration Files

**Backend Environment** (`service/.env`):
```bash
MONGO_URI=mongodb+srv://<credentials>@cluster.mongodb.net/outsider
PORT=3001
CORS_ORIGIN=http://localhost:4444
```

**Frontend Environment** (`app/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

**Backend Entry Point** (`service/src/index.ts`):
```typescript
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { connectDB } from "./lib/db";
import { roomRoutes } from "./controllers/room-controller";
import { wsRoutes } from "./controllers/ws-controller";
import { wordRoutes } from "./controllers/word-controller";

// Initialize Database connection
connectDB();

const app = new Elysia()
  .use(swagger())
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:4444",
      credentials: true,
    }),
  )
  .use(wordRoutes)
  .use(roomRoutes)
  .use(wsRoutes)
  .get("/", () => "Outsider API is running")
  .listen(process.env.PORT || 3001);

export type AppRouter = typeof app;
```

---

## 2. Room Creation Flow

### API Endpoint

**Location:** `/service/src/controllers/room-controller.ts`

```typescript
.post('/', async () => {
    const roomId = crypto.randomUUID().substring(0, 6).toUpperCase();

    const newRoom = new RoomModel({
        roomId,
        status: 'lobby',
        secretWord: '',
        timerConfig: { 
            quiz: 180, 
            discussion: 180, 
            votingMode: 'manual',
            difficulty: 'medium',
            language: 'english'
        },
        phaseEndTime: null,
        players: []
    });

    await newRoom.save();
    logger.info({ roomId }, 'New room created');

    return { roomId };
}, {
    response: t.Object({ roomId: t.String() })
})
```

### Frontend Implementation

**Location:** `/app/src/app/page.tsx`

```typescript
const handleCreateRoom = async () => {
    setIsLoading(true);
    setError(null);

    try {
        const response = await api.rooms.create();
        const responseData = response.data || response;
        const roomId = responseData.roomId;

        if (roomId) {
            window.location.href = `/${roomId}`;
        } else {
            setError('Failed to create room: No room ID returned');
            setIsLoading(false);
        }
    } catch (error: any) {
        setError(`Failed to create room: ${error.response?.data || error.message}`);
        setIsLoading(false);
    }
};
```

### API Client

**Location:** `/app/src/lib/api.ts`

```typescript
export const api = {
  rooms: {
    create: async () => {
      const response = await apiClient.post('/rooms');
      return response.data;
    },
    // ... other methods
  },
};
```

### Key Patterns

1. **Short Room IDs:** Uses first 6 characters of UUID, uppercase for readability
2. **Default Configuration:** Room created with sensible defaults (timer config, status)
3. **Immediate Persistence:** Room saved to MongoDB before returning
4. **Logging:** Structured logging with context (roomId)
5. **Type-Safe Response:** Elysia `t.Object` schema for validation

### Flow Diagram

```
┌─────────────┐      POST /rooms      ┌─────────────┐
│   Frontend  │ ─────────────────────>│   Backend   │
│             │                       │             │
│  [Create]   │                       │  Generate   │
│   Button    │                       │  Room ID    │
│             │                       │             │
│             │                       │  Create     │
│             │                       │  MongoDB    │
│             │                       │  Document   │
│             │                       │             │
│             │  { roomId: "ABC123" } │             │
│  <──────────────────────────────────│             │
│             │                       │             │
│  Navigate   │                       │             │
│  /ABC123    │                       │             │
└─────────────┘                       └─────────────┘
```

---

## 3. Join Room Flow

### REST API - Join Endpoint

**Location:** `/service/src/controllers/room-controller.ts`

```typescript
.post('/:roomId/join', async ({ params: { roomId }, body, set }) => {
    const { name, deviceId } = body;
    const room = await RoomModel.findOne({ roomId });

    if (!room) {
        logger.warn({ roomId, deviceId }, 'Failed to join: Room not found');
        set.status = 404;
        return 'Room not found';
    }

    // Reconnection logic
    const existingPlayer = room.players.find(p => p.deviceId === deviceId);

    if (existingPlayer) {
        existingPlayer.isOnline = true;
        if (name) existingPlayer.name = name;
        await room.save();
        logger.info({ roomId, deviceId, name: existingPlayer.name }, 'Player reconnected');
        return { room: room.toJSON() };
    }

    // Room full check
    if (room.players.length >= 8) {
        logger.warn({ roomId, deviceId }, 'Failed to join: Room is full');
        set.status = 400;
        return 'Room is full';
    }

    // Create new player
    const newPlayer: PlayerType = {
        id: crypto.randomUUID(),
        name,
        deviceId,
        isAdmin: room.players.length === 0, // First player is admin
        isOnline: true,
        inGameRole: null
    };

    room.players.push(newPlayer);
    await room.save();
    logger.info({ roomId, deviceId, name, isAdmin: newPlayer.isAdmin }, 'Player joined');

    return { room: room.toJSON() };
}, {
    params: t.Object({ roomId: t.String() }),
    body: t.Object({ name: t.String(), deviceId: t.String() }),
    response: {
        200: t.Object({ room: RoomSchema }),
        400: t.String(),
        404: t.String()
    }
})
```

### Frontend Join Implementation

**Location:** `/app/src/app/[roomId]/page.tsx`

```typescript
const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !deviceId) return;

    try {
        const response = await api.rooms.join(roomId, nickname, deviceId);
        const responseData = response.data || response;
        const roomData = responseData.room;
        
        if (!roomData) {
            throw new Error('No room data in response');
        }
        
        setRoomState(roomData);
        setHasJoined(true);
        connectWebSocket(); // Establish WS connection after REST join
    } catch (err: any) {
        setError(`Failed to join room: ${err.response?.data || err.message}`);
    }
};
```

### Device ID Hook

**Location:** `/app/src/hooks/useDeviceId.ts`

```typescript
import { useState, useEffect } from 'react';

export const useDeviceId = () => {
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        let id = localStorage.getItem('deviceId');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('deviceId', id);
        }
        setDeviceId(id);
    }, []);

    return deviceId;
};
```

### Authentication/Authorization Pattern

1. **No User Accounts:** Uses `deviceId` stored in localStorage for persistent identity
2. **Query Parameter Auth:** WebSocket uses `deviceId` in query params for authentication
3. **Admin System:** First player to join becomes admin (can kick, start game, configure)
4. **Reconnection:** Same deviceId = same player (preserves role, admin status)

### Frontend Navigation Flow

```typescript
// Home page → Room page
router.push(`/${joinRoomId.trim().toUpperCase()}`);

// Room page validates and shows join form
const { roomId } = useParams() as { roomId: string };
const deviceId = useDeviceId();

// After successful join, WebSocket connects automatically
```

### Flow Diagram

```
┌─────────────┐                         ┌─────────────┐
│   Browser   │                         │   Backend   │
│             │                         │             │
│  Generate   │                         │             │
│  deviceId   │                         │             │
│  (localStorage)                       │             │
│             │                         │             │
│  Enter      │                         │             │
│  Nickname   │                         │             │
│             │                         │             │
│             │ POST /rooms/:id/join    │             │
│             │ { name, deviceId }      │             │
│             │ ───────────────────────>│             │
│             │                         │             │
│             │                         │ Find Room   │
│             │                         │ Check       │
│             │                         │ Reconnect?  │
│             │                         │             │
│             │                         │ Create      │
│             │                         │ Player Doc  │
│             │                         │             │
│             │  { room: {...} }        │             │
│             │ <────────────────────── │             │
│             │                         │             │
│  Store      │                         │             │
│  Room State │                         │             │
│             │                         │             │
│             │ WS Connect              │             │
│             │ ?deviceId=xxx           │             │
│             │ ───────────────────────>│             │
│             │                         │             │
└─────────────┘                         └─────────────┘
```

---

## 4. WebSocket Connection Handling

### WebSocket Server Setup

**Location:** `/service/src/controllers/ws-controller.ts`

```typescript
import { Elysia, t } from 'elysia';
import { RoomModel } from '../models/room';
import { logger } from '../lib/logger';

const activeTimers = new Map<string, { quizTimeout?: NodeJS.Timeout; discussionTimeout?: NodeJS.Timeout }>();

export const wsRoutes = new Elysia({ prefix: '/ws/rooms' })
    .ws('/:roomId', {
        // Validation schema
        query: t.Object({ deviceId: t.String() }),
        body: t.Any(),
        
        // Connection opened
        async open(ws) {
            const { roomId } = ws.data.params;
            const { deviceId } = ws.data.query;

            // Subscribe to room pub/sub channel
            ws.subscribe(`room:${roomId}`);
            logger.info({ roomId, deviceId }, 'WebSocket connected');

            // Update player online status
            const room = await RoomModel.findOne({ roomId });
            if (room) {
                const player = room.players.find(p => p.deviceId === deviceId);
                if (player) {
                    player.isOnline = true;
                    await room.save();

                    // Send initial state
                    const updatePayload = JSON.stringify({ 
                        type: 'room_state_update', 
                        room: room.toJSON() 
                    });
                    ws.publish(`room:${roomId}`, updatePayload);
                    ws.send(updatePayload);
                }
            }
        },
        
        // Message received
        async message(ws, message: any) {
            const { roomId } = ws.data.params;
            const { deviceId } = ws.data.query;

            // Parse message
            let parsedMessage = message;
            if (typeof message === 'string') {
                try {
                    parsedMessage = JSON.parse(message);
                } catch(e) { return; }
            }

            // Validate room and player exist
            const room = await RoomModel.findOne({ roomId });
            if (!room) return;

            const player = room.players.find(p => p.deviceId === deviceId);
            if (!player) return;

            // Handle message types based on role/permissions
            if (player.isAdmin) {
                // Admin actions...
            }
            
            if (player.inGameRole === 'host') {
                // Host actions...
            }
            
            // Player actions...
        },
        
        // Connection closed
        async close(ws) {
            const { roomId } = ws.data.params;
            const { deviceId } = ws.data.query;

            logger.info({ roomId, deviceId }, 'WebSocket disconnected');

            // Set player offline but don't remove
            const room = await RoomModel.findOne({ roomId });
            if (room) {
                const player = room.players.find(p => p.deviceId === deviceId);
                if (player) {
                    player.isOnline = false;
                    await room.save();
                }
                // Broadcast state update
                ws.publish(`room:${roomId}`, JSON.stringify({ 
                    type: 'room_state_update', 
                    room: room.toJSON() 
                }));
            }
        }
    });
```

### Connection Authentication Pattern

**Query Parameter Authentication:**
```typescript
// Connection URL format
ws://localhost:3001/ws/rooms/:roomId?deviceId=:deviceId

// Validation schema ensures deviceId is present
query: t.Object({ deviceId: t.String() })
```

### Connection Lifecycle

1. **Open:**
   - Subscribe to room pub/sub channel (`room:${roomId}`)
   - Validate player exists in room
   - Set `isOnline = true`
   - Send initial room state

2. **Message:**
   - Parse JSON message
   - Validate room and player exist
   - Check permissions (admin, host, player)
   - Execute action and broadcast results

3. **Close:**
   - Set `isOnline = false` (player persists for reconnection)
   - Broadcast state update to room

### Reconnection Strategy

**Frontend Implementation:**
```typescript
const connectWebSocket = () => {
    if (!deviceId) return;
    
    // Auto-detect protocol based on current page
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    
    if (!wsUrl) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}`;
    }

    const ws = new WebSocket(`${wsUrl}/ws/rooms/${roomId}?deviceId=${deviceId}`);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        wsRef.current = ws;
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Handle different message types
        switch(data.type) {
            case 'room_state_update':
                setRoomState(data.room);
                break;
            case 'game_started':
                setRoomState(data.room);
                break;
            // ... other types
        }
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
        // Auto-reconnect after delay
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
};
```

### WebSocket Event Types

**Client → Server:**
| Event | Payload | Permissions | Description |
|-------|---------|-------------|-------------|
| `start_game` | `{ hostPlayerId, difficulty, language }` | Admin | Start game with selected host |
| `kick_player` | `{ targetPlayerId }` | Admin | Remove player from room |
| `end_round` | `{}` | Admin | Reset game to lobby |
| `update_timer_config` | `{ config }` | Admin | Update timer settings |
| `trigger_showdown` | `{ wordGuessed }` | Host | Start showdown phase |
| `start_voting` | `{}` | Host | Manually start voting |
| `reveal_roles` | `{}` | Host | End game, show results |
| `submit_vote` | `{ targetId }` | Player | Vote for suspected insider |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `room_state_update` | `{ room }` | General state broadcast |
| `game_started` | `{ room }` | Game begins, roles assigned |
| `voting_started` | `{ room }` | Voting phase begins |
| `vote_tallied` | `{ voteCount, eligibleVoters, room }` | Vote count update |
| `roles_revealed` | `{ room, votes, result }` | Game over, results |

### Pub/Sub Pattern

```typescript
// Subscribe to room channel
ws.subscribe(`room:${roomId}`);

// Broadcast to all players in room
ws.publish(`room:${roomId}`, JSON.stringify(payload));

// Send to specific client only
ws.send(JSON.stringify(payload));
```

---

## 5. Player Connection Management

### Player State Schema

**Location:** `/service/src/models/room.ts`

```typescript
export const PlayerSchema = t.Object({
    id: t.String(),                    // Unique player ID (UUID)
    name: t.String(),                  // Display name
    deviceId: t.String(),              // Persistent identity
    isAdmin: t.Boolean(),              // Admin privileges
    isOnline: t.Boolean(),             // Currently connected
    inGameRole: t.Union([
        t.Literal('host'),
        t.Literal('insider'),
        t.Literal('common'),
        t.Null()
    ])
});
```

### Connection Tracking

**Online/Offline States:**
```typescript
// On WebSocket open
player.isOnline = true;
await room.save();

// On WebSocket close
player.isOnline = false;
await room.save();
ws.publish(`room:${roomId}`, JSON.stringify({ 
    type: 'room_state_update', 
    room: room.toJSON() 
}));
```

### Reconnection Handling

**Reconnection Logic (REST Join):**
```typescript
const existingPlayer = room.players.find(p => p.deviceId === deviceId);

if (existingPlayer) {
    // Reconnecting player
    existingPlayer.isOnline = true;
    if (name) existingPlayer.name = name; // Update name if changed
    await room.save();
    logger.info({ roomId, deviceId }, 'Player reconnected');
    return { room: room.toJSON() };
}
```

**Reconnection in WebSocket:**
```typescript
async open(ws) {
    const { roomId, deviceId } = /* extract from ws */;
    
    const room = await RoomModel.findOne({ roomId });
    if (room) {
        const player = room.players.find(p => p.deviceId === deviceId);
        if (player) {
            player.isOnline = true;
            await room.save();
            
            // Send current state to catch up
            ws.send(JSON.stringify({ 
                type: 'room_state_update', 
                room: room.toJSON() 
            }));
        }
    }
}
```

### Cleanup on Disconnect

**What Persists:**
- Player document remains in room's players array
- Player role (`inGameRole`) preserved
- Admin status preserved
- Name preserved

**What Changes:**
- `isOnline` flag set to `false`
- Other players see offline status

**Room Cleanup:**
```typescript
// When player explicitly leaves
.post('/:roomId/leave', async ({ params: { roomId }, body, set }) => {
    const { deviceId } = body;
    const room = await RoomModel.findOne({ roomId });

    if (!room) {
        set.status = 404;
        return 'Room not found';
    }

    room.players = room.players.filter(p => p.deviceId !== deviceId);

    if (room.players.length === 0) {
        // Delete empty room
        await RoomModel.deleteOne({ roomId });
        logger.info({ roomId }, 'Room deleted - all players left');
    } else {
        // Reassign admin if needed
        if (!room.players.some(p => p.isAdmin)) {
            room.players[0].isAdmin = true;
            logger.info({ roomId }, 'Admin reassigned');
        }
        await room.save();
    }

    return { success: true };
})
```

**Automatic Room Expiration:**
```typescript
// MongoDB TTL index in room schema
roomMongooseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 }); // 12 hours
```

### Player State Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Player Document                      │
├─────────────────────────────────────────────────────────┤
│  id: "uuid"                                             │
│  name: "Alice"                                          │
│  deviceId: "persistent-uuid"  ← Key for reconnection    │
│  isAdmin: true                                          │
│  isOnline: false  ← Toggles on WS connect/disconnect   │
│  inGameRole: "host"  ← Persists across reconnections   │
└─────────────────────────────────────────────────────────┘

State Transitions:
┌──────────┐    WS Connect    ┌──────────┐
│ Offline  │ ────────────────>│  Online  │
│          │                  │          │
│          │ <────────────────│          │
│          │  WS Disconnect   │          │
└──────────┘                  └──────────┘
     ↑                            │
     │                            │
     │      Explicit Leave        │
     └────────────────────────────┘
           (Removed from room)
```

---

## 6. App Structure

### Frontend: Next.js App Router

**Directory Structure:**
```
app/src/
├── app/                          # Next.js App Router
│   ├── [roomId]/                 # Dynamic route for rooms
│   │   └── page.tsx              # Main game room component
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page (create/join)
├── hooks/                        # Custom React hooks
│   └── useDeviceId.ts            # Persistent identity
├── lib/                          # Utilities
│   └── api.ts                    # Axios API client
└── components/                   # (Empty - components inline)
```

### Room Page Architecture

**Key State Variables:**
```typescript
const [nickname, setNickname] = useState('');
const [hasJoined, setHasJoined] = useState(false);
const [roomState, setRoomState] = useState<any>(null);
const [error, setError] = useState<string | null>(null);
const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
const [localTimerConfig, setLocalTimerConfig] = useState({ 
    quiz: 180, 
    discussion: 180, 
    votingModeAuto: false 
});
const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'thai'>('english');
const [isWordVisible, setIsWordVisible] = useState(false);
const [isRoleHidden, setIsRoleHidden] = useState(true);
const [copied, setCopied] = useState(false);
const wsRef = useRef<WebSocket | null>(null);
```

### Custom Hooks

**useDeviceId:**
```typescript
export const useDeviceId = () => {
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        let id = localStorage.getItem('deviceId');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('deviceId', id);
        }
        setDeviceId(id);
    }, []);

    return deviceId;
};
```

**useCountdown:**
```typescript
const useCountdown = (endTime: number | null) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!endTime) {
            setTimeLeft(null);
            return;
        }

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) clearInterval(interval);
        }, 1000);

        setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));

        return () => clearInterval(interval);
    }, [endTime]);

    return timeLeft;
};
```

### Backend: ElysiaJS Service

**Directory Structure:**
```
service/src/
├── controllers/                  # Route handlers
│   ├── room-controller.ts        # REST: create, join, leave
│   ├── ws-controller.ts          # WebSocket: game logic
│   └── word-controller.ts        # REST: word bank
├── models/                       # MongoDB schemas
│   ├── room.ts                   # Room & player schema
│   └── word.ts                   # Word bank schema
├── services/                     # Business logic
│   └── word-service.ts           # Word selection
├── lib/                          # Utilities
│   ├── db.ts                     # MongoDB connection
│   ├── logger.ts                 # Pino logger
│   └── seed-words.ts             # Initial data seeding
└── index.ts                      # Entry point
```

### Shared Types and Utilities

**Elysia Validation Schemas (Backend):**
```typescript
export const RoomSchema = t.Object({
    roomId: t.String(),
    status: t.Union([
        t.Literal('lobby'),
        t.Literal('playing'),
        t.Literal('showdown_discussion'),
        t.Literal('showdown_voting'),
        t.Literal('completed')
    ]),
    secretWord: t.String(),
    timerConfig: TimerConfigSchema,
    phaseEndTime: t.Union([t.Number(), t.Null()]),
    players: t.Array(PlayerSchema),
    votes: t.Array(VoteSchema),
    gameResult: t.Union([GameResultSchema, t.Null()]),
    wordWasGuessed: t.Optional(t.Boolean())
});

export type RoomType = typeof RoomSchema.static;
```

**Mongoose Schemas (Backend):**
```typescript
const roomMongooseSchema = new Schema<RoomType>({
    roomId: { type: String, required: true, unique: true, index: true },
    status: {
        type: String,
        enum: ['lobby', 'playing', 'showdown_discussion', 'showdown_voting', 'completed'],
        required: true,
        default: 'lobby'
    },
    // ... other fields
}, { timestamps: true });

// TTL Index - Auto-delete after 12 hours
roomMongooseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 });
```

---

## 7. Service Structure

### Backend Services Layer

**Word Service** (`/service/src/services/word-service.ts`):
```typescript
import { WordModel } from '../models/word';

export async function getRandomWord(
    difficulty: 'easy' | 'medium' | 'hard',
    language: 'english' | 'thai' = 'english'
): Promise<string> {
    const words = await WordModel.find({ difficulty, language }).lean();
    
    if (words.length === 0) {
        // Fallback logic
        const fallbackLang = language === 'english' ? 'thai' : 'english';
        const fallbackWords = await WordModel.find({ difficulty, language: fallbackLang }).lean();
        
        if (fallbackWords.length === 0) {
            const mediumWords = await WordModel.find({ difficulty: 'medium', language }).lean();
            return mediumWords[Math.floor(Math.random() * mediumWords.length)].word;
        }
        return fallbackWords[Math.floor(Math.random() * fallbackWords.length)].word;
    }
    
    return words[Math.floor(Math.random() * words.length)].word;
}

export async function addWord(
    word: string,
    difficulty: 'easy' | 'medium' | 'hard',
    language: 'english' | 'thai' = 'english',
    category?: string,
    createdBy?: string
) {
    const exists = await WordModel.findOne({ 
        word: language === 'thai' ? word : { $regex: new RegExp(`^${word}$`, 'i') },
        language
    });
    
    if (exists) {
        throw new Error('Word already exists in bank');
    }
    
    const newWord = new WordModel({
        word: word.trim(),
        difficulty,
        language,
        wordType: 'noun',
        category,
        createdBy,
        createdAt: new Date()
    });
    
    await newWord.save();
    return newWord;
}

// ... other functions: getAllWords, deleteWord, getWordStats
```

### Frontend Services/API Clients

**API Client** (`/app/src/lib/api.ts`):
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  // Add auth token here if needed
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('API Error: No response received');
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const api = {
  rooms: {
    create: async () => {
      const response = await apiClient.post('/rooms');
      return response.data;
    },
    get: async (roomId: string) => {
      const response = await apiClient.get(`/rooms/${roomId}`);
      return response.data;
    },
    join: async (roomId: string, name: string, deviceId: string) => {
      const response = await apiClient.post(`/rooms/${roomId}/join`, {
        name,
        deviceId,
      });
      return response.data;
    },
    leave: async (roomId: string, deviceId: string) => {
      const response = await apiClient.post(`/rooms/${roomId}/leave`, {
        deviceId,
      });
      return response.data;
    },
  },
  words: {
    getRandom: async (difficulty?: string, language?: string) => {
      const params: Record<string, string> = {};
      if (difficulty) params.difficulty = difficulty;
      if (language) params.language = language;
      const response = await apiClient.get('/api/words/random', { params });
      return response.data;
    },
    // ... other word methods
  },
};
```

### Database Models and Schemas

**Room Model** (complete):
```typescript
import mongoose, { Schema } from 'mongoose';
import { t } from 'elysia';

// Elysia schema for validation
export const PlayerSchema = t.Object({
    id: t.String(),
    name: t.String(),
    deviceId: t.String(),
    isAdmin: t.Boolean(),
    isOnline: t.Boolean(),
    inGameRole: t.Union([
        t.Literal('host'),
        t.Literal('insider'),
        t.Literal('common'),
        t.Null()
    ])
});

export const VoteSchema = t.Object({
    voterId: t.String(),
    targetId: t.String()
});

export const GameResultSchema = t.Object({
    winner: t.Union([t.Literal('commons'), t.Literal('insider')]),
    insiderIdentified: t.Boolean(),
    wordGuessed: t.Boolean()
});

export const TimerConfigSchema = t.Object({
    quiz: t.Number(),
    discussion: t.Number(),
    votingMode: t.Union([t.Literal('auto'), t.Literal('manual')]),
    difficulty: t.Union([t.Literal('easy'), t.Literal('medium'), t.Literal('hard')]),
    language: t.Union([t.Literal('english'), t.Literal('thai')])
});

export const RoomSchema = t.Object({
    roomId: t.String(),
    status: t.Union([
        t.Literal('lobby'),
        t.Literal('playing'),
        t.Literal('showdown_discussion'),
        t.Literal('showdown_voting'),
        t.Literal('completed')
    ]),
    secretWord: t.String(),
    timerConfig: TimerConfigSchema,
    phaseEndTime: t.Union([t.Number(), t.Null()]),
    players: t.Array(PlayerSchema),
    votes: t.Array(VoteSchema),
    gameResult: t.Union([GameResultSchema, t.Null()]),
    wordWasGuessed: t.Optional(t.Boolean())
});

export type RoomType = typeof RoomSchema.static;

// Mongoose schema for MongoDB
const playerMongooseSchema = new Schema<PlayerType>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    deviceId: { type: String, required: true },
    isAdmin: { type: Boolean, required: true, default: false },
    isOnline: { type: Boolean, required: true, default: true },
    inGameRole: { type: String, enum: ['host', 'insider', 'common', null], default: null }
}, { _id: false });

const voteMongooseSchema = new Schema<VoteType>({
    voterId: { type: String, required: true },
    targetId: { type: String, required: true }
}, { _id: false });

const gameResultMongooseSchema = new Schema<GameResultType>({
    winner: { type: String, enum: ['commons', 'insider'], required: true },
    insiderIdentified: { type: Boolean, required: true },
    wordGuessed: { type: Boolean, required: true }
}, { _id: false });

const timerConfigMongooseSchema = new Schema({
    quiz: { type: Number, required: true, default: 180 },
    discussion: { type: Number, required: true, default: 180 },
    votingMode: { type: String, enum: ['auto', 'manual'], required: true, default: 'manual' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, default: 'medium' },
    language: { type: String, enum: ['english', 'thai'], required: true, default: 'english' }
}, { _id: false });

const roomMongooseSchema = new Schema<RoomType>({
    roomId: { type: String, required: true, unique: true, index: true },
    status: {
        type: String,
        enum: ['lobby', 'playing', 'showdown_discussion', 'showdown_voting', 'completed'],
        required: true,
        default: 'lobby'
    },
    secretWord: { type: String, default: '' },
    timerConfig: {
        type: timerConfigMongooseSchema,
        default: () => ({ quiz: 180, discussion: 180, votingMode: 'manual' })
    },
    phaseEndTime: { type: Number, default: null },
    players: [playerMongooseSchema],
    votes: [voteMongooseSchema],
    gameResult: { type: gameResultMongooseSchema, default: null },
    wordWasGuessed: { type: Boolean, default: false }
}, { timestamps: true });

// TTL Index - Auto-delete rooms after 12 hours
roomMongooseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 });

export const RoomModel = mongoose.model<RoomType>('Room', roomMongooseSchema);
```

**Word Model:**
```typescript
import mongoose, { Schema } from 'mongoose';
import { t } from 'elysia';

export const WordSchema = t.Object({
    id: t.String(),
    word: t.String(),
    difficulty: t.Union([t.Literal('easy'), t.Literal('medium'), t.Literal('hard')]),
    language: t.Union([t.Literal('english'), t.Literal('thai')]),
    wordType: t.Literal('noun'),
    category: t.Optional(t.String()),
    createdAt: t.Date(),
    createdBy: t.Optional(t.String())
});

export type WordType = typeof WordSchema.static;

const wordSchema = new Schema<WordType>({
    word: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
    language: { type: String, enum: ['english', 'thai'], required: true, index: true, default: 'english' },
    wordType: { type: String, enum: ['noun'], required: true, default: 'noun' },
    category: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String }
});

// Compound index for efficient filtering
wordSchema.index({ difficulty: 1, language: 1, createdAt: 1 });

export const WordModel = mongoose.model<WordType>('Word', wordSchema);
```

---

## 8. Key Takeaways & Patterns to Adopt

### Architecture Patterns

#### 1. **Dual Authentication (REST + WebSocket)**
```typescript
// REST: Join room, get initial state
POST /rooms/:roomId/join
{ name, deviceId }

// WebSocket: Real-time updates
ws://localhost:3001/ws/rooms/:roomId?deviceId=:deviceId
```

**Why Adopt:** Clean separation of concerns - REST for state changes, WebSocket for real-time updates.

#### 2. **Device-Based Identity (No User Accounts)**
```typescript
// Frontend: Persistent deviceId
const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID();
localStorage.setItem('deviceId', deviceId);

// Backend: Match by deviceId for reconnection
const existingPlayer = room.players.find(p => p.deviceId === deviceId);
```

**Why Adopt:** Zero-friction onboarding, automatic reconnection, no password management.

#### 3. **MongoDB as Single Source of Truth**
```typescript
// No Redis, no in-memory state
// All game state persisted in MongoDB
const room = await RoomModel.findOne({ roomId });
room.status = 'playing';
await room.save();
```

**Why Adopt:** Simplifies architecture, ensures state survives server restarts, easier debugging.

#### 4. **Pub/Sub WebSocket Pattern**
```typescript
// Subscribe to room channel
ws.subscribe(`room:${roomId}`);

// Broadcast to all players
ws.publish(`room:${roomId}`, JSON.stringify(payload));

// Send to specific client
ws.send(JSON.stringify(payload));
```

**Why Adopt:** Efficient broadcasting, easy to add features like private messages.

#### 5. **Elysia Validation Schemas + Mongoose Schemas**
```typescript
// Elysia for API validation
export const RoomSchema = t.Object({ /* ... */ });

// Mongoose for database
const roomMongooseSchema = new Schema<RoomType>({ /* ... */ });
```

**Why Adopt:** Type safety end-to-end, validation at API boundary, clear separation of concerns.

### Code Patterns

#### 1. **Structured Logging with Pino**
```typescript
import { logger } from './lib/logger';

logger.info({ roomId, deviceId }, 'Player joined room');
logger.warn({ roomId, deviceId }, 'Failed to join: Room not found');
logger.error({ err: error }, 'Database connection error');
```

#### 2. **Active Timer Tracking**
```typescript
const activeTimers = new Map<string, { quizTimeout?: NodeJS.Timeout }>();

// Store timer reference
activeTimers.set(roomId, { quizTimeout });

// Clear on game end
const roomTimers = activeTimers.get(roomId);
if (roomTimers?.quizTimeout) clearTimeout(roomTimers.quizTimeout);
activeTimers.delete(roomId);
```

#### 3. **Admin Role Reassignment**
```typescript
if (!room.players.some(p => p.isAdmin)) {
    room.players[0].isAdmin = true;
    logger.info({ roomId }, 'Admin reassigned');
}
```

#### 4. **Graceful Reconnection**
```typescript
// On WebSocket open
player.isOnline = true;
await room.save();
ws.send(JSON.stringify({ type: 'room_state_update', room: room.toJSON() }));

// On WebSocket close
player.isOnline = false;
await room.save();
ws.publish(`room:${roomId}`, JSON.stringify({ type: 'room_state_update', room: room.toJSON() }));
```

#### 5. **Auto-Cleanup with MongoDB TTL**
```typescript
// Auto-delete rooms after 12 hours
roomMongooseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 });
```

### UI/UX Patterns

#### 1. **Pixel Art Theme (TailwindCSS)**
```typescript
// Custom Tailwind classes for retro feel
className="modern-card border-b-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
```

#### 2. **Role Hiding for Anti-Cheating**
```typescript
const [isWordVisible, setIsWordVisible] = useState(false);
const [isRoleHidden, setIsRoleHidden] = useState(true);

// Auto-hide word after 3 seconds
useEffect(() => {
    if (isWordVisible) {
        const timeout = setTimeout(() => setIsWordVisible(false), 3000);
        return () => clearTimeout(timeout);
    }
}, [isWordVisible]);
```

#### 3. **Loading States & Feedback**
```typescript
const [isLoading, setIsLoading] = useState(false);
const [copied, setCopied] = useState(false);

<button disabled={isLoading} className="modern-button">
    {isLoading ? (
        <><span className="animate-spin">⏳</span>Creating...</>
    ) : (
        <><span>🎮</span>Create Room</>
    )}
</button>
```

---

## 9. Recommendations for Sounds Fishy

### Immediate Adoptions

#### 1. **Use Same Tech Stack**
```
Frontend: Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS v4
Backend: ElysiaJS + Bun + MongoDB (Mongoose)
WebSocket: ElysiaJS built-in WebSocket (Pub/Sub)
```

**Why:** Proven working combination, excellent type safety, fast development.

#### 2. **Adopt Device-Based Identity**
```typescript
// sounds-fishy/app/src/hooks/useDeviceId.ts
export const useDeviceId = () => {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    useEffect(() => {
        let id = localStorage.getItem('deviceId');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('deviceId', id);
        }
        setDeviceId(id);
    }, []);
    return deviceId;
};
```

#### 3. **Implement Same Room Flow**
```typescript
// REST: Create room
POST /rooms → { roomId: "ABC123" }

// REST: Join room
POST /rooms/:roomId/join → { room: {...} }

// WebSocket: Real-time updates
ws://localhost:3001/ws/rooms/:roomId?deviceId=:deviceId
```

#### 4. **MongoDB Schema Design**
```typescript
// Adapt for Sounds Fishy roles
export const PlayerSchema = t.Object({
    id: t.String(),
    name: t.String(),
    deviceId: t.String(),
    isAdmin: t.Boolean(),
    isOnline: t.Boolean(),
    inGameRole: t.Union([
        t.Literal('guesser'),
        t.Literal('bigFish'),
        t.Literal('redHerring'),
        t.Null()
    ]),
    score: t.Number() // Track cumulative score
});

export const RoomSchema = t.Object({
    roomId: t.String(),
    status: t.Union([
        t.Literal('lobby'),
        t.Literal('briefing'),      // Secret info reveal
        t.Literal('pitch'),         // Verbal answers
        t.Literal('elimination'),   // Guesser eliminates
        t.Literal('round_summary'), // Scoring
        t.Literal('completed')      // Game over
    ]),
    question: t.String(),           // Current round question
    correctAnswer: t.String(),      // For Big Fish
    bluffAnswers: t.Array(t.String()), // For Red Herrings
    eliminatedPlayers: t.Array(t.String()), // Player IDs eliminated
    roundNumber: t.Number(),
    players: t.Array(PlayerSchema),
    // ... timerConfig, gameResult, etc.
});
```

### Sounds Fishy Specific Adaptations

#### 1. **Game Flow WebSocket Events**

**Client → Server:**
```typescript
// Admin actions
{ type: 'start_game' }                    // Start first round
{ type: 'end_round' }                     // Reset to lobby
{ type: 'kick_player', targetPlayerId }

// Guesser actions
{ type: 'eliminate_player', targetId }    // Eliminate a player
{ type: 'bank_points' }                   // Keep points and end round
{ type: 'continue_elimination' }          // Continue after elimination

// Red Herring actions
{ type: 'generate_more_bluffs' }          // AI generate more lies
{ type: 'ready' }                         // Ready up
```

**Server → Client:**
```typescript
{ type: 'room_state_update', room }       // General broadcast
{ type: 'game_started', room, roles }     // Roles assigned
{ type: 'elimination_result',             // Show elimination result
  eliminatedPlayerId, 
  wasBigFish, 
  pointsEarned }
{ type: 'round_ended', results }          // Round summary
{ type: 'game_ended', finalResults }      // Game over
```

#### 2. **Scoring System Implementation**

```typescript
// In ws-controller.ts message handler
if (parsedMessage.type === 'eliminate_player') {
    const targetPlayer = room.players.find(p => p.id === parsedMessage.targetId);
    const guesser = room.players.find(p => p.inGameRole === 'guesser');
    
    if (!targetPlayer || !guesser) return;
    
    const eliminationCount = room.eliminatedPlayers.length + 1;
    const pointsEarned = eliminationCount; // 1st = 1pt, 2nd = 2pts, etc.
    
    room.eliminatedPlayers.push(targetPlayer.id);
    
    if (targetPlayer.inGameRole === 'bigFish') {
        // Bust! Guesser loses all points
        // Big Fish and remaining Red Herrings get points
        room.status = 'round_summary';
        // Calculate scoring...
    } else {
        // Red Herring eliminated
        // Guesser can bank or continue
        room.status = 'elimination_choice';
    }
    
    await room.save();
    
    ws.publish(`room:${roomId}`, JSON.stringify({
        type: 'elimination_result',
        eliminatedPlayerId: targetPlayer.id,
        wasBigFish: targetPlayer.inGameRole === 'bigFish',
        pointsEarned: targetPlayer.inGameRole === 'redHerring' ? pointsEarned : 0,
        room: room.toJSON()
    }));
}
```

#### 3. **AI Integration for Word/Question Generation**

```typescript
// service/src/services/ai-service.ts
export async function generateRoundContent(
    difficulty: 'easy' | 'medium' | 'hard',
    language: 'english' | 'thai'
) {
    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [{
                role: 'user',
                content: `Generate a question and answers for a social deduction game.
                Difficulty: ${difficulty}, Language: ${language}
                Return JSON: { question, correctAnswer, bluffAnswers: string[] }`
            }]
        })
    });
    
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}
```

#### 4. **Design Theme Adaptation**

Outsider uses **Pixel Art** theme. For Sounds Fishy, adopt **Modern & Minimal with playful, funny animations**:

```typescript
// sounds-fishy/app/src/app/globals.css
@theme inline {
  --color-fish-primary: #3B82F6;
  --color-fish-secondary: #8B5CF6;
  --color-fish-accent: #10B981;
  --color-fish-danger: #EF4444;
  --color-fish-warning: #F59E0B;
  
  --font-mono: 'JetBrains Mono', monospace;
}

.modern-card {
  @apply bg-gray-900/80 backdrop-blur border border-gray-700 rounded-xl p-6;
}

.fish-animation {
  @apply animate-bounce;
  /* Add custom fish swimming animation */
}
```

### File Structure for Sounds Fishy

```
sounds-fishy/
├── app/                          # Frontend (Next.js)
│   ├── src/
│   │   ├── app/
│   │   │   ├── [roomCode]/       # Dynamic room route
│   │   │   │   └── page.tsx      # Main game page
│   │   │   ├── globals.css       # Modern & Minimal theme
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx          # Create/join room
│   │   ├── components/           # Reusable UI components
│   │   │   ├── RoomCard.tsx
│   │   │   ├── PlayerList.tsx
│   │   │   ├── EliminationPanel.tsx
│   │   │   └── RoleReveal.tsx
│   │   ├── hooks/
│   │   │   ├── useDeviceId.ts
│   │   │   ├── useWebSocket.ts
│   │   │   └── useCountdown.ts
│   │   ├── lib/
│   │   │   └── api.ts            # Axios client
│   │   ├── services/
│   │   │   └── gameService.ts    # Frontend game logic
│   │   └── types/
│   │       └── game.ts           # TypeScript types
│   └── package.json
│
├── service/                      # Backend (ElysiaJS)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── room-controller.ts
│   │   │   ├── ws-controller.ts
│   │   │   └── ai-controller.ts  # AI generation endpoints
│   │   ├── models/
│   │   │   ├── room.ts           # Adapted for Sounds Fishy
│   │   │   └── word.ts           # If using word bank
│   │   ├── services/
│   │   │   ├── gameService.ts    # Core game logic
│   │   │   ├── scoringService.ts # Scoring calculations
│   │   │   └── aiService.ts      # AI integration
│   │   ├── lib/
│   │   │   ├── db.ts
│   │   │   ├── logger.ts
│   │   │   └── ai.ts             # AI client setup
│   │   └── index.ts
│   └── package.json
│
├── AGENTS.md                     # Project guidelines
└── README.md
```

### Implementation Priority

1. **Phase 1: Core Infrastructure**
   - Set up Next.js + ElysiaJS project structure
   - Implement room creation/joining (REST)
   - Implement WebSocket connection with deviceId auth
   - Create MongoDB schemas for Sounds Fishy

2. **Phase 2: Game Loop**
   - Implement role assignment (Guesser, Big Fish, Red Herrings)
   - AI integration for question/answer generation
   - Implement elimination flow
   - Scoring system

3. **Phase 3: Polish**
   - Modern & Minimal UI theme
   - Playful animations
   - Timer management
   - Reconnection handling
   - Deployment (Vercel + Render)

### Key Differences from Outsider

| Aspect | Outsider | Sounds Fishy |
|--------|----------|--------------|
| **Roles** | Host, Insider, Common | Guesser, Big Fish, Red Herrings |
| **Game Flow** | Quiz → Showdown → Voting | Briefing → Pitch → Elimination → Scoring |
| **Scoring** | Win/Loss based on identification | Point-based with risk/reward |
| **AI Usage** | Word selection only | Question + answer generation |
| **Theme** | Pixel Art | Modern & Minimal |
| **Interaction** | Yes/No questions | Verbal answers + elimination |

---

## Appendix: Quick Reference

### Environment Variables

**Backend:**
```bash
MONGO_URI=mongodb+srv://<credentials>@cluster.mongodb.net/sounds-fishy
PORT=3001
CORS_ORIGIN=http://localhost:4444
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

**Frontend:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Development Commands

```bash
# Backend
cd service
bun run dev          # Start on port 3001

# Frontend
cd app
bun run dev          # Start on port 4444
```

### Key Dependencies

**Backend:**
```json
{
  "elysia": "latest",
  "@elysiajs/cors": "^1.4.1",
  "@elysiajs/swagger": "^1.3.1",
  "mongoose": "^9.2.4",
  "pino": "^10.3.1",
  "pino-pretty": "^13.1.3"
}
```

**Frontend:**
```json
{
  "next": "16.1.6",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "axios": "^1.13.6",
  "tailwindcss": "^4"
}
```

---

**Document Version:** 1.0  
**Last Updated:** March 19, 2026  
**Author:** AI Research Agent
