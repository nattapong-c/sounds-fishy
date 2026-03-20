'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useDeviceId } from '@/hooks/useDeviceId';
import { roomAPI } from '@/lib/api';

export default function RoomPage() {
    const { roomId } = useParams() as { roomId: string };
    const deviceId = useDeviceId();
    const router = useRouter();
    
    const [nickname, setNickname] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [roomState, setRoomState] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    // Connect to WebSocket
    const connectWebSocket = () => {
        if (!deviceId) return;
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:3001';
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${host}`;
        
        const ws = new WebSocket(`${wsUrl}/ws/rooms/${roomId}?deviceId=${deviceId}`);

        ws.onopen = () => console.log('WebSocket connected');
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('WebSocket message received:', message.type);
                
                // Handle different message types
                switch (message.type) {
                    case 'room_state_update':
                    case 'game_started':
                    case 'guess_submitted':
                        setRoomState(message.room);
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
            const response = await roomAPI.join(roomId, nickname, deviceId);
            setRoomState(response.room);
            setHasJoined(true);
            connectWebSocket();
        } catch (err: any) {
            setError(`Failed to join room: ${err.message}`);
        }
    };

    // Auto-reconnect on page load
    useEffect(() => {
        if (!deviceId) return;

        const checkExistingSession = async () => {
            try {
                const response = await roomAPI.get(roomId);
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
            await roomAPI.leave(roomId, deviceId);
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

    // Handle kick player (admin only)
    const handleKickPlayer = (targetPlayerId: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'kick_player',
                targetPlayerId
            }));
        }
    };

    // Handle start game (admin only, stub)
    const handleStartGame = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'start_game',
                hostPlayerId: null
            }));
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
                            <label className="block text-gray-500 mb-2 tracking-wider uppercase text-sm">
                                Nickname
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl p-4 text-center text-xl outline-none transition-colors"
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

    // Show lobby view
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
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
                                        <span className="font-medium truncate">{player.name}</span>
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
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="text-6xl mb-4">🐟</div>
                            <h2 className="text-2xl text-gray-700 mb-2 font-bold">
                                Game in Progress
                            </h2>
                            <p className="text-gray-500">
                                Game logic will be implemented in Phase 2
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
