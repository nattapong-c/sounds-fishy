'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import PlayerList from '@/components/players/PlayerList';
import { useRoom } from '@/hooks/useRoom';
import { useSocket } from '@/hooks/useSocket';
import { roomAPI } from '@/services/api';

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const roomCode = params.roomCode as string;

  const { room, isLoading, error, isConnected } = useRoom(roomCode);
  const { socket, joinRoom, leaveRoom, toggleReady, startGame } = useSocket(roomCode);

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Store playerId in localStorage for persistence
  useEffect(() => {
    const storedId = localStorage.getItem('playerId');
    if (storedId) {
      setPlayerId(storedId);
    }
  }, []);

  // Join room on mount
  useEffect(() => {
    if (socket && playerId && room) {
      joinRoom(playerId);
    }
  }, [socket, playerId, room, joinRoom]);

  // Check if game has started
  useEffect(() => {
    if (room && room.status !== 'lobby') {
      router.push(`/room/${roomCode}/${room.status}`);
    }
  }, [room, roomCode, router]);

  const handleToggleReady = async () => {
    if (!playerId) return;

    try {
      await roomAPI.toggleReady(roomCode, playerId);
      setIsReady(!isReady);
    } catch (err) {
      console.error('Failed to toggle ready:', err);
    }
  };

  const handleStartGame = async () => {
    try {
      await roomAPI.startGame(roomCode);
      // Game state will update via socket
    } catch (err) {
      console.error('Failed to start game:', err);
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
      alert('Room code copied!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🐟</div>
          <p className="text-gray-600">Joining room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">❌</div>
          <p className="text-red-600">{error || 'Room not found'}</p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const isHost = room.hostId === playerId;
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
            currentUserId={playerId || ''}
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
