import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

// Constants moved outside component to prevent recreation
const SLIDE_INTERVAL = 7000;
const HELP_DISPLAY_DURATION = 4000;

// Memoized gradient and class mappings
const CATEGORY_GRADIENTS = {
  "Critique": "from-red-500 via-orange-500 to-yellow-500",
  "Paradigm Shift": "from-blue-500 via-purple-500 to-indigo-600",
  "Core Insight": "from-amber-400 via-orange-500 to-red-500",
  "Definition": "from-emerald-400 via-teal-500 to-cyan-600",
  "Identity": "from-green-400 via-emerald-500 to-teal-600",
  "Core Theory": "from-indigo-500 via-purple-600 to-pink-600",
  "Reality": "from-pink-500 via-rose-500 to-red-600",
  "Practice": "from-teal-400 via-cyan-500 to-blue-600",
  "Mechanics": "from-cyan-400 via-sky-500 to-blue-500",
  "Framework": "from-purple-600 via-violet-600 to-indigo-700",
  "Core Principle": "from-rose-400 via-pink-500 to-fuchsia-600",
  "Welcome": "from-blue-400 via-cyan-500 to-sky-600"
} as const;

const CATEGORY_CLASSES = {
  "Critique": "category-critique",
  "Paradigm Shift": "category-paradigm-shift",
  "Core Insight": "category-core-insight",
  "Definition": "category-definition",
  "Identity": "category-identity",
  "Core Theory": "category-core-theory",
  "Reality": "category-reality",
  "Practice": "category-practice",
  "Mechanics": "category-mechanics",
  "Framework": "category-framework",
  "Core Principle": "category-core-principle",
  "Welcome": "category-welcome"
} as const;

// Optimized slide variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

// Performance monitoring hook for development
const usePerformanceMonitor = () => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (import.meta.env.DEV) {
      console.debug(`CompactSlideshow renders: ${renderCount.current}`);
    }
  });
  
  return renderCount.current;
};

// Debounced resize handler for responsive optimizations
const useDebounceResize = (callback: () => void, delay: number = 250) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    const handleResize = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(callback, delay);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, delay]);
};

