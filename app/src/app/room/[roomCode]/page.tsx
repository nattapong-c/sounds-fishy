'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PlayerList from '@/components/players/PlayerList';
import { useRoom } from '@/hooks/useRoom';
import { roomAPI } from '@/services/api';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;

  // Join form state
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Room state
  const [playerId, setPlayerId] = useState<string | null>(null);
  const {
    room,
    isLoading: roomLoading,
    error: roomError,
    isConnected,
    joinRoom,
    leaveRoom
  } = useRoom(roomCode, playerId || undefined);

  // Check if player already has ID
  useEffect(() => {
    const storedId = localStorage.getItem('playerId');
    if (storedId) {
      setPlayerId(storedId);
    }
  }, []);

  // Join room on mount
  useEffect(() => {
    if (playerId && room && isConnected) {
      joinRoom();
    }
  }, [playerId, room, isConnected, joinRoom]);

  // Check if game has started
  useEffect(() => {
    if (room && room.status !== 'lobby') {
      router.push(`/room/${roomCode}/${room.status}`);
    }
  }, [room, roomCode, router]);

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await roomAPI.joinRoom(roomCode.toUpperCase(), {
        playerName: playerName.trim(),
      });
      
      if (response.success) {
        localStorage.setItem('playerId', response.data.playerId);
        setPlayerId(response.data.playerId);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!playerId) return;

    try {
      await roomAPI.leaveRoom(roomCode, playerId);
      leaveRoom();
      localStorage.removeItem('playerId');
      router.push('/');
    } catch (err) {
      console.error('Failed to leave room:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleToggleReady = async () => {
    if (!playerId) return;
    try {
      await roomAPI.toggleReady(roomCode, playerId);
    } catch (err) {
      console.error('Failed to toggle ready:', err);
    }
  };

  const handleStartGame = async () => {
    try {
      await roomAPI.startGame(roomCode);
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  // Show join form if no playerId
  if (!playerId) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card space-y-4 animate-slide-in-left">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-ocean-600">🐟 Sounds Fishy</h1>
              <p className="text-gray-600">Enter your name to join</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Room Code: <span className="font-mono font-bold">{roomCode.toUpperCase()}</span>
              </p>
            </div>

            <Input
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              autoFocus
            />
            
            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => router.push('/')}
              >
                Back to Home
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

          <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
            <p>🎯 1 player guesses</p>
            <p>🐟 1 player is the Big Fish</p>
            <p>🐠 Others are Red Herrings</p>
          </div>
        </div>
      </main>
    );
  }

  // Show loading while fetching room
  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🐟</div>
          <p className="text-gray-600">Joining room...</p>
        </div>
      </div>
    );
  }

  // Show error if room not found
  if (roomError || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">❌</div>
          <p className="text-red-600">{roomError || 'Room not found'}</p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // Show room view
  const currentPlayer = room.players.find(p => p.playerId === playerId);
  const isHost = room.hostId === playerId;
  const isReady = currentPlayer?.isReady ?? false;
  const allPlayersReady = room.players.every(p => p.isReady);
  const canStartGame = isHost && allPlayersReady && room.players.length >= 3;

  return (
    <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ocean-600">Lobby</h1>
            <p className="text-sm text-gray-600">
              Room: <span className="font-mono font-bold">{roomCode}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopyCode}>
              📋 Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLeaveRoom}>
              ❌ Leave
            </Button>
          </div>
        </div>

        {/* Connection status */}
        {!isConnected && (
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 text-center">
            <span className="text-yellow-800">🔄 Reconnecting...</span>
          </div>
        )}

        {/* Player list */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">
            Players ({room.players.length}/8)
          </h2>
          <PlayerList
            players={room.players}
            hostId={room.hostId}
            currentUserId={playerId}
          />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {!isHost ? (
            <Button
              variant={isReady ? 'secondary' : 'primary'}
              className="w-full"
              onClick={handleToggleReady}
            >
              {isReady ? '✓ Ready' : "I'm Ready"}
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full"
              onClick={handleStartGame}
              disabled={!canStartGame}
            >
              {canStartGame ? '🎮 Start Game' : `Waiting for players... (${room.players.length}/3 min)`}
            </Button>
          )}

          {!isHost && (
            <p className="text-center text-sm text-gray-500">
              Waiting for host to start the game...
            </p>
          )}
        </div>

        {/* Game instructions */}
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
