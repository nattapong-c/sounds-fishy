# Phase 2: Backend - Game Briefing & AI Integration

**Status:** ✅ Completed  
**Created:** 2026-03-19  
**Target:** 2026-03-21  
**Total Tasks:** 6

## Overview

Implement the game briefing phase with AI-powered question and answer generation. This phase handles role assignment, secret word distribution, and lie generation for Red Herrings.

**Key Features:**
- AI service for question/answer generation
- Game service for briefing management
- Role-specific content delivery
- Lie generation for Red Herrings
- WebSocket events for briefing flow

**Note:** Phase 2.5 will replace AI generation with MongoDB question bank for production use. AI service remains as optional fallback.

## Tasks

### Completed ✅
- [x] T6. Create Word Bank Service (Fallback)
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/src/services/word-bank-service.ts`
  - **Notes:** Created 50+ question/answer pairs across 10 categories. Includes getRandomQuestion(), generateRoundData(), and generateLieSuggestion() methods.
- [x] T3. Update Room Model
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/src/models/game-room.ts`
  - **Notes:** Model already has all required fields (aiConfig, question, secretWord, generatedLie). No changes needed.
- [x] T1. Create AI Service
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/src/services/ai-service.ts`, `service/src/lib/ai-config.ts`
  - **Notes:** OpenAI-compatible API integration with automatic word bank fallback. Supports configurable API key, base URL, and model. **Note: Will be replaced by question bank in Phase 2.5**
- [x] T2. Create Game Service
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/src/services/game-service.ts`
  - **Notes:** Core briefing logic - startBriefing(), generateLieForPlayer(), toggleReadyAndCheck(), getRoleSpecificPayload(). Role assignment included. **Note: Will be updated in Phase 2.5 to use question bank**
- [x] T4. Add Briefing WebSocket Handler
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/src/controllers/ws-controller.ts`
  - **Notes:** Added handleGenerateLie(), updated handleReadyUp() and handleStartGame() to use gameService. Role-specific payloads sent via start_round event.
- [x] T5. Add AI Configuration to Room Controller
  - **Completed:** 2026-03-19
  - **Agent:** backend-bun-expert
  - **Files:** `service/src/controllers/room-controller.ts`
  - **Notes:** Added POST /api/rooms/:roomCode/regenerate-ai endpoint (host only). Allows regenerating AI data if not satisfied. **Note: Optional feature, may be deprecated in Phase 2.5**

### In Progress 🔄
- None yet

### Pending ⏳

#### T1. Create AI Service
- **Dependencies:** None
- **Agent:** backend-bun-expert
- **Estimated:** 2 hours
- **Files:** `service/src/services/ai-service.ts`, `service/src/lib/ai-config.ts`
- **Description:** OpenAI-compatible API integration for generating questions, correct answers, and bluff suggestions
- **Acceptance Criteria:**
  - ✅ generateRoundData() - generates question + correct answer + bluff suggestions
  - ✅ generateLieSuggestion() - generates lie based on question and existing answers
  - ✅ Configurable API key, base URL, model via environment variables
  - ✅ Fallback to word bank if AI fails
  - ✅ Error handling for API failures

#### T2. Create Game Service
- **Dependencies:** None
- **Agent:** backend-bun-expert
- **Estimated:** 1.5 hours
- **Files:** `service/src/services/game-service.ts`
- **Description:** Business logic for briefing phase, role management, and lie tracking
- **Acceptance Criteria:**
  - ✅ startBriefing() - generates AI data, assigns roles, updates room status
  - ✅ getRoleSpecificPayload() - returns role-specific data for each player
  - ✅ generateLieForPlayer() - generates and stores lie for Red Herring
  - ✅ checkAllPlayersReady() - verifies all non-host players are ready
  - ✅ toggleReadyAndCheck() - toggles ready and returns if all ready

#### T3. Update Room Model
- **Dependencies:** None
- **Agent:** backend-bun-expert
- **Estimated:** 30 minutes
- **Files:** `service/src/models/game-room.ts`
- **Description:** Add AI config, question, secretWord fields to room schema
- **Acceptance Criteria:**
  - ✅ aiConfig field (question, correctAnswer, bluffSuggestions, generatedAt, model)
  - ✅ question field (string, optional)
  - ✅ secretWord field (string, optional)
  - ✅ generatedLie field in player schema (string, optional)
  - ✅ TypeScript interfaces updated

#### T4. Add Briefing WebSocket Handler
- **Dependencies:** T1, T2, T3
- **Agent:** backend-bun-expert
- **Estimated:** 1.5 hours
- **Files:** `service/src/controllers/ws-controller.ts`
- **Description:** WebSocket handlers for briefing phase events
- **Acceptance Criteria:**
  - ✅ Handle start_game event - triggers briefing start
  - ✅ Broadcast start_round to all players with role-specific payloads
  - ✅ Handle generate_lie request from Red Herring players
  - ✅ Handle ready_up during briefing
  - ✅ Broadcast all_players_ready when everyone is ready

#### T5. Add AI Configuration to Room Controller
- **Dependencies:** T1
- **Agent:** backend-bun-expert
- **Estimated:** 30 minutes
- **Files:** `service/src/controllers/room-controller.ts`
- **Description:** Add endpoint to regenerate AI data if needed
- **Acceptance Criteria:**
  - ✅ POST /api/rooms/:roomCode/regenerate - regenerates AI data (host only)
  - ✅ Validates host is requesting
  - ✅ Returns new AI config
  - ✅ Broadcasts room_updated via WebSocket

#### T6. Create Word Bank Service (Fallback)
- **Dependencies:** None
- **Agent:** backend-bun-expert
- **Estimated:** 1 hour
- **Files:** `service/src/services/word-bank-service.ts`
- **Description:** Fallback word bank for when AI service is unavailable
- **Acceptance Criteria:**
  - ✅ Pre-defined list of 50+ question/answer pairs
  - ✅ getRandomQuestion() - returns random question with answer and bluffs
  - ✅ getRandomLie() - returns random lie suggestion
  - ✅ Used as fallback when AI service fails
  - ✅ Categories or difficulty levels (optional)

## Progress

- **Completed:** 0/6 (0%)
- **Last Updated:** 2026-03-19

## Dependencies

```
T1 ──→ T2 ──→ T4
 ↓           ↑
T3 ──────────┘
 ↓
T5

T6 (independent, used by T1)
```

## Notes

- AI service should be OpenAI-compatible (works with OpenAI API, local LLMs, etc.)
- Environment variables: OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
- Fallback to word bank if AI service is unavailable or fails
- Store generated lies per player to prevent duplicates
- AI config stored in room for reference during gameplay
- Follow patterns from Outsider project for service structure

## Testing Checklist

- [ ] AI service generates valid questions
- [ ] AI service generates appropriate bluff suggestions
- [ ] Lie generation works with context
- [ ] Fallback to word bank works
- [ ] Briefing starts correctly
- [ ] Role-specific payloads are correct
- [ ] All players ready detection works
- [ ] WebSocket events broadcast correctly
