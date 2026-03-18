# 🐟 Sounds Fishy - Digital Companion App

A digital "Secret Screen" companion app for the Sounds Fishy board game. Designed for players in the same physical location, using mobile devices as private controllers while the main interaction happens verbally.

**Design Theme:** Modern & Minimal with playful, funny animations 🐟

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Real-time:** Socket.io-client
- **Testing:** Playwright
- **Hosting:** Vercel

### Backend
- **Runtime:** Bun
- **Framework:** ElysiaJS
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io
- **Hosting:** Render

### AI Integration
- **Provider:** OpenAI-compatible API (configurable)
- **Supports:** OpenAI, OpenRouter, Together AI, Ollama, Azure OpenAI
- **Features:** Question generation, answer suggestions, lie generation

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) installed
- MongoDB running locally or connection string
- Node.js 18+ (for Next.js)

### Backend Setup

```bash
cd service

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit .env and add your MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/sounds-fishy

# Start development server
bun run dev
```

Backend will run on `http://localhost:3001`

### Frontend Setup

```bash
cd app

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Start development server
bun run dev
```

Frontend will run on `http://localhost:3000`

## Game Rules

### Roles
- **🎯 Guesser:** Doesn't know the answer, must find the Big Fish
- **🐟 Big Fish:** Knows the correct answer, must blend in
- **🐠 Red Herrings:** Must bluff with fake AI-generated answers

### Scoring
- **Eliminate Red Herring:** Guesser earns points (1st = 1pt, 2nd = 2pts, etc.)
- **Bank Option:** After elimination, Guesser can stop and keep points
- **Bust (Catch Big Fish):** Guesser loses ALL points, Big Fish and remaining Red Herrings score

### Game Flow
1. **Lobby:** Players join via room code
2. **Briefing:** Roles assigned, AI generates question & answers
3. **Pitch:** Players give verbal answers
4. **Elimination:** Guesser eliminates players
5. **Summary:** Scores updated, roles rotated

## Project Structure

```
sounds-fishy/
├── app/                        # Frontend (Next.js)
│   ├── src/
│   │   ├── app/                # Pages & layouts
│   │   ├── components/         # UI components
│   │   ├── hooks/              # React hooks
│   │   ├── lib/                # Utilities (Axios)
│   │   ├── services/           # API clients
│   │   └── types/              # TypeScript types
│   ├── package.json
│   └── tailwind.config.ts
│
├── service/                    # Backend (ElysiaJS)
│   ├── src/
│   │   ├── controllers/        # Route & Socket handlers
│   │   ├── models/             # MongoDB schemas
│   │   ├── services/           # Business logic
│   │   ├── lib/                # Database & errors
│   │   ├── types/              # TypeScript types
│   │   └── index.ts            # Entry point
│   ├── package.json
│   └── .env.example
│
├── tasks/                      # Implementation plans
│   ├── phase1-backend.md
│   ├── phase1-frontend.md
│   ├── ai-service-backend.md
│   └── ai-service-frontend.md
│
└── README.md
```

## Development

### Running Tests

**Backend:**
```bash
cd service
bun test           # Run all tests
bun test:unit      # Unit tests only
bun test:integration  # Integration tests only
```

**Frontend:**
```bash
cd app
bun test           # Component tests
bun test:e2e       # E2E tests with Playwright
```

### File Naming Conventions

**Backend:** kebab-case for all files
- ✅ `room-service.ts`, `game-room.ts`, `ai-controller.ts`
- ❌ `RoomService.ts`, `GameRoom.ts`

**Frontend:** kebab-case for all files
- ✅ `player-card.tsx`, `use-socket.ts`
- ❌ `PlayerCard.tsx`, `UseSocket.ts`

## AI Configuration

The app supports any OpenAI-compatible API:

### OpenAI (Default)
```bash
AI_API_KEY=sk-...
AI_MODEL=gpt-3.5-turbo
AI_BASE_URL=https://api.openai.com/v1
```

### OpenRouter
```bash
AI_API_KEY=your-openrouter-key
AI_MODEL=meta-llama/llama-3-70b-instruct
AI_BASE_URL=https://openrouter.ai/api/v1
```

### Local Ollama
```bash
AI_API_KEY=ollama
AI_MODEL=llama3
AI_BASE_URL=http://localhost:11434/v1
```

## Repository

**Git Remote:** `git@github.com:nattapong-c/sounds-fishy.git`

## License

MIT
