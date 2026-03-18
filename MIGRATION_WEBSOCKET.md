# WebSocket Migration Notes: Socket.io → ElysiaJS Built-in WebSocket

## Overview
The backend has been migrated from **Socket.io** to **ElysiaJS built-in WebSocket** (`Elysia.ws()`). This migration simplifies the architecture by using native WebSocket functionality built into ElysiaJS and Bun's uWebSocket implementation.

---

## Key Changes

### 1. Connection Endpoint
**Before (Socket.io):**
```typescript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3001', {
  transports: ['websocket']
});
```

**After (ElysiaJS Built-in WS):**
```typescript
const ws = new WebSocket('ws://localhost:3001/ws');
```

---

### 2. Message Format

**Before (Socket.io):**
```typescript
// Events were sent with event names
socket.emit('join_room', { roomCode: 'ABC123', playerId: 'player-1' });

// Listeners were registered per event
socket.on('room_updated', (data) => {
  console.log('Room updated:', data);
});
```

**After (ElysiaJS Built-in WS):**
```typescript
// All messages follow a standard format: { type, data }
ws.send(JSON.stringify({
  type: 'join_room',
  data: { roomCode: 'ABC123', playerId: 'player-1' }
}));

// Single message handler, route by type
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'room_updated':
      console.log('Room updated:', message.data);
      break;
    case 'player_joined':
      console.log('Player joined:', message.data);
      break;
  }
};
```

---

### 3. Event Mapping

All event names remain the **same**, only the transmission format changes:

| Event Name | Direction | Before (Socket.io) | After (ElysiaJS WS) |
|------------|-----------|-------------------|---------------------|
| `join_room` | Client → Server | `socket.emit('join_room', data)` | `ws.send(JSON.stringify({ type: 'join_room', data }))` |
| `leave_room` | Client → Server | `socket.emit('leave_room', data)` | `ws.send(JSON.stringify({ type: 'leave_room', data }))` |
| `ready_up` | Client → Server | `socket.emit('ready_up', data)` | `ws.send(JSON.stringify({ type: 'ready_up', data }))` |
| `start_game` | Client → Server | `socket.emit('start_game', data)` | `ws.send(JSON.stringify({ type: 'start_game', data }))` |
| `room_updated` | Server → Client | `socket.on('room_updated', cb)` | `message.type === 'room_updated'` |
| `player_joined` | Server → Client | `socket.on('player_joined', cb)` | `message.type === 'player_joined'` |
| `player_left` | Server → Client | `socket.on('player_left', cb)` | `message.type === 'player_left'` |
| `game_started` | Server → Client | `socket.on('game_started', cb)` | `message.type === 'game_started'` |
| `all_players_ready` | Server → Client | `socket.on('all_players_ready', cb)` | `message.type === 'all_players_ready'` |
| `start_round` | Server → Client | `socket.on('start_round', cb)` | `message.type === 'start_round'` |
| `error` | Server → Client | `socket.on('error', cb)` | `message.type === 'error'` |

---

## Frontend Implementation Example

### WebSocket Service/Hook

```typescript
// app/src/hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';

interface WSMessage {
  type: string;
  data: any;
}

interface UseWebSocketOptions {
  onRoomUpdated?: (data: any) => void;
  onPlayerJoined?: (data: any) => void;
  onPlayerLeft?: (data: any) => void;
  onGameStarted?: (data: any) => void;
  onStartRound?: (data: any) => void;
  onError?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data);
      
      console.log('📨 WS Message:', message.type, message.data);

      // Route messages by type
      switch (message.type) {
        case 'room_updated':
          options.onRoomUpdated?.(message.data);
          break;
        case 'player_joined':
          options.onPlayerJoined?.(message.data);
          break;
        case 'player_left':
          options.onPlayerLeft?.(message.data);
          break;
        case 'game_started':
          options.onGameStarted?.(message.data);
          break;
        case 'start_round':
          options.onStartRound?.(message.data);
          break;
        case 'error':
          options.onError?.(message.data);
          console.error('WS Error:', message.data);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('❌ WebSocket disconnected');
      
      // Attempt reconnection
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current += 1;
        console.log(`🔄 Reconnecting... (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
        setTimeout(connect, 2000 * reconnectAttempts.current);
      }
    };

    wsRef.current = ws;
  }, [options]);

  const send = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.error('WebSocket not connected');
    }
  }, []);

  const joinRoom = useCallback((roomCode: string, playerId: string) => {
    send('join_room', { roomCode, playerId });
  }, [send]);

  const leaveRoom = useCallback((roomCode: string, playerId: string) => {
    send('leave_room', { roomCode, playerId });
  }, [send]);

  const readyUp = useCallback((roomCode: string, playerId: string) => {
    send('ready_up', { roomCode, playerId });
  }, [send]);

  const startGame = useCallback((roomCode: string, hostId: string) => {
    send('start_game', { roomCode, hostId });
  }, [send]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    ws: wsRef.current,
    joinRoom,
    leaveRoom,
    readyUp,
    startGame,
    send,
  };
}
```

---

### Usage in Component

```typescript
// app/src/app/room/[roomCode]/page.tsx
'use client';

