'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PlayerList from '@/components/players/PlayerList';
import { useRoom } from '@/hooks/useRoom';
import { useDeviceId } from '@/hooks/useDeviceId';
import { roomAPI } from '@/services/api';
import GuesserView from '@/components/game/GuesserView';
import BigFishView from '@/components/game/BigFishView';
import RedHerringView from '@/components/game/RedHerringView';
import WaitingForPlayers from '@/components/game/WaitingForPlayers';

/**
 * Room Page - Single Page for All Game Phases
 * Handles: lobby, briefing, playing, roundEnd
 */
export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const deviceId = useDeviceId();

  // State
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

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
    refreshRoom,
  } = useRoom(roomCode, deviceId || undefined);

  // Briefing state (managed locally)
  const [role, setRole] = useState<'guesser' | 'bigFish' | 'redHerring' | null>(null);
  const [question, setQuestion] = useState('');
  const [secretWord, setSecretWord] = useState<string | undefined>();
  const [canGenerateLie, setCanGenerateLie] = useState(false);
  const [bluffSuggestions, setBluffSuggestions] = useState<string[]>([]);
  const [allPlayersReady, setAllPlayersReady] = useState(false);

  // Validate player is in room
  useEffect(() => {
    if (!deviceId || !room) return;

    const playerInRoom = room.players.find(p => p.deviceId === deviceId);

    if (!playerInRoom) {
      // Player not in room - this is normal for first-time visitors
      return;
    }

    console.log('[Validate] Player found in room:', playerInRoom.name);
    setIsJoining(false);

    // Join room via WebSocket
    joinRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, room, isConnected]);

  // Handle room status changes and phase transitions
  useEffect(() => {
    if (!room) return;

    console.log('[RoomPage] Room status changed:', room.status);

    // Handle briefing phase
    if (room.status === 'briefing' && room.aiConfig) {
      // Set briefing data from room
      setQuestion(room.aiConfig.question || room.question || '');
      setSecretWord(room.aiConfig.correctAnswer || room.secretWord);

      // Determine player role
      const player = room.players.find(p => p.deviceId === deviceId);
      if (player) {
        setRole(player.inGameRole);
        setCanGenerateLie(player.inGameRole === 'redHerring');
        setBluffSuggestions(room.aiConfig.bluffSuggestions || []);
      }
    }

    // Handle all players ready
    const nonHostPlayers = room.players.filter(p => !p.isHost);
    const allReady = nonHostPlayers.length > 0 && nonHostPlayers.every(p => p.isReady);
    setAllPlayersReady(allReady);
  }, [room, deviceId]);

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const response = await roomAPI.joinRoom(roomCode.toUpperCase(), {
        playerName: playerName.trim(),
        deviceId: deviceId!,
      });

      if (response.success) {
        console.log('[JoinRoom] Successfully joined, refreshing room data...');
        refreshRoom();
      }
    } catch (err: any) {
      console.error('[JoinRoom] Error:', err);
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

  const handleToggleReady = () => {
    toggleReady();
  };

  const handleStartGame = async () => {
    try {
      startGame();
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handleGenerateLie = async (): Promise<string> => {
    try {
      const response = await roomAPI.generateLie({ roomCode, deviceId: deviceId! });
      if (response.success) {
        return response.data.lieSuggestion;
      }
      throw new Error(response.error || 'Failed to generate lie');
    } catch (err) {
      console.error('Failed to generate lie:', err);
      throw err;
    }
  };

  // Show loading state
  if (roomLoading || isJoining) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🐟</div>
          <p className="text-gray-600">{isJoining ? 'Joining room...' : 'Loading...'}</p>
          {isJoining && <p className="text-sm text-gray-500">Please wait...</p>}
        </div>
      </main>
    );
  }

  // Show error state
  if (roomError || !room) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">❌</div>
          <p className="text-red-600">{roomError || 'Room not found'}</p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </main>
    );
  }

  // Show join form if player not in room
  const playerInRoom = room.players.find(p => p.deviceId === deviceId);
  if (!playerInRoom) {
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
                isLoading={isJoining}
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

  // Get current player info
  const currentPlayer = room.players.find(p => p.deviceId === deviceId);
  const isHost = room.hostId === deviceId;
  const isReady = currentPlayer?.isReady ?? false;
  const nonHostPlayers = room.players.filter(p => !p.isHost);
  const canStartGame = isHost && allPlayersReady && room.players.length >= 3;

  // Render based on room status
  if (room.status === 'briefing') {
    // Briefing Phase
    return (
      <main className="min-h-screen bg-gradient-to-br from-ocean-50 to-ocean-100 p-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-ocean-600 mb-2">🎮 Game Briefing</h1>
            <p className="text-gray-600">
              Room: <span className="font-mono font-bold">{roomCode}</span>
            </p>
          </div>

          {/* Role-Specific Content */}
          <div className="mb-8">
            {role === 'guesser' && (
              <GuesserView question={question} />
            )}

            {role === 'bigFish' && secretWord && (
              <BigFishView question={question} secretWord={secretWord} />
            )}

            {role === 'redHerring' && (
              <RedHerringView
                question={question}
                bluffSuggestions={bluffSuggestions}
                onGenerateLie={handleGenerateLie}
              />
            )}
          </div>

          {/* Ready Button (not for Guesser) */}
          {role && role !== 'guesser' && (
            <div className="text-center">
              <Button
                variant={isReady ? 'secondary' : 'primary'}
                size="lg"
                onClick={handleToggleReady}
                className="min-w-[200px]"
              >
                {isReady ? '✓ Ready' : "I'm Ready"}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Click when you&apos;ve reviewed your information
              </p>
            </div>
          )}

          {/* Waiting for all players */}
          {allPlayersReady && (
            <div className="mt-8 text-center">
              <WaitingForPlayers
                players={room.players}
                currentDeviceId={deviceId || undefined}
              />
              {isHost && (
                <div className="mt-4">
                  <p className="text-gray-600 mb-2">All players ready! Starting game...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Lobby Phase (default)
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
          <p>🐟 <strong>Big Fish:</strong> Know the real answer, don&apos;t get caught</p>
          <p>🐠 <strong>Red Herrings:</strong> Bluff with fake answers</p>
        </div>
      </div>
    </main>
  );
}
