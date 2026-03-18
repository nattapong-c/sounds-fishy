# Phase 1 Frontend Implementation Plan

## Overview
**Feature:** Lobby & Room Join UI  
**Goal:** Build the foundational frontend for creating/joining rooms, viewing lobby state, and real-time player management with a modern, minimal, yet playful design.

### Scope
- Landing page with create/join options
- Lobby page with player list
- Room code input with validation
- Socket.io client integration
- Real-time player join/leave updates
- Ready-up functionality
- Mobile-responsive design with playful animations

---

## Pages/Routes

### 1. `/` - Landing Page
**File:** `app/src/app/page.tsx`

**Purpose:** Entry point with create/join options

**UI Elements:**
- Game logo/title with playful fish animation
- "Create Room" button (primary CTA)
- "Join Room" button (secondary)
- Room code input field (inline or modal)
- Footer with game instructions

**Animations:**
- Fish swimming across screen on load
- Button hover bounce effect
- Subtle pulse on CTA button

---

### 2. `/room/[roomCode]` - Room Page (Dynamic Route)
**File:** `app/src/app/room/[roomCode]/page.tsx`

**Purpose:** Main room container, redirects based on room state

**Logic:**
- Fetch room data on load
- If lobby → redirect to `/room/[roomCode]/lobby`
- If game started → redirect to appropriate phase page
- Handle connection errors

---

### 3. `/room/[roomCode]/lobby` - Lobby Page
**File:** `app/src/app/room/[roomCode]/lobby/page.tsx`

**Purpose:** Waiting area for players before game starts

**UI Elements:**
- Room code display (large, copyable)
- Player list with avatars/names
- Ready button toggle
- "Waiting for host to start" message (for non-hosts)
- "Start Game" button (host only, disabled until min players)
- Leave room button
- Connection status indicator

**States:**
- Loading (connecting to room)
- Connected (showing lobby)
- Error (room not found, etc.)
- Game starting (transition animation)

**Animations:**
- Player cards slide in on join
- Ready checkmark bounce animation
- Confetti burst when all players ready
- Fish wiggle on player join

---

## Components

### Atomic Components

#### Button (`components/ui/Button.tsx`)
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
```
**Styling:** Rounded corners, bounce on hover, loading spinner

---

#### Input (`components/ui/Input.tsx`)
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
```
**Styling:** Clean borders, focus ring, error state red

---

#### Card (`components/ui/Card.tsx`)
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}
```
**Styling:** Subtle shadow, rounded-lg, hover lift effect

---

### Molecular Components

#### PlayerCard (`components/players/PlayerCard.tsx`)
```typescript
interface PlayerCardProps {
  playerName: string;
  isHost: boolean;
  isReady: boolean;
  isCurrentPlayer: boolean;
  animationDelay?: number;
}
```
**UI:**
- Avatar (fish emoji or initial)
- Player name
- Host crown icon
- Ready checkmark badge
- Slide-in animation on mount

**Styling:**
```tsx
className="bg-white rounded-xl p-4 shadow-md flex items-center gap-3 
           transform transition-all duration-300 hover:scale-105
           animate-slide-in-left"