import { useWebSocket } from '@/hooks/useWebSocket';

export default function RoomPage({ params }: { params: { roomCode: string } }) {
  const { joinRoom, leaveRoom, readyUp, startGame } = useWebSocket({
    onRoomUpdated: (data) => {
      console.log('Room state updated:', data);
      // Update room state in your store/context
    },
    onPlayerJoined: (data) => {
      console.log(`${data.playerName} joined the room`);
    },
    onPlayerLeft: (data) => {
      console.log(`${data.playerName} left the room`);
    },
    onGameStarted: (data) => {
      console.log('Game started!', data);
      // Navigate to game screen
    },
    onStartRound: (data) => {
      console.log('Round started:', data);
      // Show role-specific screen based on data.role
    },
    onError: (data) => {
      console.error('Error:', data.message);
      // Show error toast
    },
  });

  const handleJoin = () => {
    joinRoom(params.roomCode, 'player-123');
  };

  const handleReady = () => {
    readyUp(params.roomCode, 'player-123');
  };

  const handleStart = () => {
    startGame(params.roomCode, 'host-123');
  };

  return (
    <div>
      <h1>Room: {params.roomCode}</h1>
      <button onClick={handleJoin}>Join Room</button>
      <button onClick={handleReady}>Ready Up</button>
      <button onClick={handleStart}>Start Game (Host)</button>
      <button onClick={() => leaveRoom(params.roomCode, 'player-123')}>
        Leave Room
      </button>
    </div>
  );
}
```

---

## Migration Checklist for Frontend

### Dependencies
- [ ] Remove `socket.io-client` from `package.json`
- [ ] No replacement needed - use native `WebSocket` API

### Code Changes
- [ ] Replace Socket.io initialization with `new WebSocket('ws://host:port/ws')`
- [ ] Update all `socket.emit()` calls to `ws.send(JSON.stringify({ type, data }))`
- [ ] Replace `socket.on()` listeners with `ws.onmessage` handler
- [ ] Implement message routing by `message.type`
- [ ] Update reconnection logic (native WebSocket doesn't auto-reconnect)
- [ ] Update connection state management

### Testing
- [ ] Test WebSocket connection establishment
- [ ] Test all client→server events
- [ ] Test all server→client events
- [ ] Test reconnection on disconnect
- [ ] Test error handling

---

## Benefits of Migration

1. **Simpler Architecture**: No separate Socket.io server setup - WebSocket is built into ElysiaJS
2. **Native Performance**: Uses Bun's native uWebSocket implementation (µWebSockets)
3. **Smaller Bundle**: No Socket.io client library (~30KB saved)
4. **Type Safety**: Better TypeScript integration with ElysiaJS
5. **Unified Codebase**: WebSocket logic lives alongside REST routes
6. **No Extra Dependencies**: WebSocket support is built-in, no `@elysiajs/ws` package needed

---

## Breaking Changes

⚠️ **Message Format**: All WebSocket messages must now include `type` and `data` fields

**Old:**
```typescript
socket.emit('join_room', { roomCode: 'ABC' });
```

**New:**
```typescript
ws.send(JSON.stringify({
  type: 'join_room',
  data: { roomCode: 'ABC' }
}));
```

⚠️ **Connection Endpoint**: Changed from HTTP to WebSocket endpoint

**Old:** `http://localhost:3001` (Socket.io upgrades HTTP)  
**New:** `ws://localhost:3001/ws` (direct WebSocket endpoint)

⚠️ **No Auto-Reconnection**: Socket.io had built-in reconnection. Native WebSocket requires manual implementation.

---

## Environment Variables

Update your frontend `.env.local`:

```bash
# Old
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# New
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

---

## Support

For questions or issues during migration, refer to:
- Backend documentation: `BACKEND.md`
- WebSocket controller: `service/src/controllers/ws-controller.ts`
- ElysiaJS WebSocket docs: https://github.com/elysiajs/elysia-ws
