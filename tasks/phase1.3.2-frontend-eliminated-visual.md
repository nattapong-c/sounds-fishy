# Phase 1.3.2 Frontend: Eliminated Player Visual Feedback

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-23
**Total Tasks:** 2

## Overview

Frontend enhancement to show eliminated players in the selection grid with visual indicators (grayed out, "Eliminated" label) and prevent re-selection.

---

## Tasks

### Pending ⏳

- [ ] **T2. Frontend: Eliminated Player Visual Indicator**
  - **Dependencies:** T1 (Backend: Verify Eliminated Players in Broadcast)
  - **Effort:** M (2-3h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Add visual indicators to show which players have been eliminated in the selection grid. Display eliminated players with grayed-out styling and "Eliminated" label.
  - **Acceptance Criteria:**
    - ✅ Eliminated players shown with gray/opacity styling
    - ✅ "Eliminated" badge or label on eliminated player cards
    - ✅ Eliminated players remain visible in the list (not hidden)
    - ✅ Clear visual distinction from active players
    - ✅ Mobile responsive on elimination grid

- [ ] **T3. Frontend: Prevent Selecting Eliminated Players**
  - **Dependencies:** T2
  - **Effort:** S (1h)
  - **Files to Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Disable click/selection on eliminated players in the grid. Add disabled state to buttons.
  - **Acceptance Criteria:**
    - ✅ Eliminated player cards are not clickable
    - ✅ Disabled cursor style on eliminated players
    - ✅ No selection modal opens for eliminated players
    - ✅ Visual feedback shows player cannot be selected

---

## Progress

- **Completed:** 0/2 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 (Backend verification)
 ↓
T2 (Visual indicator)
 ↓
T3 (Prevent selection)
```

## Recommended Order

1. **T1** - Backend: Verify Eliminated Players in Broadcast (0.5h)
2. **T2** - Frontend: Eliminated Player Visual Indicator (2-3h)
3. **T3** - Frontend: Prevent Selecting Eliminated Players (1h)

**Total Estimated Effort:** 3.5-4.5 hours (M)

## Notes

- Reference `roomState.eliminatedPlayers` array from backend
- Use `player.id` to check if player is in eliminated list
- Disabled button styling: `disabled:opacity-50 disabled:cursor-not-allowed`
- Consider showing elimination order (1st, 2nd, 3rd eliminated)
- Keep eliminated players visible for game transparency

## UI Design Suggestions

**Eliminated Player Card:**
```
┌─────────────────────────┐
│ 👤 John Doe             │
│    [Eliminated] ❌      │
│    (grayed out, 50% opacity)
└─────────────────────────┘
```

**Active Player Card:**
```
┌─────────────────────────┐
│ 👤 Jane Smith           │
│    Click to eliminate   │
│    (normal styling)     │
└─────────────────────────┘
```

## Testing Checklist

- [ ] Eliminated players visible in selection grid
- [ ] Eliminated players have gray/opacity styling
- [ ] "Eliminated" label or badge displayed
- [ ] Eliminated player cards are not clickable
- [ ] No modal opens when clicking eliminated player
- [ ] Active players remain fully interactive
- [ ] Mobile responsive on elimination grid
- [ ] Eliminated state updates after each successful guess
