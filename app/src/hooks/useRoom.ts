'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useSocket';
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
  refreshRoom: () => void; // Add refresh function
}

/**
 * useRoom Hook
 * Manages room state and WebSocket integration
 */
export const useRoom = (roomCode: string, deviceId?: string): UseRoomReturn => {
  const [room, setRoom] = useState<IGameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { connectionState, isConnected, sendMessage, subscribe, unsubscribe } = useWebSocket(roomCode, deviceId);

  // Fetch initial room data
  const fetchRoom = useCallback(async () => {
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
  }, [roomCode]);

  useEffect(() => {
    if (roomCode) {
      fetchRoom();
    }
  }, [roomCode, fetchRoom]);

  // Refresh room data manually
  const refreshRoom = useCallback(() => {
    fetchRoom();
  }, [fetchRoom]);

  // Subscribe to WebSocket events
  useEffect(() => {
    if (!isConnected) return;

    const handleRoomUpdate = (data: IGameRoom) => setRoom(data);

    const handlePlayerJoined = (data: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 Player joined:', data.playerName);
      }
    };

    const handlePlayerLeft = (data: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('👋 Player left:', data.playerName);
      }
    };

    // Handle player disconnected
    const handlePlayerDisconnected = (data: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Player disconnected:', data.playerName);
      }
      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom;
        const updatedPlayers = prevRoom.players.map(p =>
          p.deviceId === data.deviceId
            ? { ...p, isOnline: false, lastSeen: data.lastSeen }
            : p
        );
        return { ...prevRoom, players: updatedPlayers };
      });
    };

    // Handle player reconnected
    const handlePlayerReconnected = (data: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Player reconnected:', data.playerName);
      }
      setRoom((prevRoom) => {
        if (!prevRoom) return prevRoom;
        const updatedPlayers = prevRoom.players.map(p =>
          p.deviceId === data.deviceId
            ? { ...p, isOnline: true, lastSeen: new Date().toISOString() }
            : p
        );
        return { ...prevRoom, players: updatedPlayers };
      });
    };

    // Subscribe to events
    subscribe('room_updated', handleRoomUpdate);
    subscribe('player_joined', handlePlayerJoined);
    subscribe('player_left', handlePlayerLeft);
    subscribe('player_disconnected', handlePlayerDisconnected);
    subscribe('player_reconnected', handlePlayerReconnected);

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe('room_updated');
      unsubscribe('player_joined');
      unsubscribe('player_left');
      unsubscribe('player_disconnected');
      unsubscribe('player_reconnected');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, subscribe, unsubscribe]);

  // WebSocket actions - memoized
  const joinRoom = useCallback(() => {
    if (deviceId) {
      sendMessage('join_room', { roomCode, deviceId });
    }
  }, [deviceId, roomCode, sendMessage]);

  const leaveRoom = useCallback(() => {
    if (deviceId) {
      sendMessage('leave_room', { roomCode, deviceId });
    }
  }, [deviceId, roomCode, sendMessage]);

  const toggleReady = useCallback(() => {
    if (deviceId) {
      sendMessage('ready_up', { roomCode, deviceId });
    }
  }, [deviceId, roomCode, sendMessage]);

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
    refreshRoom,
  };
};
