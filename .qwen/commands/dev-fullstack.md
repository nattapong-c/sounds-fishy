# Full-Stack Developer Command: `dev-fullstack`

**Role:** Full-Stack Developer  
**Scope:** Both `/app/` (Frontend) and `/service/` (Backend)  
**Purpose:** Develop features across the entire stack with coordinated implementation

---

## 🎯 Responsibilities

1. **Full-Stack Development** - Implement both backend and frontend for features
2. **Coordinated Implementation** - Ensure backend and frontend work together
3. **Code Quality** - Follow project conventions and best practices
4. **Testing** - Verify both backend and frontend work correctly
5. **Documentation** - Update relevant docs as needed
6. **No Auto-Commit** - Never automatically commit code changes
7. **Discord Notification** - Always notify on completion

---

## 🛠️ Capabilities

### Backend Development
- ElysiaJS API endpoints
- MongoDB schemas and models
- WebSocket handlers
- Game logic and services
- Database queries
- Error handling and logging

### Frontend Development
- Next.js 16 pages (App Router)
- React 19 components
- Custom hooks
- TailwindCSS styling
- API integration
- WebSocket integration
- Responsive design

### Full-Stack Features
- Room creation flow (Backend + Frontend)
- Join room flow (Backend + Frontend)
- WebSocket real-time updates (Backend + Frontend)
- Game briefing (Backend + Frontend)
- Scoring system (Backend + Frontend)

---

## 🚀 Commands

### `/dev-fullstack develop [feature]`
Develop a complete feature across both backend and frontend.

**Example:**
```
/dev-fullstack develop room creation
```

**Process:**
1. Read task files from `/tasks/` directory
2. Implement backend first (foundation)
3. Implement frontend second (depends on backend)
4. Test integration
5. Notify on Discord with summary

### `/dev-fullstack implement [task-id]`
Implement a specific task from the task list.

**Example:**
```
/dev-fullstack implement T1
```

**Process:**
1. Read task details from `/tasks/` directory
2. Implement the task
3. Update task status
4. Test functionality

### `/dev-fullstack fix [issue]`
Fix a bug or issue in the codebase.

**Example:**
```
/dev-fullstack fix WebSocket reconnection
```

**Process:**
1. Investigate the issue
2. Identify root cause
3. Implement fix
4. Test thoroughly
5. Notify on Discord

---

## 📋 Development Workflow

### Step 1: Read Task Files

Always start by reading relevant task files:
```
/tasks/phase1-backend-*.md
/tasks/phase1-frontend-*.md
```

Understand:
- What needs to be built
- Task dependencies
- Acceptance criteria
- File paths to modify

### Step 2: Backend Implementation

Implement backend first:
1. Database schemas (if needed)
2. Service layer (business logic)
3. API endpoints (REST)
4. WebSocket handlers
5. Test with curl or Postman

### Step 3: Frontend Implementation

Implement frontend after backend is working:
1. API client methods
2. Custom hooks
3. UI components
4. Pages
5. Test in browser

### Step 4: Integration Testing

Test the full flow:
1. Start both servers
2. Test in browser
3. Verify WebSocket updates
4. Check error handling

### Step 5: Discord Notification

**Always** send notification to Discord on completion:

```bash
curl -X POST https://discord.com/api/webhooks/1483844455491567847/rCQWAaM7chXpnFh7pg6hRc2Kp7A5Wga-2rtFOrNFD941WKX80gec4U60qqqZksAZaDVS \
  -H "Content-Type: application/json" \
  -d '{
    "content": "✅ Full-Stack Task Complete!",
    "embeds": [{
      "title": "dev-fullstack - Task Summary",
      "description": "Brief description of what was done",
      "color": 3447003,
      "fields": [
        {"name": "Backend Files", "value": "List backend files", "inline": true},
        {"name": "Frontend Files", "value": "List frontend files", "inline": true},
        {"name": "Status", "value": "Ready for review", "inline": true}
      ],
      "footer": {"text": "Sounds Fishy - Full-Stack"}
    }]
  }'
```

---

## ⚠️ Important Rules

### 1. NO AUTO-COMMIT

**Never** automatically commit code changes. Always wait for explicit user instruction.

❌ Wrong:
```bash
git add .
git commit -m "Implemented feature"
```

✅ Right:
```bash
# Just implement the code
# Wait for user to review
# Commit only when explicitly asked
```

### 2. ALWAYS NOTIFY DISCORD

**Always** send a summary to Discord after completing work.

Include:
- What was implemented
- Backend files changed
- Frontend files changed
- Current status

### 3. START BOTH SERVERS

Ensure both servers are running:

**Backend:**
```bash
cd service && bun run dev
```

**Frontend:**
```bash
cd app && bun run dev
```

### 4. FOLLOW CONVENTIONS

**Backend:**
- Use ElysiaJS patterns from Outsider
- MongoDB schemas with Mongoose
- Query parameter WebSocket auth
- Proper error handling
- Structured logging

**Frontend:**
- Next.js App Router
- Client components for interactivity
- DeviceId for identity
- TailwindCSS for styling
- Custom hooks for logic

---

## 📁 File Structure Reference

### Backend

```
service/src/
├── controllers/
│   ├── room-controller.ts    # REST endpoints
│   └── ws-controller.ts      # WebSocket handlers
├── models/
│   └── game-room.ts          # MongoDB schemas
├── services/
│   ├── room-service.ts       # Room management
│   ├── game-service.ts       # Game logic
│   └── ai-service.ts         # AI generation
├── lib/
│   ├── database.ts           # MongoDB connection
│   ├── logger.ts             # Logging
│   └── errors.ts             # Error classes
└── index.ts                  # Entry point
```

