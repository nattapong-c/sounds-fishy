'use client';

import { useState, useEffect } from 'react';

/**
 * useDeviceId Hook
 * Manages persistent device identity via localStorage
 * Same device = same playerId across sessions
 */
export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get existing deviceId from localStorage
    let id = localStorage.getItem('deviceId');
    
    // Generate new one if doesn't exist
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('deviceId', id);
    }
    
    setDeviceId(id);
  }, []);

  return deviceId;
};
