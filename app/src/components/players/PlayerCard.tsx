'use client';

import { IPlayer } from '@/types';

interface PlayerCardProps {
  player: IPlayer;
  isCurrentPlayer?: boolean;
  showRole?: boolean;
}

/**
 * PlayerCard Component
 * Displays individual player information
 */
export default function PlayerCard({ player, isCurrentPlayer = false, showRole = false }: PlayerCardProps) {
  const roleEmojis = {
    guesser: '🎯',
    bigFish: '🐟',
    redHerring: '🐠',
    null: '❓',
  };

  return (
    <div
      className={`
        flex items-center justify-between p-4 rounded-lg
        transition-all duration-200
        ${isCurrentPlayer ? 'bg-ocean-50 border-2 border-ocean-500' : 'bg-gray-50'}
        ${!player.isOnline ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-ocean-200 flex items-center justify-center text-ocean-700 font-bold">
          {player.name.charAt(0).toUpperCase()}
        </div>

        {/* Player Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">
              {player.name}
            </span>
            {player.isHost && (
              <span className="text-xs bg-ocean-100 text-ocean-700 px-2 py-0.5 rounded-full">
                👑 Host
              </span>
            )}
            {isCurrentPlayer && (
              <span className="text-xs bg-ocean-500 text-white px-2 py-0.5 rounded-full">
                You
              </span>
            )}
          </div>
          
          {showRole && player.inGameRole && (
            <div className="text-sm text-gray-600 mt-1">
              {roleEmojis[player.inGameRole]} {player.inGameRole}
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        {/* Online Indicator */}
        <div
          className={`w-3 h-3 rounded-full ${
            player.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={player.isOnline ? 'Online' : 'Offline'}
        />

        {/* Ready Status */}
        {player.isReady && (
          <span className="text-ocean-600 font-semibold">✓ Ready</span>
        )}

        {/* Score */}
        {player.score > 0 && (
          <span className="text-ocean-700 font-bold">{player.score} pts</span>
        )}
      </div>
    </div>
  );
}
