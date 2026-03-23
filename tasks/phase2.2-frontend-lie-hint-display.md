# Phase 2.2 Frontend: Display Lie Hints

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-24
**Total Tasks:** 2

## Overview

Update frontend to display lie hints to Red Fish players during gameplay. Enhance the role-specific view to show both the fake answer and the suggested lie hint for storytelling.

---

## Tasks

### Pending ⏳

- [ ] **T5. Frontend: Update Game Types**
  - **Dependencies:** T1 (Backend: Update Question Bank Schema)
  - **Effort:** S (0.5-1h)
  - **Type:** Frontend
  - **Files to Create/Modify:** `app/src/types/game.ts`
  - **Description:** Update TypeScript types to reflect new fakeAnswers structure with hints. Ensure type safety throughout the app.
  - **Acceptance Criteria:**
    - ✅ `FakeAnswer` interface includes `answer` and `hint` fields
    - ✅ `GameRoomState` updated to use new structure
    - ✅ No TypeScript errors in existing code
    - ✅ Backward compatibility handled (if needed)

- [ ] **T6. Frontend: Display Lie Hint in Red Fish View**
  - **Dependencies:** T5
  - **Effort:** S (1-2h)
  - **Type:** Frontend
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Update Red Fish role view to display both fake answer and lie hint. Make hint prominent and easy to read during gameplay.
  - **Acceptance Criteria:**
    - ✅ Red Fish sees fake answer clearly
    - ✅ Lie hint displayed prominently
    - ✅ Hint labeled as "Story Suggestion" or similar
    - ✅ Mobile responsive
    - ✅ Clean, readable design

---

## Progress

- **Completed:** 0/2 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 (Backend) ──→ T5 (Frontend: Types)
T5 ──→ T6 (Frontend: Display)
```

## Recommended Order

1. **T1** - Backend: Update Question Bank Schema (complete first)
2. **T5** - Frontend: Update Game Types (0.5-1h)
3. **T6** - Frontend: Display Lie Hint in Red Fish View (1-2h)

**Total Estimated Effort:** 1.5-3 hours (S)

## Notes

### UI/UX Design

**Red Fish View Layout:**
```
┌─────────────────────────┐
│  🐠 You are RED FISH    │
│                         │
│  Question:              │
│  What animal never      │
│  drinks water?          │
│                         │
│  Your Answer:           │
│  Camel                  │
│                         │
│  💡 Story Suggestion:   │
│  "They store fat in     │
│   their humps"          │
│                         │
│  Use this hint to tell  │
│  a convincing story!    │
└─────────────────────────┘
```

### Design Principles

- **Clear hierarchy:** Question → Answer → Hint
- **Visual distinction:** Hint in different color/box
- **Helpful iconography:** 💡 or 🎭 for hint
- **Readable:** Large enough text for mobile
- **Encouraging tone:** Help players feel confident

### Color Suggestions

- Question: Neutral (gray/black)
- Answer: Red (matches Red Fish theme)
- Hint: Blue or purple (distinctive, helpful)
- Background: Light tint for separation

## Testing Checklist

- [ ] Red Fish sees fake answer
- [ ] Lie hint displays correctly
- [ ] Hint is clearly labeled
- [ ] Design is mobile responsive
- [ ] Text is readable on all devices
- [ ] No TypeScript errors
- [ ] Blue Fish and Guesser views unchanged
- [ ] Hint helps with storytelling
