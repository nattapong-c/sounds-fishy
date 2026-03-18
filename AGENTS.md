# Project: FishyBusiness Digital (Face-to-Face Edition)

## 1. Project Overview
A digital "Secret Screen" companion app for the "Sounds Fishy" board game. Designed for players in the same physical location, using mobile devices as private controllers while the main interaction happens verbally.

**Design Theme:** Modern & Minimal with playful, funny animations 🐟

**Repository:** `git@github.com:nattapong-c/sounds-fishy.git`

---

## 2. Tech Stack
- **Frontend:** Next.js (App Router), Tailwind CSS, Playwright (Testing), Vercel (Hosting)
- **Backend:** Bun, ElysiaJS, Socket.io (Real-time), MongoDB (Persistence), Render (Hosting)
- **State Management:** MongoDB (No Redis, No In-memory storage)
- **AI Integration:** OpenAI-compatible LLM API (configurable API key, model, base URL)

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

### Phase 2: The Briefing (Secret Info)
1. Server emits `START_ROUND` via Socket.io with unique payloads.
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
2. **Socket Broadcast:** Server checks the role and sends `REVEAL_RESULT` to everyone.
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
