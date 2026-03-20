'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDeviceId } from '@/hooks/useDeviceId';
import axios from 'axios';

interface IPlayer {
  deviceId: string;
  name: string;
  isHost: boolean;
  inGameRole: 'guesser' | 'bigFish' | 'redHerring' | null;
  isOnline: boolean;
  lastSeen: string;
  score: number;
  generatedLie?: string | null;
}

interface IGameRoom {
  _id: string;
  roomCode: string;
  hostId: string;
  players: IPlayer[];
  status: 'lobby' | 'briefing' | 'playing' | 'roundEnd';
  question?: string;
  secretWord?: string;
  aiConfig?: {
    question: string;
    correctAnswer: string;
    bluffSuggestions: string[];
    generatedAt: string;
    model?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// API Client with axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const roomAPI = {
  getRoom: (roomCode: string) => apiClient.get(`/api/rooms/${roomCode}`),
  joinRoom: (roomCode: string, data: { playerName: string; deviceId: string }) => apiClient.post(`/api/rooms/${roomCode}/join`, data),
  leaveRoom: (roomCode: string, deviceId: string) => apiClient.post(`/api/rooms/${roomCode}/leave`, { deviceId }),
  startGame: (roomCode: string) => apiClient.post(`/api/rooms/${roomCode}/start`),
};

// Briefing Hook
function useBriefing(roomCode: string, deviceId?: string, room: IGameRoom | null = null) {
  const [role, setRole] = useState<'guesser' | 'bigFish' | 'redHerring' | null>(null);
  const [question, setQuestion] = useState('');
  const [secretWord, setSecretWord] = useState<string | undefined>();
  const [canGenerateLie, setCanGenerateLie] = useState(false);
  const [bluffSuggestions, setBluffSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!room || room.status !== 'briefing' || !room.aiConfig) return;

    setQuestion(room.aiConfig.question || room.question || '');
    setSecretWord(room.aiConfig.correctAnswer || room.secretWord);

    const player = room.players.find(p => p.deviceId === deviceId);
    if (player) {
      setRole(player.inGameRole);
      setCanGenerateLie(player.inGameRole === 'redHerring');
      setBluffSuggestions(room.aiConfig.bluffSuggestions || []);
    }
  }, [room, deviceId]);

  return { role, question, secretWord, canGenerateLie, bluffSuggestions };
}

// WebSocket Hook
function useWebSocket(roomCode?: string, deviceId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useState<WebSocket | null>(null)[0];
  const setWsRef = useState<WebSocket | null>(null)[1];

  useEffect(() => {
    if (!roomCode || !deviceId) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/ws?roomCode=${roomCode}&deviceId=${deviceId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => console.error('WebSocket error');

    setWsRef(ws);

    return () => {
      ws.close();
    };
  }, [roomCode, deviceId]);

  const sendMessage = useCallback((type: string, data: any) => {
    const ws = wsRef;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data }));
    }
  }, [wsRef]);

  return { isConnected, sendMessage };
}

// Room Hook
function useRoom(roomCode: string, deviceId?: string) {
  const [room, setRoom] = useState<IGameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, sendMessage } = useWebSocket(roomCode, deviceId);

  // Fetch initial room data
  useEffect(() => {
    if (!roomCode) return;
    roomAPI.getRoom(roomCode).then((response) => {
      if (response.data.success) setRoom(response.data.data);
      setIsLoading(false);
    });
  }, [roomCode]);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!isConnected) return;

    sendMessage('join_room', { roomCode, deviceId });

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      if (message.type === 'room_updated') {
        setRoom({ ...message.data, players: [...message.data.players] });
      } else if (message.type === 'start_round') {
        // Handle start round if needed
      }
    };

    // Get WebSocket instance (simplified)
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/ws?roomCode=${roomCode}&deviceId=${deviceId}`);
    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
      ws.close();
    };
  }, [isConnected, roomCode, deviceId, sendMessage]);

  const joinRoom = useCallback(() => {
    sendMessage('join_room', { roomCode, deviceId });
  }, [deviceId, roomCode, sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage('leave_room', { roomCode, deviceId });
  }, [deviceId, roomCode, sendMessage]);

  const startGame = useCallback(() => {
    sendMessage('start_game', { roomCode });
  }, [roomCode, sendMessage]);

  const refreshRoom = useCallback(() => {
    roomAPI.getRoom(roomCode).then((response) => {
      if (response.data.success) setRoom(response.data.data);
    });
  }, [roomCode]);

  return { room, isLoading, isConnected, joinRoom, leaveRoom, startGame, refreshRoom };
}

// UI Components
function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: any) {
  const variants: any = {
    primary: 'bg-ocean-600 text-white hover:bg-ocean-700',
    secondary: 'bg-ocean-100 text-ocean-700 hover:bg-ocean-200',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  };
  const sizes: any = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${variants[variant]} ${sizes[size]} ${className} rounded-lg font-semibold transition-colors`}
      {...props}
    >
      {children}
    </button>
  );
}

