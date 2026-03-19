# DeviceId Identity Pattern - Quick Reference

**Based on:** Outsider Project's proven identity system  
**Purpose:** Zero-friction player identity with automatic reconnection

---

## 🎯 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                  DeviceId Identity Flow                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. First Visit                                             │
│     ┌──────────┐      Generate UUID       ┌──────────┐     │
│     │ Browser  │─────────────────────────►│  Server  │     │
│     │          │                          │          │     │
│     │          │◄──────────────────────────│          │     │
│     │          │   Store in localStorage   │          │     │
│     └──────────┘                           └──────────┘     │
│                                                             │
│  2. Join Room                                               │
│     ┌──────────┐      Send deviceId       ┌──────────┐     │
│     │ Browser  │─────────────────────────►│  Server  │     │
│     │          │                          │          │     │
│     │          │  Check: deviceId exists? │          │     │
│     │          │                          │          │     │
│     │          │  YES: Reconnect player   │          │     │
│     │          │  NO: Create new player   │          │     │
│     └──────────┘                          └──────────┘     │
│                                                             │
│  3. Page Refresh / Browser Restart                          │
│     ┌──────────┐      Read from storage   ┌──────────┐     │
│     │ Browser  │─────────────────────────►│  Server  │     │
│     │          │                          │          │     │
│     │          │  Same deviceId = same    │          │     │
│     │          │  player (auto-reconnect) │          │     │
│     └──────────┘                          └──────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation

### Frontend: Generate & Store DeviceId

```typescript
// app/src/hooks/useDeviceId.ts
'use client';

import { useState, useEffect } from 'react';

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get existing deviceId from localStorage
    let id = localStorage.getItem('deviceId');
    
    // Generate new one if doesn't exist
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('deviceId', id);
    }
    
    setDeviceId(id);
  }, []);

  return deviceId;
};
```

### Frontend: Use in Room Creation

```typescript
// app/src/app/page.tsx
const deviceId = useDeviceId();

const handleCreateRoom = async () => {
  const response = await roomAPI.createRoom({ 
    hostName,
    deviceId  // Send deviceId to backend
  });
  
  if (response.success) {
    // Navigate to room - deviceId already stored
    router.push(`/room/${response.data.roomCode}`);
  }
};
```

### Frontend: Use in Join Room

```typescript
// app/src/app/room/[roomCode]/page.tsx
const deviceId = useDeviceId();

const handleJoinRoom = async () => {
  const response = await roomAPI.joinRoom(roomCode, { 
    playerName,
    deviceId  // Send deviceId to backend
  });
  
  if (response.success) {
    // Backend will check if deviceId exists in room
    // If yes: reconnect same player
    // If no: create new player
  }
};
```

### Frontend: WebSocket Connection

```typescript
// app/src/hooks/useSocket.ts
const buildWSUrl = useCallback(() => {
  const params = new URLSearchParams();
  if (roomCode) params.set('roomCode', roomCode);
  if (deviceId) params.set('deviceId', deviceId);  // Auth via query param
  
  return `${process.env.NEXT_PUBLIC_WS_URL}/ws?${params.toString()}`;
}, [roomCode, deviceId]);
```

### Backend: Player Schema

```typescript
// service/src/models/game-room.ts
const playerSchema = new Schema({
  deviceId: { type: String, required: true, index: true },  // Persistent identity
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
  isReady: { type: Boolean, default: false }
});
```

### Backend: Room Creation

```typescript
// service/src/controllers/room-controller.ts
.post('/rooms',
  async ({ body }) => {
    const { hostName, deviceId } = body;
    const roomCode = await generateUniqueRoomCode();

    const room = await GameRoom.create({
      roomCode,
      hostId: deviceId,  // Host is identified by deviceId
      players: [{
        deviceId,        // Store deviceId
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
  { body: t.Object({ hostName: t.String(), deviceId: t.String() }) }
)
```

### Backend: Join Room with Reconnection

