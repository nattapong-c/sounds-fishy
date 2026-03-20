# Homepage Flow

## Overview

The homepage is the entry point for Sounds Fishy. It provides two main actions:
1. **Create a new room** - Start a new game session
2. **Join an existing room** - Enter a room code to join

---

## Page Structure

```
┌─────────────────────────────────────────┐
│                                         │
│           [Game Title Logo]             │
│        "SOUNDS FISHY" (gradient)        │
│      "Storytelling & Bluffing Game"     │
│                                         │
│    ┌─────────────────────────────────┐  │
│    │                                 │  │
│    │    [Error Message - if any]     │  │
│    │    ⚠️ Failed to create room     │  │
│    │                                 │  │
│    └─────────────────────────────────┘  │
│                                         │
│    ┌─────────────────────────────────┐  │
│    │     MODERN CARD CONTAINER       │  │
│    │                                 │  │
│    │  ┌───────────────────────────┐  │  │
│    │  │  🎮 Create New Room       │  │  │
│    │  │  (Full width button)      │  │  │
│    │  └───────────────────────────┘  │  │
│    │                                 │  │
│    │        ───── OR ─────           │  │
│    │                                 │  │
│    │  ┌───────────────────────────┐  │  │
│    │  │  [ENTER ROOM ID] ____ 6   │  │  │
│    │  │  (Input, max 6 chars)     │  │  │
│    │  └───────────────────────────┘  │  │
│    │                                 │  │
│    │  ┌───────────────────────────┐  │  │
│    │  │  🚪 Join Room             │  │  │
│    │  │  (Full width button)      │  │  │
│    │  └───────────────────────────┘  │  │
│    │                                 │  │
│    └─────────────────────────────────┘  │
│                                         │
│    👥 4-8 Players  •  ⏱️ 5-10 Min  •   │
│         🎯 Storytelling & Lying         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Component Tree

```
Home (Page Component)
├── Main Container (min-h-screen, flex, centered)
│   ├── Title Section
│   │   ├── H1 Title (gradient text)
│   │   └── Subtitle (gray, uppercase)
│   ├── Error Message (conditional)
│   ├── Main Card
│   │   ├── Create Room Button
│   │   ├── Divider ("OR")
│   │   └── Join Room Form
│   │       ├── Room ID Input
│   │       └── Join Button
│   └── Footer Info
│       └── Player count, duration, genre
```

---

## State Management

### Local State (React `useState`)

| State | Type | Initial | Purpose |
|-------|------|---------|---------|
| `isLoading` | `boolean` | `false` | Track create room loading state |
| `joinRoomId` | `string` | `''` | User input for room ID to join |
| `error` | `string \| null` | `null` | Display error messages |

### External Dependencies

| Dependency | Source | Purpose |
|------------|--------|---------|
| `router` | `next/navigation` | Navigate to room page |
| `api` | `@/lib/api` | Call backend create room endpoint |

---

## User Flows

### Flow 1: Create New Room

```
┌──────────────┐
│   User       │
│   Clicks     │
│   "Create"   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ Set isLoading = true         │
│ Clear previous errors        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ API Call: POST /api/rooms    │
│ (via api.rooms.create())     │
└──────┬───────────────────────┘
       │
       ▼
    ┌──┴──┐
    │     │
    │ Success │ Error
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────────┐
│ Get     │ │ Set error        │
│ roomId  │ │ Display message  │
│         │ │ isLoading = false│
└────┬────┘ └──────────────────┘
     │
     ▼
