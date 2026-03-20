'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeviceId } from '@/hooks/useDeviceId';
import axios from 'axios';

// API Client with axios
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const roomAPI = {
  createRoom: (data: { hostName: string; deviceId: string }) => apiClient.post('/api/rooms', data),
  joinRoom: (roomCode: string, data: { playerName: string; deviceId: string }) => apiClient.post(`/api/rooms/${roomCode}/join`, data),
};

// UI Components
function Button({ children, variant = 'primary', size = 'md', className = '', isLoading = false, disabled = false, ...props }: any) {
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
      className={`${variants[variant]} ${sizes[size]} ${className} rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

function Input({ className = '', ...props }: any) {
  return (
    <input
      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all ${className}`}
      {...props}
    />
  );
}

/**
 * Home Page
 * Create or join a room
 */
export default function HomePage() {
  const router = useRouter();
  const deviceId = useDeviceId();

  // Create room state
  const [hostName, setHostName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join room state
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Wait for deviceId to be ready
  const [isDeviceIdReady, setIsDeviceIdReady] = useState(false);

  useEffect(() => {
    if (deviceId) {
      setIsDeviceIdReady(true);
    }
  }, [deviceId]);

  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      setCreateError('Please enter your name');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const response = await roomAPI.createRoom({
        hostName: hostName.trim(),
        deviceId: deviceId!,
      });

      if (response.data.success) {
        router.push(`/room/${response.data.data.roomCode}`);
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }

    if (!playerName.trim()) {
      setJoinError('Please enter your name');
      return;
    }

    if (!deviceId) {
      setJoinError('Initializing... please wait a moment');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    try {
      const response = await roomAPI.joinRoom(roomCode.toUpperCase(), {
        playerName: playerName.trim(),
        deviceId: deviceId,
      });

      if (response.data.success) {
        router.push(`/room/${response.data.data.roomCode}`);
      }
    } catch (err: any) {
      setJoinError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  // Show loading while deviceId is being initialized
  if (!isDeviceIdReady) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🐟</div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-ocean-600">🐟 Sounds Fishy</h1>
          <p className="text-xl text-gray-600">The Secret Screen Companion App</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 animate-slide-in-left">
            <h2 className="text-2xl font-semibold text-ocean-600">Create Room</h2>
            <p className="text-gray-600">Start a new game session</p>

            <Input
              placeholder="Your name"
              value={hostName}
              onChange={(e: any) => setHostName(e.target.value)}
              onKeyPress={(e: any) => e.key === 'Enter' && handleCreateRoom()}
              autoFocus
            />

            {createError && (
              <p className="text-red-600 text-sm">{createError}</p>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={handleCreateRoom}
              isLoading={isCreating}
            >
              Create Room
            </Button>
          </div>

          {/* Join Room Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 animate-slide-in-right">
            <h2 className="text-2xl font-semibold text-ocean-600">Join Room</h2>
            <p className="text-gray-600">Enter an existing game</p>

            <Input
              placeholder="Room Code"
              value={roomCode}
              onChange={(e: any) => setRoomCode(e.target.value.toUpperCase())}
              onKeyPress={(e: any) => e.key === 'Enter' && handleJoinRoom()}
            />

            <Input
              placeholder="Your name"
              value={playerName}
              onChange={(e: any) => setPlayerName(e.target.value)}
              onKeyPress={(e: any) => e.key === 'Enter' && handleJoinRoom()}
            />

            {joinError && (
              <p className="text-red-600 text-sm">{joinError}</p>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleJoinRoom}
              isLoading={isJoining}
              disabled={!playerName.trim() || !roomCode.trim()}
            >
              Join Room
            </Button>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">How to Play:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <div className="text-3xl mb-2">🎯</div>
              <p><strong>1 Guesser</strong> reads the question and finds the Big Fish</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🐟</div>
              <p><strong>1 Big Fish</strong> knows the real answer</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🐠</div>
              <p><strong>Red Herrings</strong> bluff with fake answers</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
