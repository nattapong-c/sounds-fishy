# Room Page Flow

## Overview

The room page is the main game interface for Sounds Fishy. It handles:
1. **Lobby Phase** - Player management, game configuration, start game
2. **Playing Phase** - Storytelling, role/answer display (no timer)
3. **Guessing Phase** - Guesser selects suspected Red Fish
4. **Round End** - Results display, role rotation
5. **Game Completed** - Final scores, play again

---

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                     │
│  [SOUNDS FISHY Logo]    [📋 Copy Room ID] [Leave]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────────────────────────────┐  │
│  │             │  │                                     │  │
│  │  PLAYERS    │  │         GAME AREA                   │  │
│  │  Sidebar    │  │                                     │  │
│  │             │  │  - Lobby: Settings, Start Button    │  │
│  │  - List     │  │  - Playing: Question/Answers        │  │
│  │  - Host     │  │  - Guessing: Selection UI           │  │
│  │    Select   │  │  - Round End: Results               │  │
│  │  - Kick     │  │  - Completed: Final Scores          │  │
│  │             │  │                                     │  │
│  │  (8 max)    │  │                                     │  │
│  │             │  │                                     │  │
│  └─────────────┘  └─────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Tree

```
RoomPage
├── Header
│   ├── Logo/Title
│   ├── Copy Room ID Button
│   └── Leave Button
├── Main Grid (2 columns)
│   ├── Player Sidebar
│   │   ├── Player List (with roles, admin badges)
│   │   ├── Host Selection (admin only, lobby phase)
│   │   └── Kick Buttons (admin only)
│   └── Game Area
│       ├── Lobby State
│       │   ├── Game Settings (language, difficulty)
│       │   ├── Timer Configuration (admin only)
│       │   └── Start Game Button (admin only)
│       ├── Playing State
│       │   ├── Role Display (toggle visibility)
│       │   ├── Answer Display (role-specific)
│       │   └── Storytelling UI
│       ├── Guessing State
│       │   ├── Guesser Selection UI
│       │   └── Score Display
│       ├── Round End State
│       │   ├── Round Results
│       │   └── Next Round Prep
│       └── Completed State
│           ├── Final Scores
│           └── Play Again Button (admin)
└── WebSocket Connection (background)
```

---

## State Management

### Local State (React `useState`)

| State | Type | Initial | Purpose |
|-------|------|---------|---------|
| `nickname` | `string` | `''` | User's display name |
| `hasJoined` | `boolean` | `false` | Whether user has joined room |
| `roomState` | `object` | `null` | Full room state from server |
| `error` | `string \| null` | `null` | Error messages |
| `selectedHostId` | `string \| null` | `null` | Admin's host selection |
| `isWordVisible` | `boolean` | `false` | Toggle secret word visibility |
| `isRoleHidden` | `boolean` | `true` | Hide role for privacy (anti-snooping) |
| `copied` | `boolean` | `false` | Copy room ID feedback |

### Refs

| Ref | Type | Purpose |
|-----|------|---------|
| `wsRef` | `WebSocket` | WebSocket connection |

### External Dependencies

| Dependency | Source | Purpose |
|------------|--------|---------|
| `params.roomId` | Next.js URL | Room identifier |
| `deviceId` | `useDeviceId` hook | Persistent player identity |
| `router` | `next/navigation` | Navigation (leave, kick redirect) |
| `api` | `@/lib/api` | REST API calls (join, leave, get room) |

---

## User Flows

### Flow 1: Initial Load & Auto-Reconnect

```
┌──────────────┐
│   Page Load  │
│   (roomId)   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ Check deviceId exists        │
│ (from localStorage)          │
└──────┬───────────────────────┘
       │
       ▼
    ┌──┴──┐
    │     │
  Yes     No
    │     │
    │     ▼
    │ ┌──────────────────────┐
    │ │ Show Loading Screen  │
    │ │ "Loading Identity..."│
    │ └──────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ API Call: GET /api/rooms/:id │
│ Check existing session       │
└──────┬───────────────────────┘
       │
       ▼
    ┌──┴──┐
    │     │
 In Room  Not In Room
    │     │
    │     ▼
    │ ┌──────────────────────┐
    │ │ Show Join Form       │
    │ │ - Nickname input     │
    │ │ - Enter Lobby button │
    │ └──────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ Auto-join (reconnect)        │
│ Set hasJoined = true         │
│ Connect WebSocket            │
└──────────────────────────────┘
```

