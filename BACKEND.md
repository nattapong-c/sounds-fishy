# BACKEND.md - Project "Sounds Fishy" Backend Documentation

## 🎯 Overview
This document details the backend architecture, services, and data models for the **Sounds Fishy** (FishyBusiness Digital) application. The backend handles game logic, real-time communication via WebSockets, and data persistence in MongoDB.

## 🛠 Technology Stack
*   **Framework:** ElysiaJS
*   **Runtime:** Bun
*   **Database:** MongoDB (via Mongoose ODM) - **Single source of truth for all data**
*   **Language:** TypeScript
*   **Real-time Communication:** Socket.io

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
*   **Filenames**: Use `kebab-case` for most files (e.g., `game-controller.ts`, `room-service.ts`). For files exclusively exporting a single `PascalCase` class or interface, `PascalCase` filename is also acceptable (e.g., `GameRoom.ts`) but `kebab-case` is generally preferred for consistency.
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
*   **Mocks:** Built-in mocking capabilities of `Bun.test`

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
*   **Tools:** Use `Supertest` for HTTP requests, custom WebSocket client for Socket.io.
*   **Location:** Place E2E tests in `__tests__/e2e` directory.

### Best Practices
*   **Clear Test Descriptions:** Use descriptive `describe` and `it`/`test` blocks.
*   **Arrange-Act-Assert (AAA) Pattern:** Structure tests clearly.
*   **Isolate Tests:** Each test should run independently.
*   **Mock External Dependencies:** Prevent reliance on external services.
*   **Test Coverage:** Aim for high coverage on core game logic.
*   **Cleanup:** Ensure tests clean up database entries after execution.
*   **Separate Test Database:** Use a separate MongoDB instance for tests.

## 📂 Project Structure

### `service/src/controllers/`
*   **Route Handlers**: Define HTTP endpoints (REST).
*   **WebSocket Handlers**: Manage Socket.io connections and message processing.
*   Separation of concerns between request handling and business logic.

### `service/src/models/`
*   **Mongoose Schemas**: Define structure and validation for MongoDB documents.
*   **GameRoom Model**: Stores room code, players, roles, scores, current phase.
*   **Player Model**: (If separate user authentication is implemented).

### `service/src/services/`
*   **Core Game Logic**: Encapsulates the rules and state transitions of *Sounds Fishy*.
    *   Role distribution (1 Guesser, 1 Big Fish, rest Red Herrings).
    *   Secret word selection from word bank.
    *   Scoring system (elimination points, banking, bust logic).
    *   Round rotation and phase management.
*   **Utility Services**: Helper functions for word generation, room code creation.

### `service/src/lib/`
*   **Database Connection**: Mongoose setup and connection pooling.
*   **Middlewares**: Custom Elysia middlewares (authentication, logging, error handling).
*   **Type Definitions**: Shared types for internal backend use.

### `service/src/index.ts`
*   **Elysia Entry Point**: Initializes the Elysia server, registers routes, Socket.io handlers, and connects to MongoDB.

## 🚀 API Endpoints (REST & WebSockets)

### REST Endpoints (Example)
*   `POST /rooms`: Create a new game room.
*   `GET /rooms/:roomCode`: Get details of a specific room.
*   `POST /rooms/:roomCode/join`: Join a game room.
*   `POST /rooms/:roomCode/start`: Start the game (host only).

### WebSocket Events

#### **Client to Server:**
*   `join_room`: Player joins a room with their name.
*   `ready_up`: Player indicates they are ready (after seeing their role/word).
*   `generate_lie`: Red Herring requests AI-generated lie from Gemini API.
*   `eliminate_player`: Guesser selects a player to eliminate.
*   `bank_points`: Guesser decides to bank their accumulated points.
*   `continue_round`: Guesser chooses to continue after eliminating a Red Herring.

#### **Server to Client:**
*   `room_updated`: Broadcasts room state changes (player joined, left).
*   `game_started`: Notifies all players that the game has begun.
*   `start_round`: Emits at round start with role-specific payloads:
    *   **Guesser:** Question only.
    *   **Big Fish:** Question + correct answer.
    *   **Red Herrings:** Question + lie generation option.
*   `reveal_result`: Broadcasts elimination result (Red Herring or Big Fish).
*   `round_ended`: Notifies round conclusion with score updates.
*   `game_over`: Final leaderboard and game results.

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
  secretWord: string,         // The correct answer for current round
  question: string,           // The question prompt
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

## 🔒 Authentication & Authorization
*   **Room-based Access:** Players authenticate via room code + player name.
*   **Host Privileges:** Only the host can start the game, advance rounds.
*   **Role-based Actions:** Guesser eliminates, others generate lies and ready up.

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