```typescript
// service/src/controllers/room-controller.ts
.post('/rooms/:roomCode/join',
  async ({ params, body }) => {
    const { roomCode } = params;
    const { playerName, deviceId } = body;
    
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    
    // Check if player with this deviceId already exists
    const existingPlayer = room.players.find(p => p.deviceId === deviceId);
    
    if (existingPlayer) {
      // RECONNECTION: Same deviceId = same player
      existingPlayer.isOnline = true;
      existingPlayer.name = playerName;  // Update name if changed
      await room.save();
      
      logger.info({ roomCode, deviceId }, 'Player reconnected');
      
      return {
        success: true,
        data: { deviceId, rejoined: true }
      };
    }
    
    // NEW PLAYER: Add to room
    if (room.players.length >= 8) {
      throw new BadRequestError('Room is full');
    }
    
    room.players.push({
      deviceId,
      name: playerName,
      isHost: false,
      isOnline: true,
      score: 0,
      isReady: false
    });
    
    await room.save();
    
    logger.info({ roomCode, deviceId }, 'Player joined');
    
    return {
      success: true,
      data: { deviceId, rejoined: false }
    };
  },
  { body: t.Object({ playerName: t.String(), deviceId: t.String() }) }
)
```

### Backend: WebSocket Authentication

```typescript
// service/src/controllers/ws-controller.ts
export const wsController = new Elysia()
  .ws('/ws', {
    query: t.Object({
      roomCode: t.String(),
      deviceId: t.String(),  // Required for authentication
    }),
    open(ws) {
      const { roomCode, deviceId } = ws.data.query;
      
      ws.subscribe(roomCode);
      
      // Mark player as online
      GameRoom.findOne({ roomCode }).then(async (room) => {
        if (!room) return;
        
        const player = room.players.find(p => p.deviceId === deviceId);
        if (player) {
          player.isOnline = true;
          player.lastSeen = new Date();
          await room.save();
          
          // Broadcast room update
          ws.publish(roomCode, {
            type: 'room_updated',
            data: room
          });
        }
      });
      
      ws.send({
        type: 'connected',
        data: { roomCode, deviceId }
      });
    },
    close(ws) {
      const { roomCode, deviceId } = ws.data.query;
      
      // Mark player as offline (don't remove from room)
      GameRoom.findOne({ roomCode }).then(async (room) => {
        if (!room) return;
        
        const player = room.players.find(p => p.deviceId === deviceId);
        if (player) {
          player.isOnline = false;
          player.lastSeen = new Date();
          await room.save();
          
          // Broadcast room update
          ws.publish(roomCode, {
            type: 'room_updated',
            data: room
          });
        }
      });
    },
    // ... message handlers
  });
```

---

## ✅ Benefits

| Benefit | Description |
|---------|-------------|
| **Zero-friction** | No sign-up, no login, no email verification |
| **Persistent** | Survives page refresh, browser restart, tab close |
| **Automatic Reconnection** | Same deviceId = same player, no manual intervention |
| **Simple** | One UUID stored in localStorage |
| **Secure Enough** | deviceId is random, unguessable UUID |
| **Cross-tab** | Same deviceId works across tabs/windows |
| **State Preservation** | Player keeps role, score, ready status |

---

## ⚠️ Important Notes

1. **deviceId is NOT user account** - It's device-specific, not person-specific
   - Clear browser data = new deviceId
   - Different browser = new deviceId
   - Incognito mode = new deviceId each time

2. **Don't expose deviceId to users** - It's an internal identifier
   - Don't let users copy/share it
   - Don't show it in UI

3. **Backend must validate** - Always check deviceId exists in room
   - Prevents unauthorized access
   - Ensures data integrity

4. **Cleanup old devices** - Consider TTL index on rooms
   - Auto-delete rooms after 12-24 hours of inactivity
   - Prevents database bloat

---

## 🔗 References

- **Outsider Study:** `reports/outsider-study.md` section 5.3
- **Implementation Plan:** `IMPLEMENTATION_PLAN.md` section 4
- **Project Guidelines:** `AGENTS.md` section 5.3
