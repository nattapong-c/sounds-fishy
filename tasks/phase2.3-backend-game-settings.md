# Phase 2.3 Backend: Admin Game Settings

**Status:** ⏳ Not Started
**Created:** 2026-03-23
**Target:** 2026-03-24
**Total Tasks:** 3

## Overview

Enable admin players to configure game settings before starting a game. Settings include question difficulty (easy/medium/hard) and language (English/Thai). These settings are stored in the room document and used when fetching questions.

---

## Tasks

### Pending ⏳

- [ ] **T1. Backend: Add Game Settings to Room Schema**
  - **Dependencies:** None
  - **Effort:** S (1-2h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/src/models/room.ts`
  - **Description:** Add game settings fields to Room schema: `difficulty` (easy/medium/hard) and `language` (english/thai). Include default values and validation.
  - **Acceptance Criteria:**
    - ✅ `difficulty` field with enum ['easy', 'medium', 'hard'], default 'medium'
    - ✅ `language` field with enum ['english', 'thai'], default 'english'
    - ✅ Fields included in room.toJSON() output
    - ✅ TypeScript interface updated
    - ✅ Validation for allowed values

- [ ] **T2. Backend: Update Question Service to Use Settings**
  - **Dependencies:** T1
  - **Effort:** S (1-2h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Update game start logic to pass room's difficulty and language settings to question generation service.
  - **Acceptance Criteria:**
    - ✅ `getRandomQuestion()` called with room.difficulty and room.language
    - ✅ Settings respected when distributing questions
    - ✅ Logging includes selected settings
    - ✅ Default values used if settings not set

- [ ] **T3. Backend: Add WebSocket Handler for Settings Update**
  - **Dependencies:** T1
  - **Effort:** S (1-2h)
  - **Type:** Backend
  - **Files to Create/Modify:** `service/src/controllers/ws-controller.ts`
  - **Description:** Create WebSocket handler for admin to update game settings. Validate admin permissions and broadcast changes to all players.
  - **Acceptance Criteria:**
    - ✅ New `update_game_settings` WebSocket event
    - ✅ Validates sender is admin
    - ✅ Validates difficulty and language values
    - ✅ Updates room settings
    - ✅ Broadcasts `game_settings_updated` to all players
    - ✅ Includes new settings in broadcast payload

---

## Progress

- **Completed:** 0/3 (0%)
- **Last Updated:** 2026-03-23

## Dependencies

```
T1 ──→ T2
T1 ──→ T3
```

## Recommended Order

1. **T1** - Backend: Add Game Settings to Room Schema (1-2h)
2. **T2** - Backend: Update Question Service to Use Settings (1-2h)
3. **T3** - Backend: Add WebSocket Handler for Settings Update (1-2h)

**Total Estimated Effort:** 3-6 hours (S-M)

## Notes

### Room Schema Changes

**New Fields:**
```typescript
interface IRoom {
    // ... existing fields
    difficulty?: 'easy' | 'medium' | 'hard';
    language?: 'english' | 'thai';
}
```

### WebSocket Events

**Client → Server:**
```json
{
  "type": "update_game_settings",
  "difficulty": "hard",
  "language": "thai"
}
```

**Server → Client:**
```json
{
  "type": "game_settings_updated",
  "difficulty": "hard",
  "language": "thai",
  "room": { ...room state... }
}
```

### Default Values

- **Difficulty**: 'medium' (balanced gameplay)
- **Language**: 'english' (primary language)

### Validation Rules

- Difficulty must be one of: 'easy', 'medium', 'hard'
- Language must be one of: 'english', 'thai'
- Only admin can update settings
- Settings can only be updated in 'lobby' status

## Testing Checklist

- [ ] Room schema accepts difficulty and language fields
- [ ] Default values set correctly (medium, english)
- [ ] Validation rejects invalid values
- [ ] Question service uses room settings
- [ ] WebSocket handler validates admin permission
- [ ] Settings update broadcasts to all players
- [ ] Settings persist across reconnection
- [ ] Settings cannot be changed after game starts
