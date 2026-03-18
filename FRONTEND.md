# FRONTEND.md - Project "Sounds Fishy" Frontend Documentation

## 🎯 Overview
This document outlines the frontend architecture, technologies, and key conventions for the **Sounds Fishy** (FishyBusiness Digital) application. The frontend serves as the player's "secret screen" companion, displaying role-specific information and facilitating real-time game interaction.

## 🛠 Technology Stack
*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **UI Library:** React
*   **Styling:** TailwindCSS
*   **HTTP Client:** Axios (for REST API requests)
*   **Real-time:** Native WebSocket API (ElysiaWS)
*   **Testing:** Playwright
*   **Hosting:** Vercel
*   **Package Manager/Runtime:** Bun (for development and build)
*   **AI Integration:** OpenAI-compatible LLM API UI (configurable settings, generation status, error handling)

## ✍️ Naming Convention Guidelines (TypeScript Best Practices)
Adhering to consistent naming conventions improves code readability and maintainability.

*   **Variables, Functions, Properties, Method Names**: Use `camelCase`.
    *   Examples: `playerName`, `roomCode`, `handleEliminateClick`, `useGameSocket`
*   **Components, Classes, Interfaces, Types (Type Aliases)**: Use `PascalCase`.
    *   Examples: `PlayerCard`, `EliminationPanel`, `IGameState`, `SocketMessage`, `LobbyPage`
*   **Enums and Enum Members**: Use `PascalCase` for the enum name and `PascalCase` for its members.
    *   Examples: `GameStatus.InProgress`, `PlayerRole.Guesser`, `PlayerRole.BigFish`
*   **Constants (Global/Module-Level)**: Use `UPPER_SNAKE_CASE`.
    *   Examples: `MAX_PLAYERS_PER_ROOM`, `SOCKET_SERVER_URL`, `POINTS_PER_ELIMINATION`
*   **Filenames**: Use `kebab-case` for most files (e.g., `player-card.tsx`, `use-socket.ts`). For files exclusively exporting a single `PascalCase` component or interface, `PascalCase` filename is also acceptable (e.g., `PlayerList.tsx`).
*   **Private/Protected Members**: Prefix with an underscore `_` (less common in React function components, more for classes or utility functions).
    *   Examples: `_internalState`, `_formatRoomCode`

## 💡 Code Style Examples

### Interfaces & Types
Interfaces and type aliases define data structures, ensuring type safety across the application.
```typescript
interface IGameRoom {
  id: string;
  roomCode: string;
  status: 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary';
  players: IPlayer[];
  currentRound: number;
}

interface IPlayer {
  id: string;
  name: string;
  role: PlayerRole;
  score: number;
  isReady: boolean;
}

interface IRoundPayload {
  question: string;
  secretWord?: string;        // Only for Big Fish
  canGenerateLie?: boolean;   // Only for Red Herrings
}

type PlayerRole = 'guesser' | 'bigFish' | 'redHerring';
type GameStatus = 'lobby' | 'briefing' | 'pitch' | 'elimination' | 'round_summary';
type EliminationResult = 'redHerring' | 'bigFish';
```

### React Components (Functional)
Prefer functional components with hooks.
```typescript
import React, { useState } from 'react';

interface PlayerCardProps {
  playerId: string;
  playerName: string;
  isEliminated: boolean;
  isCurrentPlayer: boolean;
  onEliminate: (id: string) => void;
  disabled: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  playerId,
  playerName,
  isEliminated,
  isCurrentPlayer,
  onEliminate,
  disabled,
}) => {
  const handleClick = () => {
    if (!disabled && !isEliminated) {
      onEliminate(playerId);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-4 rounded-lg shadow-md cursor-pointer transition-all
        ${isEliminated ? 'bg-gray-400 opacity-50' : 'bg-blue-600 hover:bg-blue-700'}
        ${disabled ? 'cursor-not-allowed' : ''}
        ${isCurrentPlayer ? 'ring-2 ring-yellow-400' : ''}
      `}
    >
      <h3 className="text-xl font-bold">{playerName}</h3>
      {isEliminated && <span className="text-sm">Eliminated</span>}
    </div>
  );
};

export default PlayerCard;
```

### Custom Hooks
Encapsulate reusable logic, especially for stateful operations or Socket.io interactions.
```typescript
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { IGameRoom, IRoundPayload } from '../types';

