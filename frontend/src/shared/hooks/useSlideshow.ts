import { useState, useEffect, useCallback, useRef } from 'react';

export interface Slide {
  id: number;
  text: string;
  highlight: string;
  bgGradient: string;
  category: string;
}

export interface SlideshowConfig {
  autoPlay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  keyboardNavigation?: boolean;
}

export interface SlideshowState {
  currentSlide: number;
  direction: number;
  isPlaying: boolean;
  isHovered: boolean;
  isFocused: boolean;
}

export const useSlideshow = (
  slides: Slide[], 
  config: SlideshowConfig = {}
) => {
  const {
    autoPlay = true,
    interval = 7000,
    pauseOnHover = true,
    keyboardNavigation = true
  } = config;

  const [state, setState] = useState<SlideshowState>({
    currentSlide: 0,
    direction: 1,
    isPlaying: autoPlay,
    isHovered: false,
    isFocused: false,
  });

  const timerRef = useRef<number | null>(null);

  // Navigation functions
  const nextSlide = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentSlide: (prev.currentSlide + 1) % slides.length,
      direction: 1,
    }));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentSlide: (prev.currentSlide - 1 + slides.length) % slides.length,
      direction: -1,
    }));
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      currentSlide: index,
      direction: index > prev.currentSlide ? 1 : -1,
    }));
  }, []);

  const togglePlayback = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const setHovered = useCallback((hovered: boolean) => {
    setState(prev => ({ ...prev, isHovered: hovered }));
  }, []);

  const setFocused = useCallback((focused: boolean) => {
    setState(prev => ({ ...prev, isFocused: focused }));
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (!state.isPlaying || (pauseOnHover && state.isHovered) || state.isFocused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(nextSlide, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isPlaying, state.isHovered, state.isFocused, nextSlide, interval, pauseOnHover]);

  // Keyboard navigation
  useEffect(() => {
    if (!keyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevSlide();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextSlide();
          break;
        case ' ':
          event.preventDefault();
          togglePlayback();
          break;
        case 'Home':
          event.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          event.preventDefault();
          goToSlide(slides.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, togglePlayback, goToSlide, slides.length, keyboardNavigation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    // State
    currentSlide: state.currentSlide,
    direction: state.direction,
    isPlaying: state.isPlaying,
    isHovered: state.isHovered,
    isFocused: state.isFocused,
    
    // Actions
    nextSlide,
    prevSlide,
    goToSlide,
    togglePlayback,
    setHovered,
    setFocused,
    
    // Computed
    totalSlides: slides.length,
    progress: ((state.currentSlide + 1) / slides.length) * 100,
    currentSlideData: slides[state.currentSlide],
  };
};
