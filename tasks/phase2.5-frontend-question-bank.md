# Phase 2.5: Frontend - Update for MongoDB Data Bank

**Status:** ⏳ Not Started  
**Created:** 2026-03-19  
**Target:** 2026-03-20  
**Total Tasks:** 2

## Overview

Update frontend to work with MongoDB-sourced data instead of AI-generated data. This is mostly a transparent change since the data structure remains the same, but we need to update types, remove AI-specific references, and update documentation.

**Key Features:**
- Update TypeScript types to reflect new data source
- Remove AI-specific UI references (if any)
- Update comments and documentation
- Ensure lie generation still works with pre-generated data

## Tasks

### Completed ✅
- None yet

### In Progress 🔄
- None yet

### Pending ⏳

#### T1. Update TypeScript Types and API
- **Dependencies:** None (can start immediately)
- **Agent:** frontend-nextjs-expert
- **Estimated:** 30 minutes
- **Files:** `app/src/types/index.ts`, `app/src/services/api.ts`
- **Description:** Update types to remove AI-specific references and add question bank data types
- **Acceptance Criteria:**
  - ✅ Add QuestionBankEntry type interface
  - ✅ Update GenerateLieResponse if needed
  - ✅ Remove or mark AI-related types as deprecated
  - ✅ Update API comments to reflect new data source
  - ✅ regenerateAi() method renamed or marked deprecated (optional feature now)

#### T2. Update UI Components and Documentation
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 30 minutes
- **Files:** `app/src/components/game/LieGenerator.tsx`, other game components
- **Description:** Update component comments, user-facing text, and documentation to remove AI references
- **Acceptance Criteria:**
  - ✅ Update LieGenerator component comments
  - ✅ Update user-facing text (e.g., "AI Lie Generator" → "Lie Generator")
  - ✅ Update tooltips and help text
  - ✅ Update README or documentation if exists
  - ✅ Ensure no broken references

## Progress

- **Completed:** 0/2 (0%)
- **Last Updated:** 2026-03-19

## Dependencies

```
T1 (Types) - Can start immediately
T2 (UI Updates) - Can start immediately
```

## Notes

- This is a lightweight update since data structure doesn't change
- Most changes are cosmetic (removing "AI" from labels)
- Lie generation still works the same way for users
- Backend handles the data source change transparently
- No breaking changes to user experience

## Testing Checklist

- [ ] Types compile without errors
- [ ] Lie generator component still works
- [ ] No AI references in UI (unless desired)
- [ ] All components render correctly
- [ ] No console errors or warnings
