# Sounds Fishy

A web application adaptation of the physical board game "Sounds Fishy" - a storytelling and bluffing game for 4-8 players.

## Project Overview

**Sounds Fishy** is a mobile-first web application that digitizes the board game experience. The game focuses on storytelling, lying, and deduction where players must identify who is telling the truth and who is bluffing.

## Game Rules

### Setup
- **Players**: 4-8 persons
- **Roles**: 
  - 1 Guesser
  - 1 Blue Fish
  - Remaining players are Red Fish

### Gameplay Flow

1. **Question Phase**: The system provides a question to all players
2. **Answer Distribution**:
   - **Blue Fish**: Receives the factual/true answer
   - **Red Fish**: Receive a fake answer with lie suggestions for storytelling
   - **Guesser**: Only sees the question (no answer)
3. **Storytelling**: Each player (except Guesser) tells their story based on their answer
4. **Deduction**: The Guesser must identify which players have fake answers

### Scoring System

- **Correct Red Fish elimination**: Guesser earns 1 temporary point (accumulative)
- **Wrong guess (selecting Blue Fish)**: Guesser loses all accumulated points (reset to 0)
- **All Red Fish eliminated**: 
  - Guesser keeps all accumulated points
  - Blue Fish earns 1 point
- **Guesser loses all points**: Remaining Red Fish each earn 1 point
- **Role Rotation**: After each round, assign a new Guesser
- **Game End**: After every player has been Guesser once, the game ends and final scores are displayed

## 🛠 Tech Stack

| Layer | Technology | Hosting |
|-------|------------|---------|
| Runtime | Bun | - |
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript | Vercel |
| Backend | ElysiaJS + TypeScript | Render |
| Database | MongoDB (Mongoose ODM) | MongoDB Atlas |
| Styling | TailwindCSS v4 | - |
| Type Safety | @elysiajs/eden (Eden Treaty) | - |
| Logging | Pino | - |

## 📂 Project Structure

```
sounds-fishy/
├── AGENTS.md                       # This file
├── README.md                       # User-facing documentation
├── app/                            # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── [roomId]/           # Dynamic room route
│   │   │   ├── globals.css         # Global styles (mobile-first)
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── page.tsx            # Home page (create/join room)
│   │   ├── components/             # React components
│   │   ├── hooks/                  # Custom React hooks
│   │   │   └── useDeviceId.ts      # Persistent identity via localStorage
│   │   └── lib/                    # Utilities
│   │       └── api.ts              # Eden Treaty client
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
├── service/                        # Backend (ElysiaJS)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── room-controller.ts  # REST endpoints (create, join, leave)
│   │   │   └── ws-controller.ts    # WebSocket handlers (game logic)
│   │   ├── models/
│   │   │   └── room.ts             # Mongoose schema + Elysia validation
│   │   ├── game/                   # Game logic and state management
│   │   │   ├── roles.ts            # Role assignment (Guesser, Blue Fish, Red Fish)
│   │   │   ├── scoring.ts          # Scoring system
│   │   │   └── questions.ts        # Question/answer database
│   │   ├── lib/
│   │   │   ├── db.ts               # MongoDB connection
│   │   │   └── logger.ts           # Pino logger
│   │   └── index.ts                # Elysia entry point
│   ├── .env                        # Environment variables (MongoDB URI)
│   ├── package.json
│   └── tsconfig.json
│
└── tests/                          # Test files
```

## 🚀 Building and Running

