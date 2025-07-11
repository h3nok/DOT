import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SlideControls from './SlideControls';

describe('SlideControls', () => {
  it('should render play button when not playing', () => {
    const mockToggle = vi.fn();
    
    render(
      <SlideControls 
        isPlaying={false} 
        onTogglePlayback={mockToggle}
      />
    );
    
    const button = screen.getByLabelText('Play slideshow');
    expect(button).toBeInTheDocument();
  });

  it('should render pause button when playing', () => {
    const mockToggle = vi.fn();
    
    render(
      <SlideControls 
        isPlaying={true} 
        onTogglePlayback={mockToggle}
      />
    );
    
    const button = screen.getByLabelText('Pause slideshow');
    expect(button).toBeInTheDocument();
  });

  it('should call onTogglePlayback when clicked', () => {
    const mockToggle = vi.fn();
    
    render(
      <SlideControls 
        isPlaying={false} 
        onTogglePlayback={mockToggle}
      />
    );
    
    const button = screen.getByLabelText('Play slideshow');
    fireEvent.click(button);
    
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });
});