const useGameSocket = (roomCode: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameRoom, setGameRoom] = useState<IGameRoom | null>(null);
  const [roundPayload, setRoundPayload] = useState<IRoundPayload | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('room_updated', (data: IGameRoom) => {
      setGameRoom(data);
    });

    newSocket.on('start_round', (payload: IRoundPayload) => {
      setRoundPayload(payload);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = useCallback((playerName: string) => {
    socket?.emit('join_room', { roomCode, playerName });
  }, [socket, roomCode]);

  const readyUp = useCallback(() => {
    socket?.emit('ready_up', { roomCode });
  }, [socket, roomCode]);

  const eliminatePlayer = useCallback((targetPlayerId: string) => {
    socket?.emit('eliminate_player', { roomCode, targetPlayerId });
  }, [socket, roomCode]);

  const bankPoints = useCallback(() => {
    socket?.emit('bank_points', { roomCode });
  }, [socket, roomCode]);

  return {
    socket,
    gameRoom,
    roundPayload,
    isConnected,
    joinRoom,
    readyUp,
    eliminatePlayer,
    bankPoints,
  };
};

export default useGameSocket;
```

### Error Handling in UI
Handle errors gracefully, providing user feedback.
```typescript
// Example within a component
import { useRouter } from 'next/router';

const GameRoomPage: React.FC = () => {
  const router = useRouter();
  const { roomCode } = router.query;
  const { gameRoom, isConnected, error } = useGameSocket(roomCode as string);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Connecting to game server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error: {error}. Please try refreshing the page.
      </div>
    );
  }

  if (!gameRoom) {
    return <p>Room not found.</p>;
  }

  return (
    <div>
      <h1>Room: {gameRoom.roomCode}</h1>
      {/* Render game UI based on role and phase */}
    </div>
  );
};
```

## 📂 Project Structure

### `app/src/app/` (Next.js App Router)
*   **`/`**: Landing page with options to create or join a room.
*   **`/create`**: Room creation flow.
*   **`/room/[roomCode]`**: Dynamic route for active game room.
*   **`/room/[roomCode]/lobby`**: Lobby waiting area.
*   **`/room/[roomCode]/briefing`**: Role briefing screen (secret info with AI-generated content).
*   **`/room/[roomCode]/settings`**: Game settings (host-only AI configuration).
*   **`/room/[roomCode]/elimination`**: Elimination phase UI.
*   **`/room/[roomCode]/summary`**: Round summary and leaderboard.
*   **`layout.tsx`**: Root layout for the application.
*   **`page.tsx`**: Landing page entry point.

### `app/src/components/`
*   **Atomic Design Principles**: Components organized into atoms, molecules, organisms.
*   **Reusable UI Elements**:
    *   `Button`, `Input`, `Card` (atoms)
    *   `PlayerCard`, `RoleBadge`, `ScoreDisplay`, `AIBadge` (molecules)
    *   `EliminationPanel`, `PlayerList`, `ReadyCheck` (organisms)
    *   `BriefingScreen`, `LobbyScreen` (templates)
*   **AI-Specific Components**:
    *   `AIBadge`: Shows "AI Generated" indicator with model name
    *   `AILoadingSpinner`: Loading state for AI generation
    *   `QuestionDisplay`: Question card with AI badge
    *   `AnswerReveal`: Tap-to-reveal for Big Fish answer
    *   `BluffSuggestions`: List of AI-suggested bluffs for Red Herrings
    *   `AIConfigInput`: Host settings for API key, model, base URL

### `app/src/hooks/`
*   **Custom React Hooks**: For encapsulating reusable stateful logic.
*   **`useGameSocket`**: Socket.io connection and event handling.
*   **`useGameState`**: Local game state management.
*   **`usePlayerRole`**: Role-specific view logic.
*   **`useAIGeneration`**: AI content generation (rounds, lies)
*   **`useAIConfig`**: AI configuration management (host-only)

### `app/src/lib/`
*   **Utility Functions**: Helper functions, formatters, validators.
*   **API Client Setup**: Axios configuration with interceptors, base URL, and error handling.
*   **Socket Client**: Socket.io client initialization.

### `app/src/services/`
*   **Frontend Business Logic**: Functions for game actions (join, ready, eliminate, bank).
*   **Local State Management**: Client-side state orchestration.

### `app/src/types/`
*   **TypeScript Definitions**: Shared interfaces for game entities, API payloads, Socket messages.
*   **`index.ts`**: Central export for all types.

## 🔄 State Management
*   **Socket.io Server State:** Primary game state lives on the server (MongoDB + in-memory for active rooms).
*   **React Local State:** Component-level state via `useState`, `useReducer`.
*   **Custom Hooks:** Shared state logic via `useGameSocket`, `useGameState`.
*   **No Global State Library:** Keep it simple with React Context only if truly needed.

## 🌐 API Integration
*   **Axios Client:** For all REST API requests with interceptors and error handling
*   **Native WebSocket:** For all real-time game updates via ElysiaWS:
    *   Connection: `ws://localhost:3001/ws`
    *   Message format: `{ type: string, data: any }`
    *   Room state changes
    *   Round start/end
    *   Elimination results
    *   Score updates

### WebSocket Configuration
```typescript
// app/src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001/ws';

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // Handle message.type and message.data
    };
    
    wsRef.current = ws;
    return () => ws.close();
  }, []);
  
  const sendMessage = (type: string, data: any) => {
    wsRef.current?.send(JSON.stringify({ type, data }));
  };
  
  return { isConnected, sendMessage };
};
```

