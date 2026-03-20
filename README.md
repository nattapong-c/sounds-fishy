# Sounds Fishy - Digital Secret Screen Companion

A digital companion app for the "Sounds Fishy" board game. Players use mobile devices as private controllers while interacting verbally in the same physical location.

**Design Theme:** Modern & Minimal with playful animations 🐟

---

## 🎯 Quick Start

### Prerequisites
- Node.js 18+ / Bun 1.0+
- MongoDB (local or Atlas)
- Git

### Installation

```bash
# Clone repository
git clone git@github.com:nattapong-c/sounds-fishy.git
cd sounds-fishy

# Install backend dependencies
cd service && bun install

# Install frontend dependencies
cd ../app && bun install
```

### Environment Setup

**Backend (`service/.env`):**
```bash
MONGODB_URI=mongodb://localhost:27017/sounds-fishy
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Frontend (`app/.env.local`):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Running the Application

```bash
# Terminal 1 - Backend
cd service && bun run dev

# Terminal 2 - Frontend
cd app && bun run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## 🎮 Game Rules

### Roles

| Role | Hidden From Player | Visible To Player |
| :--- | :--- | :--- |
| **Guesser** | The Correct Answer | The Question |
| **Big Fish** | None | Question + Correct Answer |
| **Red Herrings** | The Correct Answer | Question + Bluff Suggestions |

### Gameplay Flow

1. **Lobby Phase**
   - Host creates room
   - Players join via room code
   - Host starts game when 3+ players ready

2. **Briefing Phase**
   - Guesser sees question only
   - Big Fish sees question + secret answer
   - Red Herrings see question + bluff suggestions
   - All players prepare their answers

3. **Verbal Phase** (Offline)
   - Each player gives answer verbally
   - Guesser watches for suspicious behavior

4. **Elimination Phase** (Future)
   - Guesser eliminates players
   - Scoring based on correct identification

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- Axios (API client)
- Native WebSocket

**Backend:**
- Bun Runtime
- ElysiaJS (Web Framework)
- MongoDB + Mongoose
- WebSocket (built-in)

**Database:**
- MongoDB (single source of truth)
- No Redis, no in-memory state

### Project Structure

```
sounds-fishy/
├── app/                          # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                  # Pages
│   │   │   ├── page.tsx          # Home page
│   │   │   └── room/[roomCode]/
│   │   │       └── page.tsx      # Lobby/Briefing page
│   │   ├── hooks/
│   │   │   └── useDeviceId.ts    # Device identity hook
│   │   └── types/                # TypeScript types
│   ├── package.json
│   └── .env.local
│
├── service/                      # Backend (ElysiaJS)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── room-controller.ts    # REST API
│   │   │   └── ws-controller.ts      # WebSocket
│   │   ├── models/
│   │   │   └── game-room.ts          # MongoDB schema
│   │   ├── services/
│   │   │   ├── room-service.ts       # Room logic
│   │   │   └── game-service.ts       # Game logic
│   │   ├── lib/
│   │   │   ├── database.ts           # MongoDB connection
│   │   │   └── logger.ts             # Pino logger
│   │   └── index.ts                  # Entry point
│   ├── package.json
│   └── .env
│
├── tasks/                        # Task documentation
├── reports/                      # Research & analysis
└── README.md                     # This file
```

---

## 🔌 API Reference

### REST Endpoints

#### Create Room
```http
POST /api/rooms
Content-Type: application/json

{
  "hostName": "Player Name",
  "deviceId": "unique-device-id"
}

Response: {
  "success": true,
  "data": {
    "roomId": "...",
    "roomCode": "ABC123",
    "deviceId": "..."
  }
}
```

#### Join Room
```http
POST /api/rooms/:roomCode/join
Content-Type: application/json

{
  "playerName": "Player Name",
  "deviceId": "unique-device-id"
}
```

#### Get Room
```http
GET /api/rooms/:roomCode
```

#### Start Game (Host Only)
```http
POST /api/rooms/:roomCode/start
```

#### Leave Room
```http
POST /api/rooms/:roomCode/leave
Content-Type: application/json

{
  "deviceId": "unique-device-id"
}
```

