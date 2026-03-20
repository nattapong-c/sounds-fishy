'use client';

import { useState } from 'react';

interface SecretRevealProps {
  secret: string;
  label?: string;
  onReveal?: () => void;
}

/**
 * SecretReveal Component
 * Interactive "Tap to Reveal" component for secret information
 * Features smooth animation and haptic feedback on mobile
 */
export default function SecretReveal({ secret, label = 'Secret Word', onReveal }: SecretRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleReveal = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      
      // Vibrate on mobile devices (if supported)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Call onReveal callback if provided
      if (onReveal) {
        onReveal();
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-2">
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      
      <button
        onClick={handleReveal}
        disabled={isRevealed}
        className={`
          w-full py-6 px-8 rounded-xl
          transition-all duration-500 ease-in-out
          focus:outline-none focus:ring-4 focus:ring-ocean-500 focus:ring-opacity-50
          ${isRevealed
            ? 'bg-gradient-to-br from-ocean-500 to-ocean-600 scale-105'
            : 'bg-gradient-to-br from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400'
          }
        `}
        style={{
          filter: isRevealed ? 'none' : 'blur(8px)',
          cursor: isRevealed ? 'default' : 'pointer',
        }}
      >
        <div className="relative">
          {/* Hidden State - Show "Tap to Reveal" */}
          {!isRevealed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center blur-0">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-lg font-semibold text-gray-700">Tap to Reveal</p>
              <p className="text-sm text-gray-500 mt-1">Only you can see this</p>
            </div>
          )}
          
          {/* Revealed State - Show Secret */}
          <div className={`transition-opacity duration-300 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-2xl md:text-3xl font-bold text-white tracking-wide">
              {secret}
            </p>
          </div>
        </div>
      </button>
      
      {/* Revealed Indicator */}
      {isRevealed && (
        <div className="text-center mt-3 animate-fade-in">
          <p className="text-sm text-ocean-600 font-medium flex items-center justify-center gap-1">
            <span>✓</span> Revealed
          </p>
        </div>
      )}
    </div>
  );
}
