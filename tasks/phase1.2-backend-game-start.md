# Phase 1.2 Backend: Game Start & Guessing Phase

**Status:** ⏳ Not Started  
**Created:** 2026-03-20  
**Target:** 2026-03-21  
**Total Tasks:** 6

## Overview

Backend implementation for starting the game: assign roles (Guesser, Blue Fish, Red Fish), get question/answer from database, and broadcast role-specific information to players.

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Question Bank Schema & Seed Data**
  - **Dependencies:** None
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `service/src/models/question-bank.ts`, `service/scripts/seed-questions.ts`
  - **Description:** Create MongoDB schema for questions with correct answer and fake answers. Add seed script with 20+ initial questions.
  - **Acceptance Criteria:**
    - ✅ QuestionBank schema with question, correctAnswer, fakeAnswers array
    - ✅ Index on category/language for random selection
    - ✅ Seed script populates 20+ questions
    - ✅ Questions cover different categories (kitchen, animals, jobs, etc.)

- [ ] **T2. Backend: Question Bank Service**
  - **Dependencies:** T1
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `service/src/services/question-bank-service.ts`
  - **Description:** Create service to get random question from database. Support filtering by category/language if needed.
  - **Acceptance Criteria:**
    - ✅ getRandomQuestion() returns random question with all answers
    - ✅ Handles empty database gracefully
    - ✅ Logs question selection for debugging

- [ ] **T3. Backend: Room Model Update for Game State**
  - **Dependencies:** None
  - **Effort:** S (1h)
  - **Files to Create/Modify:** `service/src/models/room.ts`
  - **Description:** Add game state fields: currentQuestion, currentRound, roundGuesserId, scores map.
  - **Acceptance Criteria:**
    - ✅ currentQuestion field (stores question object)
    - ✅ currentRound number (starts at 1)
    - ✅ roundGuesserId (tracks whose turn to guess)
    - ✅ scores map with playerId → {totalPoints, tempPoints, roundsAsGuesser, roundsAsBlueFish, roundsAsRedFish}

- [ ] **T4. Backend: Role Assignment Logic**
  - **Dependencies:** T3
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `service/src/game/roles.ts`
  - **Description:** Implement role assignment algorithm: rotate Guesser each round, random Blue Fish, rest are Red Fish.
  - **Acceptance Criteria:**
    - ✅ assignRoles(players, lastGuesserId) returns player assignments
    - ✅ Rotates Guesser to next player each round
    - ✅ Random Blue Fish from remaining players
    - ✅ Rest are Red Fish
    - ✅ Handles 4-8 players correctly

- [ ] **T5. Backend: Start Game WebSocket Handler**
  - **Dependencies:** T2, T4
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Handle start_game WebSocket message: validate admin, assign roles, get question, broadcast to players.
  - **Acceptance Criteria:**
    - ✅ Validates admin permissions
    - ✅ Validates minimum 4 players
    - ✅ Calls role assignment service
    - ✅ Gets random question from question bank
    - ✅ Updates room status to 'playing'
    - ✅ Broadcasts game_started with role-specific data

- [ ] **T6. Backend: Role-Specific Payload Builder**
  - **Dependencies:** T5
  - **Effort:** S (1-2h)
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Build different payloads for each role: Guesser (question only), Blue Fish (question + correct answer), Red Fish (question + fake answer + lie suggestion).
  - **Acceptance Criteria:**
    - ✅ Guesser receives: question only
    - ✅ Blue Fish receives: question + correctAnswer
    - ✅ Red Fish receives: question + fakeAnswer + lieSuggestion
    - ✅ Each Red Fish gets UNIQUE fake answer

---

## Progress

- **Completed:** 0/6 (0%)
- **Last Updated:** 2026-03-20

## Dependencies

```
T1 ──→ T2 ──→ T5 ──→ T6
              ↑
T3 ──→ T4 ────┘
```

## Recommended Order

1. **T1** - Backend: Question Bank Schema (1-2h)
2. **T2** - Backend: Question Bank Service (1-2h)
3. **T3** - Backend: Room Model Update (1h)
4. **T4** - Backend: Role Assignment Logic (3-4h)
5. **T5** - Backend: Start Game Handler (3-4h)
6. **T6** - Backend: Role-Specific Payload (1-2h)

**Total Estimated Effort:** 10-15 hours (L)

## Notes

- Reference AGENTS.md for game rules and role definitions
- Follow Outsider project patterns for WebSocket event handling
- No timers needed - players proceed at their own pace
- Each Red Fish must get a UNIQUE fake answer (important for gameplay)

## Testing Checklist

- [ ] Question bank schema created and indexed
- [ ] Seed script populates 20+ questions
- [ ] getRandomQuestion() returns valid question
- [ ] Role assignment works for 4, 5, 6, 7, 8 players
- [ ] Guesser rotates correctly each round
- [ ] Start game validates admin permissions
- [ ] Start game validates minimum 4 players
- [ ] Each role receives correct payload
- [ ] Each Red Fish gets unique fake answer
- [ ] Room status updates to 'playing'
