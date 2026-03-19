import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import PlayerCard from '@/components/players/PlayerCard';

describe('PlayerCard Component', () => {
  const defaultProps = {
    playerName: 'TestPlayer',
    isHost: false,
    inGameRole: null as const,
    isOnline: true,
    isReady: false,
    isCurrentPlayer: false,
  };

  it('should render player name correctly', () => {
    render(<PlayerCard {...defaultProps} />);
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
  });

  it('should show host crown for host player', () => {
    render(<PlayerCard {...defaultProps} isHost={true} />);
    expect(screen.getByText('👑 Host')).toBeInTheDocument();
  });

  it('should show online indicator when player is online', () => {
    render(<PlayerCard {...defaultProps} isOnline={true} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should show disconnected indicator when player is offline', () => {
    render(<PlayerCard {...defaultProps} isOnline={false} />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should apply grayscale and opacity when disconnected', () => {
    const { container } = render(<PlayerCard {...defaultProps} isOnline={false} />);
    const card = container.firstChild;
    expect(card).toHaveClass('opacity-60', 'grayscale');
  });

  it('should show game role badge for non-host players', () => {
    render(<PlayerCard {...defaultProps} inGameRole="guesser" />);
    expect(screen.getByText('🎯 Guesser')).toBeInTheDocument();
  });

  it('should not show game role for host', () => {
    render(<PlayerCard {...defaultProps} isHost={true} inGameRole={null} />);
    expect(screen.queryByText('🎯 Guesser')).not.toBeInTheDocument();
  });
});
