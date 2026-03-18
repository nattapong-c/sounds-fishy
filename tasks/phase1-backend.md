# Phase 1 Backend Implementation Plan

## Overview
**Feature:** Core Game Room & Lobby System  
**Goal:** Establish the foundational backend infrastructure for room creation, player management, and real-time Socket.io communication.

### Scope
- MongoDB connection and schema setup
- REST API for room creation and joining
- Socket.io integration for real-time updates
- Basic lobby management (players join/leave)
- Host assignment and room code generation

---

## Database Schema

### GameRoom Model
```typescript
// service/src/models/game_room.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer {
  playerId: string;
  name: string;
  role: 'guesser' | 'bigFish' | 'redHerring' | 'host';
  score: number;
  isReady: boolean;
  generatedLie?: string;
  eliminatedInRound?: number;
}

export interface IGameRoom extends Document {
  roomCode: string;
  hostId: string;
  status: 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary' | 'completed';
  players: IPlayer[];
  currentRound: number;
  secretWord?: string;
  question?: string;
  eliminatedPlayers: Array<{
    playerId: string;
    round: number;
    wasBigFish: boolean;
  }>;
  roundHistory: Array<{
    roundNumber: number;
    secretWord: string;
    question: string;
    guesserScore: number;
    bigFishScore: number;
    redHerringScores: number[];
    bustOccurred: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  playerId: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['guesser', 'bigFish', 'redHerring', 'host'],
    default: 'host'
  },
  score: { type: Number, default: 0 },
  isReady: { type: Boolean, default: false },
  generatedLie: { type: String },
  eliminatedInRound: { type: Number }
});

const GameRoomSchema = new Schema<IGameRoom>({
  roomCode: { type: String, required: true, unique: true, uppercase: true },
  hostId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['lobby', 'briefing', 'pitch', 'elimination', 'round_summary', 'completed'],
    default: 'lobby'
  },
  players: [PlayerSchema],
  currentRound: { type: Number, default: 1 },
  secretWord: { type: String },
  question: { type: String },
  eliminatedPlayers: [{
    playerId: String,
    round: Number,
    wasBigFish: Boolean
  }],
  roundHistory: [{
    roundNumber: Number,
    secretWord: String,
    question: String,
    guesserScore: Number,
    bigFishScore: Number,
    redHerringScores: [Number],
    bustOccurred: Boolean
  }]
}, { timestamps: true });

export default mongoose.model<IGameRoom>('GameRoom', GameRoomSchema);
```

---

## API Endpoints

### REST Routes

#### 1. POST /api/rooms
**Description:** Create a new game room  
**Request:**
```typescript
{
  hostName: string;  // Host player name
}
```
**Response:**
```typescript
{
  success: true;
  data: {
    roomId: string;
    roomCode: string;
    hostId: string;
  };
}
```

#### 2. GET /api/rooms/:roomCode
**Description:** Get room details  
**Response:**
```typescript
{
  success: true;
  data: {
    roomCode: string;
    status: string;
    hostId: string;
    players: Array<{ playerId: string; name: string; role: string; score: number; isReady: boolean }>;
    currentRound: number;
  };
}
```

#### 3. POST /api/rooms/:roomCode/join
**Description:** Join an existing room  
**Request:**
```typescript
{
  playerName: string;
}
```
**Response:**
```typescript
{
  success: true;
  data: {
    playerId: string;
    roomCode: string;
  };
}
```

#### 4. POST /api/rooms/:roomCode/leave
**Description:** Leave a room  
**Request:**
```typescript
{
  playerId: string;
}
```

---

## Socket.io Events

### Client → Server Events

#### 1. `join_room`
```typescript
{
  roomCode: string;
  playerId: string;
}
```
**Action:** Add player to socket room, broadcast room update

#### 2. `leave_room`
```typescript
{
  roomCode: string;
  playerId: string;
}
```
**Action:** Remove player from socket room, broadcast room update

#### 3. `ready_up`
```typescript
{
  roomCode: string;
  playerId: string;
}
```
**Action:** Toggle player ready status, check if all players ready

#### 4. `start_game`
```typescript
{
  roomCode: string;
  hostId: string;
}
```
**Action:** Validate host, assign roles, emit `game_started`