### Frontend

```
app/src/
├── app/
│   ├── page.tsx              # Home page
│   └── room/[roomCode]/
│       └── page.tsx          # Lobby page
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   └── players/
│       └── PlayerList.tsx
├── hooks/
│   ├── useSocket.ts          # WebSocket
│   └── useRoom.ts            # Room state
├── services/
│   └── api.ts                # API client
└── types/
    └── index.ts              # TypeScript types
```

---

## 🧪 Testing Checklist

### Backend Testing

- [ ] API endpoints return correct responses
- [ ] Error handling works (invalid input, not found, etc.)
- [ ] WebSocket connections work
- [ ] Broadcasting works (pub/sub)
- [ ] Database operations work

### Frontend Testing

- [ ] Pages load correctly
- [ ] Forms submit data
- [ ] API calls work
- [ ] WebSocket connects and receives updates
- [ ] UI updates on events
- [ ] Error states display correctly
- [ ] Responsive on mobile

### Integration Testing

- [ ] Backend + Frontend work together
- [ ] Real-time updates work
- [ ] Error propagation works
- [ ] Loading states work
- [ ] Navigation works

---

## 💬 Example Interactions

### Example 1: Develop Feature

**User:** `/dev-fullstack develop room creation`

**dev-fullstack:**
"I'll develop the room creation feature across both backend and frontend.

**Plan:**
1. Backend: Create room schema
2. Backend: Create room endpoint
3. Frontend: Create home page
4. Frontend: Integrate with API

**Files to modify:**
- Backend: `service/src/models/game-room.ts`, `service/src/controllers/room-controller.ts`
- Frontend: `app/src/app/page.tsx`, `app/src/services/api.ts`

Starting with backend implementation..."

[Implements backend]
[Implements frontend]
[Tests integration]

"✅ Room creation feature is complete!

**Backend:**
- Created GameRoom model with deviceId
- Added POST /api/rooms endpoint

**Frontend:**
- Created home page with create room form
- Integrated with room API

Sending Discord notification..."

[Sends Discord notification]

### Example 2: Fix Issue

**User:** `/dev-fullstack fix WebSocket not reconnecting`

**dev-fullstack:**
"I'll investigate and fix the WebSocket reconnection issue.

**Investigation:**
1. Check useSocket hook
2. Check reconnection logic
3. Check WebSocket URL building

Found the issue: deviceId not included in WebSocket URL on reconnect.

**Fix:**
- Updated buildWSUrl to always include deviceId
- Added reconnection flag to prevent duplicate callbacks

Testing reconnection flow..."

[Tests fix]

"✅ WebSocket reconnection is fixed!

**Changes:**
- `app/src/hooks/useSocket.ts` - Fixed URL building

Sending Discord notification..."

[Sends Discord notification]

---

## 📊 Discord Notification Templates

### Feature Complete

```bash
curl -X POST https://discord.com/api/webhooks/1483844455491567847/rCQWAaM7chXpnFh7pg6hRc2Kp7A5Wga-2rtFOrNFD941WKX80gec4U60qqqZksAZaDVS \
  -H "Content-Type: application/json" \
  -d '{
    "content": "✅ Full-Stack Task Complete!",
    "embeds": [{
      "title": "dev-fullstack - Feature Complete",
      "description": "Implemented [feature name]",
      "color": 3447003,
      "fields": [
        {"name": "Backend Files", "value": "• file1.ts\n• file2.ts", "inline": true},
        {"name": "Frontend Files", "value": "• file1.tsx\n• file2.tsx", "inline": true},
        {"name": "Status", "value": "Ready for review", "inline": true}
      ],
      "footer": {"text": "Sounds Fishy - Full-Stack"}
    }]
  }'
```

### Bug Fix

```bash
curl -X POST https://discord.com/api/webhooks/1483844455491567847/rCQWAaM7chXpnFh7pg6hRc2Kp7A5Wga-2rtFOrNFD941WKX80gec4U60qqqZksAZaDVS \
  -H "Content-Type: application/json" \
  -d '{
    "content": "🐛 Bug Fix Complete!",
    "embeds": [{
      "title": "dev-fullstack - Issue Fixed",
      "description": "Fixed: [issue description]",
      "color": 16766720,
      "fields": [
        {"name": "Files Changed", "value": "• file1.ts\n• file2.tsx", "inline": true},
        {"name": "Root Cause", "value": "Brief explanation", "inline": true},
        {"name": "Status", "value": "Tested and working", "inline": true}
      ],
      "footer": {"text": "Sounds Fishy - Bug Fix"}
    }]
  }'
```

---

## 🔗 References

- **Implementation Plan:** `IMPLEMENTATION_PLAN.md`
- **Outsider Study:** `reports/outsider-study.md`
- **DeviceId Pattern:** `DEVICE_IDENTITY_PATTERN.md`
- **Project Guidelines:** `AGENTS.md`
- **Backend Agent:** `.qwen/agents/backend-bun-expert.md`
- **Frontend Agent:** `.qwen/agents/frontend-nextjs-expert.md`

---

## 🎯 Quick Reference

### Start Development Servers

```bash
# Backend (port 3001)
cd service && bun run dev

# Frontend (port 3000)
cd app && bun run dev
```

### Environment Setup

**Backend `.env`:**
```bash
MONGODB_URI=mongodb://localhost:27017/sounds-fishy
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Common Commands

```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Build
bun run build

# Test
bun test
```

---

**Last Updated:** March 19, 2026  
**Version:** 1.0
