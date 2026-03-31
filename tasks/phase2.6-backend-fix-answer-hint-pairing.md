# Phase 2.6 Backend: Fix Red Fish Answer-Hint Pair Display

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 3

## Overview

Red Fish players are receiving mismatched answer-hint pairs. The current implementation sends the fake answer text and a lie suggestion (hint from another player), but doesn't send the player's OWN hint that matches their assigned fake answer.

**Problem:**
- Current: Sends `fakeAnswer.answer` + `lieSuggestion` (from different player)
- Missing: Player's own hint that matches their fake answer
- Result: Player sees answer "Camel" but hint "They swallow prey whole" (from Snake)

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Add hint Field to Red Fish Data**
  - **Dependencies:** None
  - **Effort:** S (1h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`, `app/src/types/game.ts`
  - **Description:** Add `hint` field to Red Fish player data that contains the hint matching their assigned fake answer. Keep `lieSuggestion` as optional storytelling aid from different player.
  - **Acceptance Criteria:**
    - ✅ Red Fish playerDataMap includes `hint` field (their own hint)
    - ✅ `hint` matches `fakeAnswer` (same IFakeAnswer object)
    - ✅ `lieSuggestion` remains as storytelling aid (from different player)
    - ✅ Reconnection logic also includes `hint` field
    - ✅ TypeScript types updated

- [ ] **T2. Frontend: Display Matching Answer-Hint Pair**
  - **Dependencies:** T1
  - **Effort:** S (1-2h)
  - **Type:** Frontend
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Update Red Fish view to display the matching answer-hint pair prominently. Show lie suggestion as optional "storytelling aid" separately.
  - **Acceptance Criteria:**
    - ✅ Red Fish sees "Your Answer: Camel"
    - ✅ Red Fish sees "Your Hint: They store fat in their humps" (matching Camel)
    - ✅ Lie suggestion shown separately as "Storytelling Aid"
    - ✅ Clear visual distinction between own hint vs lie suggestion
    - ✅ UI labels are clear and not confusing

- [ ] **T3. Backend: Add Validation Logging**
  - **Dependencies:** T1
  - **Effort:** S (0.5h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Add debug logging to verify answer-hint pairs match when distributed.
  - **Acceptance Criteria:**
    - ✅ Log shows which Red Fish gets which answer-hint pair
    - ✅ Log confirms pairs match (answer's hint = distributed hint)
    - ✅ Logging in both start_game and next_round
    - ✅ Logs can be disabled in production

---

## Progress

- **Completed:** 3/3 (100%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 ──→ T2
T1 ──→ T3
```

## Recommended Order

1. **T1** - Backend: Add hint Field to Red Fish Data (1h) ✅
2. **T2** - Frontend: Display Matching Answer-Hint Pair (1-2h) ✅
3. **T3** - Backend: Add Validation Logging (0.5h) ✅

**Total Estimated Effort:** 2.5-3.5 hours (S-M)

## Notes

### Current Implementation (PROBLEM)

**Backend sends:**
```typescript
playerDataMap[playerId] = {
    role: 'redFish',
    question: room.question!,
    fakeAnswer: fakeAnswer.answer,      // "Camel"
    lieSuggestion                        // Hint from DIFFERENT player!
};
```

**Frontend receives:**
```typescript
if (message.fakeAnswer) {
    setMyAnswer(message.fakeAnswer);    // "Camel"
}
if (message.lieSuggestion) {
    setMyLieSuggestion(message.lieSuggestion);  // "They swallow prey whole" (Snake's hint!)
}
```

**Result:** Player sees answer "Camel" with hint "They swallow prey whole" ❌

### Correct Implementation

**Backend should send:**
```typescript
playerDataMap[playerId] = {
    role: 'redFish',
    question: room.question!,
    fakeAnswer: fakeAnswer.answer,      // "Camel"
    hint: fakeAnswer.hint,              // "They store fat in their humps" ✅
    lieSuggestion                        // Optional: hint from different player
};
```

**Frontend should display:**
```
┌─────────────────────────┐
│  🐠 You are RED FISH    │
│                         │
│  Your Answer: Camel     │
│  Your Hint: They store  │
│  fat in their humps     │
│                         │
│  💡 Storytelling Aid:   │
│  "They swallow prey     │
│  whole"                 │
│  (optional suggestion)  │
└─────────────────────────┘
```

### Code Changes Required

**Backend (ws-controller.ts):**
```typescript
// Line ~206: Add hint field
playerDataMap[playerId] = {
    role: 'redFish',
    question: room.question!,
    fakeAnswer: fakeAnswer.answer,
    hint: fakeAnswer.hint,        // ADD THIS
    lieSuggestion
};

// Line ~73: Reconnection logic
} else if (player.inGameRole === 'redFish' && room.fakeAnswersDistribution) {
    const fakeAnswerObj = room.fakeAnswersDistribution.get(player.id);
    payload.fakeAnswer = fakeAnswerObj?.answer;
    payload.hint = fakeAnswerObj?.hint;    // ADD THIS
    payload.lieSuggestion = ...;
}
```

**Frontend (types/game.ts):**
```typescript
export interface GamePayload {
    type: 'game_started';
    role: GameRole;
    question: string;
    correctAnswer?: string;
    fakeAnswer?: string;
    hint?: string;              // ADD THIS
    lieSuggestion?: string;
}
```

**Frontend (page.tsx):**
```typescript
// Red Fish view - show matching pair
<div>
    <p>Your Answer: {myAnswer}</p>
    <p>Your Hint: {myHint}</p>  {/* Use new hint field */}
    
    {myLieSuggestion && (
        <div>
            <p>💡 Storytelling Aid:</p>
            <p>"{myLieSuggestion}"</p>
            <p className="text-xs">(Optional suggestion from another player)</p>
        </div>
    )}
</div>
```

## Testing Checklist

- [x] Red Fish receives matching answer-hint pair
- [x] Hint matches the assigned fake answer
- [x] Lie suggestion is clearly labeled as optional
- [x] Reconnection preserves matching pairs
- [x] UI clearly distinguishes own hint vs lie suggestion
- [x] Test with actual game session
- [x] Verify with 4-8 players
- [x] Check logs show correct pairs
