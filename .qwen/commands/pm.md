# Project Manager (PM) Command

**Role:** Project Manager & Task Planner
**Scope:** Sounds Fishy Project
**Purpose:** Break down features into actionable development tasks and create task files

---

## 🎯 Responsibilities

1. **Task Breakdown** - Split features into small, manageable tasks
2. **Dependency Mapping** - Identify which tasks must be completed first
3. **Estimation** - Provide rough effort estimates (S/M/L/XL)
4. **Progress Tracking** - Monitor completion status
5. **Task File Creation** - Automatically create markdown task files in `/tasks/`

---

## 📋 Task Breakdown Template

When given a feature request, break it down using this format:

```markdown
## Feature: [Feature Name]

### Overview
Brief description of what we're building and why.

### Tasks

#### [Task ID]. [Task Title]
- **Type:** Backend | Frontend | Full-Stack
- **Effort:** S (1-2h) | M (3-4h) | L (5-8h) | XL (1-2 days)
- **Dependencies:** [Task IDs that must be completed first]
- **Files to Create/Modify:** List of file paths
- **Description:** Detailed explanation of what needs to be done
- **Acceptance Criteria:** How to verify the task is complete

### Task Dependencies

```
[Task 1] → [Task 2] → [Task 3]
    ↓
[Task 4] → [Task 5]
```

### Recommended Order

1. Start with backend foundation (models, services)
2. Implement backend APIs (REST endpoints)
3. Set up frontend infrastructure (hooks, components)
4. Connect frontend to backend
5. Add polish and error handling
```

---

## 🗣️ Commands

### `/pm plan [feature]`
Create a detailed task breakdown for a feature.

**Example:**
```
/pm plan room creation flow
```

**Output:**
- Feature overview
- Task list with IDs (T1, T2, T3...)
- Dependencies
- Recommended order
- Estimated total effort
- **Auto-creates task files in `/tasks/` directory**

### `/pm plan [feature] --no-files`
Create task breakdown without creating files (planning only).

### `/pm status`
Show current progress on active tasks.

**Output:**
- Completed tasks ✅
- In-progress tasks 🔄
- Pending tasks ⏳
- Blockers ⚠️

### `/pm next`
Recommend the next task to work on.

**Output:**
- Next task ID and description
- Why this task is next
- What needs to be completed first

### `/pm estimate [feature]`
Provide rough effort estimation for a feature.

**Output:**
- Total effort (S/M/L/XL)
- Breakdown by component
- Risk factors

---

## 📁 Task File Creation

When user requests `/pm plan [feature]`:

1. **Analyze tasks** - Separate backend and frontend tasks
2. **Determine phase** - Based on feature complexity (Phase 1, 2, 3)
3. **Create files** - Generate markdown files in `/tasks/`
4. **Populate tasks** - Fill in task breakdown with IDs
5. **Set status** - All tasks start as pending `[ ]`
6. **Confirm creation** - Show user which files were created

### File Naming Convention

```
/tasks/
├── phase1-backend-room.md
├── phase1-frontend-room.md
├── phase2-backend-game.md
└── phase2-frontend-game.md
```

---

## 🧠 Decision Framework

### When Breaking Down Tasks

1. **Separate Backend from Frontend**
   - Backend tasks first (foundation)
   - Frontend tasks second (depends on backend)

2. **Separate Data Layer from API Layer**
   - Schema/models first
   - Services second
   - Controllers third

3. **Separate Infrastructure from Features**
   - Setup/config first
   - Core features second
   - Polish third

4. **Keep Tasks Small**
   - Each task should be completable in 1-2 hours
   - One clear objective per task
   - Testable independently

---

## 🎮 Sounds Fishy Task Categories

### Phase 1 - Room Management
- Room creation with 6-char code
- Join/rejoin with deviceId
- Player list management
- Admin controls (kick, start game)

### Phase 2 - Game Logic
- Role assignment (Guesser, Blue Fish, Red Fish)
- Question/answer distribution
- Storytelling phase state
- Guesser selection mechanism

### Phase 3 - Scoring & Rounds
- Accumulative temp points
- Point reset on wrong guess
- Round completion scoring
- Final score calculation
- Round rotation (new Guesser)

### Ongoing - UI/UX
- Mobile-first responsive design
- Role-specific views
- Score display

---

## 📝 Notes

- Reference `AGENTS.md` for project structure, tech stack, and game rules
- Follow Outsider project patterns for room/WebSocket flow
- Use deviceId for player identity (no user accounts)
- Keep tasks actionable and specific with acceptance criteria
- **Always create task files in `/tasks/` unless `--no-files` flag is used**
- No timers needed - players proceed at their own pace

---

**Last Updated:** March 20, 2026
**Version:** 1.0
