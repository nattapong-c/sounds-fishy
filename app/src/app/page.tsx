'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { roomAPI } from '@/services/api';
import { useDeviceId } from '@/hooks/useDeviceId';

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

      if (response.success) {
        router.push(`/room/${response.data.roomCode}`);
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
      console.log('[JoinRoom] Calling API with:', { roomCode: roomCode.toUpperCase(), deviceId });
      const response = await roomAPI.joinRoom(roomCode.toUpperCase(), {
        playerName: playerName.trim(),
        deviceId: deviceId,
      });

      console.log('[JoinRoom] API Response:', response);

      if (response.success) {
        router.push(`/room/${response.data.roomCode}`);
      }
    } catch (err: any) {
      console.error('[JoinRoom] Error:', err);
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
          <div className="card space-y-4 animate-slide-in-left">
            <h2 className="text-2xl font-semibold text-ocean-600">Create Room</h2>
            <p className="text-gray-600">Start a new game session</p>
            
            <Input
              placeholder="Your name"
              value={hostName}
              onChange={setHostName}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
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
          <div className="card space-y-4 animate-slide-in-right">
            <h2 className="text-2xl font-semibold text-ocean-600">Join Room</h2>
            <p className="text-gray-600">Enter an existing game</p>

            <Input
              placeholder="Room Code"
              value={roomCode}
              onChange={(value) => setRoomCode(value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              autoFocus
            />

            <Input
              placeholder="Your name"
              value={playerName}
              onChange={setPlayerName}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
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
        <div className="card text-center space-y-4">
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
