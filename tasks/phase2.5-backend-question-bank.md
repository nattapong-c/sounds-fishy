# Phase 2.5: Backend - MongoDB Data Bank (Replace AI Generation)

**Status:** ⏳ Not Started  
**Created:** 2026-03-19  
**Target:** 2026-03-20  
**Total Tasks:** 5

## Overview

Replace AI-generated round data with pre-generated data stored in MongoDB. This provides more control over question quality, eliminates API costs, and ensures consistent game experience. Data will include questions, correct answers, fake answers (bluff suggestions), and lie suggestions.

**Key Features:**
- MongoDB schema for question bank
- Service layer for fetching random questions
- Fallback to word bank if MongoDB empty
- Script structure for future data seeding
- Remove AI service dependency from game flow

## Tasks

### Completed ✅
- [x] T1. Create Question Bank Schema
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/src/models/question-bank.ts`
  - **Notes:** Created schema with question, correctAnswer, bluffSuggestions[], lieSuggestions[], category, difficulty, usageCount. Includes static getRandom() method.
- [x] T2. Create Question Bank Service
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/src/services/question-bank-service.ts`
  - **Notes:** Service with getRandomQuestion(), getRandomLieSuggestion(), getByCategory(), getByDifficulty(). Falls back to word bank if MongoDB empty.
- [x] T3. Update Game Service to Use Question Bank
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/src/services/game-service.ts`
  - **Notes:** Replaced aiService with questionBankService in startBriefing() and generateLieForPlayer(). Updated logging.
- [x] T4. Create Data Seed Script Structure
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/scripts/seed-questions.ts`, `service/package.json`
  - **Notes:** Created seed script with 10 mockup questions. Added "seed" command to package.json. Prevents duplicates.
- [x] T5. Update Environment Configuration
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/.env.example`, `service/.env`
  - **Notes:** Removed AI config completely. Added note about Question Bank. AI service deleted.
- [x] **BONUS: Removed AI Service**
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** Deleted: `service/src/services/ai-service.ts`, `service/src/lib/ai-config.ts`
  - **Notes:** Completely removed AI service and regenerate-ai endpoint. Cleaner codebase, no AI dependencies.

### In Progress 🔄
- None yet

### Pending ⏳

#### T1. Create Question Bank Schema
- **Dependencies:** None
- **Agent:** backend-bun-expert
- **Estimated:** 30 minutes
- **Files:** `service/src/models/question-bank.ts`
- **Description:** Define MongoDB schema for storing pre-generated question data with question, correct answer, bluff suggestions, and lie suggestions
- **Acceptance Criteria:**
  - ✅ Schema with fields: question, correctAnswer, bluffSuggestions[], lieSuggestions[]
  - ✅ Category field (optional)
  - ✅ Difficulty field (easy/medium/hard)
  - ✅ Usage count field (to track and balance usage)
  - ✅ Indexes for efficient random queries
  - ✅ TypeScript interfaces exported

#### T2. Create Question Bank Service
- **Dependencies:** T1
- **Agent:** backend-bun-expert
- **Estimated:** 1 hour
- **Files:** `service/src/services/question-bank-service.ts`
- **Description:** Service layer for fetching random questions from MongoDB with proper fallback logic
- **Acceptance Criteria:**
  - ✅ getRandomQuestion(playerCount) - returns question data
  - ✅ Uses MongoDB aggregation for random selection
  - ✅ Filters by player count for appropriate bluff suggestions
  - ✅ Fallback to word-bank-service if MongoDB empty
  - ✅ Tracks usage count for balancing
  - ✅ Error handling for database failures

#### T3. Update Game Service to Use Question Bank
- **Dependencies:** T1, T2
- **Agent:** backend-bun-expert
- **Estimated:** 1 hour
- **Files:** `service/src/services/game-service.ts`
- **Description:** Replace AI service calls with question bank service in startBriefing() and generateLieForPlayer()
- **Acceptance Criteria:**
  - ✅ startBriefing() uses questionBankService.getRandomQuestion()
  - ✅ generateLieForPlayer() uses question bank lie suggestions
  - ✅ Remove aiService import (or keep as optional fallback)
  - ✅ Update logging to reflect new data source
  - ✅ All existing tests pass

#### T4. Create Data Seed Script Structure
- **Dependencies:** T1
- **Agent:** backend-bun-expert
- **Estimated:** 30 minutes
- **Files:** `service/scripts/seed-questions.ts`
- **Description:** Create script structure for future data seeding (mockup data for now)
- **Acceptance Criteria:**
  - ✅ Script can be run with `bun run scripts/seed-questions.ts`
  - ✅ Includes mockup data (5-10 sample questions)
  - ✅ Prevents duplicates (checks before inserting)
  - ✅ Logs progress and results
  - ✅ Clear instructions in comments for future data addition

#### T5. Update Environment Configuration
- **Dependencies:** None
- **Agent:** backend-bun-expert
- **Estimated:** 15 minutes
- **Files:** `service/.env.example`, `service/.env`
- **Description:** Add configuration for question bank settings
- **Acceptance Criteria:**
  - ✅ QUESTION_BANK_COLLECTION environment variable (optional)
  - ✅ REMOVE or mark AI config as optional
  - ✅ Update documentation comments
  - ✅ Backward compatible (AI config still works if needed)

## Progress

- **Completed:** 0/5 (0%)
- **Last Updated:** 2026-03-19

## Dependencies

```
T1 (Schema) → T2 (Service) → T3 (Game Service Update)
   ↓
   T4 (Seed Script)

T5 (Env Config) - Independent
```

## Notes

- This replaces AI generation as the PRIMARY data source
- AI service can remain as optional fallback (if desired)
- Word bank service remains as final fallback
- Mockup data should cover different categories and difficulties
- Future: Separate script will generate large dataset using AI
- This approach eliminates API costs and latency during gameplay

## Testing Checklist

- [ ] Question bank schema works correctly
- [ ] getRandomQuestion() returns valid data
- [ ] Fallback to word bank works when MongoDB empty
- [ ] Game service uses question bank correctly
- [ ] Seed script can insert mockup data
- [ ] No breaking changes to existing API
- [ ] WebSocket events still work correctly
