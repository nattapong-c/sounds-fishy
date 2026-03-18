# Phase 2 Frontend - Player Status & Role Separation

## Overview
**Feature:** Player Online Status Display & Role Separation  
**Goal:** Show online/disconnected status for players and display host flag separately from game role

### Scope
- Update PlayerCard component to show online status indicator
- Add disconnected state styling (grayed out, "Disconnected" badge)
- Separate host badge from game role display
- Handle player_disconnected and player_reconnected WebSocket events
- Update TypeScript types for new player structure

---

## Pages/Routes

### No New Pages Required
Existing pages updated to show new player status information.

**Updated Pages:**
- `/room/{roomId}` - Player list shows online status and separated roles

---

## Components

### Updated: PlayerCard Component

```typescript
// app/src/components/players/PlayerCard.tsx

import React from 'react';
import { clsx } from 'clsx';

interface PlayerCardProps {
  playerName: string;
  isHost: boolean;
  inGameRole: 'guesser' | 'bigFish' | 'redHerring' | null;
  isOnline: boolean;
  isReady: boolean;
  isCurrentPlayer: boolean;
  lastSeen?: Date;
  animationDelay?: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  playerName,
  isHost,
  inGameRole,
  isOnline,
  isReady,
  isCurrentPlayer,
  lastSeen,
  animationDelay = 0,
}) => {
  const getRoleBadge = () => {
    if (isHost) {
      return (
        <span className="text-xs text-fish-gold flex items-center gap-1">
          👑 Host
        </span>
      );
    }
    
    switch (inGameRole) {
      case 'guesser':
        return (
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            🎯 Guesser
          </span>
        );
      case 'bigFish':
        return (
          <span className="text-xs text-fish-gold bg-yellow-100 px-2 py-0.5 rounded-full">
            🐟 Big Fish
          </span>
        );
      case 'redHerring':
        return (
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            🐠 Red Herring
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusIndicator = () => {
    if (isOnline) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Online
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          Disconnected
          {lastSeen && (
            <span className="text-xs text-gray-400 ml-1">
              ({formatLastSeen(lastSeen)})
            </span>
          )}
        </div>
      );
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-xl p-4 shadow-md flex items-center gap-3',
        'transform transition-all duration-300 hover:scale-105',
        'animate-slide-in-left',
        isCurrentPlayer && 'ring-2 ring-ocean-500',
        !isOnline && 'opacity-60 grayscale'
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Avatar with status indicator */}
      <div className="relative">
        <div className="text-2xl">🐟</div>
        <div
          className={clsx(
            'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      </div>

      {/* Player info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={clsx(
            'font-semibold text-gray-900',
            !isOnline && 'text-gray-500'
          )}>
            {playerName}
          </p>
          {isCurrentPlayer && (
            <span className="text-xs text-ocean-600 bg-ocean-100 px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {getRoleBadge()}
          {getStatusIndicator()}
        </div>
      </div>

      {/* Ready indicator */}
      {isReady && isOnline && (
        <div className="text-fish-green text-xl animate-bounce" data-testid="ready-checkmark">
          ✓
        </div>
      )}
      
      {/* Disconnected badge */}
      {!isOnline && (
        <div className="text-xs text-gray-400">
          ⚠️
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
```

### Updated: PlayerList Component

```typescript
// app/src/components/players/PlayerList.tsx

import React from 'react';
import PlayerCard from './PlayerCard';
import { IPlayer } from '@/types';

interface PlayerListProps {
  players: IPlayer[];
  hostId: string;
  currentUserId: string;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  hostId,
  currentUserId,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {players.map((player, index) => (
        <PlayerCard
          key={player.playerId}
          playerName={player.name}
          isHost={player.isHost}
          inGameRole={player.inGameRole}
          isOnline={player.isOnline}
          isReady={player.isReady}
          isCurrentPlayer={player.playerId === currentUserId}
          lastSeen={player.lastSeen}
          animationDelay={index * 100}
        />
      ))}
    </div>
  );
};

export default PlayerList;
```

---

## Hooks

### Updated: useRoom Hook