---

### Flow 2: Join Room (New Player)

```
┌──────────────┐
│   User       │
│   Enters     │
│   Nickname   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ Form Submit:                 │
│ - Validate nickname not empty│
│ - Call api.rooms.join()      │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Backend:                     │
│ - Add player to room         │
│ - Set isAdmin = first player │
│ - Return room data           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Set hasJoined = true         │
│ Store roomState              │
│ Connect WebSocket            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Render Lobby View            │
└──────────────────────────────┘
```

**Implementation:**
```typescript
const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !deviceId) return;

    try {
        const response = await api.rooms.join(roomId, nickname, deviceId);
        const roomData = response.data?.room || response.room;
        
        setRoomState(roomData);
        setHasJoined(true);
        connectWebSocket();
    } catch (err: any) {
        setError(`Failed to join room: ${err.response?.data || err.message}`);
    }
};
```

---

### Flow 3: WebSocket Connection

```
┌──────────────┐
│   Connect    │
│   WebSocket  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ Build URL:                   │
│ ws://localhost:3001/         │
│ ws/rooms/:roomId?deviceId=:id│
│ (Auto-detect ws:// or wss://)│
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ ws.onopen                    │
│ Log "WS Connected"           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ ws.onmessage                 │
│ Parse JSON message           │
└──────┬───────────────────────┘
       │
       ▼
    ┌──┴──────────────────────────┐
    │ Message Type                │
    ├─────────────────────────────┤
    │ • room_state_update         │
    │ • game_started              │
    │ • round_ended               │
    │ • voting_started            │
    │ • vote_tallied              │
    │ • roles_revealed            │
    └─────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Update roomState             │
│ Trigger re-render            │
└──────────────────────────────┘
```

**Implementation:**
```typescript
const connectWebSocket = () => {
    if (!deviceId) return;
    
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:3001';
        wsUrl = `${protocol}//${host}`;
    }
    
    const ws = new WebSocket(`${wsUrl}/ws/rooms/${roomId}?deviceId=${deviceId}`);

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (['room_state_update', 'game_started', 'round_ended'].includes(message.type)) {
            setRoomState(message.room);
        }
    };
    
    wsRef.current = ws;
};
```

---

### Flow 4: Start Game (Admin)

```
┌──────────────┐
│   Admin      │
│   Selects    │
│   Host       │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ Set selectedHostId           │
│ (UI highlight)               │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────┐
│   Admin      │
│   Clicks     │
│   "Start"    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ WebSocket Send:              │
│ {                            │
│   type: 'start_game',        │
│   hostPlayerId: selectedId,  │
│   difficulty: 'medium',      │
│   language: 'english'        │
│ }                            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Backend:                     │
│ - Assign roles               │
│ - Get question/answers       │
│ - Set status = 'playing'     │
│ - Broadcast game_started     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ All clients receive:         │
│ { type: 'game_started',      │
│   room: {...} }              │
│ Update UI to Playing State   │
└──────────────────────────────┘
```

---

### Flow 5: Role Assignment (Backend)

```typescript
// Backend assigns roles on game start
const players = [...room.players];
const shuffled = players.sort(() => 0.5 - Math.random());

// Rotate Guesser (track lastGuesserId)
const previousGuesserId = room.lastGuesserId;
let guesserIndex = 0;
if (previousGuesserId) {
    const prevIndex = players.findIndex(p => p.id === previousGuesserId);
    guesserIndex = (prevIndex + 1) % players.length;
}

