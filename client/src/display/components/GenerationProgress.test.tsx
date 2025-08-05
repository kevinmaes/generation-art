import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GenerationProgress } from './GenerationProgress';

describe('GenerationProgress', () => {
  it('should render spinner and default message', () => {
    render(<GenerationProgress />);

    expect(screen.getByText('Generating art...')).toBeTruthy();
    // Check for spinner by looking for the animated div
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should render custom message', () => {
    render(<GenerationProgress message="Custom loading message" />);

    expect(screen.getByText('Custom loading message')).toBeTruthy();
    expect(screen.queryByText('Generating art...')).toBeNull();
  });

  it('should not render progress details when progress is null', () => {
    render(<GenerationProgress progress={null} />);

    expect(screen.queryByText(/Step \d+ of \d+/)).toBeNull();
  });

  it('should render progress details when progress is provided', () => {
    const progress = {
      current: 2,
      total: 5,
      transformerName: 'Smart Layout',
    };

    render(<GenerationProgress progress={progress} />);

    expect(screen.getByText('Step 2 of 5')).toBeTruthy();
    expect(screen.getByText('Smart Layout')).toBeTruthy();

    // Check progress bar exists
    const progressBar = document.querySelector('.bg-blue-500');
    expect(progressBar).toBeTruthy();
    const progressBarStyle = (progressBar as HTMLElement).style.width;
    expect(progressBarStyle).toBe('40%'); // 2/5 * 100%
  });

  it('should apply custom className', () => {
    const { container } = render(
      <GenerationProgress className="custom-class" />,
    );

    const firstChild = container.firstChild as HTMLElement;
    expect(firstChild.className).toContain('custom-class');
  });

  it('should calculate progress bar width correctly', () => {
    const progress = {
      current: 3,
      total: 4,
      transformerName: 'Node Shape',
    };

    render(<GenerationProgress progress={progress} />);

    const progressBar = document.querySelector('.bg-blue-500');
    expect(progressBar).toBeTruthy();
    expect((progressBar as HTMLElement).style.width).toBe('75%'); // 3/4 * 100%
  });

  it('should handle edge case of 100% progress', () => {
    const progress = {
      current: 5,
      total: 5,
      transformerName: 'Final Transform',
    };

    render(<GenerationProgress progress={progress} />);

    expect(screen.getByText('Step 5 of 5')).toBeTruthy();

    const progressBar = document.querySelector('.bg-blue-500');
    expect(progressBar).toBeTruthy();
    expect((progressBar as HTMLElement).style.width).toBe('100%');
  });
});