const CompactSlideshow: React.FC = () => {
  // Performance monitoring in development
  usePerformanceMonitor();
  
  // Responsive optimization
  const [isLargeScreen, setIsLargeScreen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  
  useDebounceResize(useCallback(() => {
    setIsLargeScreen(window.innerWidth >= 1024);
  }, []));
  // Consolidated state using useReducer pattern
  const [state, setState] = useState({
    currentSlide: 0,
    direction: 1,
    isPlaying: true,
    isHovered: false,
    isFocused: false,
    showKeyboardHelp: false,
    hasShownHelp: false
  });

  // Use refs for timers to avoid stale closures
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const helpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoized slides data
  const slides = useMemo(() => [
    {
      id: 1,
      text: " Our science",
      highlight: "has not explained Consciousness",
      bgGradient: "from-gray-600/20 to-gray-800/20",
      category: "Critique"
    },
    {
      id: 2,
      text: "Philosophy offers complexity",
      highlight: "but rarely clarity",
      bgGradient: "from-stone-400/20 to-stone-700/20",
      category: "Critique"
    },
    {
      id: 3,
      text: "Religion provides comfort",
      highlight: "but is fraught with dogmas",
      bgGradient: "from-slate-500/20 to-gray-900/20",
      category: "Critique"
    },
    {
      id: 4,
      text: "DOT argues Consciousness is fundamental",
      highlight: "all else is virtual",
      bgGradient: "from-blue-900/20 to-gray-700/20",
      category: "Paradigm Shift"
    },
    {
      id: 5,
      text: "Subjectivity bends to the scientific method",
      highlight: "it is measurable and predictable",
      bgGradient: "from-amber-500/20 to-orange-600/20",
      category: "Core Insight"
    },
    {
      id: 6,
      text: "What is a Digital Organism (D.O.)?",
      highlight: "A living computational system contending with entropy and complexity",
      bgGradient: "from-emerald-500/20 to-teal-700/20",
      category: "Definition"
    },
    {
      id: 7,
      text: "You are Little c:",
      highlight: "fragment of Consciousness immersed in a virtual reality frame (RF)",
      bgGradient: "from-indigo-500/20 to-purple-600/20",
      category: "Core Theory"
    },
    {
      id: 8,
      text: "Reality is data",
      highlight: "structured information processed by Little c",
      bgGradient: "from-violet-500/20 to-purple-700/20",
      category: "Reality"
    },
    {
      id: 9,
      text: "Intent is your interface",
      highlight: "and entropy is your obstacle",
      bgGradient: "from-teal-500/20 to-blue-600/20",
      category: "Practice"
    },
    {
      id: 10,
      text: "DOT is not a belief",
      highlight: "it is a model of reality",
      bgGradient: "from-purple-700/20 to-indigo-900/20",
      category: "Framework"
    },
    {
      id: 11,
      text: "In DOT, Love (without any connotations)",
      highlight: "is a necessity",
      bgGradient: "from-rose-500/20 to-pink-600/20",
      category: "Core Principle"
    },
    {
      id: 12,
      text: "Fear is the opposite of Love",
      highlight: "high entropy creates chaotic, fearful being - low entropy creates stable, loving systems",
      bgGradient: "from-red-600/20 to-orange-700/20",
      category: "Core Principle"
    },
    {
      id: 13,
      text: "Welcome to",
      highlight: "Consciousness 101",
      bgGradient: "from-blue-500/20 to-cyan-600/20",
      category: "Welcome"
    }
  ], []);

  // Memoized helper functions
  const getCategoryGradient = useCallback((category: string) => {
    return CATEGORY_GRADIENTS[category as keyof typeof CATEGORY_GRADIENTS] || "from-gray-400 to-gray-600";
  }, []);

  const getCategoryClass = useCallback((category: string) => {
    return CATEGORY_CLASSES[category as keyof typeof CATEGORY_CLASSES] || "category-default";
  }, []);

  // Optimized state update function
  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Cleanup function
  const cleanupTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (helpTimerRef.current) {
      clearTimeout(helpTimerRef.current);
      helpTimerRef.current = null;
    }
  }, []);

  // Auto-play effect with optimized state management
  useEffect(() => {
    if (!state.isPlaying || state.isHovered || state.isFocused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setState(prev => {
        const nextSlide = (prev.currentSlide + 1) % slides.length;
        // If we're at the last slide, stop auto-playing
        if (nextSlide === 0) {
          return { ...prev, isPlaying: false };
        }
        return { ...prev, currentSlide: nextSlide, direction: 1 };
      });
    }, SLIDE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [slides.length, state.isPlaying, state.isHovered, state.isFocused]);

  // Handle keyboard help display - show only once on first keyboard focus
  useEffect(() => {
    if (state.isFocused && !state.hasShownHelp) {
      updateState({ showKeyboardHelp: true, hasShownHelp: true });
      
      // Hide the help after 4 seconds
      helpTimerRef.current = setTimeout(() => {
        updateState({ showKeyboardHelp: false });
      }, HELP_DISPLAY_DURATION);
    }
    
    return () => {
      if (helpTimerRef.current) {
        clearTimeout(helpTimerRef.current);
        helpTimerRef.current = null;
      }
    };
  }, [state.isFocused, state.hasShownHelp, updateState]);

  // Navigation functions with optimized state updates
  const nextSlide = useCallback(() => {
    setState(prev => ({
      ...prev,
      direction: 1,
      currentSlide: (prev.currentSlide + 1) % slides.length
    }));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setState(prev => ({
      ...prev,
      direction: -1,
      currentSlide: (prev.currentSlide - 1 + slides.length) % slides.length
    }));
  }, [slides.length]);

  const togglePlayPause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const goToSlide = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      direction: index > prev.currentSlide ? 1 : -1,
      currentSlide: index
    }));
  }, []);

  // Keyboard navigation with optimized state updates
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if slideshow is in viewport and handle keyboard navigation
      const slideshowElement = document.querySelector('.slideshow-container');
      if (!slideshowElement) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          updateState({ isFocused: true });
          prevSlide();
          break;
        case 'ArrowRight':
          event.preventDefault();
          updateState({ isFocused: true });
          nextSlide();
          break;
        case ' ':
        case 'Space':
          event.preventDefault();
          updateState({ isFocused: true });
          togglePlayPause();
          break;
        case 'Escape':
          event.preventDefault();
          updateState({ 
            isPlaying: false, 
            isFocused: false, 
            showKeyboardHelp: false 
          });
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          event.preventDefault();
          updateState({ isFocused: true });
          const slideIndex = parseInt(event.key) - 1;
          if (slideIndex < slides.length) {
            goToSlide(slideIndex);
          }
          break;
        case '0':
          event.preventDefault();
          updateState({ isFocused: true });
          if (slides.length >= 10) {
            goToSlide(9);
          }
          break;
        default:
          // Handle slides 11-13 with specific key combinations
          if (event.key === '!' && slides.length >= 11) { // Shift + 1
            event.preventDefault();
            updateState({ isFocused: true });
            goToSlide(10);
          } else if (event.key === '@' && slides.length >= 12) { // Shift + 2
            event.preventDefault();
            updateState({ isFocused: true });
            goToSlide(11);
          } else if (event.key === '#' && slides.length >= 13) { // Shift + 3
            event.preventDefault();
            updateState({ isFocused: true });
            goToSlide(12);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, updateState, nextSlide, prevSlide, togglePlayPause, goToSlide]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers]);

  return (
    <div 
      className="slideshow-container relative w-full max-w-4xl mx-auto mb-16"
      onMouseEnter={() => updateState({ isHovered: true })}
      onMouseLeave={() => updateState({ isHovered: false })}
      onFocus={(e) => {
        // Only set focused if it was triggered by keyboard navigation
        if (e.target === e.currentTarget) {
          updateState({ isFocused: true });
        }
      }}
      onBlur={() => {
        updateState({ isFocused: false, showKeyboardHelp: false });
      }}
      tabIndex={0}
      role="region"
      aria-label="DOT Consciousness Slideshow"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Floating container with enhanced shadows and curves */}
      <div className="relative animate-float">
        {/* Enhanced background glow */}
        <div className="absolute -inset-6 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2rem] blur-xl opacity-40 animate-pulse"></div>
        
        {/* Main floating card */}
        <div className={`slideshow-float slideshow-enter relative ${
          isLargeScreen 
            ? 'h-60 md:h-72 lg:h-80' 
            : 'h-52 md:h-60 lg:h-72'
        } overflow-hidden bg-card/80 backdrop-blur-3xl rounded-[1.5rem] border border-border/20 shadow-2xl`}>
          {/* Dynamic background gradient */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${slides[state.currentSlide].bgGradient} rounded-[1.5rem] opacity-20`}
            key={`bg-${state.currentSlide}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{ duration: 1.2 }}
          />
          
          {/* Enhanced grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}></div>

          {/* Visual slide indicator strip with bright blue color */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent slideshow-progress-glow">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              initial={{ width: "0%" }}
              animate={{ width: `${((state.currentSlide + 1) / slides.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Auto-play progress indicator with bright blue color */}
          {state.isPlaying && !state.isHovered && !state.isFocused && (
            <motion.div
              className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500/60 to-blue-600/60 z-10"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 7, ease: "linear", repeat: Infinity }}
              key={state.currentSlide}
            />
          )}

          {/* Keyboard shortcuts help - appears when focused */}
          {state.showKeyboardHelp && (
            <motion.div
              className="absolute top-16 right-6 z-50 bg-background/95 backdrop-blur-xl rounded-lg px-3 py-2 border border-border/30 shadow-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">←→</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd>
                  <span>Play/Pause</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">1-9</kbd>
                  <span>Jump to slide</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Category indicator with enhanced design and modern gradients */}
          <div className="absolute top-4 left-6 z-30">
            <motion.div 
              className={`slideshow-button category-indicator-glow ${getCategoryClass(slides[state.currentSlide].category)} bg-gradient-to-r ${getCategoryGradient(slides[state.currentSlide].category)} backdrop-blur-xl rounded-full px-4 py-2 border border-white/20 shadow-lg flex items-center space-x-2 category-pulse`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={`category-${state.currentSlide}`}
              transition={{ duration: 0.3 }}
              style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              <motion.div 
                className="w-2 h-2 rounded-full bg-white/90 shadow-lg"
                animate={{ 
                  scale: [1, 1.3, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(255, 255, 255, 0.4)',
                    '0 0 0 4px rgba(255, 255, 255, 0.1)',
                    '0 0 0 0 rgba(255, 255, 255, 0)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="text-sm font-semibold text-white drop-shadow-sm tracking-wide">
                {slides[state.currentSlide].category}
              </div>
            </motion.div>
          </div>

          {/* Progress indicator */}
          <div className="absolute top-4 right-16 z-30">
            <motion.div 
              className="slideshow-button bg-background/90 backdrop-blur-xl rounded-full px-3 py-2 border border-border/30 shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xs text-muted-foreground/90 font-mono font-medium tracking-wider">
                {String(state.currentSlide + 1).padStart(2, '0')}/{String(slides.length).padStart(2, '0')}
              </div>
            </motion.div>
          </div>

          {/* Play/Pause control */}
          <div className="absolute top-4 right-4 z-30">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
              className="slideshow-button p-3 text-muted-foreground hover:text-foreground transition-all duration-300 bg-background/90 backdrop-blur-xl rounded-full hover:bg-background border border-border/30 hover:border-border/60 shadow-lg hover:shadow-xl"
              title={state.isPlaying ? "Pause slideshow (Spacebar)" : "Play slideshow (Spacebar)"}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={state.isPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {state.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </motion.button>
          </div>

          <AnimatePresence initial={false} custom={state.direction}>
            <motion.div
              key={state.currentSlide}
              custom={state.direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 flex flex-col justify-center items-center px-10 py-8 text-center"
            >
              <motion.div
                className={`${
                  isLargeScreen 
                    ? 'text-2xl md:text-3xl lg:text-5xl' 
                    : 'text-xl md:text-2xl lg:text-4xl'
                } font-light text-foreground mb-6 leading-tight max-w-4xl`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{ 
                  fontFamily: 'Inter, "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                  fontWeight: '300',
                  letterSpacing: '-0.025em',
                  lineHeight: '1.2',
                  fontFeatureSettings: '"ss01" on, "ss02" on'
                }}
              >
                {slides[state.currentSlide].text}
              </motion.div>
              <motion.div
                className={`${
                  isLargeScreen 
                    ? 'text-lg md:text-xl lg:text-2xl' 
                    : 'text-base md:text-lg lg:text-xl'
                } text-primary font-medium italic leading-relaxed max-w-5xl slideshow-text-highlight`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{ 
                  fontFamily: slides[state.currentSlide].highlight.includes('∝') ? 'JetBrains Mono, "SF Mono", Consolas, monospace' : 'Inter, "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                  fontWeight: '500',
                  letterSpacing: '-0.01em',
                  lineHeight: '1.6',
                  fontFeatureSettings: '"ss01" on, "cv01" on'
                }}
              >
                {slides[state.currentSlide].highlight}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Enhanced navigation arrows - positioned outside the content area */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="slideshow-button nav-arrow-left absolute left-4 top-1/2 transform -translate-y-1/2 p-3 text-muted-foreground hover:text-foreground transition-all duration-300 bg-background/90 backdrop-blur-xl rounded-full hover:bg-background border border-border/30 hover:border-border/60 shadow-lg hover:shadow-xl z-30"
            title="Previous slide (Left arrow)"
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="slideshow-button nav-arrow-right absolute right-4 top-1/2 transform -translate-y-1/2 p-3 text-muted-foreground hover:text-foreground transition-all duration-300 bg-background/90 backdrop-blur-xl rounded-full hover:bg-background border border-border/30 hover:border-border/60 shadow-lg hover:shadow-xl z-30"
            title="Next slide (Right arrow)"
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {/* Enhanced progress dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-30">
            <div className="slideshow-button flex space-x-2 bg-background/90 backdrop-blur-xl rounded-full px-4 py-2 border border-border/30 shadow-lg">
              {slides.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSlide(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-500 relative ${
                    index === state.currentSlide 
                      ? 'bg-primary scale-150 shadow-lg shadow-primary/60 progress-dot-active' 
                      : 'bg-muted-foreground/40 hover:bg-muted-foreground/70 hover:scale-125'
                  }`}
                  title={`Slide ${index + 1}: ${slides[index].text} (Press ${index + 1} to jump here)`}
                  whileHover={{ scale: index === state.currentSlide ? 1.5 : 1.25 }}
                  whileTap={{ scale: 0.8 }}
                  aria-label={`Go to slide ${index + 1}: ${slides[index].text}`}
                >
                  {index === state.currentSlide && (
                    <motion.div 
                      className="absolute inset-0 bg-primary rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error boundary component for the slideshow
class SlideshowErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CompactSlideshow Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full max-w-4xl mx-auto mb-16 h-60 md:h-72 lg:h-80">
          <div className="flex items-center justify-center h-full bg-card/80 backdrop-blur-3xl rounded-[1.5rem] border border-border/20 shadow-2xl">
            <div className="text-center p-8">
              <h3 className="text-lg font-medium text-foreground mb-2">
                Welcome to DOT
              </h3>
              <p className="text-muted-foreground">
                Digital Organism Theory - A new model of consciousness and reality
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapped component with error boundary
const CompactSlideshowWithErrorBoundary: React.FC = () => (
  <SlideshowErrorBoundary>
    <CompactSlideshow />
  </SlideshowErrorBoundary>
);

export default CompactSlideshowWithErrorBoundary;
