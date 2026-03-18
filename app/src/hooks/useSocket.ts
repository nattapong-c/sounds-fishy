'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Connection states enum
enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed'
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface UseWebSocketReturn {
  connectionState: ConnectionState;
  isConnected: boolean;
  isReconnecting: boolean;
  sendMessage: (type: string, data: any) => void;
  subscribe: (eventType: string, callback: (data: any) => void) => void;
  unsubscribe: (eventType: string) => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const MAX_RECONNECT_DELAY = 10000; // 10 seconds cap

export const useWebSocket = (roomCode?: string, playerId?: string): UseWebSocketReturn => {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CONNECTING);
  const callbacksRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  // Build WebSocket URL with query params for authentication
  const buildWSUrl = useCallback(() => {
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    
    if (!wsUrl) {
      // Auto-detect protocol based on current page (from Outsider pattern)
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3001';
      wsUrl = `${protocol}//${host}`;
    }
    
    // Add query parameters for authentication
    const params = new URLSearchParams();
    if (roomCode) params.set('roomCode', roomCode);
    if (playerId) params.set('playerId', playerId);
    
    return `${wsUrl}/ws${params.toString() ? `?${params.toString()}` : ''}`;
  }, [roomCode, playerId]);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(buildWSUrl());

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionState(ConnectionState.CONNECTED);
        reconnectAttemptsRef.current = 0;
      };

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setConnectionState(ConnectionState.DISCONNECTED);

        // Exponential backoff reconnection strategy (from Outsider pattern)
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          
          // Calculate delay: 1s, 2s, 4s, 8s, 10s (capped)
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY
          );
          
          setConnectionState(ConnectionState.RECONNECTING);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionState(ConnectionState.FAILED);
          console.error('❌ Max reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't expose internal errors to users
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle error messages from server
          if (message.type === 'error') {
            console.error('Server error:', message.data.message);
          }
          
          // Route to subscribed callbacks
          const callbacks = callbacksRef.current.get(message.type);
          if (callbacks) {
            callbacks.forEach((callback) => callback(message.data));
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionState(ConnectionState.FAILED);
    }
  }, [buildWSUrl]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn(`WebSocket not connected (state: ${wsRef.current?.readyState}), message queued:`, type);
    }
  }, []);

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    if (!callbacksRef.current.has(eventType)) {
      callbacksRef.current.set(eventType, new Set());
    }
    callbacksRef.current.get(eventType)!.add(callback);
  }, []);

  const unsubscribe = useCallback((eventType: string) => {
    const callbacks = callbacksRef.current.get(eventType);
    if (callbacks) {
      callbacks.clear();
      callbacksRef.current.delete(eventType);
    }
  }, []);

  return {
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    isReconnecting: connectionState === ConnectionState.RECONNECTING,
    sendMessage,
    subscribe,
    unsubscribe,
  };
};
