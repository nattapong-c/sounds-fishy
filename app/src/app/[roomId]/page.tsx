'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useDeviceId } from '@/hooks/useDeviceId';
import { api } from '@/lib/api';
import { GameRole, GameRoomState } from '@/types/game';

export default function RoomPage() {
    const { roomId } = useParams() as { roomId: string };
    const deviceId = useDeviceId();
    const router = useRouter();

    const [nickname, setNickname] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [roomState, setRoomState] = useState<GameRoomState | null>(null);
    const [myRole, setMyRole] = useState<GameRole | null>(null);
    const [myQuestion, setMyQuestion] = useState<string>('');
    const [myAnswer, setMyAnswer] = useState<string>('');
    const [myLieSuggestion, setMyLieSuggestion] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showEliminationView, setShowEliminationView] = useState(false);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [rankings, setRankings] = useState<Array<{ position: number; playerId: string; playerName: string; totalPoints: number; isTied: boolean }>>([]);
    const [showEliminationModal, setShowEliminationModal] = useState(false);
    const [eliminationResult, setEliminationResult] = useState<{
        eliminatedPlayerName: string;
        eliminatedPlayerRole: GameRole | null;
        isCorrect: boolean;
        tempPoints: number;
        isRoundOver: boolean;
        pointsAwarded: number;
    } | null>(null);
    const [pointsBreakdown, setPointsBreakdown] = useState<Array<{
        playerId: string;
        playerName: string;
        pointsEarned: number;
        reason: string;
        totalPoints: number;
    }>>([]);
    const wsRef = useRef<WebSocket | null>(null);

    // Connect to WebSocket
    const connectWebSocket = () => {
        if (!deviceId) return;
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:3001';
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${host}`;
        
        const ws = new WebSocket(`${wsUrl}/ws/rooms/${roomId}?deviceId=${deviceId}`);

        ws.onopen = () => {
            console.log('WebSocket connected');
            // After connecting, fetch latest room state
            api.rooms.get(roomId).then(response => {
                setRoomState(response.room);
            }).catch(err => {
                console.error('Failed to fetch room state after WS connect:', err);
            });
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('WebSocket message received:', message.type);

                // Handle different message types
                switch (message.type) {
                    case 'room_state_update':
                        setRoomState(message.room);
                        break;
                    case 'guess_submitted':
                        setRoomState(message.room);

                        // Handle elimination result
                        if (message.eliminatedPlayerName && message.eliminatedPlayerRole !== undefined) {
                            setEliminationResult({
                                eliminatedPlayerName: message.eliminatedPlayerName,
                                eliminatedPlayerRole: message.eliminatedPlayerRole,
                                isCorrect: message.isCorrect,
                                tempPoints: message.tempPoints || 0,
                                isRoundOver: message.isRoundOver,
                                pointsAwarded: message.pointsAwarded || 0
                            });
                            setShowEliminationModal(true);

                            // If round is over, show points breakdown
                            if (message.isRoundOver && message.pointsBreakdown) {
                                setPointsBreakdown(message.pointsBreakdown);
                            }
                        }

                        setShowEliminationView(false);
                        setSelectedPlayerId(null);
                        setShowConfirmModal(false);
                        break;
                    case 'game_started':
                        // Handle role-specific game start data
                        setRoomState(message.room);

                        // Check if this is a reconnection (direct properties) or new game (playerDataMap)
                        if (message.role) {
                            // Reconnection: direct properties
                            setMyRole(message.role);
                            setMyQuestion(message.question);
                            if (message.correctAnswer) {
                                setMyAnswer(message.correctAnswer);
                            }
                            if (message.fakeAnswer) {
                                setMyAnswer(message.fakeAnswer);
                            }
                            if (message.lieSuggestion) {
                                setMyLieSuggestion(message.lieSuggestion);
                            }
                            console.log('Game reconnected - My role:', message.role);
                        } else if (message.playerDataMap) {
                            // New game: playerDataMap structure
                            const currentPlayer = message.room.players?.find((p: any) => p.deviceId === deviceId);
                            if (currentPlayer && message.playerDataMap) {
                                const myData = message.playerDataMap[currentPlayer.id];
                                if (myData) {
                                    setMyRole(myData.role);
                                    setMyQuestion(myData.question);
                                    if (myData.correctAnswer) {
                                        setMyAnswer(myData.correctAnswer);
                                    }
                                    if (myData.fakeAnswer) {
                                        setMyAnswer(myData.fakeAnswer);
                                    }
                                    if (myData.lieSuggestion) {
                                        setMyLieSuggestion(myData.lieSuggestion);
                                    }
                                    console.log('Game started - My role:', myData.role);
                                }
                            }
                        }
                        break;
                    case 'round_started':
                        setRoomState(message.room);
                        // Handle role-specific data for new round
                        if (message.role) {
                            // Reconnection: direct properties
                            setMyRole(message.role);
                            setMyQuestion(message.question);
                            if (message.correctAnswer) {
                                setMyAnswer(message.correctAnswer);
                            }
                            if (message.fakeAnswer) {
                                setMyAnswer(message.fakeAnswer);
                            }
                            if (message.lieSuggestion) {
                                setMyLieSuggestion(message.lieSuggestion);
                            }
                        } else if (message.playerDataMap) {
                            // New round: playerDataMap structure
                            const roundPlayer = message.room.players?.find((p: any) => p.deviceId === deviceId);
                            if (roundPlayer && message.playerDataMap) {
                                const myData = message.playerDataMap[roundPlayer.id];
                                if (myData) {
                                    setMyRole(myData.role);
                                    setMyQuestion(myData.question);
                                    if (myData.correctAnswer) {
                                        setMyAnswer(myData.correctAnswer);
                                    }
                                    if (myData.fakeAnswer) {
                                        setMyAnswer(myData.fakeAnswer);
                                    }
                                    if (myData.lieSuggestion) {
                                        setMyLieSuggestion(myData.lieSuggestion);
                                    }
                                }
                            }
                        }
                        break;
                    case 'game_ended':
                        setRoomState(message.room);
                        if (message.rankings) {
                            setRankings(message.rankings);
                        }
                        break;
                    case 'error':
                        console.error('WebSocket error:', message.message);
                        setError(message.message);
                        break;
                    default:
                        console.log('Unknown message type:', message.type);
                }
            } catch (e) {
                console.error('Failed to parse WebSocket message', e);
            }
        };
        
        ws.onclose = () => console.log('WebSocket disconnected');
        wsRef.current = ws;
    };

    // Handle join room
    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim() || !deviceId) return;

        try {
          const response = await api.rooms.join(roomId, nickname, deviceId);
            setRoomState(response.room);
            setHasJoined(true);
            connectWebSocket();
        } catch (err: any) {
            setError(`Failed to join room: ${err.message}`);
        }
    };

    // Handle kick player (admin only)
    const handleKickPlayer = (targetPlayerId: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'kick_player',
                targetPlayerId
            }));
        }
    };

    // Handle start game (admin only)
    const handleStartGame = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'start_game'
            }));
        }
    };

    // Handle show elimination view (Guesser only)
    const handleShowElimination = () => {
        setShowEliminationView(true);
    };

    // Handle select player for elimination
    const handleSelectPlayer = (playerId: string) => {
        setSelectedPlayerId(playerId);
        setShowConfirmModal(true);
    };

    // Handle confirm elimination
    const handleConfirmElimination = () => {
        if (selectedPlayerId && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'submit_guess',
                targetPlayerId: selectedPlayerId
            }));
        }
        setShowConfirmModal(false);
        setSelectedPlayerId(null);
    };

    // Handle next round (admin only)
    const handleNextRound = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'next_round'
            }));
        }
    };

    // Handle end game (admin only)
    const handleEndGame = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'end_game'
            }));
        }
    };

    // Handle go back to lobby (admin only, after game end)
    const handleGoToLobby = async () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'end_round'
            }));
        }
        setRankings([]);
    };
    useEffect(() => {
        if (!deviceId) return;

        const checkExistingSession = async () => {
            try {
                const response = await api.rooms.get(roomId);
                const room = response.room;
                
                if (!room) return;
                
                const isAlreadyInRoom = room.players.some((p: any) => p.deviceId === deviceId);

                if (isAlreadyInRoom) {
                    setRoomState(room);
                    setHasJoined(true);
                    connectWebSocket();
                }
            } catch (err) {
                console.error('Failed to check room session', err);
            }
        };

        checkExistingSession();
    }, [deviceId, roomId]);

    // Cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    // Detect if kicked from room
    useEffect(() => {
        if (hasJoined && roomState && deviceId) {
            const stillInRoom = roomState.players.some((p: any) => p.deviceId === deviceId);
            if (!stillInRoom) {
                router.push('/');
            }
        }
    }, [roomState, deviceId, hasJoined, router]);

    // Handle leave room
    const handleLeaveRoom = async () => {
        if (!deviceId || !roomId) return;
        try {
            await api.rooms.leave(roomId, deviceId);
            router.push('/');
        } catch (error: any) {
            alert(`Failed to leave room: ${error.message}`);
        }
    };

    // Handle copy room ID
    const handleCopyRoomId = async () => {
        try {
            const fullUrl = `${window.location.origin}/${roomId}`;
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy room ID:', err);
        }
    };

    // Show loading while deviceId is being loaded
    if (!deviceId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-500 tracking-widest uppercase">Loading...</p>
                </div>
            </div>
        );
    }

    // Show join form if not joined
    if (!hasJoined) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    <h2 className="text-2xl mb-6 text-center font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent">
                        Join Room: {roomId}
                    </h2>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-3 text-red-600">
                                <span>❌</span>
                                <span>{error}</span>
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleJoin} className="flex flex-col gap-6">
                        <div>
                            <label className="block text-gray-700 mb-2 tracking-wider uppercase text-sm font-medium">
                                Nickname
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full border-2 border-gray-300 focus:border-blue-500 rounded-xl p-4 text-center text-xl outline-none transition-colors text-gray-900 font-medium"
                                maxLength={15}
                                autoFocus
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xl font-bold tracking-wide py-4 rounded-xl transition-all"
                        >
                            <span className="flex items-center justify-center gap-3">
                                <span className="text-2xl">🚪</span>
                                Enter Lobby
                            </span>
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Get current player info
    const currentPlayer = roomState?.players?.find((p: any) => p.deviceId === deviceId);
    const isAdmin = currentPlayer?.isAdmin;

    // Elimination Modal Component
    const EliminationModal = () => {
        if (!eliminationResult) return null;

        const { eliminatedPlayerName, eliminatedPlayerRole, isCorrect, tempPoints, isRoundOver, pointsAwarded } = eliminationResult;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full transform transition-all scale-100">
                    {/* Role Icon */}
                    <div className="text-center mb-6">
                        <div className="text-7xl mb-4">
                            {eliminatedPlayerRole === 'redFish' ? '🐠' : '🐟'}
                        </div>
                        <h2 className="text-3xl font-bold mb-2">
                            {isCorrect ? '🎉 Correct!' : '❌ Wrong!'}
                        </h2>
                        <p className="text-gray-600 text-lg">
                            {eliminatedPlayerName} was{' '}
                            <span className={`font-bold ${
                                eliminatedPlayerRole === 'blueFish' ? 'text-blue-600' : 'text-red-500'
                            }`}>
                                {eliminatedPlayerRole === 'blueFish' ? 'Blue Fish' : 'Red Fish'}
                            </span>
                        </p>
                    </div>

                    {/* Points Display */}
                    <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                        {isCorrect ? (
                            <>
                                <p className="text-green-600 font-bold text-xl mb-2">
                                    +{tempPoints} Temp Point{tempPoints !== 1 ? 's' : ''}
                                </p>
                                <p className="text-gray-600">
                                    {isRoundOver 
                                        ? `Round Over! ${pointsAwarded} points awarded!` 
                                        : 'Keep eliminating Red Fish!'}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-red-600 font-bold text-xl mb-2">
                                    Points Reset to 0
                                </p>
                                <p className="text-gray-600">
                                    Blue Fish eliminated - Round Over!
                                </p>
                            </>
                        )}
                    </div>

                    {/* Continue Button */}
                    {!isRoundOver && (
                        <button
                            onClick={() => setShowEliminationModal(false)}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xl font-bold py-4 rounded-xl transition-all"
                        >
                            Continue Eliminating
                        </button>
                    )}

                    {/* Round Over Message */}
                    {isRoundOver && (
                        <p className="text-center text-gray-500">
                            Showing points breakdown...
                        </p>
                    )}
                </div>
            </div>
        );
    };

    // Points Breakdown Component (for round end)
    const PointsBreakdownView = () => {
        if (pointsBreakdown.length === 0) return null;

        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                    📊 Points Breakdown
                </h3>
                <div className="space-y-3">
                    {pointsBreakdown.map((breakdown) => (
                        <div
                            key={breakdown.playerId}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                                breakdown.pointsEarned > 0
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">{breakdown.playerName}</p>
                                <p className="text-sm text-gray-500">{breakdown.reason}</p>
                            </div>
                            <div className="text-right">
                                {breakdown.pointsEarned > 0 && (
                                    <p className="text-green-600 font-bold text-lg">
                                        +{breakdown.pointsEarned}
                                    </p>
                                )}
                                <p className="text-gray-600 font-medium">
                                    {breakdown.totalPoints} total
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Show lobby view
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
            {/* Elimination Modal */}
            {showEliminationModal && <EliminationModal />}

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 gap-4 bg-white rounded-2xl shadow-lg p-4">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 bg-clip-text text-transparent">
                    SOUNDS FISHY
                </h1>
                <div className="flex items-center gap-4 flex-wrap justify-center">
                    <button
                        onClick={handleCopyRoomId}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            copied 
                                ? 'border-green-500 bg-green-50 text-green-600' 
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <span className="text-gray-500">Room:</span>{' '}
                        <span className={`font-bold ${copied ? 'text-green-600' : 'text-blue-600'}`}>
                            {copied ? '✓ COPIED!' : roomId}
                        </span>
                    </button>
                    <button
                        onClick={handleLeaveRoom}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all"
                    >
                        Leave
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Player List Sidebar */}
                <div className="col-span-1 bg-white rounded-2xl shadow-lg p-6 h-fit">
                    <h2 className="text-lg mb-4 font-bold text-gray-700 flex items-center gap-2">
                        <span>👥</span>
                        Players ({roomState?.players?.length}/8)
                    </h2>
                    <ul className="space-y-2">
                        {roomState?.players?.map((player: any) => (
                            <li
                                key={player.id}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 ${
                                    player.deviceId === deviceId
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'bg-gray-50 border-gray-200'
                                } ${!player.isOnline ? 'opacity-50 grayscale' : ''}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {player.isAdmin && (
                                            <span title="Admin" className="text-yellow-500">👑</span>
                                        )}
                                        <span className="font-medium truncate text-gray-900">{player.name}</span>
                                        {player.deviceId === deviceId && (
                                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                                You
                                            </span>
                                        )}
                                    </div>
                                    {!player.isOnline && (
                                        <span className="text-xs text-red-500">Disconnected</span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    {isAdmin && roomState?.status === 'lobby' && (
                                        <button
                                            onClick={() => handleKickPlayer(player.id)}
                                            disabled={player.isAdmin || player.deviceId === deviceId}
                                            className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-sm px-2 py-1 rounded transition-colors"
                                            title="Kick player"
                                        >
                                            Kick
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                
                {/* Game Area */}
                <div className="col-span-1 lg:col-span-3 bg-white rounded-2xl shadow-lg p-6 min-h-[500px]">
                    {roomState?.status === 'lobby' ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="text-6xl mb-4">🎮</div>
                            <h2 className="text-2xl text-gray-700 mb-2 font-bold">
                                Waiting in Lobby
                            </h2>
                            <p className="text-gray-500 mb-8 max-w-md">
                                {isAdmin
                                    ? "When ready, start the game. Need at least 4 players."
                                    : "Waiting for admin to start the game..."}
                            </p>

                            {isAdmin ? (
                                <button
                                    onClick={handleStartGame}
                                    disabled={roomState?.players?.length < 4}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-xl font-bold tracking-wide py-4 px-12 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg"
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="text-3xl">🎯</span>
                                        Start Game
                                    </span>
                                </button>
                            ) : (
                                <div className="text-yellow-500 text-lg flex items-center gap-2">
                                    <span className="animate-pulse">⏳</span>
                                    Waiting for Admin...
                                </div>
                            )}
                        </div>
                    ) : roomState?.status === 'playing' ? (
                        // Game Started - Show Role-Specific View
                        <div className="flex-1 flex flex-col">
                            {myRole === 'guesser' && (
                                <div className="flex-1 flex flex-col gap-6">
                                    {/* Guesser Role Card */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center">
                                        <div className="text-5xl mb-4">🔍</div>
                                        <h3 className="text-2xl font-bold text-blue-800 mb-2">You are the GUESSER</h3>
                                        <p className="text-blue-600 mb-6">Listen to their stories and find the Red Fish!</p>

                                        {/* Temp Points Display */}
                                        <div className="bg-white rounded-xl p-4 mb-6 shadow-lg inline-block">
                                            <p className="text-gray-500 text-xs uppercase mb-1">Temp Points</p>
                                            <p className="text-4xl font-bold text-blue-600">
                                                {roomState?.currentTempPoints || 0}
                                            </p>
                                            {(roomState?.currentTempPoints || 0) > 0 && (
                                                <p className="text-green-600 text-sm mt-1">
                                                    +{(roomState?.currentTempPoints || 0)} points
                                                </p>
                                            )}
                                        </div>

                                        <div className="bg-white rounded-xl p-6 mb-6 shadow">
                                            <p className="text-gray-500 text-sm uppercase mb-2">Question</p>
                                            <p className="text-xl font-bold text-gray-900">{myQuestion}</p>
                                        </div>

                                        <div className="text-gray-600 text-sm">
                                            <p>🎯 All other players will tell their story</p>
                                            <p>🐟 One is telling the truth (Blue Fish)</p>
                                            <p>🐠 Rest are bluffing (Red Fish)</p>
                                            <p className="mt-2 font-semibold">Find the Red Fish!</p>
                                        </div>
                                    </div>

                                    {/* Go Eliminate Button */}
                                    <button
                                        onClick={handleShowElimination}
                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xl font-bold tracking-wide py-4 px-12 rounded-xl transition-all shadow-lg"
                                    >
                                        <span className="flex items-center justify-center gap-3">
                                            <span className="text-3xl">⚡</span>
                                            Go Eliminate!
                                        </span>
                                    </button>

                                    {/* Elimination View */}
                                    {showEliminationView && (
                                        <div className="bg-white rounded-2xl p-6 shadow-lg">
                                            <h4 className="text-xl font-bold text-gray-800 mb-4">Select a Player to Eliminate</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {roomState?.players
                                                    .filter((p: any) => p.deviceId !== deviceId)
                                                    .map((player: any) => {
                                                        const isEliminated = roomState?.eliminatedPlayers?.includes(player.id);
                                                        
                                                        return (
                                                            <button
                                                                key={player.id}
                                                                onClick={() => !isEliminated && handleSelectPlayer(player.id)}
                                                                disabled={isEliminated}
                                                                className={`p-4 border-2 rounded-xl transition-all text-left ${
                                                                    isEliminated
                                                                        ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                                                                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-2xl">
                                                                        {isEliminated ? '❌' : '🎯'}
                                                                    </span>
                                                                    <div className="flex-1">
                                                                        <p className={`font-semibold ${
                                                                            isEliminated ? 'text-gray-500' : 'text-gray-900'
                                                                        }`}>{player.name}</p>
                                                                        <p className="text-sm">
                                                                            {isEliminated ? (
                                                                                <span className="text-red-500 font-medium">Eliminated</span>
                                                                            ) : (
                                                                                <span className="text-gray-500">Click to eliminate</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                            <button
                                                onClick={() => setShowEliminationView(false)}
                                                className="mt-4 text-gray-500 hover:text-gray-700 font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {myRole === 'blueFish' && (
                                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 text-center">
                                    <div className="text-5xl mb-4">🐟</div>
                                    <h3 className="text-2xl font-bold text-yellow-800 mb-2">You are the BLUE FISH</h3>
                                    <p className="text-yellow-600 mb-6">Tell the TRUE story!</p>
                                    
                                    <div className="bg-white rounded-xl p-6 mb-6 shadow">
                                        <p className="text-gray-500 text-sm uppercase mb-2">Question</p>
                                        <p className="text-xl font-bold text-gray-900 mb-4">{myQuestion}</p>
                                        
                                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                                            <p className="text-green-600 text-sm font-bold uppercase mb-1">✓ Your Answer (TRUTH)</p>
                                            <p className="text-lg font-semibold text-gray-900">{myAnswer}</p>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm">
                                        Tell a story based on the <span className="font-semibold text-green-600">true answer</span>. 
                                        Don't let the Guesser figure out you're the Blue Fish!
                                    </p>
                                </div>
                            )}

                            {myRole === 'redFish' && (
                                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 text-center">
                                    <div className="text-5xl mb-4">🐠</div>
                                    <h3 className="text-2xl font-bold text-red-800 mb-2">You are a RED FISH</h3>
                                    <p className="text-red-600 mb-6">Tell a convincing lie!</p>
                                    
                                    <div className="bg-white rounded-xl p-6 mb-6 shadow">
                                        <p className="text-gray-500 text-sm uppercase mb-2">Question</p>
                                        <p className="text-xl font-bold text-gray-900 mb-4">{myQuestion}</p>
                                        
                                        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                                            <p className="text-red-600 text-sm font-bold uppercase mb-1">🎯 YOUR ANSWER (Must Say This!)</p>
                                            <p className="text-lg font-semibold text-gray-900">{myAnswer}</p>
                                        </div>
                                        
                                        {myLieSuggestion && (
                                            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                                                <p className="text-yellow-600 text-sm font-bold uppercase mb-1">💡 Hint (For Inspiration)</p>
                                                <p className="text-gray-700">{myLieSuggestion}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm">
                                        You <span className="font-semibold text-red-600">MUST</span> use your assigned answer.
                                        Make it convincing so the Guesser doesn't pick you!
                                    </p>
                                </div>
                            )}

                            {/* Confirmation Modal */}
                            {showConfirmModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmModal(false)}>
                                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                        <div className="text-center mb-6">
                                            <div className="text-5xl mb-4">⚠️</div>
                                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirm Elimination</h3>
                                            <p className="text-gray-600">Are you sure you want to eliminate this player?</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={handleConfirmElimination}
                                                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                                            >
                                                ✓ Confirm
                                            </button>
                                            <button
                                                onClick={() => { setShowConfirmModal(false); setSelectedPlayerId(null); }}
                                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : roomState?.status === 'round_end' ? (
                        // Round End View with Points Breakdown
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="text-6xl mb-4">🎯</div>
                            <h2 className="text-2xl text-gray-700 mb-2 font-bold">Round Complete!</h2>
                            <p className="text-gray-500 mb-6">Points have been awarded</p>

                            {/* Points Breakdown */}
                            <PointsBreakdownView />

                            {isAdmin ? (
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleNextRound}
                                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xl font-bold tracking-wide py-4 px-12 rounded-xl transition-all shadow-lg"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="text-3xl">🔄</span>
                                            Next Round
                                        </span>
                                    </button>
                                    <button
                                        onClick={handleEndGame}
                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xl font-bold tracking-wide py-4 px-12 rounded-xl transition-all shadow-lg"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="text-3xl">🏁</span>
                                            End Game
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                <p className="text-yellow-500 text-lg flex items-center gap-2">
                                    <span className="animate-pulse">⏳</span>
                                    Waiting for admin...
                                </p>
                            )}
                        </div>
                    ) : roomState?.status === 'completed' ? (
                        // Game End View with Rankings
                        <div className="flex-1 flex flex-col">
                            <div className="text-center mb-8">
                                <div className="text-6xl mb-4">🏆</div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>
                                <p className="text-gray-500">Final Rankings</p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                                <div className="space-y-4">
                                    {rankings.map((ranking, index) => (
                                        <div
                                            key={ranking.playerId}
                                            className={`flex items-center gap-4 p-4 rounded-xl ${
                                                ranking.position === 1 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300' :
                                                ranking.position === 2 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300' :
                                                ranking.position === 3 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300' :
                                                'bg-gray-50 border-2 border-gray-200'
                                            }`}
                                        >
                                            <div className="text-3xl font-bold w-12 text-center">
                                                {ranking.position === 1 ? '🥇' :
                                                 ranking.position === 2 ? '🥈' :
                                                 ranking.position === 3 ? '🥉' :
                                                 `#${ranking.position}`}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">{ranking.playerName}</p>
                                                {ranking.isTied && <p className="text-xs text-gray-500">Tied</p>}
                                            </div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {ranking.totalPoints} pts
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isAdmin ? (
                                <button
                                    onClick={handleGoToLobby}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xl font-bold tracking-wide py-4 px-12 rounded-xl transition-all shadow-lg"
                                >
                                    <span className="flex items-center justify-center gap-3">
                                        <span className="text-3xl">🏠</span>
                                        Go back to Lobby
                                    </span>
                                </button>
                            ) : (
                                <p className="text-center text-gray-500">
                                    Waiting for admin to return to lobby...
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="text-6xl mb-4">🐟</div>
                            <h2 className="text-2xl text-gray-700 mb-2 font-bold">
                                Game in Progress
                            </h2>
                            <p className="text-gray-500">
                                Waiting for next phase...
                            </p>
                        </div>
                    )}

                    {/* Force End Round - Admin Only */}
                    {isAdmin && roomState?.status !== 'completed' && (
                        <div className="mt-8 pt-6 border-t-2 border-gray-200 flex justify-end">
                            <button
                                onClick={() => wsRef.current?.send(JSON.stringify({ type: 'end_round' }))}
                                className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                            >
                                Force End Round
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