```typescript
// app/src/hooks/useRoom.ts

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket, WebSocketMessage } from './useSocket';
import { roomAPI } from '@/services/api';
import { IGameRoom, IPlayer } from '@/types';

interface UseRoomReturn {
  room: IGameRoom | null;
  isLoading: boolean;
  error: string | null;
  connectionState: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed';
  isConnected: boolean;
  joinRoom: () => void;
  leaveRoom: () => void;
  toggleReady: () => void;
  startGame: () => void;
}

export const useRoom = (roomCode: string, playerId?: string): UseRoomReturn => {
  const [room, setRoom] = useState<IGameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connectionState, isConnected, sendMessage, subscribe } = useWebSocket(roomCode, playerId);

  // Fetch initial room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data = await roomAPI.getRoom(roomCode);
        if (data.success) {
          setRoom(data.data);
        } else {
          setError(data.error?.message || 'Room not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to connect to room');
      } finally {
        setIsLoading(false);
      }
    };

    if (roomCode) {
      fetchRoom();
    }
  }, [roomCode]);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!isConnected) return;

    const handleRoomUpdate = (data: IGameRoom) => setRoom(data);
    
    const handlePlayerJoined = (data: any) => {
      console.log('Player joined:', data.playerName);
      // Show toast notification
    };
    
    const handlePlayerLeft = (data: any) => {
      console.log('Player left:', data.playerName);
      // Show toast notification
    };

    // NEW: Handle player disconnected
    const handlePlayerDisconnected = (data: any) => {
      console.log('Player disconnected:', data.playerId);
      // Update room state to show player as offline
      if (room) {
        const updatedPlayers = room.players.map(p =>
          p.playerId === data.playerId
            ? { ...p, isOnline: false, lastSeen: new Date(data.lastSeen) }
            : p
        );
        setRoom({ ...room, players: updatedPlayers });
      }
    };

    // NEW: Handle player reconnected
    const handlePlayerReconnected = (data: any) => {
      console.log('Player reconnected:', data.playerId);
      // Update room state to show player as online
      if (room) {
        const updatedPlayers = room.players.map(p =>
          p.playerId === data.playerId
            ? { ...p, isOnline: true, lastSeen: new Date() }
            : p
        );
        setRoom({ ...room, players: updatedPlayers });
      }
    };

    // Subscribe to events
    subscribe('room_updated', handleRoomUpdate);
    subscribe('player_joined', handlePlayerJoined);
    subscribe('player_left', handlePlayerLeft);
    subscribe('player_disconnected', handlePlayerDisconnected);
    subscribe('player_reconnected', handlePlayerReconnected);

    // Cleanup
    return () => {
      // Unsubscribe handled by hook's internal cleanup
    };
  }, [isConnected, subscribe, room]);

  // WebSocket actions - memoized
  const joinRoom = useCallback(() => {
    if (playerId) {
      sendMessage('join_room', { roomCode, playerId });
    }
  }, [playerId, roomCode, sendMessage]);

  const leaveRoom = useCallback(() => {
    if (playerId) {
      sendMessage('leave_room', { roomCode, playerId });
    }
  }, [playerId, roomCode, sendMessage]);

  const toggleReady = useCallback(() => {
    if (playerId) {
      sendMessage('ready_up', { roomCode, playerId });
    }
  }, [playerId, roomCode, sendMessage]);

  const startGame = useCallback(() => {
    sendMessage('start_game', { roomCode });
  }, [roomCode, sendMessage]);

  return {
    room,
    isLoading,
    error,
    connectionState,
    isConnected,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
  };
};
```

---

## Types

### Updated: IPlayer Interface

```typescript
// app/src/types/index.ts

export interface IPlayer {
  playerId: string;
  name: string;
  isHost: boolean;                    // NEW: Separate host flag
  inGameRole: 'guesser' | 'bigFish' | 'redHerring' | null; // NEW: Game role
  isOnline: boolean;                  // NEW: Connection status
  score: number;
  isReady: boolean;
  lastSeen?: string;                  // NEW: Last activity timestamp
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
```

---

## Styling

### Tailwind Classes

**Online Status Indicator:**
```typescript
// Online (green pulse)
<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />

// Disconnected (gray static)
<div className="w-2 h-2 bg-gray-400 rounded-full" />
```

**Disconnected Player Card:**
```typescript
// Opacity and grayscale for disconnected players
clsx(
  !isOnline && 'opacity-60 grayscale'
)
```

**Role Badges:**
```typescript
// Host (gold)
<span className="text-xs text-fish-gold">👑 Host</span>

// Guesser (purple)
<span className="text-xs text-purple-600 bg-purple-100">🎯 Guesser</span>

// Big Fish (yellow/gold)
<span className="text-xs text-fish-gold bg-yellow-100">🐟 Big Fish</span>

// Red Herring (blue)
<span className="text-xs text-blue-600 bg-blue-100">🐠 Red Herring</span>
```

