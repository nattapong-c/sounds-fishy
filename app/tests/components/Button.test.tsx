import { describe, it, expect, beforeEach } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../src/components/ui/Button';

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should apply primary variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByText('Primary').closest('button');
    expect(button).toHaveClass('bg-ocean-500');
  });

  it('should apply secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByText('Secondary').closest('button');
    expect(button).toHaveClass('border-2 border-ocean-500');
  });

  it('should apply different sizes', () => {
    const { container } = render(
      <>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </>
    );

    const smallBtn = container.children[0];
    const mediumBtn = container.children[1];
    const largeBtn = container.children[2];

    expect(smallBtn).toHaveClass('px-4 py-2');
    expect(mediumBtn).toHaveClass('px-6 py-3');
    expect(largeBtn).toHaveClass('px-8 py-4');
  });

  it('should be disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByText('Loading...').closest('button');
    expect(button).toBeDisabled();
  });

  it('should show loading spinner when isLoading', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click
      </Button>
    );

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
