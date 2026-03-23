# Phase 2.3 Frontend: Admin Game Settings UI

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-24
**Total Tasks:** 3

## Overview

Create UI components for admin players to configure game settings (difficulty and language) before starting a game. Settings should be clearly visible to all players in the lobby.

---

## Tasks

### Pending ⏳

- [ ] **T4. Frontend: Add Game Settings State**
  - **Dependencies:** None
  - **Effort:** S (0.5-1h)
  - **Type:** Frontend
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Add state variables for game settings (difficulty, language) and update handlers. Listen for `game_settings_updated` WebSocket events.
  - **Acceptance Criteria:**
    - ✅ State for `difficulty` and `language`
    - ✅ WebSocket handler for `game_settings_updated`
    - ✅ Settings extracted from room state on reconnect
    - ✅ Default values match backend (medium, english)

- [ ] **T5. Frontend: Create Settings Configuration UI**
  - **Dependencies:** T4
  - **Effort:** M (2-3h)
  - **Type:** Frontend
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Create settings panel in lobby view with dropdown selectors for difficulty and language. Admin-only controls with clear visual feedback.
  - **Acceptance Criteria:**
    - ✅ Difficulty dropdown: Easy, Medium, Hard
    - ✅ Language dropdown: English, Thai
    - ✅ Only visible to admin in lobby
    - ✅ Real-time updates when settings change
    - ✅ Clear labels and descriptions
    - ✅ Mobile responsive design
    - ✅ Visual indicator of current selection

- [ ] **T6. Frontend: Display Settings to All Players**
  - **Dependencies:** T5
  - **Effort:** S (1-2h)
  - **Type:** Frontend
  - **Files to Create/Modify:** `app/src/app/[roomId]/page.tsx`
  - **Description:** Show current game settings to all players in lobby (read-only for non-admin). Include icons and descriptions for clarity.
  - **Acceptance Criteria:**
    - ✅ Settings visible to all players
    - ✅ Non-admin sees read-only view
    - ✅ Icons for difficulty (🟢🟡🔴) and language (🇬🇧🇹🇭)
    - ✅ Clear "Game Settings" section header
    - ✅ Updates in real-time when admin changes settings
    - ✅ Mobile responsive

---

## Progress

- **Completed:** 0/3 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T4 ──→ T5 ──→ T6
```

## Recommended Order

1. **T4** - Frontend: Add Game Settings State (0.5-1h)
2. **T5** - Frontend: Create Settings Configuration UI (2-3h)
3. **T6** - Frontend: Display Settings to All Players (1-2h)

**Total Estimated Effort:** 3.5-6 hours (S-M)

## Notes

### UI Design

**Admin View (Editable):**
```
┌─────────────────────────┐
│  ⚙️ Game Settings       │
│                         │
│  Difficulty:            │
│  [Easy ▼]               │
│                         │
│  Language:              │
│  [English ▼]            │
│                         │
│  Changes saved auto     │
└─────────────────────────┘
```

**Non-Admin View (Read-Only):**
```
┌─────────────────────────┐
│  ⚙️ Game Settings       │
│                         │
│  Difficulty: Medium 🟡  │
│  Language: English 🇬🇧   │
│                         │
│  Admin can change       │
└─────────────────────────┘
```

### Difficulty Icons

- **Easy**: 🟢 (Green circle)
- **Medium**: 🟡 (Yellow circle)
- **Hard**: 🔴 (Red circle)

### Language Icons

- **English**: 🇬🇧 or 🇺🇸
- **Thai**: 🇹🇭

### WebSocket Events

**Send (Admin):**
```typescript
ws.send(JSON.stringify({
    type: 'update_game_settings',
    difficulty: 'hard',
    language: 'thai'
}));
```

**Receive (All):**
```typescript
case 'game_settings_updated':
    setDifficulty(message.difficulty);
    setLanguage(message.language);
    break;
```

### Component Structure

```
Lobby View
├── Player List
├── Game Settings (NEW)
│   ├── Admin: Editable dropdowns
│   └── Non-Admin: Read-only display
├── Start Game Button (Admin)
└── Leave Button
```

## Testing Checklist

- [ ] Settings state initializes correctly
- [ ] Admin sees editable dropdowns
- [ ] Non-admin sees read-only display
- [ ] Difficulty dropdown has 3 options
- [ ] Language dropdown has 2 options
- [ ] Settings update via WebSocket
- [ ] Real-time updates for all players
- [ ] Icons display correctly
- [ ] Mobile responsive on all views
- [ ] Settings persist on reconnect
