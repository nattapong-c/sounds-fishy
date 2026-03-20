'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useSocket';
import { roomAPI } from '@/services/api';
import { IGameRoom, PlayerRole } from '@/types';

export interface BriefingPayload {
  question: string;
  role: PlayerRole;
  secretWord?: string;
  canGenerateLie?: boolean;
  bluffSuggestions?: string[];
  isHost?: boolean;
}

export interface UseBriefingReturn {
  // State
  role: PlayerRole;
  question: string;
  secretWord?: string;
  canGenerateLie: boolean;
  bluffSuggestions: string[];
  isHost: boolean;
  allPlayersReady: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  generateLie: () => Promise<string>;
  toggleReady: () => void;
  clearError: () => void;
}

/**
 * useBriefing Hook
 * Manages briefing phase state and WebSocket integration
 */
export const useBriefing = (roomCode: string, deviceId?: string): UseBriefingReturn => {
  const { isConnected, subscribe, sendMessage } = useWebSocket(roomCode, deviceId);

  // State
  const [role, setRole] = useState<PlayerRole>(null);
  const [question, setQuestion] = useState('');
  const [secretWord, setSecretWord] = useState<string | undefined>();
  const [canGenerateLie, setCanGenerateLie] = useState(false);
  const [bluffSuggestions, setBluffSuggestions] = useState<string[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [allPlayersReady, setAllPlayersReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen for start_round event
  useEffect(() => {
    if (!isConnected) {
      console.log('[useBriefing] Not connected to WebSocket');
      return;
    }

    console.log('[useBriefing] Subscribing to events, isConnected:', isConnected);

    const handleStartRound = (data: BriefingPayload) => {
      console.log('[useBriefing] Received start_round:', data);
      setRole(data.role);
      setQuestion(data.question);
      setSecretWord(data.secretWord);
      setCanGenerateLie(data.canGenerateLie || false);
      setBluffSuggestions(data.bluffSuggestions || []);
      setIsHost(data.isHost || false);
      setIsLoading(false);
    };

    const handleAllPlayersReady = () => {
      console.log('[useBriefing] All players ready');
      setAllPlayersReady(true);
    };

    const handleError = (data: any) => {
      console.error('[useBriefing] Error:', data);
      setError(data.message || 'An error occurred');
      setIsLoading(false);
    };

    subscribe('start_round', handleStartRound);
    subscribe('all_players_ready', handleAllPlayersReady);
    subscribe('error', handleError);
    subscribe('game_started', () => {
      console.log('[useBriefing] Game started event received');
    });
    // Fallback broadcast event
    subscribe('start_round_broadcast', () => {
      console.log('[useBriefing] Start round broadcast received, checking for role data...');
      // The individual start_round should have been received already
    });

    // Timeout fallback - if no start_round after 10 seconds, show error
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('[useBriefing] Timeout waiting for start_round event');
        setError('Briefing did not start. Please go back to the lobby and try again.');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      // Cleanup handled by parent component
    };
  }, [isConnected, subscribe, isLoading]);

  // Generate lie for Red Herring
  const generateLie = useCallback(async (): Promise<string> => {
    if (!deviceId || !roomCode) {
      throw new Error('Cannot generate lie: missing deviceId or roomCode');
    }

    try {
      const response = await roomAPI.generateLie({ roomCode, deviceId });
      
      if (response.success) {
        return response.data.lieSuggestion;
      } else {
        throw new Error(response.error || 'Failed to generate lie');
      }
    } catch (err) {
      console.error('Lie generation error:', err);
      throw err;
    }
  }, [roomCode, deviceId]);

  // Toggle ready status
  const toggleReady = useCallback(() => {
    if (!deviceId || !roomCode) return;
    
    sendMessage('ready_up', { roomCode, deviceId });
  }, [roomCode, deviceId, sendMessage]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    role,
    question,
    secretWord,
    canGenerateLie,
    bluffSuggestions,
    isHost,
    allPlayersReady,
    isLoading,
    error,

    // Actions
    generateLie,
    toggleReady,
    clearError,
  };
};
