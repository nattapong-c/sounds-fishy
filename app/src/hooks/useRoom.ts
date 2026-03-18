'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from './useSocket';
import { roomAPI } from '@/services/api';
import { IGameRoom } from '@/types';

export const useRoom = (roomCode: string, playerId?: string) => {
  const [room, setRoom] = useState<IGameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, isReconnecting, sendMessage, subscribe } = useWebSocket();

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

    // Subscribe to room updates
    const unsubscribeRoomUpdated = subscribe('room_updated', (data) => {
      setRoom(data);
    });

    const unsubscribePlayerJoined = subscribe('player_joined', (data) => {
      console.log('Player joined:', data.playerName);
    });

    const unsubscribePlayerLeft = subscribe('player_left', (data) => {
      console.log('Player left:', data.playerName);
    });

    return () => {
      unsubscribeRoomUpdated();
      unsubscribePlayerJoined();
      unsubscribePlayerLeft();
    };
  }, [isConnected, subscribe]);

  // WebSocket actions
  const joinRoom = () => {
    if (playerId) {
      sendMessage('join_room', { roomCode, playerId });
    }
  };

  const leaveRoom = () => {
    if (playerId) {
      sendMessage('leave_room', { roomCode, playerId });
    }
  };

  const toggleReady = () => {
    if (playerId) {
      sendMessage('ready_up', { roomCode, playerId });
    }
  };

  const startGame = () => {
    sendMessage('start_game', { roomCode });
  };

  return {
    room,
    isLoading,
    error,
    isConnected,
    isReconnecting,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
  };
};
