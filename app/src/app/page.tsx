'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { roomAPI } from '@/services/api';

type FormMode = 'none' | 'create' | 'join';

export default function Home() {
  const router = useRouter();
  const [formMode, setFormMode] = useState<FormMode>('none');
  
  // Create form state
  const [hostName, setHostName] = useState('');
  
  // Join form state
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  
  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await roomAPI.createRoom({ hostName: hostName.trim() });
      if (response.success) {
        // Store playerId (hostId) for WebSocket authentication
        localStorage.setItem('playerId', response.data.hostId);
        // Redirect directly to room (no suffix)
        router.push(`/room/${response.data.roomCode}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !playerName.trim()) {
      setError('Please enter room code and your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await roomAPI.joinRoom(roomCode.trim().toUpperCase(), {
        playerName: playerName.trim(),
      });
      if (response.success) {
        // Store playerId for WebSocket
        localStorage.setItem('playerId', response.data.playerId);
        router.push(`/room/${response.data.roomCode}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormMode('none');
    setHostName('');
    setRoomCode('');
    setPlayerName('');
    setError('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 flex flex-col items-center justify-center p-4">
      {/* Animated fish decoration */}
      <div className="absolute top-20 left-10 text-6xl fish-swim">🐟</div>
      <div className="absolute bottom-20 right-10 text-6xl fish-swim" style={{ animationDelay: '1.5s' }}>🐠</div>

      {/* Main content */}
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-ocean-600">🐟 Sounds Fishy</h1>
          <p className="text-gray-600">Digital Companion App</p>
        </div>

        {/* Show buttons when no form is active */}
        {formMode === 'none' && (
          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => setFormMode('create')}
            >
              Create Room
            </Button>

            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => setFormMode('join')}
            >
              Join Room
            </Button>
          </div>
        )}

        {/* Create room form */}
        {formMode === 'create' && (
          <div className="card space-y-4 animate-slide-in-left">
            <h2 className="text-xl font-semibold text-center">Create New Room</h2>
            <Input
              placeholder="Your name (as host)"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={resetForm}
              >
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleCreateRoom}
                isLoading={isLoading}
              >
                Create & Host
              </Button>
            </div>
          </div>
        )}

        {/* Join room form */}
        {formMode === 'join' && (
          <div className="card space-y-4 animate-slide-in-right">
            <h2 className="text-xl font-semibold text-center">Join Existing Room</h2>
            <Input
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <Input
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={resetForm}
              >
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleJoinRoom}
                isLoading={isLoading}
              >
                Join Room
              </Button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>🎯 1 player guesses</p>
          <p>🐟 1 player is the Big Fish</p>
          <p>🐠 Others are Red Herrings</p>
        </div>
      </div>
    </main>
  );
}
