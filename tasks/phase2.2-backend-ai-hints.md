# Phase 2.2 Backend: Improved Hint Suggestion with AI

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-24
**Total Tasks:** 4

## Overview

Enhance the question bank system to include lie hints for Red Fish players. Update MongoDB schema to store hints alongside fake answers, and implement AI-powered content generation using Gemini 2.5 Flash for automated question/answer/hint creation.

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Update Question Bank Schema**
  - **Dependencies:** None
  - **Effort:** S (1-2h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/src/services/question-bank-service.ts`, `service/src/models/question.ts` (if exists)
  - **Description:** Update fakeAnswers from string array to array of objects with `answer` and `hint` fields. Update service functions to handle new structure.
  - **Acceptance Criteria:**
    - ✅ `fakeAnswers` changed from `string[]` to `Array<{answer: string, hint: string}>`
    - ✅ `getRandomQuestion()` returns questions with hints
    - ✅ Backward compatibility maintained (optional)
    - ✅ TypeScript types updated

- [ ] **T2. Backend: Create AI Question Generation Service**
  - **Dependencies:** None
  - **Effort:** M (3-4h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/src/services/ai-question-generator.ts`
  - **Description:** Implement Gemini 2.5 Flash integration to generate questions, fake answers, and lie hints automatically. Create prompt templates for consistent output.
  - **Acceptance Criteria:**
    - ✅ Gemini API integration working
    - ✅ Prompt template generates question + correct answer + 3-5 fake answers + hints
    - ✅ Output validation (ensure all fields present)
    - ✅ Error handling for API failures
    - ✅ Rate limiting considered

- [ ] **T3. Backend: Update Seed Script**
  - **Dependencies:** T1, T2
  - **Effort:** M (2-3h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/src/scripts/seed-questions.ts`
  - **Description:** Update seed script to use AI generator for creating new questions. Add options for batch generation and category selection.
  - **Acceptance Criteria:**
    - ✅ Seed script calls AI generator
    - ✅ Can generate multiple questions in batch
    - ✅ Saves questions with hints to MongoDB
    - ✅ Progress logging
    - ✅ Duplicate prevention

- [ ] **T4. Backend: Add Environment Configuration**
  - **Dependencies:** None
  - **Effort:** S (0.5h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/.env.example`, `service/src/lib/ai-config.ts`
  - **Description:** Add Gemini API key configuration and environment variables. Create configuration loader with validation.
  - **Acceptance Criteria:**
    - ✅ `GEMINI_API_KEY` in .env.example
    - ✅ Configuration validation on startup
    - ✅ Clear error messages if API key missing
    - ✅ Documentation in README

---

## Progress

- **Completed:** 0/4 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 ──→ T3
T2 ──→ T3
T4 ──→ T2
```

## Recommended Order

1. **T1** - Backend: Update Question Bank Schema (1-2h)
2. **T4** - Backend: Add Environment Configuration (0.5h)
3. **T2** - Backend: Create AI Question Generation Service (3-4h)
4. **T3** - Backend: Update Seed Script (2-3h)

**Total Estimated Effort:** 6.5-9.5 hours (M-L)

## Notes

### MongoDB Schema Change

**Before:**
```typescript
{
  question: "What animal never drinks water?",
  correctAnswer: "Kangaroo",
  fakeAnswers: ["Camel", "Elephant", "Snake"] // string[]
}
```

**After:**
```typescript
{
  question: "What animal never drinks water?",
  correctAnswer: "Kangaroo",
  fakeAnswers: [
    { answer: "Camel", hint: "They store fat in their humps" },
    { answer: "Elephant", hint: "They use their trunk to drink" },
    { answer: "Snake", hint: "They swallow prey whole" }
  ] // Array<{answer: string, hint: string}>
}
```

### Gemini 2.5 Flash Integration

**Package:** `@google/generative-ai`

**Example usage:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const result = await model.generateContent(prompt);
```

### Prompt Template Example

```
Generate a trivia question with the following format:
- Question: [interesting question]
- Correct Answer: [factual answer]
- 3-5 Fake Answers with Lie Hints: [plausible but wrong answers with hints that sound truthful]

Example:
Question: What animal never drinks water?
Correct Answer: Kangaroo
Fake Answers:
1. Camel - They store fat in their humps
2. Elephant - They use their trunk to drink
3. Snake - They swallow prey whole

Generate 1 new question:
```

### Lie Hint Guidelines

Good hints should:
- ✅ Sound plausible and truthful
- ✅ Be factually correct statements
- ✅ Not give away that the answer is fake
- ✅ Help players tell convincing stories

Bad hints:
- ❌ Obviously false statements
- ❌ Give away the deception
- ❌ Too vague or generic

## Testing Checklist

- [ ] Schema migration works (existing questions handled)
- [ ] AI generator produces valid output
- [ ] Hints are plausible and helpful
- [ ] Seed script generates questions successfully
- [ ] MongoDB stores questions with hints
- [ ] API key validation works
- [ ] Error handling for API failures
- [ ] Rate limiting prevents API abuse
