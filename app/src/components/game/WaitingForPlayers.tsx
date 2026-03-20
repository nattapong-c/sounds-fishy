'use client';

import { IPlayer } from '@/types';

interface WaitingForPlayersProps {
  players: IPlayer[];
  currentDeviceId?: string;
}

/**
 * WaitingForPlayers Component
 * Shows waiting state while players get ready
 */
export default function WaitingForPlayers({ players, currentDeviceId }: WaitingForPlayersProps) {
  const readyPlayers = players.filter(p => p.isReady);
  const notReadyPlayers = players.filter(p => !p.isReady);

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6 animate-fade-in">
      {/* Animated Indicator */}
      <div className="relative">
        <div className="w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 bg-ocean-400 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-20 h-20 mx-auto bg-ocean-500 rounded-full flex items-center justify-center text-4xl animate-bounce">
            🎮
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-gray-800">
          Waiting for Players...
        </h3>
        <p className="text-gray-600">
          {readyPlayers.length} of {players.length} players ready
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-ocean-500 to-ocean-600 h-full transition-all duration-500 ease-out"
          style={{ width: `${(readyPlayers.length / players.length) * 100}%` }}
        />
      </div>

      {/* Ready Players List */}
      {readyPlayers.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-medium text-green-800 mb-2 flex items-center justify-center gap-1">
            <span>✓</span> Ready ({readyPlayers.length})
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {readyPlayers.map(player => (
              <span
                key={player.deviceId}
                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {player.name}
                {player.deviceId === currentDeviceId && ' (You)'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Not Ready Players List */}
      {notReadyPlayers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-2 flex items-center justify-center gap-1">
            <span>⏳</span> Getting Ready ({notReadyPlayers.length})
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {notReadyPlayers.map(player => (
              <span
                key={player.deviceId}
                className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {player.name}
                {player.deviceId === currentDeviceId && ' (You)'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Host Notification */}
      {players.find(p => p.deviceId === currentDeviceId)?.isHost && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-sm">
            <strong>👑 Host Notice:</strong> The game will start automatically once all players are ready!
          </p>
        </div>
      )}

      {/* Loading Spinner */}
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-600"></div>
      </div>
    </div>
  );
}
