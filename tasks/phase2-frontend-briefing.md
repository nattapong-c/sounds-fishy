# Phase 2: Frontend - Game Briefing & AI Integration

**Status:** ⏳ Not Started  
**Created:** 2026-03-19  
**Target:** 2026-03-21  
**Total Tasks:** 7

## Overview

Implement the briefing phase UI where players receive their role-specific information. Guesser sees the question, Big Fish sees the secret word, and Red Herrings get AI-powered lie generation assistance.

**Key Features:**
- Briefing page with role-specific content
- "Tap to Reveal" secret information
- AI lie generation for Red Herrings
- Ready status management
- Waiting for all players UI

## Tasks

### Completed ✅
- None yet

### In Progress 🔄
- None yet

### Pending ⏳

#### T1. Create Briefing Page
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 2 hours
- **Files:** `app/src/app/room/[roomCode]/briefing/page.tsx`
- **Description:** Main briefing page that shows role-specific content
- **Acceptance Criteria:**
  - ✅ Fetches room data and determines player role
  - ✅ Guesser view: Shows question only
  - ✅ Big Fish view: Shows question + secret word (tap to reveal)
  - ✅ Red Herring view: Shows question + bluff suggestions + generate lie button
  - ✅ Ready button for all roles except Guesser
  - ✅ Waiting for other players state
  - ✅ Auto-redirect when game starts

#### T2. Create Secret Reveal Component
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 1 hour
- **Files:** `app/src/components/game/SecretReveal.tsx`
- **Description:** Interactive component for revealing secret information
- **Acceptance Criteria:**
  - ✅ "Tap to Reveal" button/animation
  - ✅ Hidden state (blurred or covered)
  - ✅ Revealed state (shows secret word)
  - ✅ Smooth animation between states
  - ✅ Works on mobile touch and desktop click
  - ✅ Optional: vibrate on reveal (mobile)

#### T3. Create Lie Generator Component
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 1.5 hours
- **Files:** `app/src/components/game/LieGenerator.tsx`
- **Description:** AI-powered lie generation assistant for Red Herrings
- **Acceptance Criteria:**
  - ✅ Shows current lie suggestion
  - ✅ "Generate More Lies" button
  - ✅ Loading state during generation
  - ✅ Copy to clipboard button
  - ✅ History of generated lies (optional)
  - ✅ Error handling if generation fails

#### T4. Create Briefing Hook
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 1 hour
- **Files:** `app/src/hooks/useBriefing.ts`
- **Description:** Custom hook for briefing phase logic
- **Acceptance Criteria:**
  - ✅ Listens for start_round WebSocket event
  - ✅ Extracts role-specific data from payload
  - ✅ generateLie() method - calls API to generate lie
  - ✅ toggleReady() method - marks player as ready
  - ✅ allPlayersReady state - tracks when everyone is ready
  - ✅ Cleanup on unmount

#### T5. Add Generate Lie API Method
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 30 minutes
- **Files:** `app/src/services/api.ts`
- **Description:** API method for lie generation
- **Acceptance Criteria:**
  - ✅ generateLie(roomCode, deviceId) method
  - ✅ POST to /api/rooms/:roomCode/generate-lie
  - ✅ Returns generated lie suggestion
  - ✅ Handles errors gracefully
  - ✅ TypeScript types defined

#### T6. Create Role-Specific Components
- **Dependencies:** None
- **Agent:** frontend-nextjs-expert
- **Estimated:** 1.5 hours
- **Files:** 
  - `app/src/components/game/GuesserView.tsx`
  - `app/src/components/game/BigFishView.tsx`
  - `app/src/components/game/RedHerringView.tsx`
- **Description:** Separate components for each role's view
- **Acceptance Criteria:**
  - ✅ GuesserView: Question display, elimination panel (for later)
  - ✅ BigFishView: Question + SecretReveal component
  - ✅ RedHerringView: Question + LieGenerator + bluff suggestions
  - ✅ All components responsive
  - ✅ Consistent styling across roles

#### T7. Add Waiting for Players State
- **Dependencies:** T4
- **Agent:** frontend-nextjs-expert
- **Estimated:** 1 hour
- **Files:** `app/src/components/game/WaitingForPlayers.tsx`
- **Description:** UI shown while waiting for all players to be ready
- **Acceptance Criteria:**
  - ✅ Shows list of players who are ready
  - ✅ Shows list of players still preparing
  - ✅ Animated indicator (spinning, pulsing)
  - ✅ "Waiting for other players..." message
  - ✅ Auto-dismisses when all ready
  - ✅ Shows host notification if they need to start

## Progress

- **Completed:** 0/7 (0%)
- **Last Updated:** 2026-03-19

## Dependencies

```
T1 (main page)
├── T2 (SecretReveal)
├── T3 (LieGenerator)
├── T4 (useBriefing hook)
│   └── T5 (API method)
├── T6 (Role components)
│   ├── T2
│   └── T3
└── T7 (WaitingForPlayers)
    └── T4
```

## Notes

- Use deviceId for player identification (consistent with Phase 1)
- Role-specific payloads come from WebSocket start_round event
- Lie generation is optional - Red Herrings can write their own lies
- "Tap to Reveal" should have satisfying animation
- Mobile-first responsive design
- Consider accessibility (screen readers, keyboard navigation)

## Testing Checklist

- [ ] Briefing page loads correctly
- [ ] Role-specific content displays correctly
- [ ] Secret reveal animation works
- [ ] Lie generation works
- [ ] Ready button updates state
- [ ] Waiting for players UI shows
- [ ] Auto-redirect when game starts
- [ ] Mobile responsive
- [ ] Touch interactions work

## Integration Points

**Backend Dependencies:**
- POST /api/rooms/:roomCode/start (T4 Backend)
- POST /api/rooms/:roomCode/generate-lie (T4 Backend)
- WebSocket start_round event (T4 Backend)
- WebSocket all_players_ready event (T4 Backend)

**Must complete Backend T4 before frontend T1 can be fully tested**
