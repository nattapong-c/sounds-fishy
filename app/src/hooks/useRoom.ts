'use client';

import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { roomAPI } from '@/services/api';
import { IGameRoom } from '@/types';

export const useRoom = (roomCode: string) => {
  const [room, setRoom] = useState<IGameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocket(roomCode);

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

  // Listen for socket updates
  useEffect(() => {
    if (!socket) return;

    socket.on('room_updated', (data) => {
      setRoom(data);
    });

    socket.on('player_joined', (data) => {
      console.log('Player joined:', data.playerName);
    });

    socket.on('player_left', (data) => {
      console.log('Player left:', data.playerName);
    });

    return () => {
      socket.off('room_updated');
      socket.off('player_joined');
      socket.off('player_left');
    };
  }, [socket]);

  return { room, isLoading, error, isConnected };
};
