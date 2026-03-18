import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import PlayerCard from '../src/components/players/PlayerCard';

describe('PlayerCard Component', () => {
  const defaultProps = {
    playerName: 'TestPlayer',
    isHost: false,
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

  it('should show ready checkmark when ready', () => {
    render(<PlayerCard {...defaultProps} isReady={true} />);
    const checkmark = screen.getByTestId('ready-checkmark');
    expect(checkmark).toBeInTheDocument();
    expect(checkmark).toHaveTextContent('✓');
  });

  it('should not show ready checkmark when not ready', () => {
    render(<PlayerCard {...defaultProps} isReady={false} />);
    expect(screen.queryByTestId('ready-checkmark')).not.toBeInTheDocument();
  });

  it('should highlight current player', () => {
    render(<PlayerCard {...defaultProps} isCurrentPlayer={true} />);
    const card = screen.getByText('TestPlayer').closest('div');
    expect(card).toHaveClass('ring-2 ring-ocean-500');
  });

  it('should apply slide-in animation', () => {
    render(<PlayerCard {...defaultProps} />);
    const card = screen.getByText('TestPlayer').closest('div');
    expect(card).toHaveClass('animate-slide-in-left');
  });

  it('should respect animation delay', () => {
    const delay = 500;
    render(<PlayerCard {...defaultProps} animationDelay={delay} />);
    const card = screen.getByText('TestPlayer').closest('div');
    expect(card).toHaveStyle(`animation-delay: ${delay}ms`);
  });

  it('should display fish emoji', () => {
    render(<PlayerCard {...defaultProps} />);
    expect(screen.getByText('🐟')).toBeInTheDocument();
  });
});
