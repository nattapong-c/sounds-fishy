# WebSocket Architecture & Patterns

## Study Reference: Outsider Project Implementation

This document captures the WebSocket patterns and best practices studied from the Outsider project, adapted for Sounds Fishy.

---

## 🔌 Connection Pattern

### Backend (ElysiaJS)

```typescript
// service/src/controllers/ws-controller.ts
export const wsController = new Elysia()
  .ws('/ws', {
    // Optional: Query parameters for authentication
    query: t.Object({ 
      playerId: t.String(),
      roomId: t.String()
    }),
    
    // Message validation
    body: t.Object({
      type: t.String(),
      data: t.Any(),
    }),
    
    // Connection opened
    open(ws) {
      const { roomId, playerId } = ws.data.query;
      
      // Subscribe to room channel for pub/sub
      ws.subscribe(`room:${roomId}`);
      logger.info(`WebSocket connected: ${roomId}`);
      
      // Send initial state
      ws.send(JSON.stringify({ 
        type: 'room_state_update', 
        room: roomState 
      }));
    },
    
    // Handle messages
    message(ws, message) {
      const { roomId, playerId } = ws.data.query;
      const { type, data } = message;
      
      // Route message by type
      switch (type) {
        case 'join_room':
          handleJoinRoom(ws, roomId, playerId, data);
          break;
        // ... other cases
      }
    },
    
    // Connection closed
    close(ws) {
      const { roomId, playerId } = ws.data.query;
      logger.info(`WebSocket disconnected: ${roomId}`);
      
      // Update player status
      // Broadcast to room
      ws.publish(`room:${roomId}`, JSON.stringify({
        type: 'player_left',
        playerId
      }));
    }
  });
```

### Frontend (Native WebSocket)

```typescript
// app/src/hooks/useWebSocket.ts
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
  `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

export const useWebSocket = (roomId: string, playerId: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    const ws = new WebSocket(`${WS_URL}/ws?roomId=${roomId}&playerId=${playerId}`);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onclose = () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
      
      // Auto-reconnect with exponential backoff
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
        setTimeout(connect, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    wsRef.current = ws;
  }, [roomId, playerId]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  const send = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  return { isConnected, send };
};
```

---

## 🔄 Reconnection Strategy

### Exponential Backoff Pattern

```typescript
const useReconnectingWebSocket = (url: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const MAX_RECONNECT_DELAY = 10000; // 10 seconds

  const connect = () => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      reconnectAttempts.current = 0;
    };
    
    ws.onclose = () => {
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current++;
        
        // Exponential backoff: 1s, 2s, 4s, 8s, 10s (capped)
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          MAX_RECONNECT_DELAY
        );
        
        setTimeout(connect, delay);
      }
    };
    
    wsRef.current = ws;
  };
};
```

### Connection State Management

```typescript
enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed'
}

const [connectionState, setConnectionState] = useState(ConnectionState.CONNECTING);

// Update state based on events
ws.onopen = () => setConnectionState(ConnectionState.CONNECTED);
ws.onclose = () => {
  if (reconnectAttempts.current > 0) {
    setConnectionState(ConnectionState.RECONNECTING);
  } else {
    setConnectionState(ConnectionState.DISCONNECTED);
  }
};
ws.onerror = () => {
  if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
    setConnectionState(ConnectionState.FAILED);
  }
};
```

---

## 📡 Message Handling Pattern

### Message Type Routing

```typescript
// Backend: Route messages by type
message(ws, message: any) {
  const { type, data } = message;
  
  switch (type) {
    case 'join_room':
      handleJoinRoom(ws, data);
      break;
    case 'leave_room':
      handleLeaveRoom(ws, data);
      break;
    case 'ready_up':
      handleReadyUp(ws, data);
      break;
    case 'start_game':
      handleStartGame(ws, data);
      break;
    default:
      logger.warn(`Unknown message type: ${type}`);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Unknown message type' 
      }));
  }
}

