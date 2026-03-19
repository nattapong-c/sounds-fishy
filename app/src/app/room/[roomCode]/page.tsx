'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PlayerList from '@/components/players/PlayerList';
import { useRoom } from '@/hooks/useRoom';
import { useDeviceId } from '@/hooks/useDeviceId';
import { roomAPI } from '@/services/api';

/**
 * Lobby Page
 * Room lobby where players wait for game to start
 */
export default function LobbyPage() {
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const deviceId = useDeviceId();

  // State
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasValidated, setHasValidated] = useState(false);
  const [isValidPlayer, setIsValidPlayer] = useState(false);

  // Room hook
  const {
    room,
    isLoading: roomLoading,
    error: roomError,
    isConnected,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
  } = useRoom(roomCode, deviceId || undefined);

  // Validate player is in room
  useEffect(() => {
    if (!deviceId || !room) return;

    const playerInRoom = room.players.find(p => p.deviceId === deviceId);
    
    if (!playerInRoom) {
      setIsValidPlayer(false);
      setHasValidated(true);
      return;
    }

    setIsValidPlayer(true);
    setHasValidated(true);

    // Join room via WebSocket
    joinRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, room, isConnected]);

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
        deviceId: deviceId!,
      });

      if (response.success) {
        // Reset validation to allow re-check
        setHasValidated(false);
        setIsValidPlayer(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!deviceId) return;

    try {
      await roomAPI.leaveRoom(roomCode, deviceId);
      leaveRoom();
      router.push('/');
    } catch (err) {
      console.error('Failed to leave room:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      const fullUrl = typeof window !== 'undefined'
        ? window.location.href
        : `${window.location.origin}/room/${roomCode}`;
      await navigator.clipboard.writeText(fullUrl);
      alert('Room URL copied!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleToggleReady = async () => {
    if (!deviceId) return;
    try {
      toggleReady();
    } catch (err) {
      console.error('Failed to toggle ready:', err);
    }
  };

  const handleStartGame = async () => {
    try {
      startGame();
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  // Show loading while waiting for validation
  if (deviceId && !hasValidated && !roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🐟</div>
          <p className="text-gray-600">Joining room...</p>
        </div>
      </div>
    );
  }

  // Show join form if not valid player
  if (!deviceId || !isValidPlayer) {
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
              onChange={setPlayerName}
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
  const currentPlayer = room.players.find(p => p.deviceId === deviceId);
  const isHost = room.hostId === deviceId;
  const isReady = currentPlayer?.isReady ?? false;
  const nonHostPlayers = room.players.filter(p => p.deviceId !== room.hostId);
  const allPlayersReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady);
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
            <Button variant="ghost" size="sm" onClick={handleCopyCode} title="Copy room URL">
              📋 Copy URL
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
            currentUserId={deviceId}
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
              {canStartGame ? '🎮 Start Game' : `Waiting for players... (${room.players.length}/3)`}
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
