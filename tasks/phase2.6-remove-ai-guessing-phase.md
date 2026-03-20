# Phase 2.6: Remove AI & Implement Guessing Phase

**Status:** 🔄 In Progress  
**Created:** 2026-03-20  
**Target:** 2026-03-21  
**Total Tasks:** 8

## Overview

Remove AI generation features and implement direct transition to Guessing Phase. When host starts game, all players are immediately assigned roles and shown their information. Questions and answers will use mockup data from MongoDB question bank (no AI generation).

**Key Changes:**
- Remove AI service and AI-related code
- Remove Briefing phase (direct to Guessing Phase)
- Assign roles immediately on game start
- Use mockup questions and answers from question bank
- Keep seed script for data population

---

## Tasks

### Completed ✅

None yet.

### In Progress 🔄

None yet.

### Pending ⏳

- [ ] **T1. Backend: Remove AI Service**
  - **Dependencies:** None
  - **Agent:** backend-bun-expert
  - **Estimated:** 1-2 hours
  - **Files:** `service/src/services/ai-service.ts` (delete), `service/src/index.ts`, `service/package.json`
  - **Description:** Remove AI service file and references. Remove OpenAI API key from environment. Keep seed script.

- [ ] **T2. Backend: Update Game Service to Use Mockup Data**
  - **Dependencies:** T1
  - **Agent:** backend-bun-expert
  - **Estimated:** 2-3 hours
  - **Files:** `service/src/services/game-service.ts`, `service/src/services/question-bank-service.ts`
  - **Description:** Update `startBriefing()` to `startGame()`. Select random question from question bank. Assign roles and prepare data for all players.

- [ ] **T3. Backend: Update Game Room Model**
  - **Dependencies:** None
  - **Agent:** backend-bun-expert
  - **Estimated:** 30 min
  - **Files:** `service/src/models/game-room.ts`
  - **Description:** Change status from 'briefing' to 'guessing'. Update TypeScript types.

- [ ] **T4. Backend: Update WebSocket Controller**
  - **Dependencies:** T2, T3
  - **Agent:** backend-bun-expert
  - **Estimated:** 1-2 hours
  - **Files:** `service/src/controllers/ws-controller.ts`
  - **Description:** Update `handleStartGame` to use new game service. Broadcast 'game_started' with 'guessing' status. Send role-specific data to all players.

- [ ] **T5. Frontend: Update Room Page for Guessing Phase**
  - **Dependencies:** T4
  - **Agent:** frontend-nextjs-expert
  - **Estimated:** 2-3 hours
  - **Files:** `app/src/app/room/[roomCode]/page.tsx`
  - **Description:** Rename briefing phase to guessing phase. Update useBriefing hook to useGuessing. Update UI components.

- [ ] **T6. Frontend: Update Role Views**
  - **Dependencies:** T5
  - **Agent:** frontend-nextjs-expert
  - **Estimated:** 1-2 hours
  - **Files:** `app/src/app/room/[roomCode]/page.tsx` (inline components)
  - **Description:** Update GuesserView, BigFishView, RedHerringView to work with guessing phase. Remove any AI generation UI.

- [ ] **T7. Frontend: Remove AI-Related Code**
  - **Dependencies:** T5
  - **Agent:** frontend-nextjs-expert
  - **Estimated:** 1 hour
  - **Files:** `app/src/app/room/[roomCode]/page.tsx`
  - **Description:** Remove generateLie API call. Remove canGenerateLie state. Simplify RedHerringView.

- [ ] **T8. Testing & Verification**
  - **Dependencies:** T6, T7
  - **Agent:** general-purpose
  - **Estimated:** 1-2 hours
  - **Files:** All
  - **Description:** Test full game flow. Verify roles assigned correctly. Verify no AI errors. Verify mockup data works.

---

## Progress

- **Completed:** 0/8 (0%)
- **Last Updated:** 2026-03-20

## Dependencies

```
T1 ──→ T2 ──→ T4 ──→ T5 ──→ T6 ──→ T8
              ↓      ↓      ↓
T3 ───────────┘      │      └──→ T7 ──┘
                     │
                     └──────────────┘
```

## Mockup Data Structure

Questions should be stored in MongoDB with this structure:

```typescript
interface QuestionBank {
  question: string;
  correctAnswer: string;
  bluffSuggestions: string[];  // 3-4 fake answers for Red Herrings
  category?: string;
}
```

Example:
```json
{
  "question": "What's something you might find in a kitchen?",
  "correctAnswer": "A spatula",
  "bluffSuggestions": [
    "A toaster oven",
    "A cutting board",
    "A blender"
  ]
}
```

## Red Herring Role Distribution

When the game starts, **each Red Herring player** receives:
- **1 Fake Answer** (from bluffSuggestions array) - This is THEIR lie to tell (MUST use this)
- **1 Lie Suggestion** (from bluffSuggestions array) - This is a HINT (for inspiration only)

**Example Distribution:**
```
Room with 5 players:
- 1 Guesser (gets question only)
- 1 Big Fish (gets question + correct answer)
- 3 Red Herrings (each gets question + 1 fake answer + 1 lie suggestion)

Red Herring 1:
  - Fake Answer: "A toaster oven" (what they MUST say out loud)
  - Lie Suggestion: "A cutting board" (hint to inspire their lie)

Red Herring 2:
  - Fake Answer: "A cutting board" (what they MUST say out loud)
  - Lie Suggestion: "A blender" (hint to inspire their lie)

Red Herring 3:
  - Fake Answer: "A blender" (what they MUST say out loud)
  - Lie Suggestion: "A toaster oven" (hint to inspire their lie)
```

**Implementation Notes:**
- Each Red Herring gets a UNIQUE fake answer (no duplicates)
- Lie suggestion can be any other bluff from the array
- **Fake answer is MANDATORY - players MUST use this answer**
- Lie suggestion is just a hint/helper (optional to read)
- Players CANNOT create their own answer - must use the one given

## Notes

- **DO NOT DELETE** seed script (`service/scripts/seed-questions.ts`)
- Keep MongoDB question bank infrastructure
- Remove only AI generation logic
- Phase name changed from "Briefing" to "Guessing"
- All players receive role data immediately on game start
- No more "tap to reveal" or "ready" buttons in guessing phase