### Server → Client Events

#### 1. `room_updated`
```typescript
{
  roomCode: string;
  players: IPlayer[];
  status: string;
  currentRound: number;
}
```

#### 2. `player_joined`
```typescript
{
  playerId: string;
  playerName: string;
  playerCount: number;
}
```

#### 3. `player_left`
```typescript
{
  playerId: string;
  playerName: string;
  remainingCount: number;
}
```

#### 4. `game_started`
```typescript
{
  roomCode: string;
  status: 'briefing';
}
```

#### 5. `error`
```typescript
{
  code: string;
  message: string;
}
```

---

## Service Logic

### RoomService Class
```typescript
// service/src/services/room-service.ts

export class RoomService {
  /**
   * Generate a unique 6-character room code
   */
  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new game room with host
   */
  async createRoom(hostName: string): Promise<IGameRoom> {
    const roomCode = await this.generateUniqueRoomCode();
    const hostId = crypto.randomUUID();
    
    const room = await GameRoom.create({
      roomCode,
      hostId,
      players: [{
        playerId: hostId,
        name: hostName,
        role: 'host',
        score: 0,
        isReady: false
      }]
    });
    
    return room;
  }

  /**
   * Add player to room
   */
  async joinRoom(roomCode: string, playerName: string): Promise<IPlayer> {
    const room = await GameRoom.findOne({ roomCode });
    if (!room) {
      throw new CustomAppError('Room not found', 404, 'ROOM_NOT_FOUND');
    }
    if (room.status !== 'lobby') {
      throw new CustomAppError('Game already started', 400, 'ROOM_STARTED');
    }
    if (room.players.length >= 8) {
      throw new CustomAppError('Room is full', 400, 'ROOM_FULL');
    }

    const playerId = crypto.randomUUID();
    const newPlayer: IPlayer = {
      playerId,
      name: playerName,
      role: 'host', // Temporary, will be reassigned on game start
      score: 0,
      isReady: false
    };

    room.players.push(newPlayer);
    await room.save();
    
    return newPlayer;
  }

  /**
   * Remove player from room
   */
  async leaveRoom(roomCode: string, playerId: string): Promise<void> {
    const room = await GameRoom.findOne({ roomCode });
    if (!room) return;

    // If host leaves, transfer host or delete room
    if (playerId === room.hostId) {
      if (room.players.length > 1) {
        // Transfer to first player
        room.hostId = room.players[1].playerId;
      } else {
        // Delete empty room
        await GameRoom.deleteOne({ _id: room._id });
        return;
      }
    }

    room.players = room.players.filter(p => p.playerId !== playerId);
    await room.save();
  }

  /**
   * Toggle player ready status
   */
  async toggleReady(roomCode: string, playerId: string): Promise<boolean> {
    const room = await GameRoom.findOne({ roomCode });
    if (!room) throw new CustomAppError('Room not found', 404, 'ROOM_NOT_FOUND');

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) throw new CustomAppError('Player not found', 404, 'PLAYER_NOT_FOUND');

    player.isReady = !player.isReady;
    await room.save();

    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady);
    return allReady;
  }

  /**
   * Assign roles for game start
   */
  assignRoles(players: IPlayer[]): void {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    
    shuffled[0].role = 'guesser';
    shuffled[1].role = 'bigFish';
    
    for (let i = 2; i < shuffled.length; i++) {
      shuffled[i].role = 'redHerring';
    }
  }

  private async generateUniqueRoomCode(): Promise<string> {
    let code = this.generateRoomCode();
    let exists = await GameRoom.findOne({ roomCode: code });
    
    while (exists) {
      code = this.generateRoomCode();
      exists = await GameRoom.findOne({ roomCode: code });
    }
    
    return code;
  }
}
```

### WordBankService (Basic)
```typescript
// service/src/services/word-bank-service.ts

export class WordBankService {
  private wordBank = [
    { question: "What is a common pet?", answer: "Dog" },
    { question: "What is a popular fruit?", answer: "Apple" },
    { question: "What do you use to write?", answer: "Pen" },
    { question: "What is a common vehicle?", answer: "Car" },
    { question: "What is a popular sport?", answer: "Soccer" }
  ];

  getRandomWord(): { question: string; answer: string } {
    const randomIndex = Math.floor(Math.random() * this.wordBank.length);
    return this.wordBank[randomIndex];
  }
}
```