// Assign roles
shuffled[guesserIndex].inGameRole = 'guesser';
shuffled[(guesserIndex + 1) % players.length].inGameRole = 'blueFish';
for (let i = 0; i < players.length; i++) {
    if (i !== guesserIndex && i !== (guesserIndex + 1) % players.length) {
        shuffled[i].inGameRole = 'redFish';
    }
}

room.lastGuesserId = shuffled[guesserIndex].id;
room.status = 'playing';
```

---

### Flow 6: Storytelling Phase

```
┌─────────────────────────────────┐
│ All Players See:                │
│ - Question (from system)        │
└─────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
Guesser   Blue Fish / Red Fish
    │         │
    │         ▼
    │   ┌─────────────────────┐
    │   │ See Answer          │
    │   │ - Blue Fish: Truth  │
    │   │ - Red Fish: Fake    │
    │   └─────────────────────┘
    │         │
    │         ▼
    │   Tell Story (verbal)
    │         │
    ▼         ▼
┌─────────────────────────────┐
│ Guesser Observes            │
│ All Players Tell Stories    │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Guesser Clicks "Ready"      │
│ (All players ready)         │
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Transition to Guessing Phase│
└─────────────────────────────┘
```

---

### Flow 7: Guesser Selection

```
┌──────────────┐
│   Guesser    │
│   Clicks on  │
│   Player     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ WebSocket Send:              │
│ {                            │
│   type: 'submit_guess',      │
│   targetPlayerId: selectedId │
│ }                            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Backend:                     │
│ - Check target role          │
│ - Update scoring             │
│ - Broadcast guess_submitted  │
└──────┬───────────────────────┘
       │
       ▼
    ┌──┴──┐
    │     │
 Red Fish  Blue Fish
    │     │
    │     ▼
    │ ┌──────────────────────┐
    │ │ Temp Points = 0      │
    │ │ Remaining Red Fish   │
    │ │ each get 1 point     │
    │ └──────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ Temp Points += 1             │
│ Check if all Red Fish found  │
└──────┬───────────────────────┘
       │
       ▼
    ┌──┴──┐
    │     │
   Yes    No
    │     │
    │     ▼
    │ ┌──────────────────────┐
    │ │ Continue Guessing    │
    │ └──────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ Guesser keeps temp points    │
│ Blue Fish gets 1 point       │
│ Round End                    │
└──────────────────────────────┘
```

---

## UI States

### 1. Loading Identity
- DeviceId not yet loaded from localStorage
- Full-screen overlay
- "Loading Identity..." message

### 2. Join Form (Not Joined)
- Nickname input field
- "Enter Lobby" button
- Error display (if join fails)

### 3. Lobby (Joined, Waiting)
- Player list with admin badges
- Host selection buttons (admin only)
- Game settings (language, difficulty)
- Timer configuration (admin only)
- Start Game button (admin, disabled if < 3 players)

### 4. Playing (Storytelling)
- Role display (tap to reveal, auto-hide)
- Answer display (role-specific)
- Guesser sees question only
- Ready button (all players must confirm)

### 5. Guessing
- Player cards (clickable by Guesser)
- Score display (temp points)
- Selection feedback

### 6. Round End
- Round results
- Points awarded
- Next Guesser announcement
- Prepare for next round

### 7. Game Completed
- Final scores for all players
- Winner announcement
- "Play Again" button (admin only)

---

## Key Features

### 1. Copy Room ID
- Click to copy full URL (`${origin}/${roomId}`)
- Visual feedback: "✓ COPIED!" for 2 seconds
- Fallback for older browsers (textarea method)

### 2. Role Privacy
- Role hidden by default (tap to reveal)
- Auto-hide after 3 seconds (anti-snooping)
- Manual hide button (🙈 icon)

### 3. Admin Controls
- Host selection (lobby phase)
- Kick player (any phase)
- Timer configuration
- Force end round (emergency)

### 4. Player Management
- Online/offline status (grayscale if disconnected)
- "You" badge for current player
- Admin crown badge (👑)
- Max 8 players

### 5. Responsive Design
- Mobile-first layout
- Sidebar collapses on mobile
- Touch-friendly buttons (44px min)
- Grid adapts to screen size

---

## WebSocket Events

### Client → Server

| Event | Payload | Sent By | Phase |
|-------|---------|---------|-------|
| `start_game` | `{ hostPlayerId, difficulty, language }` | Admin | Lobby |
| `kick_player` | `{ targetPlayerId }` | Admin | Any |
| `update_timer_config` | `{ config: {...} }` | Admin | Lobby |
| `end_round` | - | Admin | Any |
| `submit_guess` | `{ targetPlayerId }` | Guesser | Guessing |
| `ready` | - | Any | Playing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room_state_update` | `{ room: {...} }` | General state broadcast |
| `game_started` | `{ room: {...} }` | Roles assigned, game begins |
| `guess_submitted` | `{ room: {...} }` | Guesser made selection, scoring updated |
| `round_ended` | `{ room: {...} }` | Round complete, new Guesser assigned |
| `game_ended` | `{ room: {...} }` | All rounds done, final scores |

