'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const useSocket = (roomCode?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      console.log('✅ Socket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Socket disconnected');
    });

    newSocket.on('connect_error', () => {
      setIsReconnecting(true);
      console.log('🔄 Socket reconnecting...');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Join room
  const joinRoom = useCallback((playerId: string) => {
    if (socket && roomCode) {
      socket.emit('join_room', { roomCode, playerId });
    }
  }, [socket, roomCode]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (socket && roomCode) {
      socket.emit('leave_room', { roomCode });
    }
  }, [socket, roomCode]);

  // Ready up
  const toggleReady = useCallback((playerId: string) => {
    if (socket && roomCode) {
      socket.emit('ready_up', { roomCode, playerId });
    }
  }, [socket, roomCode]);

  // Start game (host only)
  const startGame = useCallback(() => {
    if (socket && roomCode) {
      socket.emit('start_game', { roomCode });
    }
  }, [socket, roomCode]);

  return {
    socket,
    isConnected,
    isReconnecting,
    joinRoom,
    leaveRoom,
    toggleReady,
    startGame,
  };
};
