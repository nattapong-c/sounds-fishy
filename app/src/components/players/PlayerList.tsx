import React from 'react';
import PlayerCard from './PlayerCard';
import { IPlayer } from '@/types';

interface PlayerListProps {
  players: IPlayer[];
  hostId: string;
  currentUserId: string;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  hostId,
  currentUserId,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
      {players.map((player, index) => (
        <PlayerCard
          key={player.playerId}
          playerName={player.name}
          isHost={player.playerId === hostId}
          isReady={player.isReady}
          isCurrentPlayer={player.playerId === currentUserId}
          animationDelay={index * 100}
        />
      ))}
    </div>
  );
};

export default PlayerList;
