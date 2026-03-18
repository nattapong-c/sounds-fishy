# BACKEND.md - Project "Sounds Fishy" Backend Documentation

## 🎯 Overview
This document details the backend architecture, services, and data models for the **Sounds Fishy** (FishyBusiness Digital) application. The backend handles game logic, real-time communication via WebSockets, and data persistence in MongoDB.

## 🛠 Technology Stack
*   **Framework:** ElysiaJS (with built-in WebSocket)
*   **Runtime:** Bun (v1.0.0+)
*   **Database:** MongoDB (via Mongoose ODM) - **Single source of truth for all data**
*   **Language:** TypeScript (strict mode)
*   **Real-time Communication:** ElysiaJS Built-in WebSocket (Pub/Sub pattern)
*   **AI Integration:** OpenAI-compatible LLM API (configurable API key, model, base URL)
*   **Hosting:** Render

## ✍️ Naming Convention Guidelines (TypeScript Best Practices)
Adhering to consistent naming conventions improves code readability and maintainability.

*   **Variables, Functions, Properties, Method Names**: Use `camelCase`.
    *   Examples: `playerName`, `getGameRoom`, `isValidGuess`, `startGameRound`
*   **Classes, Interfaces, Types (Type Aliases)**: Use `PascalCase`.
    *   Examples: `GameRoom`, `Player`, `IGameState`, `WebSocketMessage`
*   **Enums and Enum Members**: Use `PascalCase` for the enum name and `PascalCase` for its members.
    *   Examples: `GameStatus.InProgress`, `PlayerRole.Guesser`, `PlayerRole.BigFish`, `PlayerRole.RedHerring`
*   **Constants (Global/Module-Level)**: Use `UPPER_SNAKE_CASE`.
    *   Examples: `DEFAULT_PORT`, `MAX_PLAYERS_PER_ROOM`, `DB_CONNECTION_STRING`, `POINTS_FOR_ELIMINATION`
*   **Filenames**: Use `kebab-case` for all files (e.g., `game-controller.ts`, `room-service.ts`, `ai-service.ts`). This applies to all files including models, services, controllers, and utilities.
    *   ✅ Correct: `room-service.ts`, `game-room.ts`, `ai-controller.ts`
    *   ❌ Incorrect: `roomService.ts`, `GameRoom.ts`, `aiController.ts`
*   **Private/Protected Members**: Prefix with an underscore `_`.
    *   Examples: `_privateField`, `_calculateRoundScores`

## 💡 Code Style Examples

### Interfaces
Interfaces define the shape of an object, promoting strong typing and clear contracts.
```typescript
interface IGameRoom {
  id: string;
  roomCode: string;
  status: 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary';
  players: IPlayer[];
  currentRound: number;
  secretWord: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IPlayer {
  id: string;
  name: string;
  role: PlayerRole;
  score: number;
  isReady: boolean;
  generatedLie?: string;
}

type PlayerRole = 'guesser' | 'bigFish' | 'redHerring';
```

### Classes
Classes encapsulate data and behavior. Follow naming conventions for class names, properties, and methods.
```typescript
class GameService {
  private _gameRooms: Map<string, IGameRoom> = new Map(); // Private member example

  constructor() {
    // Initialization logic
  }

  public createNewRoom(hostId: string): IGameRoom {
    const newRoom: IGameRoom = {
      id: crypto.randomUUID(),
      roomCode: this._generateRoomCode(),
      status: 'lobby',
      players: [{ id: hostId, role: 'host', name: 'Host Player', score: 0, isReady: false }],
      currentRound: 1,
      secretWord: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this._gameRooms.set(newRoom.id, newRoom);
    return newRoom;
  }

  public getGameRoom(roomCode: string): IGameRoom | undefined {
    return this._gameRooms.get(roomCode);
  }

  private _assignRoles(players: IPlayer[]): void {
    // Random assignment: 1 Guesser, 1 Big Fish, rest Red Herrings
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    shuffled[0].role = 'guesser';
    shuffled[1].role = 'bigFish';
    for (let i = 2; i < shuffled.length; i++) {
      shuffled[i].role = 'redHerring';
    }
  }

  private _generateRoomCode(): string {
    // Generate a 4-6 character alphanumeric code
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
```