---

## Testing Plan

### Unit Tests

#### RoomService Tests
```typescript
// service/src/__tests__/unit/room-service.test.ts

import { describe, test, expect, beforeEach } from 'bun:test';
import { RoomService } from '../../services/RoomService';

describe('RoomService', () => {
  let roomService: RoomService;

  beforeEach(() => {
    roomService = new RoomService();
  });

  test('generateRoomCode should return 6-character string', () => {
    const code = roomService.generateRoomCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  test('assignRoles should assign 1 guesser, 1 big fish, rest red herrings', () => {
    const players = [
      { playerId: '1', name: 'A', role: 'host', score: 0, isReady: false },
      { playerId: '2', name: 'B', role: 'host', score: 0, isReady: false },
      { playerId: '3', name: 'C', role: 'host', score: 0, isReady: false },
      { playerId: '4', name: 'D', role: 'host', score: 0, isReady: false }
    ];

    roomService.assignRoles(players);

    const roles = players.map(p => p.role);
    expect(roles.filter(r => r === 'guesser').length).toBe(1);
    expect(roles.filter(r => r === 'bigFish').length).toBe(1);
    expect(roles.filter(r => r === 'redHerring').length).toBe(2);
  });
});
```

### Integration Tests

#### Room API Tests
```typescript
// service/src/__tests__/integration/room-api.test.ts

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import { app } from '../../index';
import { connectDB, disconnectDB } from '../../lib/database';

describe('Room API Endpoints', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  test('POST /api/rooms should create a new room', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .send({ hostName: 'TestHost' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.roomCode).toHaveLength(6);
  });

  test('GET /api/rooms/:roomCode should return room details', async () => {
    // Create room first
    const createRes = await request(app)
      .post('/api/rooms')
      .send({ hostName: 'TestHost' });

    const roomCode = createRes.body.data.roomCode;

    const response = await request(app)
      .get(`/api/rooms/${roomCode}`);

    expect(response.status).toBe(200);
    expect(response.body.data.players.length).toBe(1);
  });

  test('POST /api/rooms/:roomCode/join should add player to room', async () => {
    const createRes = await request(app)
      .post('/api/rooms')
      .send({ hostName: 'Host' });

    const roomCode = createRes.body.data.roomCode;

    const response = await request(app)
      .post(`/api/rooms/${roomCode}/join`)
      .send({ playerName: 'NewPlayer' });

    expect(response.status).toBe(200);
    expect(response.body.data.playerId).toBeDefined();
  });
});
```

---

## Acceptance Criteria

- [ ] MongoDB connection established and working
- [ ] GameRoom model with proper schema and validation
- [ ] REST API endpoints for room CRUD operations
- [ ] Socket.io integration with all defined events
- [ ] Room code generation (6 chars, no confusing characters)
- [ ] Player join/leave functionality
- [ ] Host transfer when host leaves
- [ ] Ready-up system with all-ready detection
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Error handling with custom error classes
- [ ] TypeScript types exported for frontend consumption

---

## Dependencies

```json
{
  "dependencies": {
    "elysia": "^1.0.0",
    "socket.io": "^4.7.0",
    "mongoose": "^8.0.0",
    "@elysiajs/cors": "^1.0.0"
  },
  "devDependencies": {
    "bun-types": "^1.0.0",
    "supertest": "^6.3.0"
  }
}
```

---

## File Structure

```
service/
├── src/
│   ├── controllers/
│   │   ├── room-controller.ts
│   │   └── socket-controller.ts
│   ├── models/
│   │   └── game-room.ts
│   ├── services/
│   │   ├── room-service.ts
│   │   └── word-bank-service.ts
│   ├── lib/
│   │   ├── database.ts
│   │   └── errors.ts
│   ├── types/
│   │   └── index.ts
│   ├── __tests__/
│   │   ├── unit/
│   │   └── integration/
│   └── index.ts
└── package.json
```
