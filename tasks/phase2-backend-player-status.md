# Phase 2 Backend - Player Status & Role Separation

## Overview
**Feature:** Player Online Status Tracking & Role Separation  
**Goal:** Implement online/disconnected status for players and separate host flag from game roles

### Scope
- Add `isOnline` field to track player connection status
- Separate `isHost` flag from game role (`guesser` | `bigFish` | `redHerring`)
- Update WebSocket handlers to track connect/disconnect events
- Fix room deletion bug when host refreshes page
- Update database schema and API responses

---

## Database Schema Updates

### GameRoom Model Changes
```typescript
// service/src/models/game-room.ts

export interface IPlayer {
  playerId: string;
  name: string;
  isHost: boolean;                    // NEW: Separate host flag
  inGameRole: 'guesser' | 'bigFish' | 'redHerring' | null; // NEW: Game role
  isOnline: boolean;                  // NEW: Connection status
  score: number;
  isReady: boolean;
  generatedLie?: string;
  eliminatedInRound?: number;
  lastSeen?: Date;                    // NEW: Last activity timestamp
}

export interface IGameRoom extends Document {
  roomCode: string;
  hostId: string;                     // Still needed for room ownership
  status: 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary' | 'completed';
  players: IPlayer[];
  currentRound: number;
  // ... other fields
}

const PlayerSchema = new Schema<IPlayer>({
  playerId: { type: String, required: true },
  name: { type: String, required: true },
  isHost: { type: Boolean, default: false },  // Separate host flag
  inGameRole: { 
    type: String, 
    enum: ['guesser', 'bigFish', 'redHerring', null],
    default: null
  },
  isOnline: { type: Boolean, default: false }, // Connection status
  score: { type: Number, default: 0 },
  isReady: { type: Boolean, default: false },
  generatedLie: { type: String },
  eliminatedInRound: { type: Number },
  lastSeen: { type: Date, default: Date.now }  // Activity tracking
});
```

---

## API Endpoints Updates

### No New Endpoints Required
Existing endpoints will return updated player structure with new fields.

### Updated Response Types
```typescript
// service/src/types/index.ts

export interface PlayerResponse {
  playerId: string;
  name: string;
  isHost: boolean;           // Separate flag
  inGameRole: string | null; // Game role
  isOnline: boolean;         // Connection status
  score: number;
  isReady: boolean;
}

// All endpoints returning player data will include new fields
```

---

## WebSocket Events Updates

### Client → Server (No Changes)
- `join_room`
- `leave_room`
- `ready_up`
- `start_game`

### Server → Client (Updated Payloads)

#### `player_joined`
```typescript
{
  type: 'player_joined';
  data: {
    playerId: string;
    name: string;
    isHost: boolean;
    inGameRole: string | null;
    isOnline: boolean;
    playerCount: number;
  };
}
```

#### `player_left`
```typescript
{
  type: 'player_left';
  data: {
    playerId: string;
    name: string;
    isHost: boolean;
    wasDisconnected: boolean; // true if disconnect, false if explicit leave
    newHostId?: string;
    remainingCount: number;
  };
}
```

#### NEW: `player_disconnected`
```typescript
{
  type: 'player_disconnected';
  data: {
    playerId: string;
    name: string;
    isHost: boolean;
    isOnline: false;
    lastSeen: string; // ISO timestamp
  };
}
```

#### NEW: `player_reconnected`
```typescript
{
  type: 'player_reconnected';
  data: {
    playerId: string;
    name: string;
    isOnline: true;
  };
}
```

---

## Service Logic

### RoomService Updates