### Message Format

**Client → Server:**
```typescript
{
  type: 'join_room',
  data: { roomCode: string; playerId: string }
}

{
  type: 'leave_room',
  data: { roomCode: string; playerId: string }
}

{
  type: 'ready_up',
  data: { roomCode: string; playerId: string }
}

{
  type: 'start_game',
  data: { roomCode: string }
}
```

**Server → Client:**
```typescript
{
  type: 'room_updated',
  data: IGameRoom
}

{
  type: 'player_joined',
  data: { playerId: string; playerName: string; playerCount: number }
}

{
  type: 'player_left',
  data: { playerId: string; playerName: string; remainingCount: number }
}

{
  type: 'game_started',
  data: { roomCode: string; status: 'briefing' }
}

{
  type: 'error',
  data: { code: string; message: string }
}
```

### API Service Example
```typescript
// app/src/lib/axios.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication headers here if implemented
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 404) {
      // Handle not found errors
    } else if (error.response?.status === 500) {
      // Handle server errors
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Service Example
```typescript
// app/src/services/api.ts
import apiClient from '@/lib/axios';
import { IGameRoom } from '@/types';

export const roomAPI = {
  createRoom: (hostName: string) => 
    apiClient.post('/api/rooms', { hostName }),

  getRoom: (roomCode: string) => 
    apiClient.get(`/api/rooms/${roomCode}`),

  joinRoom: (roomCode: string, playerName: string) => 
    apiClient.post(`/api/rooms/${roomCode}/join`, { playerName }),

  leaveRoom: (roomCode: string, playerId: string) => 
    apiClient.post(`/api/rooms/${roomCode}/leave`, { playerId }),

  generateRound: (roomCode: string, data?: GenerateRoundData) => 
    apiClient.post(`/api/rooms/${roomCode}/generate-round`, data),

  generateLie: (roomCode: string, data: GenerateLieData) => 
    apiClient.post(`/api/rooms/${roomCode}/generate-lie`, data),
};
```

### Socket Message Formats
```typescript
// Client → Server
interface JoinRoomMessage {
  roomCode: string;
  playerName: string;
}

interface EliminatePlayerMessage {
  roomCode: string;
  targetPlayerId: string;
}

interface BankPointsMessage {
  roomCode: string;
}

// Server → Client
interface StartRoundMessage {
  question: string;
  secretWord?: string;      // Big Fish only
  canGenerateLie?: boolean; // Red Herring only
}

interface RevealResultMessage {
  eliminatedPlayerId: string;
  result: 'redHerring' | 'bigFish';
  guesserPoints: number;
  roundEnded: boolean;
}
```

## ✨ Styling Conventions
*   **TailwindCSS:** Utility-first CSS framework.
*   **Design Philosophy:** Modern & Minimal but Funny 🐟
    *   Clean layouts with plenty of whitespace
    *   Simple typography with playful accent elements
    *   Subtle humor in microcopy and icons
*   **Color Palette:** Define in `tailwind.config.ts`:
    *   Primary: Ocean/Fish theme (blues, teals)
    *   Accent: Gold for Big Fish, Red for Red Herrings
    *   Success/Error states with playful tones
*   **Responsive Design:** Mobile-first approach (players use phones as controllers).
*   **Animations:** Light, playful animations throughout:
    *   Fish swimming/wiggling on role reveal
    *   Bubble pop effect on elimination
    *   Subtle bounce on button hovers
    *   Victory/failure confetti or splash effects
    *   Vibration on mobile for reveals (if supported)

## 📱 Mobile-First Design Principles
*   **Touch-Friendly:** All interactive elements should be easily tappable (min 44px touch targets).
*   **Portrait Orientation:** Design primarily for vertical phone screens.
*   **Minimal Scrolling:** Keep critical info above the fold.
*   **Haptic Feedback:** Use vibration API for elimination reveals (if supported).
*   **Offline Handling:** Gracefully handle connection drops with reconnection UI.

## 🎨 Role-Specific UI Screens

### Guesser View
*   Question display (large, readable)
*   Player elimination panel
*   Bank/Continue buttons (when applicable)
*   Score tracker

### Big Fish View
*   "Tap to Reveal" interaction
*   Secret word display
*   Question reference
*   Ready button

### Red Herring View
*   "Tap to Reveal" interaction
*   Question display
*   AI-generated bluff suggestions list
*   "Generate More Lies" button (AI-powered)
*   Ready button

### Host Settings View
*   AI Configuration section (collapsible)
  *   API Key input (password field)
  *   Model selector (OpenAI, OpenRouter, Together, etc.)
  *   Base URL input (for custom endpoints)
  *   Test Connection button
*   Category preference (optional)
*   Difficulty selector (easy/medium/hard)
*   Regenerate question button