```

---

#### RoomCodeDisplay (`components/room/RoomCodeDisplay.tsx`)
```typescript
interface RoomCodeDisplayProps {
  roomCode: string;
  onCopy: () => void;
}
```
**UI:**
- Large monospace code display
- Copy button with tooltip
- "Share this code" label

**Animation:** Scale pulse on copy success

---

#### ReadyButton (`components/room/ReadyButton.tsx`)
```typescript
interface ReadyButtonProps {
  isReady: boolean;
  onToggle: () => void;
  disabled?: boolean;
}
```
**UI:**
- Toggle button (Ready / Not Ready)
- Color change (green when ready)
- Checkmark animation

---

#### PlayerList (`components/players/PlayerList.tsx`)
```typescript
interface PlayerListProps {
  players: IPlayer[];
  hostId: string;
  currentUserId: string;
}
```
**UI:**
- Grid of PlayerCards
- Player count badge
- Scrollable if > 6 players

---

#### ConnectionStatus (`components/ui/ConnectionStatus.tsx`)
```typescript
interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting?: boolean;
}
```
**UI:**
- Green dot (connected)
- Yellow dot + spinner (reconnecting)
- Red dot (disconnected)
- Tooltip with status text

---

### Organism Components

#### LobbyScreen (`components/lobby/LobbyScreen.tsx`)
```typescript
interface LobbyScreenProps {
  room: IGameRoom;
  currentUserId: string;
  isHost: boolean;
  allPlayersReady: boolean;
  onReadyToggle: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onCopyCode: () => void;
}
```
**Layout:**
```
┌─────────────────────────────────┐
│  Room: FISH42  [Copy] [X Leave] │
├─────────────────────────────────┤
│                                 │
│     👤 Player1 ✓  👤 Player2    │
│     👤 Player3 ✓  👤 You ✓      │
│                                 │
│     [✓ Ready]  or  [Start Game] │
│                                 │
│  Waiting for host to start...   │
└─────────────────────────────────┘
```

---

#### CreateRoomModal (`components/room/CreateRoomModal.tsx`)
```typescript
interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (hostName: string) => void;
}
```
**UI:**
- Host name input
- Create button
- Cancel button
- Fish swimming animation in background

---

#### JoinRoomModal (`components/room/JoinRoomModal.tsx`)
```typescript
interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (roomCode: string, playerName: string) => void;
}
```
**UI:**
- Room code input (auto-uppercase, 6 chars)
- Player name input
- Join button
- Error messages for invalid code

---

## Hooks

### useSocket (`hooks/useSocket.ts`)
```typescript
export const useSocket = (roomCode?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', () => {
      setIsReconnecting(true);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Join room
  const joinRoom = useCallback((playerId: string) => {
    socket?.emit('join_room', { roomCode, playerId });
  }, [socket, roomCode]);

  // Leave room
  const leaveRoom = useCallback(() => {
    socket?.emit('leave_room', { roomCode });
  }, [socket, roomCode]);

  // Ready up
  const toggleReady = useCallback((playerId: string) => {
    socket?.emit('ready_up', { roomCode, playerId });
  }, [socket, roomCode]);

  // Start game (host only)
  const startGame = useCallback(() => {
    socket?.emit('start_game', { roomCode });
  }, [socket, roomCode]);

  return {
    socket,
    isConnected,
    isReconnecting,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame
  };
};
```

---

### useRoom (`hooks/useRoom.ts`)
```typescript
export const useRoom = (roomCode: string) => {
  const [room, setRoom] = useState<IGameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket(roomCode);

  // Fetch initial room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomCode}`);
        const data = await res.json();
        if (data.success) {
          setRoom(data.data);
        } else {
          setError(data.error?.message || 'Room not found');
        }
      } catch (err) {
        setError('Failed to connect to room');
      } finally {
        setIsLoading(false);
      }
    };

    if (roomCode) {
      fetchRoom();
    }
  }, [roomCode]);

  // Listen for socket updates
  useEffect(() => {
    if (!socket) return;

    socket.on('room_updated', (data) => {
      setRoom(data);
    });

    socket.on('player_joined', (data) => {
      // Optional: Show toast notification
    });

    socket.on('player_left', (data) => {
      // Optional: Show toast notification
    });

    return () => {
      socket.off('room_updated');
      socket.off('player_joined');
      socket.off('player_left');
    };
  }, [socket]);

  return { room, isLoading, error, isConnected };
};
```

---

### useLocalStorage (`hooks/useLocalStorage.ts`)
```typescript
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};

// Usage: store playerId persistently
// const [playerId, setPlayerId] = useLocalStorage<string>('playerId', '');
```

---

## Types

### Shared Types (`types/index.ts`)
```typescript
export type PlayerRole = 'guesser' | 'bigFish' | 'redHerring' | 'host';
export type GameStatus = 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary' | 'completed';

export interface IPlayer {
  playerId: string;
  name: string;
  role: PlayerRole;
  score: number;
  isReady: boolean;
}

export interface IGameRoom {
  _id?: string;
  roomCode: string;
  hostId: string;
  status: GameStatus;
  players: IPlayer[];
  currentRound: number;
  createdAt?: string;
  updatedAt?: string;
}

// Socket events
export interface SocketEvents {
  // Client → Server
  'join_room': { roomCode: string; playerId: string };
  'leave_room': { roomCode: string; playerId: string };
  'ready_up': { roomCode: string; playerId: string };
  'start_game': { roomCode: string };

  // Server → Client
  'room_updated': IGameRoom;
  'player_joined': { playerId: string; playerName: string; playerCount: number };
  'player_left': { playerId: string; playerName: string; remainingCount: number };
  'game_started': { roomCode: string; status: 'briefing' };
  'error': { code: string; message: string };
}
```

---

## Styling

### Tailwind Config (`tailwind.config.ts`)
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          400: '#38bdf8',
          500: '#0ea5e9',  // Primary
          600: '#0284c7',
          900: '#0c4a6e',
        },
        fish: {
          gold: '#fbbf24',   // Big Fish accent
          red: '#ef4444',    // Red Herring accent
          green: '#22c55e',  // Ready/Success
        }
      },
      animation: {
        'swim': 'swim 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'wiggle': 'wiggle 0.5s ease-in-out',
      },
      keyframes: {
        swim: {
          '0%, 100%': { transform: 'translateX(-10px) rotate(-5deg)' },
          '50%': { transform: 'translateX(10px) rotate(5deg)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
```

---

### Global Styles (`app/globals.css`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply bg-ocean-500 text-white px-6 py-3 rounded-xl 
           font-semibold transition-all duration-200
           hover:bg-ocean-600 hover:scale-105
           active:scale-95 disabled:opacity-50 
           disabled:cursor-not-allowed disabled:hover:scale-100;
  }

  .btn-secondary {
    @apply bg-white text-ocean-600 border-2 border-ocean-500 
           px-6 py-3 rounded-xl font-semibold transition-all duration-200
           hover:bg-ocean-50 hover:scale-105
           active:scale-95;
  }

  .card {
    @apply bg-white rounded-xl shadow-md p-4 
           transition-all duration-200 hover:shadow-lg;
  }
}