```typescript
// service/src/services/room-service.ts

export interface LeaveRoomResult {
  roomDeleted: boolean;
  newHostId?: string | null;
  wasDisconnected: boolean; // Track if disconnect vs explicit leave
}

export class RoomService {
  /**
   * Mark player as disconnected (not left)
   */
  async markDisconnected(roomCode: string, playerId: string): Promise<void> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return;

    const player = room.players.find(p => p.playerId === playerId);
    if (player) {
      player.isOnline = false;
      player.lastSeen = new Date();
      await room.save();
    }
  }

  /**
   * Mark player as reconnected
   */
  async markReconnected(roomCode: string, playerId: string): Promise<void> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return;

    const player = room.players.find(p => p.playerId === playerId);
    if (player) {
      player.isOnline = true;
      player.lastSeen = new Date();
      await room.save();
    }
  }

  /**
   * Leave room (explicit leave)
   * CRITICAL FIX: Don't delete room if host disconnects (only on explicit leave)
   */
  async leaveRoom(roomCode: string, playerId: string, isDisconnect: boolean = false): Promise<LeaveRoomResult> {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      return { roomDeleted: false, newHostId: null, wasDisconnected: false };
    }

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) {
      return { roomDeleted: false, newHostId: null, wasDisconnected: false };
    }

    const isLeavingHost = player.isHost;

    // CRITICAL BUG FIX: Only delete room on explicit leave, not disconnect
    if (room.players.length === 1 && isLeavingHost) {
      if (!isDisconnect) {
        // Host explicitly leaving last player room - delete it
        await GameRoom.deleteOne({ _id: room._id });
        return { roomDeleted: true, newHostId: null, wasDisconnected: isDisconnect };
      } else {
        // Host disconnected - keep room alive
        player.isOnline = false;
        player.lastSeen = new Date();
        await room.save();
        return { roomDeleted: false, newHostId: playerId, wasDisconnected: isDisconnect };
      }
    }

    // Remove player if not disconnecting
    if (!isDisconnect) {
      room.players = room.players.filter(p => p.playerId !== playerId);
    } else {
      // Just mark as offline
      player.isOnline = false;
      player.lastSeen = new Date();
    }

    // Transfer host if needed
    let newHostId: string | null = null;
    if (isLeavingHost && room.players.length > 0) {
      // Find first non-host player
      const newHost = room.players.find(p => !p.isHost);
      if (newHost) {
        newHost.isHost = true;
        newHostId = newHost.playerId;
      } else if (room.players[0]) {
        // Fallback to first player
        room.players[0].isHost = true;
        newHostId = room.players[0].playerId;
      }
    }

    await room.save();
    return {
      roomDeleted: false,
      newHostId,
      wasDisconnected: isDisconnect
    };
  }

  /**
   * Assign roles for game start
   */
  assignRoles(players: IPlayer[]): void {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    
    // Separate host from role assignment
    const host = shuffled.find(p => p.isHost);
    const nonHostPlayers = shuffled.filter(p => !p.isHost);
    
    if (nonHostPlayers.length >= 2) {
      nonHostPlayers[0].inGameRole = 'guesser';
      nonHostPlayers[1].inGameRole = 'bigFish';
      
      for (let i = 2; i < nonHostPlayers.length; i++) {
        nonHostPlayers[i].inGameRole = 'redHerring';
      }
    }
  }
}
```

### WebSocket Controller Updates

```typescript
// service/src/controllers/ws-controller.ts

export const wsController = new Elysia()
  .ws('/ws', {
    query: t.Object({
      roomCode: t.String(),
      playerId: t.Optional(t.String()),
    }),
    
    body: t.Object({
      type: t.String(),
      data: t.Any(),
    }),
    
    async open(ws) {
      const { roomCode, playerId } = ws.data.query;
      
      logger.info(`✅ WS connected: room=${roomCode}, player=${playerId || 'anonymous'}`);
      
      // Subscribe to room channel
      ws.subscribe(`room:${roomCode}`);
      
      // Mark player as online if they exist in room
      if (playerId) {
        await roomService.markReconnected(roomCode, playerId);
        
        // Broadcast reconnection
        ws.publish(roomCode, JSON.stringify({
          type: 'player_reconnected',
          data: { playerId, isOnline: true }
        }));
      }
      
      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        data: { roomCode, playerId }
      }));
    },
    
    async close(ws) {
      const { roomCode, playerId } = ws.data.query;
      
      logger.info(`❌ WS disconnected: room=${roomCode}, player=${playerId || 'anonymous'}`);
      
      // CRITICAL FIX: Mark as disconnected, don't remove from room
      if (playerId && roomCode) {
        // Mark player as disconnected (not left)
        await roomService.markDisconnected(roomCode, playerId);
        
        // Broadcast disconnection (not player_left)
        ws.publish(roomCode, JSON.stringify({
          type: 'player_disconnected',
          data: {
            playerId,
            isOnline: false,
            lastSeen: new Date().toISOString()
          }
        }));
        
        // Get updated room state
        const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
        if (room) {
          ws.publish(roomCode, JSON.stringify({
            type: 'room_updated',
            data: room
          }));
        }
      }
      
      // Unsubscribe after broadcasting
      ws.unsubscribe(roomCode);
    },
    
    message(ws, message: WSMessage) {
      handleMessage(ws, message);
    },
  });
```

---

## Testing Plan

### Unit Tests