### WebSocket Events

#### Client → Server

```typescript
// Join room
{ type: 'join_room', data: { roomCode, deviceId } }

// Leave room
{ type: 'leave_room', data: { roomCode, deviceId } }

// Start game
{ type: 'start_game', data: { roomCode } }
```

#### Server → Client

```typescript
// Room updated
{ type: 'room_updated', data: IGameRoom }

// Player reconnected
{ type: 'player_reconnected', data: { deviceId, playerName, isOnline } }

// Game started
{ type: 'game_started', data: { roomCode, status } }

// Start round (role-specific)
{ type: 'start_round', data: { question, role, secretWord?, bluffSuggestions? } }
```

---

## 🔑 Key Features

### Device-Based Identity
- No user accounts required
- Persistent identity via localStorage
- Automatic reconnection support
- Same device = same player

### Real-time Updates
- WebSocket pub/sub pattern
- Room-based broadcasting
- Automatic state synchronization
- Reconnection handling

### MongoDB Integration
- Single source of truth
- No in-memory state
- TTL indexes for cleanup
- Efficient queries with indexes

---

## 🧪 Testing

```bash
# Frontend tests
cd app && bun run test

# Backend tests
cd service && bun test

# Build verification
cd app && bun run build
cd service && bun run build
```

---

## 📝 Recent Changes

### Major Refactoring (Latest)
- ✅ Simplified architecture (inline components & hooks)
- ✅ Integrated axios for API requests
- ✅ Removed lie generation feature (use MongoDB bluff suggestions)
- ✅ Fixed WebSocket reconnection issues
- ✅ Fixed ready status updates
- ✅ Removed ready button feature (host-controlled flow)

### Architecture Changes
- ❌ Removed: `components/`, `services/`, `types/` directories
- ❌ Removed: `useRoom.ts`, `useSocket.ts`, `useBriefing.ts` hooks
- ✅ Moved: All components inline in page files
- ✅ Created: `useBriefing` hook inline for briefing logic

### Bug Fixes
- ✅ Fixed player reconnection status display
- ✅ Fixed ready status not updating for self
- ✅ Fixed API URL routing (port 3001)
- ✅ Fixed TypeScript errors with axios
- ✅ Fixed WebSocket null reference

---

## 📚 Documentation

- **AGENTS.md** - Project guidelines and architecture
- **DEVICE_IDENTITY_PATTERN.md** - Device-based identity implementation
- **IMPLEMENTATION_PLAN.md** - Implementation roadmap
- **tasks/** - Task breakdown and progress
- **reports/** - Research and analysis

---

## 🚀 Deployment

### Backend (Render)
```bash
# Environment variables
MONGODB_URI=<mongodb-atlas-uri>
PORT=3001
FRONTEND_URL=<production-frontend-url>
```

### Frontend (Vercel)
```bash
# Environment variables
NEXT_PUBLIC_API_URL=<production-backend-url>
NEXT_PUBLIC_WS_URL=wss://<production-backend-url>
```

---

## 🤝 Contributing

1. Read task files in `/tasks/` directory
2. Follow development workflow
3. Test thoroughly
4. Update documentation
5. Create pull request

---

## 📄 License

[Your License Here]

---

## 🎯 Quick Reference

### Development Commands

```bash
# Install dependencies
bun install

# Run dev servers
cd service && bun run dev  # Backend (port 3001)
cd app && bun run dev      # Frontend (port 3000)

# Build
bun run build

# Test
bun test
```

### Common Issues

**Module not found:**
```bash
# Clean cache and rebuild
rm -rf .next node_modules/.cache
bun run build
```

**WebSocket not connecting:**
- Check `NEXT_PUBLIC_WS_URL` environment variable
- Verify backend is running on port 3001
- Check browser console for errors

**Database connection failed:**
- Verify MongoDB is running
- Check `MONGODB_URI` in `.env`
- Ensure network access (for Atlas)

---

**Repository:** `git@github.com:nattapong-c/sounds-fishy.git`  
**Last Updated:** March 2026
