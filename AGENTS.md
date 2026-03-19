# Project: FishyBusiness Digital (Face-to-Face Edition)

## 1. Project Overview
A digital "Secret Screen" companion app for the "Sounds Fishy" board game. Designed for players in the same physical location, using mobile devices as private controllers while the main interaction happens verbally.

**Design Theme:** Modern & Minimal with playful, funny animations 🐟

**Repository:** `git@github.com:nattapong-c/sounds-fishy.git`

---

## 2. Tech Stack
- **Frontend:** Next.js (App Router), Tailwind CSS, Playwright (Testing), Vercel (Hosting)
- **Backend:** Bun, ElysiaJS (with built-in WebSocket), MongoDB (Persistence), Render (Hosting)
- **State Management:** MongoDB (No Redis, No In-memory storage) - Single source of truth
- **AI Integration:** OpenAI-compatible LLM API (configurable API key, model, base URL)
- **Real-time Communication:** ElysiaJS WebSocket (Pub/Sub pattern, query parameter authentication)

---

## 3. Game Rules (The Logic)

### Roles & Information
| Role | Hidden From Player | Visible To Player |
| :--- | :--- | :--- |
| **The Guesser** | The Correct Answer | The Question + Elimination Panel |
| **The Big Fish** | None | The Question + The Correct Answer |
| **Red Herrings** | The Correct Answer | The Question + AI Bluff Assistant |

### Scoring System (Risk vs. Reward)
- **Eliminate a Red Herring:** Guesser earns points (1st = 1pt, 2nd = 2pts, 3rd = 3pts, etc.).
- **The "Bank" Option:** After any successful elimination, the Guesser can stop and keep their points.
- **The "Bust" (Catching the Big Fish):** - If the Guesser picks the **Big Fish** by mistake, they lose **ALL** points for that round.
    - The Big Fish and all remaining (non-eliminated) Red Herrings receive points instead.

---

## 4. Detailed Game Flow (Step-by-Step)

### Phase 1: Lobby & Setup
1. **Host** creates a room (stored in MongoDB).
2. **Players** join via Room Code. Names are stored in MongoDB.
3. **Start:** Server randomly assigns 1 Guesser, 1 Big Fish, and the rest as Red Herrings.
4. **AI Generation:** Server uses OpenAI-compatible LLM to generate:
   - Question prompt for the round
   - Correct answer (for Big Fish)
   - Set of believable bluff answers (for Red Herrings to reference)

**Routing:** `/room/{roomCode}` (dual-purpose: join form or room view)

### Phase 2: The Briefing (Secret Info)
1. Server emits `start_round` via WebSocket with unique payloads.
2. **Guesser Screen:** Displays the Question. They read it out loud.
3. **Others Screen:** Displays "Tap to Reveal" button.
    - **Big Fish** sees the question + the correct answer (AI-generated).
    - **Red Herrings** see the question + AI-generated bluff suggestions + optional "Generate More Lies" button (AI-powered).
4. All players (except Guesser) click "Ready" when they have their answer prepared.

### Phase 3: The Pitch (Verbal)
1. Each player (except Guesser) gives their answer verbally to the room.
2. The Guesser watches for stutters, eye contact, and "fishy" logic.

### Phase 4: Elimination (Interactive)
1. Guesser selects a player on their phone to eliminate.
2. **WebSocket Broadcast:** Server checks the role and sends `reveal_result` to everyone.
3. **Visual Result:** Every phone vibrates/animates showing if it was a "Red Herring" or "Big Fish."
4. **Logic Loop:**
    - If **Red Herring**: Guesser chooses to **"Continue"** (higher points) or **"Bank"** (end round).
    - If **Big Fish**: Round ends immediately (Guesser Busted).

### Phase 5: Round Summary
1. Update MongoDB with new scores.
2. Show Leaderboard.
3. Rotate roles for the next round.

---

## 📂 Project Structure
Following a **Clean Code** approach to separate concerns between the UI and the Game Engine.

```text
sounds-fishy/
├── app/                        # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                # Next.js App Router (Routes & Pages)
│   │   ├── components/         # Atomic UI components
│   │   ├── hooks/              # Custom React hooks (Game state, Socket)
│   │   ├── lib/                # Shared utilities & API clients
│   │   ├── services/           # Frontend business logic
│   │   └── types/              # Frontend TypeScript definitions
│   ├── public/                 # Static assets (Assets for cards/roles)
│   ├── next.config.mjs
│   └── tailwind.config.ts
│
├── service/                    # Backend (Elysia)
│   ├── src/
│   │   ├── controllers/        # Route & WebSocket handlers
│   │   ├── models/             # MongoDB Schemas / Mongoose models
│   │   ├── services/           # Core Game Logic (Role distribution, Word bank)
│   │   ├── lib/                # Database connection & Middlewares
│   │   └── index.ts            # Elysia entry point
│   ├── bun.lockb
│   └── package.json
│
└── README.md                   # Project documentation
```

---

## 5. Architecture Patterns (from Outsider Project)

### 5.1 WebSocket Connection Pattern