```typescript
// service/src/__tests__/unit/room-service-player-status.test.ts

import { describe, test, expect, beforeEach } from 'bun:test';
import { RoomService } from '../../services/room-service';
import GameRoom from '../../models/game-room';

describe('RoomService - Player Status', () => {
  let roomService: RoomService;

  beforeEach(async () => {
    roomService = new RoomService();
    // Setup test data
  });

  test('markDisconnected should set isOnline to false', async () => {
    // Create room with player
    const room = await GameRoom.create({
      roomCode: 'TEST123',
      hostId: 'player-1',
      players: [{
        playerId: 'player-1',
        name: 'TestHost',
        isHost: true,
        inGameRole: null,
        isOnline: true,
        score: 0,
        isReady: false
      }]
    });

    await roomService.markDisconnected('TEST123', 'player-1');

    const updatedRoom = await GameRoom.findOne({ roomCode: 'TEST123' });
    expect(updatedRoom?.players[0].isOnline).toBe(false);
    expect(updatedRoom?.players[0].lastSeen).toBeDefined();
  });

  test('markReconnected should set isOnline to true', async () => {
    // Similar test for reconnection
  });

  test('leaveRoom with isDisconnect=false should remove player', async () => {
    // Test explicit leave removes player
  });

  test('leaveRoom with isDisconnect=true should keep player in room', async () => {
    // Test disconnect keeps player in room
  });

  test('host disconnect should not delete room', async () => {
    // CRITICAL BUG FIX TEST
    const room = await GameRoom.create({
      roomCode: 'HOST123',
      hostId: 'host-1',
      players: [{
        playerId: 'host-1',
        name: 'Host',
        isHost: true,
        isOnline: true,
        score: 0,
        isReady: false
      }]
    });

    const result = await roomService.leaveRoom('HOST123', 'host-1', true); // true = disconnect

    expect(result.roomDeleted).toBe(false);
    expect(result.newHostId).toBe('host-1');

    const updatedRoom = await GameRoom.findOne({ roomCode: 'HOST123' });
    expect(updatedRoom).not.toBeNull();
    expect(updatedRoom?.players.length).toBe(1); // Player still in room
    expect(updatedRoom?.players[0].isOnline).toBe(false);
  });

  test('host explicit leave should delete room if last player', async () => {
    // Explicit leave by host with no other players should delete room
  });

  test('assignRoles should separate host from game roles', async () => {
    const players = [
      { playerId: '1', name: 'Host', isHost: true, inGameRole: null, isOnline: true, score: 0, isReady: false },
      { playerId: '2', name: 'P2', isHost: false, inGameRole: null, isOnline: true, score: 0, isReady: false },
      { playerId: '3', name: 'P3', isHost: false, inGameRole: null, isOnline: true, score: 0, isReady: false },
      { playerId: '4', name: 'P4', isHost: false, inGameRole: null, isOnline: true, score: 0, isReady: false }
    ];

    roomService.assignRoles(players);

    // Host should not have game role
    const host = players.find(p => p.isHost);
    expect(host?.inGameRole).toBe(null);

    // Other players should have roles
    const nonHosts = players.filter(p => !p.isHost);
    expect(nonHosts[0].inGameRole).toBe('guesser');
    expect(nonHosts[1].inGameRole).toBe('bigFish');
    expect(nonHosts[2].inGameRole).toBe('redHerring');
  });
});
```

### Integration Tests

```typescript
// service/src/__tests__/integration/websocket-player-status.test.ts

import { describe, test, expect } from 'bun:test';
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

describe('WebSocket Player Status', () => {
  // Test player disconnect/reconnect events
  // Test room persistence on host disconnect
  // Test online status broadcasting
});
```

---

## Migration Guide

### Database Migration
```typescript
// service/src/lib/migrations/add-player-status-fields.ts

export async function addPlayerStatusFields() {
  const rooms = await GameRoom.find({});
  
  for (const room of rooms) {
    for (const player of room.players) {
      // Add new fields if missing
      if (player.isHost === undefined) {
        player.isHost = player.playerId === room.hostId;
      }
      if (player.inGameRole === undefined) {
        player.inGameRole = player.role || null;
      }
      if (player.isOnline === undefined) {
        player.isOnline = true; // Assume online for existing players
      }
      if (player.lastSeen === undefined) {
        player.lastSeen = new Date();
      }
    }
    await room.save();
  }
  
  console.log(`Migrated ${rooms.length} rooms with new player status fields`);
}
```

---

## Acceptance Criteria

- [ ] Player schema updated with `isHost`, `inGameRole`, `isOnline`, `lastSeen`
- [ ] WebSocket `open` handler marks player as reconnected
- [ ] WebSocket `close` handler marks player as disconnected (not removed)
- [ ] Room NOT deleted when host disconnects (only on explicit leave)
- [ ] `player_disconnected` event broadcast on disconnect
- [ ] `player_reconnected` event broadcast on reconnect
- [ ] Host flag separate from game role
- [ ] Game roles: `guesser`, `bigFish`, `redHerring` (not assigned to host)
- [ ] Unit tests passing (10+ tests)
- [ ] Integration tests passing
- [ ] Migration script for existing rooms
- [ ] API responses include new player fields

---

## Dependencies

```json
{
  "dependencies": {
    "elysia": "^1.0.0",
    "mongoose": "^8.0.0"
  },
  "devDependencies": {
    "bun-types": "^1.0.0"
  }
}
```

---

## File Structure

```
service/src/
├── models/
│   └── game-room.ts              # Updated Player schema
├── services/
│   └── room-service.ts           # New methods: markDisconnected, markReconnected
├── controllers/
│   └── ws-controller.ts          # Updated open/close handlers
├── types/
│   └── index.ts                  # Updated PlayerResponse type
├── lib/
│   └── migrations/
│       └── add-player-status-fields.ts  # NEW: Migration script
└── __tests__/
    ├── unit/
    │   └── room-service-player-status.test.ts  # NEW
    └── integration/
        └── websocket-player-status.test.ts     # NEW
```
