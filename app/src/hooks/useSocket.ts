'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001/ws';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  sendMessage: (type: string, data: any) => void;
  subscribe: (eventType: string, callback: (data: any) => void) => void;
  unsubscribe: (eventType: string) => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const callbacksRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0;
      };

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt reconnection
        if (reconnectAttemptsRef.current < 5) {
          setIsReconnecting(true);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            console.log(`🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
            connect();
          }, 1000 * reconnectAttemptsRef.current);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
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
      setIsReconnecting(true);
    }
  }, []);

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
      console.warn('WebSocket not connected, message queued:', type);
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
    isConnected,
    isReconnecting,
    sendMessage,
    subscribe,
    unsubscribe,
  };
};