### Prerequisites
- [Bun](https://bun.sh/) runtime installed
- MongoDB instance (local or Atlas)

### Environment Setup

**Backend** (`service/.env`):
```bash
MONGO_URI=mongodb://localhost:27017/sounds-fishy
# Or MongoDB Atlas connection string
PORT=3001
CORS_ORIGIN=http://localhost:4444
```

**Frontend** (create `app/.env.local` if needed):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Development Commands

**Backend:**
```bash
cd service
bun run dev          # Start ElysiaJS dev server on port 3001
```

**Frontend:**
```bash
cd app
bun run dev          # Start Next.js dev server on port 4444
bun run build        # Build for production
bun run lint         # Run ESLint
```

### Testing
```bash
cd service
bun test             # Run backend tests

cd app
bun run lint         # Lint check
```

## 🎮 Key Architecture Concepts

### Identity Management
- No user accounts - uses `deviceId` (UUID stored in `localStorage`) for persistent identity
- Players reconnect automatically if they refresh or lose connection
- `isOnline` flag tracks current connection status

### WebSocket Communication
- Connection: `ws://localhost:3001/ws/rooms/:roomId?deviceId=:deviceId`
- All game state updates broadcast via `room_state_update` event
- Events are JSON-stringified payloads with `type` field

### Room States
```typescript
'lobby'               → Waiting for players, admin configures game
'playing'             → Storytelling phase active (no timer)
'guessing'            → Guesser making selections (no timer)
'round_end'           → Round results displayed
'completed'           → Game over, final scores displayed
```

### Key WebSocket Events

**Client → Server:**
- `start_game` (admin): Begin game with role assignment
- `kick_player` (admin): Remove player
- `end_round` (admin): Reset to lobby
- `submit_guess` (guesser): Select player with fake answer
- `reveal_roles` (host): End game, show all roles

**Server → Client:**
- `room_state_update`: General state broadcast
- `game_started`: Game begins, roles assigned
- `guess_submitted`: Guesser made a selection
- `round_ended`: Round results with scoring
- `roles_revealed`: Game over, all roles shown

## 🎨 UI/UX Theme

**Minimal, Clean & Funny:**

- **Minimal**: Simple layouts, generous whitespace, focused content
- **Clean**: Clear typography, consistent spacing, no visual clutter
- **Funny**: Playful illustrations, witty microcopy, humorous animations

### Design Principles

1. **Less is More** - Remove unnecessary elements, keep only what's essential
2. **Clear Hierarchy** - Use size, weight, and color to guide attention
3. **Playful Touches** - Add humor through:
   - Fish-themed illustrations/icons
   - Witty button labels and error messages
   - Subtle animations (fish swimming, bubbles)
   - Funny role reveal animations

### Color Palette

- **Primary**: Ocean Blue (`#0077B6`) - main actions, links
- **Secondary**: Coral (`#FF6B6B`) - Red Fish, warnings
- **Accent**: Gold (`#FFD93D`) - Blue Fish, highlights
- **Background**: Light/Clean (`#F8F9FA` or white)
- **Text**: Dark Gray (`#2D3436`) - readable, not harsh black

### Typography

- **Font**: System fonts (San Francisco, Inter, or similar clean sans-serif)
- **Headings**: Bold, playful
- **Body**: Regular weight, comfortable reading size (16px+)

### Visual Elements

- **Icons**: Simple line icons with fish/sea theme
- **Illustrations**: Minimal fish characters with expressions
- **Cards**: Subtle shadows, rounded corners (8-12px)
- **Buttons**: Touch-friendly (44px min), clear states

### Mobile-First

- Touch-friendly tap targets (minimum 44px)
- Thumb-friendly navigation
- Responsive breakpoints for tablets/desktops

## 📝 Coding Conventions

### TypeScript Naming
- **Variables/Functions**: `camelCase` (`gameSession`, `handleGuess`)
- **Components/Classes**: `PascalCase` (`GameCard`, `RoomPage`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_PLAYERS`, `API_BASE_URL`)
- **Files**: `kebab-case` (`room-controller.ts`, `useDeviceId.ts`)

### Backend Patterns
- Elysia `t` schemas for validation + Eden type inference
- Mongoose for MongoDB persistence
- Pino for structured logging
- WebSocket messages validated before processing

### Frontend Patterns
- Functional components with hooks
- Custom hooks for reusable logic (`useDeviceId`)
- Eden Treaty for type-safe API calls
- TailwindCSS for all styling

## 🔧 Key Files Reference

| File | Purpose |
|------|---------|
| `service/src/index.ts` | Elysia app entry, CORS, route registration |
| `service/src/models/room.ts` | Mongoose schema + Elysia validation schemas |
| `service/src/controllers/ws-controller.ts` | Core game logic, WebSocket handlers |
| `service/src/game/roles.ts` | Role assignment logic (Guesser, Blue Fish, Red Fish) |
| `service/src/game/scoring.ts` | Scoring system implementation |
| `app/src/app/[roomId]/page.tsx` | Main room/game page, WebSocket client |
| `app/src/lib/api.ts` | Eden Treaty client initialization |
| `app/src/hooks/useDeviceId.ts` | Persistent identity management |

## 📋 Development Phases

### Phase 1 - Core Game Loop
- Room creation/joining
- Admin controls (kick, start game)
- Role assignment (Guesser, Blue Fish, Red Fish)
- Question/answer distribution
- Storytelling phase (no timer - players proceed at their own pace)

### Phase 2 - Scoring & Rounds
- Guesser selection mechanism
- Scoring system implementation
- Round rotation (new Guesser)
- Round results display

### Phase 3 - Game End & Polish
- Final scoring and results
- Game history
- Mobile UI polish
- "Play Again" functionality

## 🐛 Common Issues & Solutions

**WebSocket not connecting:**
- Ensure backend is running on port 3001
- Check `NEXT_PUBLIC_WS_URL` environment variable
- Vercel hosting requires external WebSocket URL (Render backend)

**MongoDB connection error:**
- Verify `MONGO_URI` in `service/.env`
- Ensure MongoDB is running or Atlas connection is valid

**Type errors with Eden:**
- Backend `AppRouter` type must be exported from `service/src/index.ts`
- Frontend imports type: `import type { AppRouter } from '../../../service/src/index'`

---

## 📚 Rooms & WebSocket Flow

This project follows the same room management and WebSocket communication patterns as the Outsider project. See the detailed flow documentation for:

- Room lifecycle (create, join, leave)
- WebSocket connection management
- Reconnection strategy with `deviceId`
- Message handling patterns
- State synchronization
- Edge cases & error handling

### Key Differences from Outsider

| Aspect | Outsider | Sounds Fishy |
|--------|----------|--------------|
| Timers | Quiz/Discussion/Voting timers | No timers - players proceed at own pace |
| Roles | Host, Insider, Common | Guesser, Blue Fish, Red Fish |
| Win Condition | Word guessed + Insider identified | Guesser finds all Red Fish |
| Scoring | Binary win/lose | Accumulative points system |
| Game Flow | Quiz → Showdown → Voting | Storytelling → Guessing → Round End |

### Adapted WebSocket Events

**Client → Server:**
- `start_game` (admin): Begin game, assign roles, get question/answers
- `kick_player` (admin): Remove player from room
- `end_round` (admin): End current round, rotate Guesser role
- `submit_guess` (guesser): Select a player suspected as Red Fish
- `end_game` (admin): End full game, show final scores

**Server → Client:**
- `room_state_update`: General state broadcast (player join/leave, status changes)
- `game_started`: Roles assigned, question/answers distributed
- `guess_submitted`: Guesser made a selection, scoring updated
- `round_ended`: Round complete, new Guesser assigned
- `game_ended`: All rounds complete, final scores displayed

### Room States (Adapted)

```typescript
'lobby'       → Waiting for players, admin configures game
'playing'     → Storytelling phase - players see question/answers
'guessing'    → Guesser selects suspected Red Fish players
'round_end'   → Round results shown, preparing next round
'completed'   → All rounds done, final scores displayed
```

### Game State Flow

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐
│  lobby  │───►│ playing  │───►│ guessing  │───►│ round_end│───►│ completed │
└─────────┘    └──────────┘    └───────────┘    └──────────┘    └───────────┘
     ▲                                               │
     │                                               │ (more rounds)
     └───────────────────────────────────────────────┘
```

### Role Assignment Flow

```typescript
// Backend: Role assignment on game start
const players = [...room.players];
const shuffled = players.sort(() => 0.5 - Math.random());

// Determine next Guesser (rotate through all players)
const previousGuesserId = room.lastGuesserId;
let guesserIndex = 0;
if (previousGuesserId) {
    const prevIndex = players.findIndex(p => p.id === previousGuesserId);
    guesserIndex = (prevIndex + 1) % players.length;
}

// Assign roles
shuffled[guesserIndex].inGameRole = 'guesser';
shuffled[(guesserIndex + 1) % players.length].inGameRole = 'blueFish';
for (let i = 0; i < players.length; i++) {
    if (i !== guesserIndex && i !== (guesserIndex + 1) % players.length) {
        shuffled[i].inGameRole = 'redFish';
    }
}

room.lastGuesserId = shuffled[guesserIndex].id;
```

### Scoring Flow

```typescript
interface GameScore {
    playerId: string;
    playerName: string;
    totalPoints: number;
    roundsAsGuesser: number;
    roundsAsBlueFish: number;
    roundsAsRedFish: number;
}

// Scoring logic
if (guesser.selectedPlayer.inGameRole === 'redFish') {
    // Correct guess
    guesserScore.tempPoints += 1;
    if (allRedFishEliminated) {
        guesserScore.totalPoints += guesserScore.tempPoints;
        blueFishScore.totalPoints += 1;
    }
} else if (guesser.selectedPlayer.inGameRole === 'blueFish') {
    // Wrong guess - reset temp points
    guesserScore.tempPoints = 0;
    // Remaining Red Fish get points
    remainingRedFish.forEach(player => {
        playerScore.totalPoints += 1;
    });
}
```
