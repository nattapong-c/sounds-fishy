# Phase 1.2 Frontend: Game Start & Guessing Phase

**Status:** ✅ Completed
**Created:** 2026-03-20
**Updated:** 2026-03-23  
**Updated:** 2026-03-20  
**Target:** 2026-03-21  
**Total Tasks:** 5

## Overview

Frontend implementation for game start: handle game_started event, display role-specific views (Guesser, Blue Fish, Red Fish). 

**Important:** Storytelling happens face-to-face (players physically point to who tells their story). No app UI needed for turn management - just show each player their role-specific information.

---

## Tasks

### Completed ✅

- [x] **T7. Frontend: Game State Types & Interfaces**
  - **Dependencies:** None
  - **Effort:** S (1h)
  - **Files to Create/Modify:** `app/src/types/game.ts`
  - **Description:** Create TypeScript types for game state, roles, question/answer payloads.
  - **Acceptance Criteria:**
    - ✅ GameRole type ('guesser' | 'blueFish' | 'redFish')
    - ✅ Question interface
    - ✅ GamePayload interface (role-specific)
    - ✅ RoomState extension with game fields

- [x] **T8. Frontend: Game Started Event Handler**
  - **Dependencies:** T7
  - **Effort:** M (3-4h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Handle game_started WebSocket event, update UI based on player's role.
  - **Acceptance Criteria:**
    - ✅ Listens for game_started event
    - ✅ Extracts role from payload
    - ✅ Shows role-specific view
    - ✅ Displays question/answer correctly

- [x] **T9. Frontend: Guesser View Component**
  - **Dependencies:** T8
  - **Effort:** S (2-3h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx` (inline component)
  - **Description:** Display for Guesser: shows question, player list, instructions to listen for fake stories. Face-to-face gameplay - no in-app selection.
  - **Acceptance Criteria:**
    - ✅ Shows question prominently
    - ✅ Shows player list (for reference)
    - ✅ Shows instructions: "Listen to their stories and find the Red Fish"
    - ✅ Does NOT show any answers
    - ✅ Clean, minimal design

- [x] **T10. Frontend: Blue Fish View Component**
  - **Dependencies:** T8
  - **Effort:** S (2-3h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx` (inline component)
  - **Description:** Display for Blue Fish: shows question + correct answer, instructions to tell truth. Tap-to-reveal for privacy.
  - **Acceptance Criteria:**
    - ✅ Shows question
    - ✅ Shows correct answer (clearly marked as TRUTH)
    - ✅ Shows instructions: "Tell the TRUE story"
    - ✅ Tap-to-reveal (hide by default to prevent cheating)
    - ✅ Clean, minimal design

- [x] **T11. Frontend: Red Fish View Component**
  - **Dependencies:** T8
  - **Effort:** S (2-3h)
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx` (inline component)
  - **Description:** Display for Red Fish: shows question + fake answer (MANDATORY) + lie suggestion (hint). Tap-to-reveal for privacy.
  - **Acceptance Criteria:**
    - ✅ Shows question
    - ✅ Shows fake answer (clearly marked as YOUR ANSWER - must say this)
    - ✅ Shows lie suggestion (marked as HINT - for inspiration)
    - ✅ Instructions: "Tell this story convincingly!"
    - ✅ Tap-to-reveal (hide by default to prevent cheating)
    - ✅ Clean, minimal design

---

## Progress

- **Completed:** 0/5 (0%)
- **Last Updated:** 2026-03-20

## Dependencies

```
T7 ──→ T8 ──→ T9
        │     T10
        │     T11
```

## Recommended Order

1. **T7** - Frontend: Game State Types (1h)
2. **T8** - Frontend: Game Started Handler (3-4h)
3. **T9** - Frontend: Guesser View (2-3h)
4. **T10** - Frontend: Blue Fish View (2-3h)
5. **T11** - Frontend: Red Fish View (2-3h)

**Total Estimated Effort:** 10-14 hours (M-L)

## Notes

- Reference AGENTS.md for UI/UX theme (minimal, clean, funny)
- Mobile-first responsive design
- **No turn management UI** - players select storyteller face-to-face
- Tap-to-reveal prevents accidental exposure when sharing screen
- Keep UI simple: just show role + question/answer

## Testing Checklist

- [ ] TypeScript types compile without errors
- [ ] game_started event handled correctly
- [ ] Guesser view shows question only (no answers)
- [ ] Blue Fish view shows question + correct answer
- [ ] Red Fish view shows question + fake answer + lie suggestion
- [ ] Tap-to-reveal works for Blue Fish and Red Fish
- [ ] Each role view is visually distinct
- [ ] Mobile responsive on all role views
- [ ] Instructions are clear and funny
- [ ] No turn/phase management UI (face-to-face gameplay)
