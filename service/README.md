# Sounds Fishy - Backend Service

Backend service for the Sounds Fishy digital companion app. Built with **Bun** and **ElysiaJS** for ultra-fast performance.

## 🚀 Quick Start

### Prerequisites

- **Bun** (v1.0.0+) - [Install Guide](https://bun.sh/)
- **MongoDB** (v7.0+) - Local or cloud (Atlas)

### Installation

```bash
# Navigate to service directory
cd service

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# See Environment Variables section below
```

### Running the Service

```bash
# Development mode (with hot reload)
bun run dev

# Production mode
bun run start
```

The server will start on `http://localhost:3001`

### Testing

```bash
# Run all tests
bun test

# Run unit tests only
bun run test:unit

# Run integration tests only
bun run test:integration
```

---

## 📋 Environment Variables

Create a `.env` file in the `service/` directory:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sounds-fishy
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sounds-fishy

# Server Configuration
PORT=3001
HOST=0.0.0.0

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# AI Configuration (Optional - for Phase 2)
# AI_API_KEY=sk-your-api-key-here
# AI_MODEL=gpt-3.5-turbo
# AI_BASE_URL=https://api.openai.com/v1
```

### Environment Variable Details

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ Yes | - | MongoDB connection string |
| `PORT` | ❌ No | `3001` | Server port number |
| `HOST` | ❌ No | `0.0.0.0` | Network interface to bind |
| `FRONTEND_URL` | ❌ No | `http://localhost:3000` | Frontend URL for CORS |
| `AI_API_KEY` | ❌ No | - | OpenAI-compatible API key |
| `AI_MODEL` | ❌ No | `gpt-3.5-turbo` | AI model to use |
| `AI_BASE_URL` | ❌ No | `https://api.openai.com/v1` | AI API base URL |

---

## 📡 API Endpoints

All endpoints are prefixed with `/api`.

### Room Management

#### `POST /api/rooms` - Create Room
Create a new game room.

**Request:**
```json
{
  "hostName": "Player One"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "507f1f77bcf86cd799439011",
    "roomCode": "FISH42",
    "hostId": "player-123"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Host name is required"
}
```

---

#### `GET /api/rooms/:roomCode` - Get Room
Retrieve room details and current state.

**Parameters:**
- `roomCode` (path) - 6-character room code (case-insensitive)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "roomCode": "FISH42",
    "hostId": "player-123",
    "status": "lobby",
    "players": [
      {
        "playerId": "player-123",
        "name": "Player One",
        "role": "host",
        "score": 0,
        "isReady": false
      }
    ],
    "currentRound": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Room not found"
}
```

---

#### `POST /api/rooms/:roomCode/join` - Join Room
Join an existing game room.

**Parameters:**
- `roomCode` (path) - 6-character room code

**Request:**
```json
{
  "playerName": "Player Two"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "playerId": "player-456",
    "roomCode": "FISH42"
  }
}
```

**Error Responses:**
```json
// 400 - Player name required
{
  "success": false,
  "error": "Player name is required"
}