/* Utility for playful fish animation */
.fish-swim {
  animation: swim 3s ease-in-out infinite;
}
```

---

## Testing Plan

### Component Tests

#### PlayerCard Test
```typescript
// app/src/__tests__/components/PlayerCard.test.tsx

import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import PlayerCard from '../../components/players/PlayerCard';

describe('PlayerCard', () => {
  it('renders player name correctly', () => {
    render(<PlayerCard playerName="TestUser" isHost={false} isReady={false} isCurrentPlayer={false} />);
    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('shows host crown for host player', () => {
    render(<PlayerCard playerName="Host" isHost={true} isReady={false} isCurrentPlayer={false} />);
    expect(screen.getByTestId('host-crown')).toBeInTheDocument();
  });

  it('shows ready checkmark when ready', () => {
    render(<PlayerCard playerName="Ready" isHost={false} isReady={true} isCurrentPlayer={false} />);
    expect(screen.getByTestId('ready-checkmark')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

#### Lobby Flow Test
```typescript
// app/tests/e2e/lobby-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Lobby Flow', () => {
  test('should create a room and show lobby', async ({ page }) => {
    // Go to landing page
    await page.goto('/');

    // Click create room
    await page.click('button:has-text("Create Room")');

    // Enter host name
    await page.fill('input[placeholder="Your name"]', 'TestHost');
    await page.click('button:has-text("Create")');

    // Should redirect to lobby
    await expect(page).toHaveURL(/\/room\/[A-Z0-9]{6}\/lobby/);

    // Should show room code
    const roomCodeElement = page.getByTestId('room-code');
    await expect(roomCodeElement).toBeVisible();

    // Should show player list with host
    await expect(page.getByText('TestHost')).toBeVisible();
  });

  test('should join existing room with code', async ({ page }) => {
    // Create room first (via API or another page)
    const roomCode = 'TEST123';

    await page.goto('/');
    await page.click('button:has-text("Join Room")');

    // Enter room code
    await page.fill('input[placeholder="Room code"]', roomCode);
    await page.fill('input[placeholder="Your name"]', 'NewPlayer');
    await page.click('button:has-text("Join")');

    // Should redirect to lobby
    await expect(page).toHaveURL(`/room/${roomCode}/lobby`);

    // Should see both players
    await expect(page.getByText('TestHost')).toBeVisible();
    await expect(page.getByText('NewPlayer')).toBeVisible();
  });

  test('should toggle ready status', async ({ page }) => {
    // ... setup from previous test

    const readyButton = page.getByTestId('ready-button');
    await readyButton.click();

    // Should show ready state
    await expect(readyButton).toHaveText('✓ Ready');
    await expect(readyButton).toHaveClass(/bg-green/);
  });

  test('should show error for invalid room code', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Join Room")');

    await page.fill('input[placeholder="Room code"]', 'INVALID');
    await page.fill('input[placeholder="Your name"]', 'Player');
    await page.click('button:has-text("Join")');

    // Should show error message
    await expect(page.getByText('Room not found')).toBeVisible();
  });
});
```

---

## Acceptance Criteria

- [ ] Landing page with create/join buttons
- [ ] Create room flow with host name input
- [ ] Join room flow with code + name input
- [ ] Lobby page showing all players
- [ ] Real-time player join/leave via Socket.io
- [ ] Ready button toggle functionality
- [ ] Host-only start game button (disabled until min 4 players)
- [ ] Room code copy to clipboard
- [ ] Mobile-responsive layout (tested on 375px width)
- [ ] Playful animations (fish swim, button bounce, slide-ins)
- [ ] Connection status indicator
- [ ] Error handling for invalid rooms
- [ ] Component tests passing
- [ ] E2E tests passing for core lobby flow
- [ ] TypeScript types aligned with backend

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/react": "^14.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0"
  }
}
```

---

## File Structure

```
app/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   └── room/
│   │       └── [roomCode]/
│   │           ├── page.tsx            # Room container
│   │           └── lobby/
│   │               └── page.tsx        # Lobby page
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ConnectionStatus.tsx
│   │   ├── players/
│   │   │   ├── PlayerCard.tsx
│   │   │   └── PlayerList.tsx
│   │   ├── room/
│   │   │   ├── RoomCodeDisplay.tsx
│   │   │   ├── ReadyButton.tsx
│   │   │   ├── CreateRoomModal.tsx
│   │   │   └── JoinRoomModal.tsx
│   │   └── lobby/
│   │       └── LobbyScreen.tsx
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   ├── useRoom.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   └── __tests__/
│       ├── components/
│       └── e2e/
├── tests/
│   └── e2e/
│       └── lobby-flow.spec.ts
├── public/
│   └── fish-logo.svg
├── tailwind.config.ts
└── package.json
```
