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

/**
 * useSocket Hook
 * Manages WebSocket connection with automatic reconnection
 * Uses deviceId for authentication via query parameters
 */
export const useWebSocket = (roomCode?: string, deviceId?: string): UseWebSocketReturn => {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CONNECTING);
  const callbacksRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const isIntentionalReconnectRef = useRef(false); // Track intentional reconnects

  // Build WebSocket URL with query params for authentication
  const buildWSUrl = useCallback(() => {
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;

    if (!wsUrl) {
      // Auto-detect protocol based on current page
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3001';
      wsUrl = `${protocol}//${host}`;
    }

    // Add query parameters for authentication
    const params = new URLSearchParams();
    if (roomCode) params.set('roomCode', roomCode);
    if (deviceId) params.set('deviceId', deviceId);

    return `${wsUrl}/ws${params.toString() ? `?${params.toString()}` : ''}`;
  }, [roomCode, deviceId]);

  const connect = useCallback(() => {
    // Close existing connection cleanly if it exists
    if (wsRef.current) {
      wsRef.current.onclose = null; // Remove onclose handler to prevent reconnection logic
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(buildWSUrl());

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionState(ConnectionState.CONNECTED);
        reconnectAttemptsRef.current = 0;
        isIntentionalReconnectRef.current = false;
      };

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setConnectionState(ConnectionState.DISCONNECTED);

        // Don't reconnect if this was an intentional reconnect (deviceId changed)
        if (isIntentionalReconnectRef.current) {
          return;
        }

        // Exponential backoff reconnection strategy
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
        // Only log errors if not an intentional reconnect
        if (!isIntentionalReconnectRef.current) {
          console.error('WebSocket error:', error);
        }
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
    // Mark as intentional reconnect if we already had a connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      isIntentionalReconnectRef.current = true;
    }
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnection logic on cleanup
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
    const callbacks = callbacksRef.current.get(eventType)!;
    
    // Check if this exact callback is already registered to prevent duplicates
    if (!callbacks.has(callback)) {
      callbacks.add(callback);
    }
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