---

## Error Handling

### Error Scenarios

| Error | Cause | User Action |
|-------|-------|-------------|
| Failed to join | Room not found | Return to home |
| Room full (8 players) | Max capacity reached | Try another room |
| Kicked by admin | Admin removed player | Redirect to home |
| WebSocket disconnect | Network issue | Auto-reconnect on wake |
| Invalid deviceId | Corrupted localStorage | Re-join with new identity |

### Kicked Player Detection

```typescript
useEffect(() => {
    if (hasJoined && roomState && deviceId) {
        const stillInRoom = roomState.players.some(
            (p: any) => p.deviceId === deviceId
        );
        if (!stillInRoom) {
            router.push('/'); // Redirect to home
        }
    }
}, [roomState, deviceId, hasJoined, router]);
```

---

## Styling Classes

### Custom Classes (define in `globals.css`)

| Class | Purpose |
|-------|---------|
| `.modern-bg` | Gradient background |
| `.modern-card` | Card container (shadow, rounded) |
| `.modern-button` | Base button styles |
| `.modern-input` | Input field styles |
| `.modern-glow` | Glow effect (for roles) |
| `.animate-fade-in` | Fade-in animation |

### Tailwind Utilities

- **Layout**: `grid`, `grid-cols-1`, `lg:grid-cols-4`, `gap-8`
- **Spacing**: `p-4`, `p-6`, `p-8`, `mb-6`, `gap-4`
- **Typography**: `text-2xl`, `font-bold`, `tracking-wider`, `text-center`
- **Colors**: `text-gray-400`, `text-yellow-500`, `border-blue-500/50`
- **Effects**: `bg-gradient-to-r`, `bg-clip-text`, `text-transparent`

---

## Accessibility

- **Semantic HTML**: `<header>`, `<main>`, `<section>`, `<button>`
- **Labels**: Form inputs have associated labels
- **Error Announcements**: Error messages visible with icons
- **Disabled States**: Buttons show disabled state clearly
- **Keyboard Navigation**: All interactive elements focusable
- **Touch Targets**: Buttons minimum 44px height
- **Screen Reader**: Role announcements, game state changes

---

## Mobile Considerations

- **Responsive Grid**: Single column on mobile, 4 columns on desktop
- **Sidebar**: Player list stacks above/below game area on mobile
- **Text Sizing**: Scales appropriately (`text-2xl md:text-3xl`)
- **Padding**: `p-4` on mobile, `p-6 md:p-8` on larger screens
- **Flex Wrap**: Header items wrap on small screens
- **Full Width**: Buttons span full container width on mobile

---

## Future Enhancements

1. **Chat Interface** - Built-in text chat for questions
2. **Ready System** - All players confirm ready before guessing
3. **Score History** - Track scores across multiple games
4. **Custom Questions** - User-generated question/answer sets
5. **Sound Effects** - Subtle audio feedback for actions
6. **Animations** - Fish swimming, bubbles, role reveal effects
7. **Spectator Mode** - Allow observers without playing
8. **Game Statistics** - Win rates, most common guesses

---

**Document Version**: 1.0  
**Last Updated**: March 20, 2026