function Input({ className = '', ...props }: any) {
  return (
    <input
      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 ${className}`}
      {...props}
    />
  );
}

function PlayerCard({ player, isCurrentPlayer }: { player: IPlayer; isCurrentPlayer?: boolean }) {
  const roleEmojis: any = { guesser: '🎯', bigFish: '🐟', redHerring: '🐠', null: '❓' };

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg ${isCurrentPlayer ? 'bg-ocean-50 border-2 border-ocean-500' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-ocean-200 flex items-center justify-center text-ocean-700 font-bold">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{player.name}</span>
            {player.isHost && <span className="text-xs bg-ocean-100 text-ocean-700 px-2 py-0.5 rounded-full">👑 Host</span>}
            {isCurrentPlayer && <span className="text-xs bg-ocean-500 text-white px-2 py-0.5 rounded-full">You</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>
    </div>
  );
}

function PlayerList({ players, hostId, currentUserId }: { players: IPlayer[]; hostId: string; currentUserId?: string }) {
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.deviceId === hostId) return -1;
    if (b.deviceId === hostId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-3">
      {sortedPlayers.map((player) => (
        <PlayerCard key={player.deviceId} player={player} isCurrentPlayer={player.deviceId === currentUserId} />
      ))}
    </div>
  );
}

function GuesserView({ question }: { question: string }) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl mb-2">🎯</div>
        <h2 className="text-2xl font-bold text-ocean-600">You are the Guesser</h2>
        <p className="text-gray-600">Read the question and find the Big Fish!</p>
      </div>
      <div className="bg-gradient-to-br from-ocean-50 to-blue-50 border-2 border-ocean-200 rounded-xl p-8">
        <p className="text-sm font-medium text-ocean-600 mb-3 uppercase">Question</p>
        <p className="text-2xl font-bold text-gray-800">{question}</p>
      </div>
    </div>
  );
}

function BigFishView({ question, secretWord }: { question: string; secretWord: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl mb-2">🐟</div>
        <h2 className="text-2xl font-bold text-ocean-600">You are the Big Fish</h2>
        <p className="text-gray-600">Know the real answer, don't get caught!</p>
      </div>
      <div className="bg-gradient-to-br from-ocean-50 to-blue-50 border-2 border-ocean-200 rounded-xl p-8">
        <p className="text-sm font-medium text-ocean-600 mb-3 uppercase">Question</p>
        <p className="text-2xl font-bold text-gray-800">{question}</p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Tap to reveal your secret word</p>
        <button
          onClick={() => setRevealed(true)}
          className={`w-full max-w-md mx-auto py-6 px-8 rounded-xl transition-all ${revealed ? 'bg-ocean-600' : 'bg-gray-300 hover:bg-gray-400'}`}
          style={{ filter: revealed ? 'none' : 'blur(8px)' }}
        >
          <p className={`text-2xl font-bold text-white ${!revealed && 'blur-md'}`}>{secretWord}</p>
          {!revealed && <p className="text-lg font-semibold text-gray-700 mt-2 blur-md">Tap to Reveal</p>}
        </button>
      </div>
    </div>
  );
}

function RedHerringView({ question, bluffSuggestions }: { question: string; bluffSuggestions: string[] }) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl mb-2">🐠</div>
        <h2 className="text-2xl font-bold text-ocean-600">You are a Red Herring</h2>
        <p className="text-gray-600">Bluff with fake answers!</p>
      </div>
      <div className="bg-gradient-to-br from-ocean-50 to-blue-50 border-2 border-ocean-200 rounded-xl p-8">
        <p className="text-sm font-medium text-ocean-600 mb-3 uppercase">Question</p>
        <p className="text-2xl font-bold text-gray-800">{question}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">Bluff Suggestions:</h3>
        {bluffSuggestions.map((bluff, i) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-gray-700">{bluff}</p>
          </div>
        ))}
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h3 className="font-semibold text-purple-800 mb-2">💡 Tip</h3>
        <p className="text-purple-700">Use one of the bluff suggestions above, or create your own believable lie!</p>
      </div>
    </div>
  );
}

// Main Page Component
export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const deviceId = useDeviceId();

  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [hasJoinedWebSocket, setHasJoinedWebSocket] = useState(false);

  const { room, isLoading, isConnected, joinRoom, leaveRoom, startGame, refreshRoom } = useRoom(roomCode, deviceId || undefined);

  // Use briefing hook
  const { role, question, secretWord, canGenerateLie, bluffSuggestions } = useBriefing(roomCode, deviceId || undefined, room);

  // Validate player is in room
  useEffect(() => {
    if (!deviceId || !room) return;
    const playerInRoom = room.players.find(p => p.deviceId === deviceId);
    if (!playerInRoom) return;
    setIsJoining(false);
    if (!hasJoinedWebSocket && isConnected) {
      joinRoom();
      setHasJoinedWebSocket(true);
    }
  }, [deviceId, room, isConnected, hasJoinedWebSocket, joinRoom]);

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setIsJoining(true);
    setError('');
    try {
      const response = await roomAPI.joinRoom(roomCode.toUpperCase(), { playerName: playerName.trim(), deviceId: deviceId! });
      if (response.data.success) refreshRoom();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join room');
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!deviceId) return;
    try {
      await roomAPI.leaveRoom(roomCode, deviceId);
      leaveRoom();
      router.push('/');
    } catch (err) {
      // Silently handle error
    }
  };

  const handleCopyCode = async () => {
    try {
      const fullUrl = window.location.href;
      await navigator.clipboard.writeText(fullUrl);
      alert('Room URL copied!');
    } catch (err) {
      // Silently handle error
    }
  };

  const handleStartGame = async () => {
    try {
      startGame();
    } catch (err) {
      // Silently handle error
    }
  };

  // Show loading
  if (isLoading || (deviceId && isJoining)) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🐟</div>
          <p className="text-gray-600">{isJoining ? 'Joining room...' : 'Loading...'}</p>
        </div>
      </main>
    );
  }

  // Show error
  if (error || !room) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">❌</div>
          <p className="text-red-600">{error || 'Room not found'}</p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </main>
    );
  }

  // Show join form
  const playerInRoom = room.players.find(p => p.deviceId === deviceId);
  if (!playerInRoom) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card space-y-4">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-ocean-600">🐟 Sounds Fishy</h1>
              <p className="text-gray-600">Enter your name to join</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Room Code: <span className="font-mono font-bold">{roomCode.toUpperCase()}</span></p>
            </div>
            <Input placeholder="Your name" value={playerName} onChange={(e: any) => setPlayerName(e.target.value)} onKeyPress={(e: any) => e.key === 'Enter' && handleJoinRoom()} autoFocus />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => router.push('/')}>Back to Home</Button>
              <Button variant="primary" className="flex-1" onClick={handleJoinRoom} disabled={isJoining}>Join Room</Button>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
            <p>🎯 1 player guesses</p>
            <p>🐟 1 player is the Big Fish</p>
            <p>🐠 Others are Red Herrings</p>
          </div>
        </div>
      </main>
    );
  }

  // Briefing Phase
  if (room.status === 'briefing') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-ocean-600 mb-2">🎮 Game Briefing</h1>
            <p className="text-gray-600">Room: <span className="font-mono font-bold">{roomCode}</span></p>
          </div>
          {role === 'guesser' && <GuesserView question={question} />}
          {role === 'bigFish' && secretWord && <BigFishView question={question} secretWord={secretWord} />}
          {role === 'redHerring' && <RedHerringView question={question} bluffSuggestions={bluffSuggestions} />}
          {!role && room.hostId === deviceId && (
            <div className="card text-center space-y-4">
              <div className="text-6xl">⏳</div>
              <h2 className="text-2xl font-bold text-ocean-600">Waiting for Roles...</h2>
              <p className="text-gray-600">The game is starting. You will receive your role shortly.</p>
            </div>
          )}
          <div className="text-center p-4 bg-ocean-50 rounded-lg mt-6">
            <p className="text-ocean-800 font-medium">Review your information above</p>
            <p className="text-sm text-ocean-600 mt-1">The game will begin shortly...</p>
          </div>
        </div>
      </main>
    );
  }

  // Lobby Phase
  const isHost = room.hostId === deviceId;

  return (
    <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ocean-600">Lobby</h1>
            <p className="text-sm text-gray-600">Room: <span className="font-mono font-bold">{roomCode}</span></p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopyCode}>📋 Copy URL</Button>
            <Button variant="ghost" size="sm" onClick={handleLeaveRoom}>❌ Leave</Button>
          </div>
        </div>
        {!isConnected && (
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 text-center">
            <span className="text-yellow-800">🔄 Reconnecting...</span>
          </div>
        )}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Players ({room.players.length}/8)</h2>
          <PlayerList players={room.players} hostId={room.hostId} currentUserId={deviceId || undefined} />
        </div>
        <div className="space-y-4">
          {isHost && (
            <Button variant="primary" className="w-full" onClick={handleStartGame} disabled={room.players.length < 3}>
              {room.players.length >= 3 ? '🎮 Start Game' : `Waiting for players... (${room.players.length}/3)`}
            </Button>
          )}
          {!isHost && (
            <div className="text-center p-4 bg-ocean-50 rounded-lg">
              <p className="text-ocean-800 font-medium">Waiting for host to start the game...</p>
              <p className="text-sm text-ocean-600 mt-1">The host will start when enough players have joined</p>
            </div>
          )}
        </div>
        <div className="card text-sm text-gray-600 space-y-2">
          <h3 className="font-semibold">How to Play:</h3>
          <p>🎯 <strong>Guesser:</strong> Read the question and find the Big Fish</p>
          <p>🐟 <strong>Big Fish:</strong> Know the real answer, don't get caught</p>
          <p>🐠 <strong>Red Herrings:</strong> Bluff with fake answers</p>
        </div>
      </div>
    </main>
  );
}
