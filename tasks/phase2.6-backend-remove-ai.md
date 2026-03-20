# Phase 2.6 Backend: Remove AI & Update Game Logic

**Status:** ⏳ Not Started  
**Created:** 2026-03-20  
**Target:** 2026-03-21  
**Total Tasks:** 4

## Overview

Backend tasks for removing AI service and implementing Guessing Phase with mockup data from MongoDB.

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Remove AI Service**
  - **Dependencies:** None
  - **Agent:** backend-bun-expert
  - **Estimated:** 1-2 hours
  - **Files to Modify:**
    - `service/src/services/ai-service.ts` (DELETE)
    - `service/src/index.ts` (remove AI imports)
    - `service/.env` (remove OPENAI_* variables - document as optional)
    - `service/package.json` (remove openai dependency if exists)
  - **Description:** 
    - Delete `ai-service.ts` file completely
    - Remove all imports of ai-service from other files
    - Remove OpenAI API configuration from environment
    - Keep seed script intact (`service/scripts/seed-questions.ts`)
  - **Acceptance Criteria:**
    - ✅ No references to ai-service in codebase
    - ✅ No OpenAI API calls
    - ✅ Seed script still works
    - ✅ Backend builds without errors

- [ ] **T2. Backend: Update Game Service to Use Mockup Data**
  - **Dependencies:** T1
  - **Agent:** backend-bun-expert
  - **Estimated:** 2-3 hours
  - **Files to Modify:**
    - `service/src/services/game-service.ts`
    - `service/src/services/question-bank-service.ts`
  - **Description:**
    - Rename `startBriefing()` to `startGame()`
    - Remove AI generation logic
    - Select random question from question bank (MongoDB)
    - Assign roles: 1 Guesser, 1 Big Fish, rest Red Herrings
    - For Red Herrings: Assign unique fake answer + lie suggestion to each
    - Store question, correct answer, and bluff suggestions in room
    - Return room with all data prepared
  - **Acceptance Criteria:**
    - ✅ `startGame()` function exists
    - ✅ Random question selected from MongoDB
    - ✅ Roles assigned correctly (1 Guesser, 1 Big Fish, rest Red Herrings)
    - ✅ Each Red Herring gets unique fake answer (MANDATORY to use)
    - ✅ Each Red Herring gets lie suggestion (hint only)
    - ✅ Room saved with question, answer, and bluff suggestions
    - ✅ No AI calls

- [ ] **T3. Backend: Update Game Room Model**
  - **Dependencies:** None
  - **Agent:** backend-bun-expert
  - **Estimated:** 30 min
  - **Files to Modify:**
    - `service/src/models/game-room.ts`
  - **Description:**
    - Change status enum: remove 'briefing', add 'guessing'
    - Update TypeScript interface IGameRoom
    - Update any type references
  - **Acceptance Criteria:**
    - ✅ Status can be 'guessing'
    - ✅ No 'briefing' status
    - ✅ TypeScript compiles without errors

- [ ] **T4. Backend: Update WebSocket Controller**
  - **Dependencies:** T2, T3
  - **Agent:** backend-bun-expert
  - **Estimated:** 1-2 hours
  - **Files to Modify:**
    - `service/src/controllers/ws-controller.ts`
  - **Description:**
    - Update `handleStartGame` to call `gameService.startGame()`
    - Broadcast `game_started` with status: 'guessing'
    - Send role-specific payload to ALL players via direct WebSocket send
    - Each player receives: question, role, and role-specific data
      - Guesser: question only
      - Big Fish: question + correctAnswer
      - Red Herring: question + fakeAnswer + lieSuggestion
  - **Acceptance Criteria:**
    - ✅ All players receive start_round event
    - ✅ Each player gets correct role-specific data
    - ✅ Red Herrings get fakeAnswer (what to say)
    - ✅ Red Herrings get lieSuggestion (hint)
    - ✅ Room status updated to 'guessing'
    - ✅ Broadcast sent to all players

---

## Progress

- **Completed:** 0/4 (0%)
- **Last Updated:** 2026-03-20

## Dependencies

```
T1 ──→ T2 ──→ T4
         ↑
T3 ──────┘
```

## Recommended Order

1. **T3** (30 min) - Update model first (foundation)
2. **T1** (1-2h) - Remove AI service
3. **T2** (2-3h) - Update game service with mockup data
4. **T4** (1-2h) - Update WebSocket controller

**Total Estimated Effort:** 4-6.5 hours (M-L)

## Notes

- Keep seed script - it's useful for populating test data
- Question bank should already exist in MongoDB from Phase 2.5
- Use random selection from question bank (no AI)
- Ensure all players receive data simultaneously