---

## Testing Plan

### Component Tests

```typescript
// app/tests/components/PlayerCard.test.tsx

import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import PlayerCard from '@/components/players/PlayerCard';

describe('PlayerCard - Online Status', () => {
  const baseProps = {
    playerName: 'TestPlayer',
    isHost: false,
    inGameRole: null as const,
    isReady: false,
    isCurrentPlayer: false,
  };

  it('should show online indicator when player is online', () => {
    render(<PlayerCard {...baseProps} isOnline={true} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should show disconnected indicator when player is offline', () => {
    render(<PlayerCard {...baseProps} isOnline={false} />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should apply grayscale and opacity when disconnected', () => {
    const { container } = render(<PlayerCard {...baseProps} isOnline={false} />);
    const card = container.firstChild;
    expect(card).toHaveClass('opacity-60', 'grayscale');
  });

  it('should show host badge separately from game role', () => {
    render(<PlayerCard {...baseProps} isHost={true} isOnline={true} />);
    expect(screen.getByText('👑 Host')).toBeInTheDocument();
  });

  it('should show game role badge for non-host players', () => {
    render(<PlayerCard {...baseProps} inGameRole="guesser" isOnline={true} />);
    expect(screen.getByText('🎯 Guesser')).toBeInTheDocument();
  });

  it('should not show game role for host', () => {
    render(<PlayerCard {...baseProps} isHost={true} inGameRole={null} isOnline={true} />);
    expect(screen.queryByText('🎯 Guesser')).not.toBeInTheDocument();
  });

  it('should format lastSeen time correctly', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    render(<PlayerCard {...baseProps} isOnline={false} lastSeen={fiveMinutesAgo} />);
    expect(screen.getByText(/5m ago/)).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
// app/tests/e2e/player-status.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Player Online Status', () => {
  test('should show player as online when connected', async ({ page }) => {
    // Create room and join
    await page.goto('/');
    // ... join flow
    
    // Should show "Online" indicator
    await expect(page.getByText('Online')).toBeVisible();
  });

  test('should show player as disconnected when browser closes', async ({ page, context }) => {
    // Create room with 2 players
    // ... setup
    
    // Close one player's browser
    await context.pages()[1].close();
    
    // Remaining player should see "Disconnected" status
    await expect(page.getByText('Disconnected')).toBeVisible();
  });

  test('should show reconnected status when player refreshes', async ({ page }) => {
    // Create room
    // ... setup
    
    // Refresh page
    await page.reload();
    
    // Should show "Online" again after reconnection
    await expect(page.getByText('Online')).toBeVisible();
  });

  test('should not delete room when host disconnects', async ({ page }) => {
    // Host creates room
    await page.goto('/');
    // ... create room
    
    // Get room code
    const roomCode = await page.locator('span.font-mono').textContent();
    
    // Refresh page (simulate disconnect)
    await page.reload();
    
    // Should still be in room (not redirected to home)
    await expect(page).toHaveURL(`/room/${roomCode}`);
  });
});
```

---

## Acceptance Criteria

- [ ] PlayerCard shows online/disconnected indicator
- [ ] Disconnected players shown with grayscale and opacity
- [ ] Host badge (👑) displayed separately from game role
- [ ] Game roles: 🎯 Guesser, 🐟 Big Fish, 🐠 Red Herring
- [ ] Host does NOT have game role badge
- [ ] `player_disconnected` event handled
- [ ] `player_reconnected` event handled
- [ ] Last seen time formatted (just now, 5m ago, 1h ago)
- [ ] Component tests passing (7+ tests)
- [ ] E2E tests for disconnect/reconnect flow
- [ ] Room persists when host refreshes page
- [ ] TypeScript types updated with new fields

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "axios": "^1.6.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/react": "^14.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

---

## File Structure

```
app/src/
├── components/
│   └── players/
│       ├── PlayerCard.tsx          # Updated with status & role separation
│       └── PlayerList.tsx          # Updated to pass new props
├── hooks/
│   └── useRoom.ts                  # Handle disconnect/reconnect events
├── types/
│   └── index.ts                    # Updated IPlayer interface
└── tests/
    ├── components/
    │   └── PlayerCard.test.tsx     # Updated tests
    └── e2e/
        └── player-status.spec.ts   # NEW: Status tests
```
