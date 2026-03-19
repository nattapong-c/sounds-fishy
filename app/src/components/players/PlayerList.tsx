'use client';

import { IPlayer } from '@/types';
import PlayerCard from './PlayerCard';

interface PlayerListProps {
  players: IPlayer[];
  hostId: string;
  currentUserId?: string;
  showRole?: boolean;
}

/**
 * PlayerList Component
 * Displays list of all players in the room
 */
export default function PlayerList({
  players,
  hostId,
  currentUserId,
  showRole = false,
}: PlayerListProps) {
  // Sort: host first, then by name
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.deviceId === hostId) return -1;
    if (b.deviceId === hostId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-3">
      {sortedPlayers.map((player) => (
        <PlayerCard
          key={player.deviceId}
          player={player}
          isCurrentPlayer={player.deviceId === currentUserId}
          showRole={showRole}
        />
      ))}
    </div>
  );
}
