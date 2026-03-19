# Sounds Fishy - Implementation Plan

**Based on:** Outsider Project Architecture Study  
**Date:** March 19, 2026  
**Repository:** `git@github.com:nattapong-c/sounds-fishy.git`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Core Flows](#4-core-flows)
5. [Implementation Phases](#5-implementation-phases)
6. [File-by-File Implementation Guide](#6-file-by-file-implementation-guide)

---

## 1. Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Sounds Fishy Architecture               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (Next.js)          Backend (ElysiaJS)             │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │   React 19       │        │   Bun Runtime    │          │
│  │   Next.js 16     │◄──────►│   ElysiaJS       │          │
│  │   TailwindCSS v4 │  REST  │   WebSocket      │          │
│  └──────────────────┘  WS    └──────────────────┘          │
│         │                          │                        │
│         │                          │                        │
│         └──────────┬───────────────┘                        │
│                    │                                        │
│                    ▼                                        │
│          ┌─────────────────┐                                │
│          │   MongoDB       │                                │
│          │   (Single Source│                                │
│          │    of Truth)    │                                │
│          └─────────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles (from Outsider)

1. **MongoDB as Single Source of Truth** - No Redis, no in-memory state
2. **Query Parameter Authentication** - Simple WebSocket auth via `?deviceId=xxx`
3. **Pub/Sub Pattern** - Room-based broadcasting
4. **Device-Based Identity** - localStorage for player persistence (deviceId survives refresh/restart)
5. **Dual Schema Approach** - Elysia for validation, Mongoose for persistence

---

## 2. Technology Stack

| Layer | Technology | Purpose | Notes |
|-------|------------|---------|-------|
| **Runtime** | Bun | JavaScript runtime | Both frontend & backend |
| **Frontend** | Next.js 16 (App Router) | UI framework | React 19 |
| **Styling** | TailwindCSS v4 | Utility-first CSS | Modern & Minimal theme |
| **Backend** | ElysiaJS | Web framework | Fast, TypeScript-first |
| **Database** | MongoDB + Mongoose | Persistent storage | Single source of truth |
| **Real-time** | ElysiaJS WebSocket | Pub/Sub communication | Built-in, no extra deps |
| **AI** | OpenAI-compatible API | Question/answer generation | Configurable endpoint |
| **Logging** | Custom logger | Structured logging | Colored console output |
| **Testing** | Playwright | E2E testing | Frontend only |
| **Hosting** | Vercel (FE) + Render (BE) | Deployment | Same as Outsider |

---

## 3. Project Structure

### Complete File Structure

```
sounds-fishy/
├── app/                          # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── globals.css       # Global styles
│   │   │   ├── layout.tsx        # Root layout
│   │   │   ├── page.tsx          # Home page
│   │   │   └── room/
│   │   │       └── [roomCode]/
│   │   │           ├── page.tsx  # Lobby page
│   │   │           └── briefing/
│   │   │               └── page.tsx  # Briefing page
│   │   ├── components/           # UI components (Atomic design)
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Toast.tsx
│   │   │   └── players/
│   │   │       ├── PlayerList.tsx
│   │   │       └── PlayerCard.tsx
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useSocket.ts      # WebSocket connection
│   │   │   └── useRoom.ts        # Room state management
│   │   ├── lib/                  # Utilities
│   │   │   ├── api.ts            # Axios API client
│   │   │   └── utils.ts          # Helper functions
│   │   ├── services/             # Frontend business logic
│   │   │   └── api.ts            # Room API methods
│   │   └── types/                # TypeScript definitions
│   │       └── index.ts
│   ├── public/                   # Static assets
│   ├── .env.example
│   ├── .env.local
│   ├── next.config.mjs
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── package.json
│
├── service/                      # Backend (ElysiaJS)
│   ├── src/
│   │   ├── controllers/          # Route & WebSocket handlers
│   │   │   ├── room-controller.ts    # REST endpoints
│   │   │   └── ws-controller.ts      # WebSocket handlers
│   │   ├── models/               # MongoDB schemas
│   │   │   └── game-room.ts      # Room & player schema
│   │   ├── services/             # Business logic
│   │   │   ├── room-service.ts   # Room management
│   │   │   ├── game-service.ts   # Game logic
│   │   │   └── ai-service.ts     # AI generation
│   │   ├── lib/                  # Utilities
│   │   │   ├── database.ts       # MongoDB connection
│   │   │   ├── logger.ts         # Custom logger
│   │   │   └── errors.ts         # Error classes
│   │   ├── types/                # TypeScript types
│   │   │   └── index.ts
│   │   └── index.ts              # Elysia entry point
│   ├── .env.example
│   ├── .env
│   ├── tsconfig.json
│   └── package.json
│
├── tasks/                        # Task files
│   ├── phase1-backend.md
│   ├── phase1-frontend.md
│   ├── phase2-backend.md
│   └── phase2-frontend.md
│
├── AGENTS.md                     # Project guidelines
├── IMPLEMENTATION_PLAN.md        # This file
├── README.md                     # Project documentation
└── .gitignore
```

---

## 4. Core Flows

### 4.1 Room Creation Flow

```
┌─────────┐      POST /api/rooms      ┌─────────┐
│ Player  │──────────────────────────►│ Backend │
│         │                           │         │
│         │                           │ 1. Generate room code
│         │                           │ 2. Create host player
│         │                           │ 3. Save to MongoDB
│         │                           │ 4. Return {roomId, hostId}
│         │◄──────────────────────────│
│         │  {roomId, roomCode, hostId}
│         │
│  Store in localStorage
│         │
│  Navigate to /room/[roomCode]
│         │
└─────────┘
```

**Backend Implementation:**
```typescript
// service/src/controllers/room-controller.ts
.post('/rooms',
  async ({ body, set }) => {
    const { hostName } = body;
    const roomCode = await roomService.generateUniqueRoomCode();
    const deviceId = crypto.randomUUID();

    const room = await GameRoom.create({
      roomCode,
      hostId: deviceId,
      players: [{
        deviceId: deviceId,
        name: hostName,
        isHost: true,
        isOnline: true,
        score: 0,
        isReady: false
      }]
    });

    return {
      success: true,
      data: { roomId: room._id, roomCode, deviceId }
    };
  },
  { body: t.Object({ hostName: t.String() }) }
)
```

**Frontend Implementation:**
```typescript
// app/src/app/page.tsx
const handleCreateRoom = async () => {
  const response = await roomAPI.createRoom({ hostName });
  if (response.success) {
    localStorage.setItem('deviceId', response.data.deviceId);
    window.location.href = `/room/${response.data.roomCode}`;
  }
};
```

### 4.2 Join Room Flow

```
┌─────────┐    POST /api/rooms/:code/join   ┌─────────┐
│ Player  │─────────────────────────────────►│ Backend │
│         │                                  │         │
│         │                                  │ 1. Find room
│         │                                  │ 2. Check if deviceId exists (reconnect)
│         │                                  │ 3. Create new player if not exists
│         │                                  │ 4. Save to MongoDB
│         │◄─────────────────────────────────│
│         │  {deviceId, roomCode}            │
│         │
│  Store deviceId in localStorage
│         │
│  WebSocket connects with ?deviceId=xxx
│         │
│  Backend broadcasts room_updated
│         │
│  Frontend receives update → UI refresh
│         │
└─────────┘
```

**Backend Implementation:**
```typescript
// service/src/controllers/room-controller.ts
.post('/rooms/:roomCode/join',
  async ({ params, body }) => {
    const { roomCode } = params;
    const { playerName, deviceId } = body;

    const player = await roomService.joinRoom(roomCode, playerName, deviceId);

    return {
      success: true,
      data: { deviceId, roomCode }
    };
  },
  { body: t.Object({ playerName: t.String(), deviceId: t.Optional(t.String()) }) }
)
```

**Frontend Implementation:**
```typescript
// app/src/app/room/[roomCode]/page.tsx
const handleJoinRoom = async () => {
  const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID();
  const response = await roomAPI.joinRoom(roomCode, { playerName, deviceId });
  if (response.success) {
    localStorage.setItem('deviceId', response.data.deviceId);
    setDeviceId(response.data.deviceId);
    // WebSocket will auto-reconnect with new deviceId
  }
};
```

### 4.3 WebSocket Connection Flow

```
┌─────────┐                         ┌─────────┐
│ Player  │                         │ Backend │
│         │                         │         │
│ Connect to ws://host/ws?          │         │
│   roomCode=XXX&deviceId=YYY       │         │
│──────────────────────────────────►│         │
│                                   │ 1. Validate query params
│                                   │ 2. Subscribe to room channel
│                                   │ 3. Mark player as online
│                                   │ 4. Broadcast room_updated
│                                   │         │
│◄──────────────────────────────────│
│  {type: 'connected', data: {...}} │
│                                   │
│ Listen for events:                │
│  - room_updated                   │
│  - player_joined                  │
│  - player_left                    │
│                                   │
│ Send messages:                    │
│  - join_room                      │
│  - leave_room                     │
│  - ready_up                       │
│  - start_game                     │
│──────────────────────────────────►│
└─────────┘                         └─────────┘
```

**WebSocket Server Setup:**
```typescript
// service/src/controllers/ws-controller.ts
export const wsController = new Elysia()
  .ws('/ws', {
    query: t.Object({
      roomCode: t.String(),
      deviceId: t.Optional(t.String()),
    }),
    body: t.Object({
      type: t.String(),
      data: t.Any(),
    }),
    open(ws) {
      const { roomCode, deviceId } = ws.data.query;
      ws.subscribe(roomCode);

      if (deviceId) {
        // Mark player as online
        GameRoom.findOne({ roomCode }).then(async (room) => {
          const player = room.players.find(p => p.deviceId === deviceId);
          if (player) {
            player.isOnline = true;
            await room.save();
            ws.publish(roomCode, { type: 'room_updated', data: room });
          }
        });
      }

      ws.send({ type: 'connected', data: { roomCode, deviceId } });
    },
    close(ws) {
      const { roomCode, deviceId } = ws.data.query;
      // Mark player as offline (don't remove from room)
      if (deviceId) {
        GameRoom.findOne({ roomCode }).then(async (room) => {
          const player = room.players.find(p => p.deviceId === deviceId);
          if (player) {
            player.isOnline = false;
            player.lastSeen = new Date();
            await room.save();
            ws.publish(roomCode, { type: 'room_updated', data: room });
          }
        });
      }
    },
    message(ws, message) {
      // Route to appropriate handler based on message.type
    },
  });
```

### 4.4 Player Connection Management

**Player Schema:**
```typescript
// service/src/models/game-room.ts
const playerSchema = new Schema({
  deviceId: { type: String, required: true },  // Persistent identity
  name: { type: String, required: true },
  isHost: { type: Boolean, default: false },
  inGameRole: {
    type: String,
    enum: ['guesser', 'bigFish', 'redHerring', null],
    default: null
  },
  isOnline: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  score: { type: Number, default: 0 },
  isReady: { type: Boolean, default: false },
  generatedLie: { type: String, default: null }
});
```

**Connection Lifecycle:**
1. **Connect:** Mark `isOnline = true`, broadcast `room_updated`
2. **Disconnect:** Mark `isOnline = false`, set `lastSeen`, broadcast `room_updated`
3. **Reconnect:** Same deviceId = same player (preserves role, score, etc.)
4. **Explicit Leave:** Remove from room array, clean up

**Key Points:**
- `deviceId` is generated once and stored in `localStorage`
- `deviceId` survives page refresh and browser restart
- No user accounts needed
- Reconnection is automatic with same `deviceId`
- Backend matches players by `deviceId`, not by session

---

## 5. Implementation Phases

### Phase 1: Core Infrastructure (Priority: HIGH)

**Backend:**
- [ ] Set up ElysiaJS server with Bun
- [ ] Configure MongoDB connection
- [ ] Create GameRoom model with player schema
- [ ] Implement room-controller (create, get, join, leave)
- [ ] Implement ws-controller (connection, join_room, leave_room)
- [ ] Create room-service (business logic)
- [ ] Set up logging and error handling

**Frontend:**
- [ ] Set up Next.js 16 with App Router
- [ ] Configure TailwindCSS v4
- [ ] Create API client (Axios)
- [ ] Implement useSocket hook (WebSocket connection)
- [ ] Implement useRoom hook (room state management)
- [ ] Create home page (create/join room form)
- [ ] Create lobby page (player list, ready button)
- [ ] Create basic UI components (Button, Input, Card)

**Testing:**
- [ ] Test room creation flow
- [ ] Test join room flow
- [ ] Test WebSocket connection/reconnection
- [ ] Test player list updates

### Phase 2: Game Logic (Priority: MEDIUM)

**Backend:**
- [ ] Implement game-service (role assignment, briefing)
- [ ] Implement ai-service (question/answer generation)
- [ ] Add ready_up WebSocket handler
- [ ] Add start_game WebSocket handler
- [ ] Implement role distribution logic

**Frontend:**
- [ ] Create briefing page (secret info display)
- [ ] Implement ready status UI
- [ ] Add "Generate Lie" feature for Red Herrings
- [ ] Show role-specific information

**Testing:**
- [ ] Test role assignment
- [ ] Test AI generation
- [ ] Test ready flow

### Phase 3: Game Play (Priority: LOW)

**Backend:**
- [ ] Implement elimination logic
- [ ] Implement scoring system
- [ ] Add WebSocket handlers for game actions
- [ ] Implement round summary

**Frontend:**
- [ ] Create elimination UI
- [ ] Show scoring panel
- [ ] Create round summary screen
- [ ] Add animations and polish

**Testing:**
- [ ] Full game flow test
- [ ] Scoring verification
- [ ] E2E tests with Playwright

---

## 6. File-by-File Implementation Guide

### Backend Files

#### 1. `service/src/index.ts` - Entry Point
```typescript
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectDB } from './lib/database';
import { roomController } from './controllers/room-controller';
import { wsController } from './controllers/ws-controller';
import { logger } from './lib/logger';

connectDB();

const app = new Elysia()
  .use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
  .use(wsController)
  .use(roomController)
  .get('/', () => '🐟 Sounds Fishy API')
  .listen(process.env.PORT || 3001);

logger.info(`🐟 Server running on port ${process.env.PORT}`);
export type AppRouter = typeof app;
```

#### 2. `service/src/models/game-room.ts` - Database Schema
```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer {
  deviceId: string;  // Persistent identity
  name: string;
  isHost: boolean;
  inGameRole: 'guesser' | 'bigFish' | 'redHerring' | null;
  isOnline: boolean;
  lastSeen: Date;
  score: number;
  isReady: boolean;
  generatedLie?: string | null;
}

export interface IGameRoom extends Document {
  roomCode: string;
  hostId: string;
  players: IPlayer[];
  status: 'lobby' | 'briefing' | 'playing' | 'roundEnd';
  question?: string;
  secretWord?: string;
  aiConfig?: IAiConfig;
}

const playerSchema = new Schema<IPlayer>({...});
const gameRoomSchema = new Schema<IGameRoom>({...});

export default mongoose.model<IGameRoom>('GameRoom', gameRoomSchema);
```

#### 3. `service/src/controllers/room-controller.ts` - REST API
```typescript
import { Elysia, t } from 'elysia';
import { roomService } from '../services/room-service';
import GameRoom from '../models/game-room';

export const roomController = new Elysia({ prefix: '/api' })
  .post('/rooms', async ({ body }) => {...})
  .get('/rooms/:roomCode', async ({ params }) => {...})
  .post('/rooms/:roomCode/join', async ({ params, body }) => {...})
  .post('/rooms/:roomCode/leave', async ({ params, body }) => {...})
  .post('/rooms/:roomCode/ready', async ({ params, body }) => {...})
  .post('/rooms/:roomCode/start', async ({ params }) => {...});
```

#### 4. `service/src/controllers/ws-controller.ts` - WebSocket
```typescript
import { Elysia, t } from 'elysia';
import GameRoom from '../models/game-room';
import { roomService } from '../services/room-service';

export const wsController = new Elysia()
  .ws('/ws', {
    query: t.Object({ roomCode: t.String(), deviceId: t.Optional(t.String()) }),
    body: t.Object({ type: t.String(), data: t.Any() }),
    open(ws) {...},
    close(ws) {...},
    message(ws, message) {
      switch (message.type) {
        case 'join_room': handleJoinRoom(ws, message.data); break;
        case 'leave_room': handleLeaveRoom(ws, message.data); break;
        case 'ready_up': handleReadyUp(ws, message.data); break;
        case 'start_game': handleStartGame(ws, message.data); break;
      }
    },
  });
```

#### 5. `service/src/services/room-service.ts` - Business Logic
```typescript
export class RoomService {
  async createRoom(hostName: string) {...}
  async joinRoom(roomCode: string, playerName: string, deviceId?: string) {...}
  async leaveRoom(roomCode: string, deviceId: string) {...}
  async toggleReady(roomCode: string, deviceId: string) {...}
  async startGame(roomCode: string) {...}
  assignRoles(players: IPlayer[]) {...}
}
```

#### 6. `service/src/lib/database.ts` - MongoDB Connection
```typescript
import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    logger.info('✅ MongoDB connected');
  } catch (error) {
    logger.error(`MongoDB connection error: ${error}`);
  }
}
```

### Frontend Files

#### 1. `app/src/lib/api.ts` - API Client
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

export default apiClient;
```

#### 2. `app/src/services/api.ts` - Room API
```typescript
import apiClient from '@/lib/api';

export const roomAPI = {
  createRoom: async (data: { hostName: string }) => {...},
  getRoom: async (roomCode: string) => {...},
  joinRoom: async (roomCode: string, data: { playerName: string, deviceId?: string }) => {...},
  leaveRoom: async (roomCode: string, deviceId: string) => {...},
  toggleReady: async (roomCode: string, deviceId: string) => {...},
  startGame: async (roomCode: string) => {...},
};
```

#### 3. `app/src/hooks/useSocket.ts` - WebSocket Hook
```typescript
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebSocket = (roomCode?: string, deviceId?: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const callbacksRef = useRef<Map<string, Set<Function>>>(new Map());

  const buildWSUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (roomCode) params.set('roomCode', roomCode);
    if (deviceId) params.set('deviceId', deviceId);
    return `${process.env.NEXT_PUBLIC_WS_URL}/ws?${params.toString()}`;
  }, [roomCode, deviceId]);

  const connect = useCallback(() => {
    const ws = new WebSocket(buildWSUrl());
    ws.onopen = () => setConnectionState('connected');
    ws.onclose = () => setConnectionState('disconnected');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      callbacksRef.current.get(message.type)?.forEach(cb => cb(message.data));
    };
    wsRef.current = ws;
  }, [buildWSUrl]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const subscribe = useCallback((type: string, callback: Function) => {...});
  const sendMessage = useCallback((type: string, data: any) => {...});

  return { connectionState, isConnected: connectionState === 'connected', subscribe, sendMessage };
};
```

#### 4. `app/src/hooks/useRoom.ts` - Room State Hook
```typescript
'use client';
import { useState, useEffect } from 'react';
import { useWebSocket } from './useSocket';
import { roomAPI } from '@/services/api';

export const useRoom = (roomCode: string, deviceId?: string) => {
  const [room, setRoom] = useState(null);
  const { isConnected, subscribe, sendMessage } = useWebSocket(roomCode, deviceId);

  useEffect(() => {
    roomAPI.getRoom(roomCode).then(data => setRoom(data.data));
  }, [roomCode]);

  useEffect(() => {
    if (!isConnected) return;
    subscribe('room_updated', (data) => setRoom(data));
    subscribe('player_joined', (data) => console.log('Player joined:', data));
  }, [isConnected, subscribe]);

  const joinRoom = useCallback(() => {
    sendMessage('join_room', { roomCode, deviceId });
  }, [deviceId, roomCode, sendMessage]);

  const toggleReady = useCallback(() => {
    sendMessage('ready_up', { roomCode, deviceId });
  }, [deviceId, roomCode, sendMessage]);

  return { room, isConnected, joinRoom, toggleReady };
};
```

#### 5. `app/src/app/page.tsx` - Home Page
```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { roomAPI } from '@/services/api';

export default function HomePage() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');

  const handleCreateRoom = async () => {
    const response = await roomAPI.createRoom({ hostName });
    if (response.success) {
      localStorage.setItem('deviceId', response.data.deviceId);
      router.push(`/room/${response.data.roomCode}`);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100">
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-4xl font-bold text-ocean-600 mb-8">🐟 Sounds Fishy</h1>
        <Input value={hostName} onChange={setHostName} placeholder="Your name" />
        <Button onClick={handleCreateRoom}>Create Room</Button>
      </div>
    </main>
  );
}
```

#### 6. `app/src/app/room/[roomCode]/page.tsx` - Lobby Page
```typescript
'use client';
import { useParams } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import PlayerList from '@/components/players/PlayerList';
import Button from '@/components/ui/Button';

export default function LobbyPage() {
  const params = useParams<{ roomCode: string }>();
  const deviceId = typeof window !== 'undefined' ? localStorage.getItem('deviceId') : null;
  const { room, isConnected, joinRoom, toggleReady } = useRoom(params.roomCode, deviceId || undefined);

  useEffect(() => {
    if (deviceId && isConnected) {
      joinRoom();
    }
  }, [deviceId, isConnected, joinRoom]);

  const isHost = room?.hostId === deviceId;
  const isReady = room?.players.find(p => p.deviceId === deviceId)?.isReady;

  return (
    <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Lobby</h1>
        <PlayerList players={room?.players || []} hostId={room?.hostId} />
        {!isHost ? (
          <Button onClick={toggleReady}>{isReady ? '✓ Ready' : "I'm Ready"}</Button>
        ) : (
          <Button disabled={!allReady}>Start Game</Button>
        )}
      </div>
    </main>
  );
}
```

---

## Next Steps

1. **Review this plan** with the team
2. **Set up development environment** (Bun, MongoDB, Node.js)
3. **Start Phase 1** - Core Infrastructure
4. **Create task files** in `tasks/` directory for each phase
5. **Begin implementation** following the file-by-file guide

---

## References

- **Outsider Study:** `/reports/outsider-study.md`
- **Project Guidelines:** `AGENTS.md`
- **Game Rules:** `AGENTS.md` section 3
- **Tech Stack:** `AGENTS.md` section 2
