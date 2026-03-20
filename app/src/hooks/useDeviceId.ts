'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sounds-fishy-deviceId';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Custom hook for persistent device identity
 * Generates UUID on first use, stores in localStorage, returns same deviceId across sessions
 */
export function useDeviceId(): string | null {
    const [deviceId, setDeviceId] = useState<string | null>(null);

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        let id = localStorage.getItem(STORAGE_KEY);
        
        if (!id) {
            id = generateUUID();
            localStorage.setItem(STORAGE_KEY, id);
        }
        
        setDeviceId(id);
    }, []);

    return deviceId;
}
