import React from 'react';
import { clsx } from 'clsx';

interface PlayerCardProps {
  playerName: string;
  isHost: boolean;
  inGameRole: 'guesser' | 'bigFish' | 'redHerring' | null;
  isOnline: boolean;
  isReady: boolean;
  isCurrentPlayer: boolean;
  lastSeen?: string;
  animationDelay?: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  playerName,
  isHost,
  inGameRole,
  isOnline,
  isReady,
  isCurrentPlayer,
  lastSeen,
  animationDelay = 0,
}) => {
  const getRoleBadge = () => {
    if (isHost) {
      return (
        <span className="text-xs text-fish-gold flex items-center gap-1">
          👑 Host
        </span>
      );
    }
    
    switch (inGameRole) {
      case 'guesser':
        return (
          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
            🎯 Guesser
          </span>
        );
      case 'bigFish':
        return (
          <span className="text-xs text-fish-gold bg-yellow-100 px-2 py-0.5 rounded-full">
            🐟 Big Fish
          </span>
        );
      case 'redHerring':
        return (
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            🐠 Red Herring
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusIndicator = () => {
    if (isOnline) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Online
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          Disconnected
          {lastSeen && (
            <span className="text-xs text-gray-400 ml-1">
              ({formatLastSeen(lastSeen)})
            </span>
          )}
        </div>
      );
    }
  };

  const formatLastSeen = (lastSeenStr: string) => {
    const lastSeen = new Date(lastSeenStr);
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-xl p-4 shadow-md flex items-center gap-3',
        'transform transition-all duration-300 hover:scale-105',
        'animate-slide-in-left',
        isCurrentPlayer && 'ring-2 ring-ocean-500',
        !isOnline && 'opacity-60 grayscale'
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Avatar with status indicator */}
      <div className="relative">
        <div className="text-2xl">🐟</div>
        <div
          className={clsx(
            'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white',
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      </div>

      {/* Player info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={clsx(
            'font-semibold text-gray-900',
            !isOnline && 'text-gray-500'
          )}>
            {playerName}
          </p>
          {isCurrentPlayer && (
            <span className="text-xs text-ocean-600 bg-ocean-100 px-2 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {getRoleBadge()}
          {getStatusIndicator()}
        </div>
      </div>

      {/* Ready indicator */}
      {isReady && isOnline && (
        <div className="text-fish-green text-xl animate-bounce" data-testid="ready-checkmark">
          ✓
        </div>
      )}
      
      {/* Disconnected badge */}
      {!isOnline && (
        <div className="text-xs text-gray-400">
          ⚠️
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
