import React from 'react';
import { clsx } from 'clsx';

interface PlayerCardProps {
  playerName: string;
  isHost: boolean;
  isReady: boolean;
  isCurrentPlayer: boolean;
  animationDelay?: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  playerName,
  isHost,
  isReady,
  isCurrentPlayer,
  animationDelay = 0,
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl p-4 shadow-md flex items-center gap-3',
        'transform transition-all duration-300 hover:scale-105',
        'animate-slide-in-left',
        isCurrentPlayer && 'ring-2 ring-ocean-500'
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="text-2xl">🐟</div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{playerName}</p>
        {isHost && (
          <span className="text-xs text-fish-gold flex items-center gap-1">
            👑 Host
          </span>
        )}
      </div>
      {isReady && (
        <div className="text-fish-green text-xl animate-bounce" data-testid="ready-checkmark">
          ✓
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