// Frontend: Handle incoming messages
const handleMessage = (message: { type: string; data: any }) => {
  switch (message.type) {
    case 'room_updated':
      setRoom(message.data);
      break;
    case 'player_joined':
      toast(`${message.data.playerName} joined!`);
      break;
    case 'game_started':
      router.push(`/room/${roomCode}/briefing`);
      break;
    case 'error':
      setError(message.data.message);
      break;
  }
};
```

### Message Validation

```typescript
// Backend: Validate message structure
.ws('/ws', {
  body: t.Object({
    type: t.String(),
    data: t.Any(),
  }),
  
  message(ws, message) {
    // Type guard
    if (!message.type || typeof message.type !== 'string') {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
      return;
    }
    
    // Process message...
  }
})
```

---

## 🏠 Room-Based Pub/Sub Pattern

### Subscribe to Room Channel

```typescript
// Backend
open(ws) {
  const { roomId } = ws.data.query;
  
  // Subscribe to room channel
  ws.subscribe(`room:${roomId}`);
  
  // Broadcast to room
  ws.publish(`room:${roomId}`, JSON.stringify({
    type: 'player_joined',
    playerId: ws.data.playerId,
    playerName: ws.data.playerName
  }));
}
```

### Publish to Room

```typescript
// Broadcast to all players in room
ws.publish(`room:${roomId}`, JSON.stringify({
  type: 'room_updated',
  room: roomData
}));

// Send to specific player only
ws.send(JSON.stringify({
  type: 'your_role',
  role: 'bigFish',
  secretWord: 'Dog'
}));
```

---

## ❌ Error Handling Pattern

### Client-Side Error Handling

```typescript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  
  // Don't expose internal errors to users
  setError('Connection lost. Attempting to reconnect...');
};

ws.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    
    // Handle error messages from server
    if (message.type === 'error') {
      toast.error(message.data.message);
      return;
    }
    
    handleMessage(message);
  } catch (e) {
    console.error('Failed to parse message:', e);
  }
};
```

### Server-Side Error Handling

```typescript
message(ws, message: any) {
  try {
    const { type, data } = message;
    
    switch (type) {
      case 'join_room':
        handleJoinRoom(ws, data);
        break;
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  } catch (error) {
    logger.error('WebSocket message error:', error);
    
    // Send error to client
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }));
  }
}
```

---

## 🔐 Authentication Pattern

### Query Parameter Authentication

```typescript
// Backend: Validate on connection
.ws('/ws', {
  query: t.Object({
    playerId: t.String(),
    roomId: t.String(),
    // Optional: token for additional auth
    token: t.Optional(t.String())
  }),
  
  open(ws) {
    const { playerId, roomId, token } = ws.data.query;
    
    // Validate player exists in room
    const room = await RoomModel.findOne({ roomId });
    if (!room || !room.players.find(p => p.id === playerId)) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid player or room' 
      }));
      ws.close();
      return;
    }
    
    // Optional: Validate token
    if (token && !validateToken(token, playerId)) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid authentication token' 
      }));
      ws.close();
      return;
    }
    
    // Connection valid
    ws.subscribe(`room:${roomId}`);
  }
})
```

### Frontend: Include Auth in Connection

```typescript
const connectWebSocket = () => {
  const ws = new WebSocket(
    `${WS_URL}/ws?roomId=${roomId}&playerId=${playerId}&token=${authToken}`
  );
  
  ws.onopen = () => {
    console.log('✅ Connected and authenticated');
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'error' && message.message.includes('authentication')) {
      // Redirect to login or re-authenticate
      router.push('/login');
    }
  };
};
```

---

## 🎯 Sounds Fishy Implementation

### Backend WebSocket Events

```typescript
// service/src/controllers/ws-controller.ts
export const wsController = new Elysia()
  .ws('/ws', {
    query: t.Object({
      playerId: t.String(),
      roomCode: t.String()
    }),
    
    body: t.Object({
      type: t.String(),
      data: t.Any()
    }),
    
    open(ws) {
      const { roomCode, playerId } = ws.data.query;
      ws.subscribe(`room:${roomCode}`);
      logger.info(`✅ WS connected: ${roomCode}`);
    },
    
    message(ws, message) {
      const { type, data } = message;
      
      switch (type) {
        case 'join_room':
          handleJoinRoom(ws, data);
          break;
        case 'leave_room':
          handleLeaveRoom(ws, data);
          break;
        case 'ready_up':
          handleReadyUp(ws, data);
          break;
        case 'start_game':
          handleStartGame(ws, data);
          break;
        case 'generate_lie':
          handleGenerateLie(ws, data);
          break;
        case 'eliminate_player':
          handleEliminatePlayer(ws, data);
          break;
        case 'bank_points':
          handleBankPoints(ws, data);
          break;
        default:
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Unknown message type' 
          }));
      }
    },
    
    close(ws) {
      const { roomCode, playerId } = ws.data.query;
      logger.info(`❌ WS disconnected: ${roomCode}`);
      
      // Handle player disconnect
      handlePlayerDisconnect(ws, roomCode, playerId);
    }
  });
