'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket, WebSocketMessage } from './useSocket';
import { roomAPI } from '@/services/api';
import { IGameRoom } from '@/types';

interface UseRoomReturn {
  room: IGameRoom | null;
  isLoading: boolean;
  error: string | null;
  connectionState: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed';
  isConnected: boolean;
  joinRoom: () => void;
  leaveRoom: () => void;
  toggleReady: () => void;
  startGame: () => void;
}

export const useRoom = (roomCode: string, playerId?: string): UseRoomReturn => {
  const [room, setRoom] = useState<IGameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connectionState, isConnected, sendMessage, subscribe } = useWebSocket(roomCode, playerId);

  // Fetch initial room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const data = await roomAPI.getRoom(roomCode);
        if (data.success) {
          setRoom(data.data);
        } else {
          setError(data.error?.message || 'Room not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to connect to room');
      } finally {
        setIsLoading(false);
      }
    };

    if (roomCode) {
      fetchRoom();
    }
  }, [roomCode]);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!isConnected) return;

    const handleRoomUpdate = (data: IGameRoom) => setRoom(data);
    const handlePlayerJoined = (data: any) => {
      // Only log once, not on every room update
      if (process.env.NODE_ENV === 'development') {
        console.log('Player joined:', data.playerName);
      }
    };
    const handlePlayerLeft = (data: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Player left:', data.playerName);
      }
    };

    // Subscribe to events
    subscribe('room_updated', handleRoomUpdate);
    subscribe('player_joined', handlePlayerJoined);
    subscribe('player_left', handlePlayerLeft);

    // Cleanup: unsubscribe on unmount
    return () => {
      // Unsubscribe is handled by the hook's internal cleanup
    };
  }, [isConnected, subscribe]);

  // WebSocket actions - memoized
  const joinRoom = useCallback(() => {
    if (playerId) {
      sendMessage('join_room', { roomCode, playerId });
    }
  }, [playerId, roomCode, sendMessage]);

  const leaveRoom = useCallback(() => {
    if (playerId) {
      sendMessage('leave_room', { roomCode, playerId });
    }
  }, [playerId, roomCode, sendMessage]);

  const toggleReady = useCallback(() => {
    if (playerId) {
      sendMessage('ready_up', { roomCode, playerId });
    }
  }, [playerId, roomCode, sendMessage]);

  const startGame = useCallback(() => {
    sendMessage('start_game', { roomCode });
  }, [roomCode, sendMessage]);

  return {
    room,
    isLoading,
    error,
    connectionState,
    isConnected,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
  };
};