// 404 - Room not found
{
  "success": false,
  "error": "Room not found"
}
```

---

#### `POST /api/rooms/:roomCode/leave` - Leave Room
Leave a game room.

**Parameters:**
- `roomCode` (path) - 6-character room code

**Request:**
```json
{
  "playerId": "player-456"
}
```

**Response:**
```json
{
  "success": true
}
```

**Note:** If the host leaves, host privileges are automatically transferred to the first remaining player. If the last player leaves, the room is deleted.

---

#### `POST /api/rooms/:roomCode/ready` - Toggle Ready
Toggle a player's ready status.

**Parameters:**
- `roomCode` (path) - 6-character room code

**Request:**
```json
{
  "playerId": "player-456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allReady": true
  }
}
```

**Note:** `allReady` indicates if all players in the room are ready to start.

---

#### `POST /api/rooms/:roomCode/start` - Start Game
Start the game (host only).

**Parameters:**
- `roomCode` (path) - 6-character room code

**Response:**
```json
{
  "success": true,
  "data": {
    "roomCode": "FISH42",
    "status": "briefing"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Not enough players to start (minimum 3)"
}
```

---

## 🔌 WebSocket Events

Real-time communication via ElysiaJS built-in WebSocket.

### Connection

**Endpoint:** `ws://localhost:3001/ws`

**Query Parameters:**
- `roomCode` (required) - Room code to join
- `playerId` (optional) - Player identifier

**Example Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3001/ws?roomCode=FISH42&playerId=player-123');
```

**Connection Response:**
```json
{
  "type": "connected",
  "data": {
    "roomCode": "FISH42",
    "playerId": "player-123"
  }
}
```

---

### Message Format

All WebSocket messages follow this structure:

```typescript
{
  type: string;  // Event name
  data: any;     // Event payload
}
```

---

### Client → Server Events

#### `join_room`
Player joins a room's WebSocket channel.

**Payload:**
```json
{
  "type": "join_room",
  "data": {
    "roomCode": "FISH42",
    "playerId": "player-123"
  }
}
```

---

#### `leave_room`
Player leaves the room.

**Payload:**
```json
{
  "type": "leave_room",
  "data": {
    "roomCode": "FISH42",
    "playerId": "player-123"
  }
}
```

---

#### `ready_up`
Toggle player's ready status.

**Payload:**
```json
{
  "type": "ready_up",
  "data": {
    "roomCode": "FISH42",
    "playerId": "player-123"
  }
}
```

---

#### `start_game`
Host starts the game.

**Payload:**
```json
{
  "type": "start_game",
  "data": {
    "roomCode": "FISH42"
  }
}
```

---

### Server → Client Events

#### `room_updated`
Broadcast when room state changes.

**Payload:**
```json
{
  "type": "room_updated",
  "data": {
    "_id": "...",
    "roomCode": "FISH42",
    "hostId": "player-123",
    "status": "lobby",
    "players": [...],
    "currentRound": 1
  }
}
```

---

#### `player_joined`
A player joined the room.

**Payload:**
```json
{
  "type": "player_joined",
  "data": {
    "playerId": "player-456",
    "playerName": "Player Two",
    "playerCount": 3
  }
}
```

---

#### `player_left`
A player left the room.

**Payload:**
```json
{
  "type": "player_left",
  "data": {
    "playerId": "player-456",
    "playerName": "Player Two",
    "remainingCount": 2,
    "newHostId": "player-789"  // Only if host left
  }
}
```

---

#### `host_transferred`
Host privileges transferred to a new player.

**Payload:**
```json
{
  "type": "host_transferred",
  "data": {
    "newHostId": "player-789",
    "newHostName": "Player Three"
  }
}
```

---

#### `left_room`
Confirmation sent to leaving player.

**Payload:**
```json
{
  "type": "left_room",
  "data": {
    "roomCode": "FISH42",
    "playerId": "player-456"
  }
}
```

---

#### `room_deleted`
Room was deleted (sent when last player leaves).

**Payload:**
```json
{
  "type": "room_deleted",
  "data": {
    "roomCode": "FISH42",
    "reason": "Host left and room was empty"
  }
}
```

---

#### `all_players_ready`
All players are ready to start.

**Payload:**
```json
{
  "type": "all_players_ready",
  "data": {
    "roomCode": "FISH42"
  }
}
```

---

#### `game_started`
Game has started.

**Payload:**
```json
{
  "type": "game_started",
  "data": {
    "roomCode": "FISH42",
    "status": "briefing"
  }
}
```

---

#### `start_round`
Round started with role-specific information.

**Payload (Guesser):**
```json
{
  "type": "start_round",
  "data": {
    "question": "What animal is known for...?",
    "role": "guesser"
  }
}
```

**Payload (Big Fish):**
```json
{
  "type": "start_round",
  "data": {
    "question": "What animal is known for...?",
    "secretWord": "Dolphin",
    "role": "bigFish"
  }
}
```

**Payload (Red Herring):**
```json
{
  "type": "start_round",
  "data": {
    "question": "What animal is known for...?",
    "canGenerateLie": true,
    "role": "redHerring"
  }
}
```

---

#### `error`
Error message.

**Payload:**
```json
{
  "type": "error",
  "data": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room not found"
  }
}
```

---

## 🗄️ Database Schema

### GameRoom Collection

```typescript
{
  _id: ObjectId,
  roomCode: string,           // 6-character code (e.g., "FISH42")
  hostId: string,             // PlayerId of the host
  status: string,             // 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary' | 'completed'
  players: [{
    playerId: string,
    name: string,
    role: string,             // 'guesser' | 'bigFish' | 'redHerring' | 'host'
    score: number,
    isReady: boolean,
    generatedLie?: string,
    eliminatedInRound?: number
  }],
  currentRound: number,       // Current round number
  secretWord?: string,        // Correct answer (for Big Fish)
  question?: string,          // Question prompt
  eliminatedPlayers: [{
    playerId: string,
    round: number,
    wasBigFish: boolean
  }],
  roundHistory: [{
    roundNumber: number,
    secretWord: string,
    question: string,
    guesserScore: number,
    bigFishScore: number,
    redHerringScores: number[],
    bustOccurred: boolean
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `roomCode` - Unique, case-insensitive
- Automatic `createdAt` and `updatedAt` timestamps

---

## 🏗️ Architecture

### Project Structure

```
service/
├── src/
│   ├── controllers/          # Route & WebSocket handlers
│   │   ├── room-controller.ts
│   │   └── ws-controller.ts
│   ├── models/               # MongoDB schemas + TypeScript interfaces
│   │   ├── game-room.ts
│   │   └── index.ts
│   ├── services/             # Core business logic
│   │   └── room-service.ts
│   ├── types/                # Type aliases and API contracts
│   │   └── index.ts
│   ├── lib/                  # Utilities and infrastructure
│   │   ├── database.ts
│   │   ├── errors.ts
│   │   └── logger.ts
│   ├── __tests__/            # Test files
│   │   ├── unit/
│   │   └── integration/
│   └── index.ts              # Elysia entry point
├── .env.example
├── .env
├── package.json
└── bun.lockb
```

### Design Patterns

**Clean Architecture:**
- **Controllers:** Handle HTTP/WebSocket concerns only
- **Services:** Pure business logic (no HTTP/WS dependencies)
- **Models:** Data validation and persistence
- **Lib:** Infrastructure (database, logging, errors)

**Dependency Injection:**
- Services instantiated once and shared
- Easy to mock for testing

**Error Handling:**
- Custom error classes with status codes
- Global error middleware
- Consistent error response format

---

## 🧪 Testing

### Test Structure

```
__tests__/
├── unit/                     # Isolated unit tests
│   └── room-service.test.ts
└── integration/              # Integration tests
    ├── room-api.test.ts
    └── websocket.test.ts
```

### Running Tests

```bash
# All tests
bun test

# Unit tests only
bun run test:unit

# Integration tests only
bun run test:integration

# With coverage (future)
bun test --coverage
```

### Test Database

Integration tests use a separate test database:
```bash
MONGODB_URI=mongodb://localhost:27017/sounds-fishy-test
```

### Writing Tests

**Unit Test Example:**
```typescript
// __tests__/unit/room-service.test.ts
import { describe, test, expect } from 'bun:test';
import { roomService } from '../../services/room-service';

describe('RoomService', () => {
  test('generateRoomCode should return 6-character string', () => {
    const code = roomService.generateRoomCode();
    expect(code).toHaveLength(6);
  });

  test('assignRoles should assign 1 guesser, 1 big fish, rest red herrings', () => {
    // Test implementation
  });
});
```

**Integration Test Example:**
```typescript
// __tests__/integration/room-api.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import { app } from '../../index';

describe('Room API', () => {
  test('POST /api/rooms should create room', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .send({ hostName: 'Test Host' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.roomCode).toHaveLength(6);
  });
});
```

---

## 🔧 Troubleshooting

### MongoDB Connection Issues

**Error: `MongoServerError: Authentication failed`**
- Verify `MONGODB_URI` in `.env` is correct
- For Atlas: Check IP whitelist includes your server
- For local: Ensure MongoDB is running

**Error: `connect ECONNREFUSED`**
```bash
# Check if MongoDB is running
pgrep -x mongod

# Start MongoDB (macOS)
brew services start mongodb-community

# Start MongoDB (Linux)
sudo systemctl start mongod
```

### Port Already in Use

**Error: `EADDRINUSE: address already in use`**
```bash
# Find process on port 3001
lsof -ti:3001

# Kill the process
lsof -ti:3001 | xargs kill -9
```

### CORS Errors

**Browser console: `Access-Control-Allow-Origin` error**
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Ensure backend is running before starting frontend
- Clear browser cache and hard refresh

### WebSocket Connection Issues

**WebSocket fails to connect:**
1. Check backend is running on correct port
2. Verify query parameters: `ws://localhost:3001/ws?roomCode=FISH42&playerId=player-123`
3. Check browser console for connection errors
4. Verify CORS settings allow WebSocket connections

### Room Not Found

**Error: `Room not found`**
- Room codes are case-insensitive (converted to uppercase internally)
- Room may have been deleted if all players left
- Verify room was created successfully via `GET /api/rooms/:roomCode`

### Host Transfer Issues

**Host leaves but no new host assigned:**
- Ensure at least one other player is in the room
- Check `host_transferred` WebSocket event is received
- Verify database update via `GET /api/rooms/:roomCode`

---

## 📝 Development Workflow

1. **Start MongoDB**
   ```bash
   brew services start mongodb-community  # macOS
   ```

2. **Install Dependencies**
   ```bash
   cd service
   bun install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start Development Server**
   ```bash
   bun run dev
   ```

5. **Run Tests**
   ```bash
   bun test
   ```

6. **Make Changes**
   - Edit files in `src/`
   - Server auto-reloads with hot reload
   - Tests run on save (optional)

---

## 🚀 Deployment

### Environment Variables for Production

```bash
MONGODB_URI=mongodb+srv://...  # Use MongoDB Atlas
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app
```

### Deploy to Render

1. Connect GitHub repository
2. Set environment variables in Render dashboard
3. Build command: `bun install`
4. Start command: `bun run start`

### Health Check

Endpoint: `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📚 Additional Documentation

- **[AGENTS.md](../AGENTS.md)** - Game rules and flow
- **[BACKEND.md](../BACKEND.md)** - Detailed backend architecture
- **[SETUP.md](../SETUP.md)** - Complete setup guide
- **[WEBSOCKET_PATTERNS.md](../WEBSOCKET_PATTERNS.md)** - WebSocket implementation patterns

---

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Write tests
4. Run `bun test` to verify
5. Submit pull request

## 📄 License

MIT