```

### Frontend WebSocket Hook

```typescript
// app/src/hooks/useWebSocket.ts
export const useWebSocket = (roomCode: string, playerId: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    
    const ws = new WebSocket(`${WS_URL}/ws?roomCode=${roomCode}&playerId=${playerId}`);

    ws.onopen = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      reconnectAttempts.current = 0;
    };

    ws.onclose = () => {
      setIsConnected(false);
      
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        setIsReconnecting(true);
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        setTimeout(connect, delay);
      } else {
        setIsReconnecting(false);
      }
    };

    ws.onerror = () => {
      console.error('WebSocket error');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Handle message based on type
        handleMessage(message);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    wsRef.current = ws;
  }, [roomCode, playerId]);

  const send = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  return {
    isConnected,
    isReconnecting,
    send,
    connect
  };
};
```

---

## 📊 Comparison: Outsider vs Sounds Fishy

| Aspect | Outsider | Sounds Fishy |
|--------|----------|--------------|
| **Endpoint** | `/ws/rooms/:roomId` | `/ws` |
| **Auth** | Query params (deviceId, roomId) | Query params (playerId, roomCode) |
| **Reconnection** | Manual (in component) | Automatic (in hook) |
| **Message Format** | `{ type, data }` | `{ type, data }` |
| **Pub/Sub** | Room channels | Room channels |
| **Error Handling** | Server sends error messages | Same pattern |

---

## ✅ Best Practices Summary

1. **Always validate on connection** - Check player/room exists
2. **Use exponential backoff** - 1s, 2s, 4s, 8s, 10s (capped)
3. **Subscribe to room channels** - Enables easy broadcasting
4. **Send error messages to clients** - Don't just log server-side
5. **Handle reconnection gracefully** - Show UI state to users
6. **Clean up on disconnect** - Update player status, notify room
7. **Validate message structure** - Type guards prevent crashes
8. **Use TypeScript** - Type-safe message handlers
9. **Log connections/disconnections** - Debugging and monitoring
10. **Separate concerns** - Hook for connection, component for UI

---

## 🔧 Configuration

### Environment Variables

```bash
# Backend (service/.env)
PORT=3001
FRONTEND_URL=http://localhost:3000

# Frontend (app/.env)
NEXT_PUBLIC_WS_URL=ws://localhost:3001
# Or auto-detect based on protocol:
# NEXT_PUBLIC_WS_URL=wss://your-domain.com for production
```

---

## 📚 References

- **Outsider Project:** `/Users/airm1/Desktop/code/outsider/`
  - Backend: `service/src/controllers/ws-controller.ts`
  - Frontend: `app/src/app/[roomId]/page.tsx`
- **ElysiaJS WebSocket Docs:** https://elysiajs.com/
- **MDN WebSocket API:** https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