### Type Aliases
Type aliases provide a way to define new names for types, enhancing readability.
```typescript
type PlayerRole = 'guesser' | 'bigFish' | 'redHerring';
type GameStatus = 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary';
type EliminationResult = 'redHerring' | 'bigFish';
```

### Error Handling
Implement custom error classes for specific application errors to provide more context and structured error responses.
```typescript
class CustomAppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'SERVER_ERROR') {
    super(message);
    this.name = 'CustomAppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, CustomAppError.prototype);
  }
}

// Example usage
function joinRoom(roomCode: string, playerId: string) {
  const room = new GameService().getGameRoom(roomCode);
  if (!room) {
    throw new CustomAppError(`Room with code ${roomCode} not found.`, 404, 'ROOM_NOT_FOUND');
  }
  if (room.status !== 'lobby') {
    throw new CustomAppError(`Room ${roomCode} has already started.`, 400, 'ROOM_STARTED');
  }
  // ... rest of join logic
}
```

## ✅ Testing Guidelines

### Frameworks & Tools
*   **Test Runner:** `Bun.test` (Bun's built-in test runner)
*   **Assertion Library:** `expect` (bundled with `Bun.test`)
*   **HTTP Testing:** `Supertest` for testing ElysiaJS HTTP endpoints
*   **WebSocket Testing:** Native WebSocket API in Bun tests

### Types of Tests

#### 🧪 Unit Tests
*   **Focus:** Test individual functions, classes, or modules in isolation.
*   **Scope:** Ensure each unit of code behaves as expected under various inputs.
*   **Mocks:** Heavily utilize mocks for external dependencies (database calls, external APIs).
*   **Location:** Place unit tests in `__tests__/unit` directory or in `*.test.ts` files.

#### 🔗 Integration Tests
*   **Focus:** Verify interaction between components (controller + service + database).
*   **Scope:** Ensure components work correctly when combined.
*   **Environment:** May involve a test MongoDB instance.
*   **Location:** Place integration tests in `__tests__/integration` directory.

#### 🚀 End-to-End (E2E) Tests
*   **Focus:** Test entire system flow from start to finish.
*   **Scope:** Validate critical user journeys (create room → join → play → score).
*   **Tools:** Use `Supertest` for HTTP requests, native WebSocket client for WS events.
*   **Location:** Place E2E tests in `__tests__/e2e` directory.

### WebSocket Testing Example
```typescript
// service/src/__tests__/integration/websocket.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';

describe('WebSocket Events', () => {
  let ws: WebSocket;
  
  beforeAll(async () => {
    ws = new WebSocket('ws://localhost:3001/ws');
    
    await new Promise((resolve) => {
      ws.onopen = resolve;
    });
  });

  test('join_room should add player to room', (done) => {
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'room_updated') {
        expect(message.data.roomCode).toBe('TEST123');
        done();
      }
    };
    
    ws.send(JSON.stringify({
      type: 'join_room',
      data: { roomCode: 'TEST123', playerId: 'player-1' }
    }));
  });

  afterAll(() => {
    ws.close();
  });
});
```

### Best Practices
*   **Clear Test Descriptions:** Use descriptive `describe` and `it`/`test` blocks.
*   **Arrange-Act-Assert (AAA) Pattern:** Structure tests clearly.
*   **Isolate Tests:** Each test should run independently.
*   **Mock External Dependencies:** Prevent reliance on external services.
*   **Test Coverage:** Aim for high coverage on core game logic.
*   **Cleanup:** Ensure tests clean up database entries after execution.
*   **Separate Test Database:** Use a separate MongoDB instance for tests.

## 📂 Project Structure

### File Naming Convention
All files use **kebab-case** naming:
- ✅ `room-controller.ts`, `game-room.ts`, `room-service.ts`
- ❌ `roomController.ts`, `GameRoom.ts`, `roomService.ts`

### `service/src/models/`
**Single Source of Truth for TypeScript Interfaces and Mongoose Models**
- **Mongoose Schemas**: Define structure and validation for MongoDB documents.
- **TypeScript Interfaces**: All interfaces are defined here alongside schemas.
- **Centralized Exports**: `models/index.ts` re-exports all interfaces for easy importing.
- **GameRoom Model**: Stores room code, players, roles, scores, current phase.

**Example:**
```typescript
// service/src/models/game-room.ts
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
  status: GameStatus;
  players: IPlayer[];
  // ...
}

const PlayerSchema = new Schema<IPlayer>({...});
const GameRoomSchema = new Schema<IGameRoom>({...});

export default mongoose.model<IGameRoom>('GameRoom', GameRoomSchema);
```

**Import Pattern:**
```typescript
// Import from models directly
import GameRoom, { IPlayer, IGameRoom } from '../models/game-room';

// Or use centralized exports
import { IPlayer, IGameRoom } from '../models';
```

### `service/src/types/`
**Re-exported Type Aliases and API Contracts**
- Re-exports model interfaces for convenience.
- Defines type aliases (`PlayerRole`, `GameStatus`).
- Socket event type definitions.
- API request/response types.

**Example:**
```typescript
// service/src/types/index.ts
export { IPlayer, IGameRoom } from '../models/game-room';

export type PlayerRole = 'guesser' | 'bigFish' | 'redHerring' | 'host';
export type GameStatus = 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary' | 'completed';
```

### `service/src/controllers/`
**Route and WebSocket Handlers**
- **Route Handlers**: Define HTTP endpoints (REST).
- **WebSocket Handlers**: Manage ElysiaJS WebSocket connections and message processing.
- Import types from `models/` folder.
- Keep only route logic - no business logic.

**Files:**
- `room-controller.ts`: REST API endpoints for room management
- `ws-controller.ts`: WebSocket event handlers for real-time communication

### `service/src/services/`
**Core Business Logic**
- Encapsulates the rules and state transitions of *Sounds Fishy*.
- Import types from `models/` folder.
- Pure business logic - no HTTP/WebSocket concerns.

**Responsibilities:**
- Role distribution (1 Guesser, 1 Big Fish, rest Red Herrings).
- Room code generation.
- Host transfer logic.
- Room auto-deletion.

**Files:**
- `room-service.ts`: Room management and game logic

### `service/src/lib/`
**Utilities and Infrastructure**
- **Database Connection**: Mongoose setup and connection pooling.
- **Middlewares**: Custom Elysia middlewares (authentication, logging, error handling).
- **Error Classes**: Custom error types for consistent error handling.
- **Logger**: Structured logging utility.

### `service/src/index.ts`
**Elysia Entry Point**
- Initializes the Elysia server.
- Registers REST routes and WebSocket handlers.
- Connects to MongoDB.
- Configures CORS.

## 🚀 API Endpoints (REST & WebSockets)

### REST Endpoints

All REST endpoints are prefixed with `/api`.

#### **POST /api/rooms** - Create Room
Create a new game room.

**Request:**
```json
{
  "hostName": "Player One"
}
```

**Response (200):**
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

**Error (400):**
```json
{
  "success": false,
  "error": "Host name is required"
}
```

---

#### **GET /api/rooms/:roomCode** - Get Room
Retrieve room details and current state.

**Parameters:**
- `roomCode` (path) - 6-character room code (case-insensitive)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "roomCode": "FISH42",
    "hostId": "player-123",
    "status": "lobby",
    "players": [...],
    "currentRound": 1
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Room not found"
}
```

---

#### **POST /api/rooms/:roomCode/join** - Join Room
Join an existing game room.

**Parameters:**
- `roomCode` (path) - 6-character room code

**Request:**
```json
{
  "playerName": "Player Two"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "playerId": "player-456",
    "roomCode": "FISH42"
  }
}
```

---

#### **POST /api/rooms/:roomCode/leave** - Leave Room
Leave a game room.

**Parameters:**
- `roomCode` (path) - 6-character room code

**Request:**
```json
{
  "playerId": "player-456"
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Host Transfer Logic:**
- If the host leaves, host privileges are automatically transferred to the first remaining player
- If the last player leaves, the room is deleted from MongoDB

---

#### **POST /api/rooms/:roomCode/ready** - Toggle Ready
Toggle a player's ready status.

**Parameters:**
- `roomCode` (path) - 6-character room code

**Request:**
```json
{
  "playerId": "player-456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "allReady": true
  }
}
```

---

#### **POST /api/rooms/:roomCode/start** - Start Game
Start the game (host only).

**Parameters:**
- `roomCode` (path) - 6-character room code

**Response (200):**
```json
{
  "success": true,
  "data": {
    "roomCode": "FISH42",
    "status": "briefing"
  }
}
```

---

### WebSocket Events

**Connection Endpoint:** `ws://<host>:<port>/ws`

**Query Parameters:**
- `roomCode` (required) - Room code to join
- `playerId` (optional) - Player identifier

**Example Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3001/ws?roomCode=FISH42&playerId=player-123');
```

**Message Format:**
All WebSocket messages follow a standard format:
```typescript
{
  type: string;      // Event name
  data: any;         // Event payload
}
```

#### **Client to Server Events:**

1. **`join_room`** - Player joins a room's WebSocket channel
```typescript
{
  type: 'join_room';
  data: {
    roomCode: string;
    playerId: string;
  };
}
```

2. **`leave_room`** - Player leaves a room
```typescript
{
  type: 'leave_room';
  data: {
    roomCode: string;
    playerId: string;
  };
}
```

3. **`ready_up`** - Player toggles ready status
```typescript
{
  type: 'ready_up';
  data: {
    roomCode: string;
    playerId: string;
  };
}
```

4. **`start_game`** - Host starts the game
```typescript
{
  type: 'start_game';
  data: {
    roomCode: string;
  };
}
```

#### **Server to Client Events:**

1. **`connected`** - Initial WebSocket connection confirmation
```typescript
{
  type: 'connected';
  data: {
    roomCode: string;
    playerId?: string;
  };
}
```

2. **`room_updated`** - Broadcasts room state changes
```typescript
{
  type: 'room_updated';
  data: IGameRoom;  // Full room object
}
```

3. **`player_joined`** - New player joined the room
```typescript
{
  type: 'player_joined';
  data: {
    playerId: string;
    playerName: string;
    playerCount: number;
  };
}
```

4. **`player_left`** - Player left the room
```typescript
{
  type: 'player_left';
  data: {
    playerId: string;
    playerName: string;
    remainingCount: number;
    newHostId?: string;  // Present if host left
  };
}
```

5. **`host_transferred`** - Host privileges transferred
```typescript
{
  type: 'host_transferred';
  data: {
    newHostId: string;
    newHostName: string;
  };
}
```

6. **`left_room`** - Confirmation sent to leaving player
```typescript
{
  type: 'left_room';
  data: {
    roomCode: string;
    playerId: string;
  };
}
```

7. **`room_deleted`** - Room was deleted (last player left)
```typescript
{
  type: 'room_deleted';
  data: {
    roomCode: string;
    reason: string;
  };
}
```

8. **`all_players_ready`** - All players are ready to start
```typescript
{
  type: 'all_players_ready';
  data: {
    roomCode: string;
  };
}
```

9. **`game_started`** - Game has begun
```typescript
{
  type: 'game_started';
  data: {
    roomCode: string;
    status: 'briefing';
  };
}
```

10. **`start_round`** - Round start with role-specific payloads
```typescript
// For Guesser
{
  type: 'start_round';
  data: {
    question: string;
    role: 'guesser';
  };
}

// For Big Fish
{
  type: 'start_round';
  data: {
    question: string;
    secretWord: string;
    role: 'bigFish';
  };
}

// For Red Herring
{
  type: 'start_round';
  data: {
    question: string;
    canGenerateLie: boolean;
    role: 'redHerring';
  };
}
```
- **Guesser:** Receives `question` and `role`
- **Big Fish:** Receives `question`, `secretWord`, and `role`
- **Red Herrings:** Receives `question`, `canGenerateLie: true`, and `role`

11. **`error`** - Error message
```typescript
{
  type: 'error';
  data: {
    code: string;
    message: string;
  };
}
```

## 🗄 Database Schema (MongoDB)

### **`GameRoom` Collection**
Stores active and completed game rooms.
```typescript
{
  _id: ObjectId,
  roomCode: string,           // 4-6 character code (e.g., "FISH42")
  status: string,             // 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary'
  hostId: string,             // Player ID of the host
  players: [{
    playerId: string,
    name: string,
    role: string,             // 'guesser' | 'bigFish' | 'redHerring'
    score: number,
    isReady: boolean,
    generatedLie: string,     // Optional, for Red Herrings
    eliminatedInRound: number // Optional, tracks when player was eliminated
  }],
  currentRound: number,
  aiConfig: {                 // AI-generated content for current round
    question: string,
    correctAnswer: string,
    bluffSuggestions: string[],
    generatedAt: Date,
    model: string             // e.g., "gpt-3.5-turbo", "llama-3-70b"
  },
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

### **`Player` Collection** (Optional, if user accounts are implemented)
```typescript
{
  _id: ObjectId,
  username: string,
  email: string,
  passwordHash: string,
  totalGamesPlayed: number,
  totalWins: number,
  createdAt: Date
}
```

## 🔑 Key Implementation Patterns

### Query Parameter Authentication (WebSocket)
Following the Outsider project pattern, WebSocket connections use query parameters for authentication:

```typescript
// Connection URL
ws://localhost:3001/ws?roomCode=FISH42&playerId=player-123

// In ws-controller.ts
export const wsController = new Elysia()
  .ws('/ws', {
    query: t.Object({
      roomCode: t.String(),
      playerId: t.Optional(t.String()),
    }),
    open(ws) {
      const { roomCode, playerId } = ws.data.query;
      logger.info(`WS connected: room=${roomCode}, player=${playerId}`);
      ws.subscribe(roomCode.toUpperCase());
    },
  });
```

**Benefits:**
- Simple connection setup
- No handshake overhead
- Easy to debug and test
- Consistent with ElysiaJS patterns

### Host Transfer Logic
When the host leaves, host privileges are automatically transferred:

```typescript
// In room-service.ts
async leaveRoom(roomCode: string, playerId: string): Promise<LeaveRoomResult> {
  const room = await GameRoom.findOne({ roomCode });
  
  if (playerId === room.hostId) {
    // Host is leaving - transfer to first remaining player
    const remainingPlayers = room.players.filter(p => p.playerId !== playerId);
    
    if (remainingPlayers.length === 0) {
      // Last player - delete room
      await GameRoom.deleteOne({ roomCode });
      return { roomDeleted: true };
    }
    
    // Transfer host to first remaining player
    room.hostId = remainingPlayers[0].playerId;
    room.players = remainingPlayers;
    await room.save();
    
    return { newHostId: remainingPlayers[0].playerId };
  }
  
  // Non-host leaving - just remove player
  room.players = room.players.filter(p => p.playerId !== playerId);
  await room.save();
  
  return {};
}
```

**Events Triggered:**
1. `host_transferred` - Broadcast to remaining players if host left
2. `player_left` - Broadcast leaving player info
3. `room_updated` - Broadcast updated room state
4. `room_deleted` - Sent to leaving player if room was deleted

### Room Auto-Deletion
Rooms are automatically deleted when:
- The last player (host) leaves
- All players disconnect

```typescript
// In handleLeaveRoom (ws-controller.ts)
if (result.roomDeleted) {
  ws.send({
    type: 'room_deleted',
    data: {
      roomCode: normalizedRoomCode,
      reason: isHostLeaving ? 'Host left and room was empty' : 'Last player left'
    }
  });
  
  ws.unsubscribe(normalizedRoomCode);
  // Clean up connection tracking
  return;
}
```

### Leave Room Pattern (Broadcast Before Unsubscribe)
Critical pattern to ensure events reach all players:

```typescript
// ✅ CORRECT: Broadcast BEFORE unsubscribing
async function handleLeaveRoom(ws: any, data: LeaveRoomData) {
  // 1. Remove player from database
  const result = await roomService.leaveRoom(roomCode, playerId);
  
  // 2. Broadcast to remaining players (while still subscribed)
  ws.publish(roomCode, { type: 'player_left', data: {...} });
  ws.publish(roomCode, { type: 'room_updated', data: {...} });
  
  // 3. Send confirmation to leaving player
  ws.send({ type: 'left_room', data: {...} });
  
  // 4. NOW unsubscribe (after all broadcasts)
  ws.unsubscribe(roomCode);
}

// ❌ WRONG: Unsubscribe before broadcasting
async function handleLeaveRoom(ws: any, data: LeaveRoomData) {
  await roomService.leaveRoom(roomCode, playerId);
  ws.unsubscribe(roomCode);  // ❌ Can't broadcast after unsubscribe!
  ws.publish(roomCode, {...});  // Never reaches anyone
}
```

### Exponential Backoff Reconnection (Frontend)
Recommended pattern for handling disconnections:

```typescript
// Frontend implementation example
class WebSocketManager {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, delay);
      }
    };
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };
  }
}
```

### MongoDB-Only State Management
All game state is persisted in MongoDB - no in-memory storage:

```typescript
// ✅ CORRECT: Always query MongoDB
const room = await GameRoom.findOne({ roomCode });
room.players.push(newPlayer);
await room.save();

// ❌ WRONG: Don't use in-memory maps for game state
const rooms = new Map();  // Don't do this!
rooms.set(roomCode, room);
```

**Benefits:**
- Single source of truth
- Survives server restarts
- Easy to debug and inspect
- Consistent state across requests
- No synchronization issues

### Room Code Normalization
All room codes are normalized to uppercase:

```typescript
const normalizedRoomCode = roomCode.toUpperCase();
const room = await GameRoom.findOne({ roomCode: normalizedRoomCode });
```

**Schema Configuration:**
```typescript
const GameRoomSchema = new Schema({
  roomCode: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true  // Auto-convert to uppercase
  },
});
```

### Connection Tracking
Track WebSocket connections by room for targeted messaging:

```typescript
const roomConnections = new Map<string, Set<any>>();

// In open handler
if (!roomConnections.has(roomCode)) {
  roomConnections.set(roomCode, new Set());
}
roomConnections.get(roomCode)!.add(ws);

// In close handler
const connections = roomConnections.get(roomCode);
if (connections) {
  connections.delete(ws);
}
```

### Role-Specific Payloads
Send different data based on player role:

```typescript
// In handleStartGame
for (const connection of connections) {
  const player = room.players.find(p => p.playerId === connection.data?.playerId);
  
  connection.send({
    type: 'start_round',
    data: {
      question: room.question,
      secretWord: player.role === 'bigFish' ? room.secretWord : undefined,
      canGenerateLie: player.role === 'redHerring',
      role: player.role
    }
  });
}
```

## 🔒 Authentication & Authorization
*   **Room-based Access:** Players authenticate via room code + player name.
*   **Host Privileges:** Only the host can start the game, advance rounds, configure AI settings.
*   **Role-based Actions:** Guesser eliminates, others generate lies and ready up.

## 🤖 AI Configuration

### Environment Variables
```bash
# AI Configuration (OpenAI-compatible)
AI_API_KEY=sk-your-api-key-here
AI_MODEL=gpt-3.5-turbo
AI_BASE_URL=https://api.openai.com/v1

# Alternative: OpenRouter (multiple models)
# AI_API_KEY=your-openrouter-key
# AI_MODEL=meta-llama/llama-3-70b-instruct
# AI_BASE_URL=https://openrouter.ai/api/v1

# Alternative: Together AI
# AI_API_KEY=your-together-key
# AI_MODEL=meta-llama/Llama-3-70b-chat-hf
# AI_BASE_URL=https://api.together.xyz/v1

# Alternative: Local Ollama
# AI_API_KEY=ollama
# AI_MODEL=llama3
# AI_BASE_URL=http://localhost:11434/v1
```

### AI Service Features
*   **Configurable API:** Support for OpenAI, OpenRouter, Together AI, Ollama, and any OpenAI-compatible API
*   **Question Generation:** AI generates question + correct answer + bluff suggestions
*   **Lie Generation:** On-demand lie suggestions for Red Herring players
*   **Fallback Word Bank:** Pre-defined questions/answers if AI is unavailable
*   **Token Tracking:** Monitor API usage and costs (optional)

### AI Generation Flow
1.  Host starts game → Server calls AI service
2.  AI generates: question, correct answer, 3-5 bluff suggestions
3.  Content saved to MongoDB in `GameRoom.aiConfig`
4.  Server emits `start_round` with role-specific payloads
5.  Red Herrings can request additional lie suggestions via `generate_lie`

## 🎮 Core Game Logic

### Scoring System
```typescript
// Points for eliminating Red Herrings
const RED_HERRING_ELIMINATION_POINTS = {
  1: 1,  // First elimination: 1 point
  2: 2,  // Second: 2 points
  3: 3,  // Third: 3 points
  // ... continues incrementing
};

// Bust scenario: Guesser picks Big Fish
// - Guesser loses ALL accumulated points for the round
// - Big Fish gets points equal to remaining Red Herrings × 2
// - Each remaining Red Herring gets points equal to their elimination order
```

### Role Assignment Algorithm
```typescript
function assignRoles(players: IPlayer[]): void {
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  
  shuffled[0].role = 'guesser';
  shuffled[1].role = 'bigFish';
  
  for (let i = 2; i < shuffled.length; i++) {
    shuffled[i].role = 'redHerring';
  }
}
```
