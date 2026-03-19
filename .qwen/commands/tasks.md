# Task Manager Command

**Role:** Task Tracker & Progress Manager  
**Scope:** Sounds Fishy Project  
**Purpose:** Track task completion and manage task files

---

## 📁 Task File Structure

Tasks are stored in `tasks/` directory with this naming convention:

```
tasks/
├── phase1-backend.md          # Phase 1 Backend tasks
├── phase1-frontend.md         # Phase 1 Frontend tasks
├── phase2-backend.md          # Phase 2 Backend tasks
└── phase2-frontend.md         # Phase 2 Frontend tasks
```

### Task File Format

```markdown
# Phase 1: Backend - Room Management

## Status: 🔄 In Progress

### Completed Tasks
- [x] T1. Create GameRoom model with deviceId
- [x] T2. Set up MongoDB connection

### In Progress
- [🔄] T3. Implement room creation endpoint

### Pending Tasks
- [ ] T4. Implement join room endpoint
- [ ] T5. Add WebSocket connection handler

### Blockers
- ⚠️ Waiting for MongoDB setup
```

---

## 🗣️ Commands

### `/tasks create [phase] [type]`
Create a new task file for a phase.

**Example:**
```
/tasks create phase1 backend
```

**Output:**
- Creates `tasks/phase1-backend.md`
- Pre-populates with task template
- Ready for task tracking

### `/tasks update [task-id] [status]`
Update task completion status.

**Example:**
```
/tasks update T3 ✅
```

**Status Options:**
- `⏳` or `pending` - Not started
- `🔄` or `progress` - In progress
- `✅` or `done` - Completed
- `⚠️` or `blocked` - Blocked

### `/tasks list [phase]`
List all tasks in a phase.

**Example:**
```
/tasks list phase1
```

**Output:**
```
## Phase 1: Backend

✅ T1. Create GameRoom model
✅ T2. Set up MongoDB connection
🔄 T3. Implement room creation endpoint
⏳ T4. Implement join room endpoint
⏳ T5. Add WebSocket handler

Progress: 2/5 (40%)
```

### `/tasks next`
Show next recommended task.

**Output:**
```
Next Task: T3. Implement room creation endpoint

Why: T1 and T2 are complete, T3 is the next dependency
Estimated: 1-2 hours
Files: service/src/controllers/room-controller.ts
```

### `/tasks summary`
Show overall progress across all phases.

**Output:**
```
## Project Progress

Phase 1: Backend     ████████░░ 80% (4/5)
Phase 1: Frontend    ████░░░░░░ 40% (2/5)
Phase 2: Backend     ░░░░░░░░░░ 0% (0/6)
Phase 2: Frontend    ░░░░░░░░░░ 0% (0/6)

Total: 6/22 tasks (27%)
```

---

## 📊 Progress Tracking

### Status Indicators

| Symbol | Meaning | Color |
|--------|---------|-------|
| ⏳ | Pending / Not started | Gray |
| 🔄 | In Progress | Yellow |
| ✅ | Completed | Green |
| ⚠️ | Blocked | Red |

### Progress Calculation

```
Progress = (Completed Tasks / Total Tasks) × 100

Phase Progress = Completed in Phase / Total in Phase
Overall Progress = All Completed / All Tasks
```

---

## 🎯 Task Dependencies

When updating task status, check dependencies:

```
T1 → T2 → T3
      ↓
      T4
```

**Rules:**
- Can't start T2 until T1 is ✅
- Can't start T3 until T2 is ✅
- Can start T4 once T2 is ✅ (parallel with T3)

**Validation:**
```
User: "Mark T3 as done"
Manager: "⚠️ T2 must be completed first. Current status: T2 = pending"
```

---

## 📝 Task File Template

```markdown
# [Phase Name]: [Type]

**Status:** ⏳ Not Started | 🔄 In Progress | ✅ Completed
**Start Date:** YYYY-MM-DD
**Target Date:** YYYY-MM-DD

## Overview
Brief description of what this phase covers.

## Tasks

### Completed ✅
- [x] T1. [Task description]
  - **Completed:** YYYY-MM-DD
  - **Files:** [file paths]
  - **Notes:** Any relevant notes

### In Progress 🔄
- [🔄] T2. [Task description]
  - **Started:** YYYY-MM-DD
  - **Files:** [file paths]
  - **Progress:** What's done, what's left

### Pending ⏳
- [ ] T3. [Task description]
  - **Dependencies:** T1, T2
  - **Estimated:** 1-2 hours
  - **Files:** [file paths]

### Blocked ⚠️
- [!] T4. [Task description]
  - **Blocker:** What's blocking
  - **Owner:** Who needs to unblock
  - **Since:** When blocked

## Progress

- **Completed:** 2/6 (33%)
- **Last Updated:** YYYY-MM-DD

## Notes

Any additional context, decisions, or important information.
```

---

## 🔄 Workflow

### Starting a Phase

1. Create task file: `/tasks create phase1 backend`
2. Review task breakdown from PM
3. Copy tasks from PM breakdown into task file
4. Mark all as pending: `[ ]`

### Working on Tasks

1. Check next task: `/tasks next`
2. Mark as in progress: `/tasks update T3 🔄`
3. Work on task
4. Mark as done: `/tasks update T3 ✅`
5. Add completion date and files

### Completing a Phase

1. Verify all tasks are ✅
2. Update phase status: `**Status:** ✅ Completed`
3. Add completion notes
4. Celebrate! 🎉

---

## 📈 Reporting

### Daily Standup Format

```
## Daily Update - YYYY-MM-DD

### Completed Today
- ✅ T3. Implement room creation endpoint

### In Progress
- 🔄 T4. Implement join room endpoint (50% done)

### Blockers
- None

### Tomorrow
- Finish T4
- Start T5 (WebSocket handler)
```

### Weekly Summary

```
## Weekly Summary - Week of YYYY-MM-DD

### Progress
- Started: Phase 1 Backend
- Completed: 4 tasks
- Total Progress: 40%

### Next Week
- Complete Phase 1 Backend
- Start Phase 1 Frontend
```

---

## 🎯 Integration with PM Command

**PM creates breakdown → Tasks tracks execution**

```
/pm plan room creation
→ Returns task breakdown with IDs (T1, T2, T3...)

/tasks create phase1 backend
→ Creates task file

/tasks update T1 ✅
→ Tracks completion

/tasks summary
→ Shows overall progress
```

---

## 💡 Tips

1. **Update Frequently** - Mark tasks as you complete them
2. **Be Specific** - Include file paths and details
3. **Track Blockers** - Note what's blocking progress
4. **Celebrate Wins** - Acknowledge completed tasks
5. **Review Regularly** - Check `/tasks summary` daily

---

**Last Updated:** March 19, 2026  
**Version:** 1.0