**Query Parameter Authentication:**
```typescript
// Frontend connects with deviceId (persistent identity)
ws://localhost:3001/ws?roomCode=ABC123&deviceId=xyz-789

// Backend validates in Elysia
.ws('/ws', {
  query: t.Object({
    roomCode: t.String(),
    deviceId: t.Optional(t.String()),
  }),
  // ... handlers
})
```

**Connection Lifecycle:**
1. **Open:** Subscribe to room channel, mark player as online, broadcast `room_updated`
2. **Message:** Route to handler based on `message.type`
3. **Close:** Mark player as offline (don't remove), broadcast `room_updated`

### 5.2 Room-Based Pub/Sub

```typescript
// Backend broadcasting pattern
ws.subscribe(roomCode);  // Subscribe to room channel
ws.publish(roomCode, {   // Broadcast to all in room
  type: 'player_joined',
  data: { deviceId, playerName, playerCount }
});
```

### 5.3 Player Identity via deviceId (localStorage)

```typescript
// Frontend: Generate deviceId once on first join
const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID();
localStorage.setItem('deviceId', deviceId);

// Frontend: Retrieve on page load (survives refresh/restart)
const deviceId = localStorage.getItem('deviceId');

// Backend: Same deviceId = same player (auto-reconnection)
const player = room.players.find(p => p.deviceId === deviceId);
// If found: update isOnline = true (reconnection)
// If not found: create new player entry
```

**Key Points:**
- `deviceId` is generated once and stored in `localStorage`
- `deviceId` survives page refresh and browser restart
- No user accounts needed
- Reconnection is automatic with same `deviceId`
- Backend matches players by `deviceId`, not by session
- Same `deviceId` in same room = same player (preserves role, score, etc.)

### 5.4 MongoDB as Single Source of Truth

**No Redis, No In-Memory State:**
- All game state stored in MongoDB
- WebSocket connections are transient
- Player reconnection restores state from database
- `isOnline` flag tracks current connection status

### 5.5 Dual Schema Approach

```typescript
// Elysia schema for API validation
body: t.Object({
  playerName: t.String(),
  deviceId: t.Optional(t.String()),
})

// Mongoose schema for database persistence
const playerSchema = new Schema({
  deviceId: String,  // Persistent identity
  name: String,
  isHost: Boolean,
  // ...
});
```

---

## 6. Key Implementation Details

### 6.1 Room Creation Flow

```
POST /api/rooms
  ↓
Generate room code → Create host player (with deviceId) → Save to MongoDB
  ↓
Return {roomId, roomCode, deviceId} → Store in localStorage → Navigate to /room/[roomCode]
```

### 6.2 Join Room Flow

```
POST /api/rooms/:code/join
  ↓
Find room → Check if deviceId exists (reconnect) or create new player → Save to MongoDB
  ↓
Return {deviceId, roomCode} → Store in localStorage
  ↓
WebSocket reconnects with deviceId → Backend broadcasts room_updated
  ↓
Frontend receives update → UI refresh → Player sees themselves in room
```

### 6.3 WebSocket Reconnection Strategy

```typescript
// useSocket.ts - Exponential backoff
const MAX_RECONNECT_ATTEMPTS = 5;
const delays: [1000, 2000, 4000, 8000, 10000]; // Cap at 10s

ws.onclose = () => {
  if (attempt < MAX_RECONNECT_ATTEMPTS) {
    setTimeout(() => connect(), delays[attempt]);
    attempt++;
  }
};
```

### 6.4 Player Disconnection vs Leave

**Disconnect (Refresh/Close Tab):**
- Mark `isOnline = false`
- Set `lastSeen = Date.now()`
- Keep player in room array (deviceId preserved)
- Broadcast `player_disconnected`
- On reconnect: same deviceId restores player state

**Explicit Leave:**
- Remove from room array
- Transfer host if needed
- Delete room if empty
- Broadcast `player_left`

---

## 7. Development Workflow

### Available Commands

**Frontend Only:**
```bash
cd app && bun run dev    # Start Next.js dev server (port 3000)
```

**Backend Only:**
```bash
cd service && bun run dev  # Start ElysiaJS dev server (port 3001)
```

**Full-Stack:**
- Run both servers in separate terminals
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- WebSocket: `ws://localhost:3001/ws`

### Environment Setup

**Backend `.env`:**
```bash
MONGODB_URI=mongodb://localhost:27017/sounds-fishy
PORT=3001
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## 8. Testing Strategy

### Backend Testing
- Unit tests for services (room-service, game-service, ai-service)
- Integration tests for WebSocket events
- Mock MongoDB with in-memory database

### Frontend Testing
- Component tests (Button, Input, PlayerCard)
- Hook tests (useSocket, useRoom)
- E2E tests with Playwright (lobby flow, game flow)

---

## 9. References

- **Implementation Plan:** `IMPLEMENTATION_PLAN.md`
- **Outsider Study:** `reports/outsider-study.md`
- **Repository:** `git@github.com:nattapong-c/sounds-fishy.git`