┌─────────────────────────────┐
│ window.location.href =      │
│ `/${roomId}`                │
│ (Full page reload to room)  │
└─────────────────────────────┘
```

**Implementation:**
```typescript
const handleCreateRoom = async () => {
    setIsLoading(true);
    setError(null);

    try {
        const response = await api.rooms.create();
        const roomId = response.data?.roomId || response.roomId;

        if (roomId) {
            window.location.href = `/${roomId}`;
        } else {
            setError('Failed to create room: No room ID returned');
            setIsLoading(false);
        }
    } catch (error: any) {
        setError(`Failed to create room: ${error.response?.data || error.message}`);
        setIsLoading(false);
    }
};
```

---

### Flow 2: Join Existing Room

```
┌──────────────┐
│   User       │
│   Enters     │
│   Room ID    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ Input onChange:              │
│ - Convert to UPPERCASE       │
│ - Max 6 characters           │
│ - Update joinRoomId state    │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────┐
│   User       │
│   Clicks     │
│   "Join"     │
│   or Enter   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ Validate:                    │
│ - joinRoomId.trim() not empty│
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Router push:                 │
│ `/${joinRoomId.toUpperCase()}`│
│ (Client-side navigation)     │
└──────────────────────────────┘
```

**Implementation:**
```typescript
const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
        router.push(`/${joinRoomId.trim().toUpperCase()}`);
    }
};
```

---

## API Integration

### Create Room Endpoint

**Client Call:**
```typescript
await api.rooms.create();
```

**Expected Response:**
```typescript
{
    roomId: string;  // 6-character uppercase code (e.g., "ABC123")
}
```

**Error Handling:**
- Network errors caught by `try/catch`
- Backend errors displayed via `error.response?.data`
- No roomId returned → display error message

---

## UI States

### 1. Initial State
- Title displayed
- "Create New Room" button enabled
- "Join Room" input empty, button disabled

### 2. Loading State (Creating Room)
- Create button shows: `⏳ Creating...`
- Create button disabled
- Join form still interactive

### 3. Error State
- Error banner appears above main card
- Red border, warning icon ⚠️
- Descriptive error message
- User can dismiss by trying again

### 4. Input State (Join Room)
- Input converts to UPPERCASE automatically
- Character counter shows `X/6`
- Join button enabled when input not empty

---

## Styling Classes

### Custom Classes (to be defined in `globals.css`)

| Class | Purpose |
|-------|---------|
| `.modern-bg` | Gradient background for page |
| `.modern-card` | Card container with shadow, rounded corners |
| `.modern-button` | Base button styles |
| `.modern-button-primary` | Primary button (blue gradient) |
| `.modern-button-success` | Success button (green gradient) |
| `.modern-input` | Input field styles |
| `.animate-fade-in` | Fade-in animation on load |

### Tailwind Utilities Used

- **Layout**: `min-h-screen`, `flex`, `flex-col`, `items-center`, `justify-center`
- **Spacing**: `p-4`, `p-6`, `p-8`, `mb-8`, `mb-12`, `gap-3`, `gap-4`
- **Typography**: `text-5xl`, `text-7xl`, `font-bold`, `tracking-wide`, `text-center`
- **Colors**: `text-gray-400`, `text-red-400`, `border-red-500/50`
- **Effects**: `bg-gradient-to-r`, `bg-clip-text`, `text-transparent`

---

## Navigation

### Create Room → Room Page
- **Method**: `window.location.href` (full reload)
- **Reason**: Ensures clean state, WebSocket reconnection
- **URL**: `/{roomId}`

### Join Room → Room Page
- **Method**: `router.push` (client-side navigation)
- **Reason**: Faster, preserves some state
- **URL**: `/{roomId}` (uppercase)

---

## Error Scenarios

| Error | Cause | User Message |
|-------|-------|--------------|
| Network error | Backend unreachable | "Failed to create room: Network error" |
| No roomId | Backend returns invalid response | "Failed to create room: No room ID returned" |
| Empty input | User clicks Join without ID | Button disabled, no action |
| Room not found | Invalid room ID entered | Handled on room page |

---

## Accessibility

- **Semantic HTML**: `<main>`, `<h1>`, `<form>`, `<button>`
- **Labels**: Input has descriptive placeholder
- **Error Announcements**: Error messages visible with icon
- **Disabled States**: Buttons show disabled state clearly
- **Keyboard Navigation**: Form submit on Enter key
- **Touch Targets**: Buttons minimum 44px height

---

## Mobile Considerations

- **Responsive**: `md:` breakpoints for tablet/desktop
- **Text Sizing**: `text-5xl md:text-7xl` scales appropriately
- **Padding**: `p-4` on mobile, `p-6 md:p-8` on larger screens
- **Flex Wrap**: Footer info wraps on small screens
- **Full Width**: Buttons span full container width

---

## Future Enhancements

1. **Recent Rooms**: Show list of recently joined rooms
2. **Tutorial**: First-time user onboarding
3. **Game Rules**: Modal with game explanation
4. **Settings**: Language, sound toggle
5. **QR Code**: Share room via QR code

---

**Document Version**: 1.0  
**Last Updated**: March 20, 2026
