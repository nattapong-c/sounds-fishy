# Phase 2.6 Frontend: Guessing Phase UI

**Status:** ⏳ Not Started  
**Created:** 2026-03-20  
**Target:** 2026-03-21  
**Total Tasks:** 3

## Overview

Frontend tasks for updating UI to support Guessing Phase (no Briefing phase) and removing AI generation features.

---

## Tasks

### Pending ⏳

- [ ] **T5. Frontend: Update Room Page for Guessing Phase**
  - **Dependencies:** T4 (Backend: WebSocket Controller)
  - **Agent:** frontend-nextjs-expert
  - **Estimated:** 2-3 hours
  - **Files to Modify:**
    - `app/src/app/room/[roomCode]/page.tsx`
  - **Description:**
    - Rename `useBriefing` hook to `useGuessing`
    - Update room status check from 'briefing' to 'guessing'
    - Update phase name in UI from "Game Briefing" to "Guessing Phase"
    - Ensure role data is received via WebSocket `start_round` event
    - Update state management for guessing phase
  - **Acceptance Criteria:**
    - ✅ useGuessing hook exists
    - ✅ Room status 'guessing' triggers phase
    - ✅ All players receive role data
    - ✅ UI shows "Guessing Phase"
    - ✅ No references to "briefing"

- [ ] **T6. Frontend: Update Role Views**
  - **Dependencies:** T5
  - **Agent:** frontend-nextjs-expert
  - **Estimated:** 1-2 hours
  - **Files to Modify:**
    - `app/src/app/room/[roomCode]/page.tsx` (inline components)
    - GuesserView
    - BigFishView
    - RedHerringView
  - **Description:**
    - Update GuesserView: Show question, maybe timer or instructions
    - Update BigFishView: Show question + secret answer (no tap-to-reveal needed, already in guessing phase)
    - Update RedHerringView: Show question + fakeAnswer (MANDATORY - what they must say) + lieSuggestion (hint only)
    - Remove any "ready" buttons or "waiting for players" states
    - Simplify UI for immediate gameplay
    - RedHerringView should clearly show:
      - "Your Answer" (fakeAnswer - MANDATORY, what they must say)
      - "Hint" (lieSuggestion - optional helper, just for inspiration)
    - Make it clear that fakeAnswer is MANDATORY (cannot create own)
  - **Acceptance Criteria:**
    - ✅ Guesser sees question immediately
    - ✅ Big Fish sees question + answer immediately
    - ✅ Red Herring sees fakeAnswer (MANDATORY) immediately
    - ✅ Red Herring sees lieSuggestion (hint) immediately
    - ✅ No tap-to-reveal in BigFishView
    - ✅ RedHerringView clearly shows fakeAnswer is MANDATORY
    - ✅ UI makes it clear players cannot create their own answer

- [ ] **T7. Frontend: Remove AI-Related Code**
  - **Dependencies:** T5
  - **Agent:** frontend-nextjs-expert
  - **Estimated:** 1 hour
  - **Files to Modify:**
    - `app/src/app/room/[roomCode]/page.tsx`
  - **Description:**
    - Remove `handleGenerateLie` function
    - Remove `canGenerateLie` state
    - Remove generateLie API call from roomAPI
    - Remove onGenerateLie prop from RedHerringView
    - Remove any AI-related imports or utilities
  - **Acceptance Criteria:**
    - ✅ No generateLie API calls
    - ✅ No handleGenerateLie function
    - ✅ No canGenerateLie state
    - ✅ RedHerringView simplified (no AI button)
    - ✅ No TypeScript errors

---

## Progress

- **Completed:** 0/3 (0%)
- **Last Updated:** 2026-03-20

## Dependencies

```
T4 (Backend) ──→ T5 ──→ T6
                      │
                      └──→ T7
```

## Recommended Order

1. **T5** (2-3h) - Update room page and hook
2. **T6** (1-2h) - Update role view components
3. **T7** (1h) - Remove AI-related code

**Total Estimated Effort:** 4-6 hours (M-L)

## UI Flow

### Before (Briefing Phase):
```
Lobby → Host clicks "Start Game" → Briefing Phase → (Ready buttons) → Game
```

### After (Guessing Phase):
```
Lobby → Host clicks "Start Game" → Guessing Phase (immediate)
```

### Role Views (Guessing Phase):

**Guesser:**
```
┌─────────────────────┐
│  🎯 You are Guesser │
│                     │
│  Question:          │
│  "What's something  │
│   you find in a     │
│   kitchen?"         │
│                     │
│  Listen to answers  │
│  and find the Big   │
│  Fish!              │
└─────────────────────┘
```

**Big Fish:**
```
┌─────────────────────┐
│ 🐟 You are Big Fish │
│                     │
│  Question:          │
│  "What's something  │
│   you find in a     │
│   kitchen?"         │
│                     │
│  Your Answer:       │
│  "A spatula"        │
│                     │
│  Don't get caught!  │
└─────────────────────┘
```

**Red Herring:**
```
┌─────────────────────────────┐
│ 🐠 You are Red Herring      │
│                             │
│  Question:                  │
│  "What's something you      │
│   find in a kitchen?"       │
│                             │
│  🎯 Your Answer (MUST USE): │
│  "A toaster oven"           │
│  ⚠️ You MUST say this answer │
│                             │
│  💡 Hint (Optional):        │
│  "A cutting board"          │
│  (Just for inspiration)     │
│                             │
│  Remember: Use your assigned│
│  answer when speaking!      │
└─────────────────────────────┘
```

## Notes

- No more "tap to reveal" - Big Fish sees answer immediately
- No more "ready" buttons - game starts immediately
- No AI generation - Red Herrings get pre-defined suggestions
- All players see their role data simultaneously
