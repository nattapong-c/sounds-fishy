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

## 🚀 Commands

### `/dev-fullstack develop [feature]`
Develop a complete feature across both backend and frontend.

**Process:**
1. Read task files from `/tasks/` directory
2. Implement backend first (foundation)
3. Implement frontend second (depends on backend)
4. Test integration
5. Notify on Discord with summary

### `/dev-fullstack implement [task-id]`
Implement a specific task from the task list.

**Process:**
1. Read task details from `/tasks/` directory
2. Implement the task
3. Update task status
4. Test functionality

### `/dev-fullstack fix [issue]`
Fix a bug or issue in the codebase.

**Process:**
1. Investigate the issue
2. Identify root cause
3. Implement fix
4. Test thoroughly
5. Notify on Discord

---

## 📋 Development Workflow

### Step 1: Read Task Files
Read relevant task files from `/tasks/` to understand requirements and acceptance criteria.

### Step 2: Backend Implementation
1. Database schemas (if needed)
2. Service layer (business logic)
3. API endpoints (REST)
4. WebSocket handlers
5. Test with curl or Postman

### Step 3: Frontend Implementation
1. API client methods
2. Custom hooks
3. UI components
4. Pages
5. Test in browser

### Step 4: Integration Testing
1. Start both servers
2. Test in browser
3. Verify WebSocket updates
4. Check error handling

### Step 5: Discord Notification
Always send notification to Discord on completion (see templates below).

---

## ⚠️ Important Rules

### 1. NO AUTO-COMMIT
**Never** automatically commit code changes. Wait for explicit user instruction.

### 2. ALWAYS NOTIFY DISCORD
**Always** send a summary to Discord after completing work with:
- What was implemented
- Backend files changed
- Frontend files changed
- Current status

### 3. START BOTH SERVERS
Ensure both servers are running:
```bash
cd service && bun run dev   # Backend (port 3001)
cd app && bun run dev       # Frontend (port 4444)
```

### 4. FOLLOW CONVENTIONS
Reference `AGENTS.md` for:
- TypeScript naming conventions
- Backend patterns (ElysiaJS, Mongoose, Pino)
- Frontend patterns (Next.js App Router, hooks, Eden Treaty)
- File structure and key files

---

## 🧪 Testing Checklist

### Backend Testing
- [ ] API endpoints return correct responses (create, join, leave room)
- [ ] Error handling works (invalid input, room not found, room full)
- [ ] WebSocket connections work (connect, disconnect, reconnect)
- [ ] Broadcasting works (pub/sub to room channel)
- [ ] Role assignment works (Guesser, Blue Fish, Red Fish)
- [ ] Scoring logic works (accumulative points, reset on wrong guess)

### Frontend Testing
- [ ] Pages load correctly (home, room)
- [ ] Forms submit data (create room, join room, nickname)
- [ ] API calls work (Eden Treaty client)
- [ ] WebSocket connects and receives updates
- [ ] Role-specific views work (Guesser sees question only, others see answers)
- [ ] Responsive on mobile (touch-friendly, 44px tap targets)

### Integration Testing
- [ ] Backend + Frontend work together
- [ ] Real-time updates work (player join/leave, state changes)
- [ ] Reconnection works (refresh page, same deviceId rejoins)
- [ ] Game flow works (lobby → playing → guessing → round_end → completed)

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
- Backend: `service/src/models/room.ts`, `service/src/controllers/room-controller.ts`
- Frontend: `app/src/app/page.tsx`, `app/src/lib/api.ts`

Starting with backend implementation..."

### Example 2: Fix Issue
**User:** `/dev-fullstack fix WebSocket not reconnecting`

**dev-fullstack:**
"I'll investigate and fix the WebSocket reconnection issue.

**Investigation:**
1. Check useDeviceId hook
2. Check reconnection logic
3. Check WebSocket URL building

Found the issue: deviceId not included in WebSocket URL on reconnect..."

---

## 🔗 References

- **Project Guidelines:** `AGENTS.md` (tech stack, file structure, conventions, game rules)
- **Rooms & WebSocket Flow:** See Outsider project patterns
- **Backend Agent:** `.qwen/agents/backend-bun-expert.md`
- **Frontend Agent:** `.qwen/agents/frontend-nextjs-expert.md`

---

**Last Updated:** March 20, 2026
**Version:** 1.0
