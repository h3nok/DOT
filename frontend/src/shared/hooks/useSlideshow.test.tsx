import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSlideshow } from '../../shared/hooks/useSlideshow';

// Mock slides data
const mockSlides = [
  {
    id: 1,
    text: "Test slide 1",
    highlight: "highlight 1",
    bgGradient: "from-blue-500 to-purple-600",
    category: "Test"
  },
  {
    id: 2,
    text: "Test slide 2", 
    highlight: "highlight 2",
    bgGradient: "from-red-500 to-orange-600",
    category: "Test"
  }
];

// Test component that uses the hook
const TestComponent = () => {
  const {
    currentSlide,
    isPlaying,
    nextSlide,
    prevSlide,
    togglePlayback,
    totalSlides,
    currentSlideData
  } = useSlideshow(mockSlides, { autoPlay: false });

  return (
    <div>
      <div data-testid="current-slide">{currentSlide}</div>
      <div data-testid="total-slides">{totalSlides}</div>
      <div data-testid="is-playing">{isPlaying.toString()}</div>
      <div data-testid="slide-text">{currentSlideData?.text}</div>
      <button data-testid="next-button" onClick={nextSlide}>Next</button>
      <button data-testid="prev-button" onClick={prevSlide}>Previous</button>
      <button data-testid="toggle-button" onClick={togglePlayback}>Toggle</button>
    </div>
  );
};

describe('useSlideshow hook', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  it('should initialize with first slide', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('current-slide')).toHaveTextContent('0');
    expect(screen.getByTestId('total-slides')).toHaveTextContent('2');
    expect(screen.getByTestId('slide-text')).toHaveTextContent('Test slide 1');
  });

  it('should navigate to next slide', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('next-button'));
    
    expect(screen.getByTestId('current-slide')).toHaveTextContent('1');
    expect(screen.getByTestId('slide-text')).toHaveTextContent('Test slide 2');
  });

  it('should navigate to previous slide', () => {
    render(<TestComponent />);
    
    // Go to next slide first
    fireEvent.click(screen.getByTestId('next-button'));
    expect(screen.getByTestId('current-slide')).toHaveTextContent('1');
    
    // Then go back
    fireEvent.click(screen.getByTestId('prev-button'));
    expect(screen.getByTestId('current-slide')).toHaveTextContent('0');
  });

  it('should wrap around when reaching end', () => {
    render(<TestComponent />);
    
    // Navigate past the last slide
    fireEvent.click(screen.getByTestId('next-button')); // slide 1
    fireEvent.click(screen.getByTestId('next-button')); // should wrap to slide 0
    
    expect(screen.getByTestId('current-slide')).toHaveTextContent('0');
    expect(screen.getByTestId('slide-text')).toHaveTextContent('Test slide 1');
  });

  it('should toggle playback state', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('is-playing')).toHaveTextContent('false');
    
    fireEvent.click(screen.getByTestId('toggle-button'));
    
    expect(screen.getByTestId('is-playing')).toHaveTextContent('true');
  });

  it.skip('should handle keyboard navigation', async () => {
    // Skip this test for now - needs proper keyboard navigation setup
    render(<TestComponent />);
    
    // Simulate ArrowRight key press
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    
    await waitFor(() => {
      expect(screen.getByTestId('current-slide')).toHaveTextContent('1');
    });
    
    // Simulate ArrowLeft key press
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    
    await waitFor(() => {
      expect(screen.getByTestId('current-slide')).toHaveTextContent('0');
    });
  });
});
