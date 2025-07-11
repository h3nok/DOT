import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSlideshow, Slide } from '../../../../shared/hooks/useSlideshow';
import { usePerformanceMonitor } from '../../../../shared/hooks/usePerformanceMonitor';
import SlideContent from './SlideContent';
import SlideControls from './SlideControls';
import SlideNavigation from './SlideNavigation';

interface SlideshowContainerProps {
  slides: Slide[];
  className?: string;
}

// Memoized gradient and class mappings
const CATEGORY_GRADIENTS = {
  "Critique": "from-red-500 via-orange-500 to-yellow-500",
  "Paradigm Shift": "from-blue-500 via-purple-500 to-indigo-600",
  "Core Insight": "from-amber-400 via-orange-500 to-red-500",
  "Definition": "from-emerald-400 via-teal-500 to-cyan-600",
  "Identity": "from-green-400 via-emerald-500 to-teal-600",
  "Core Theory": "from-indigo-500 via-purple-600 to-pink-600",
  "Mechanics": "from-cyan-400 via-blue-500 to-indigo-600",
  "Framework": "from-violet-500 via-purple-600 to-fuchsia-600",
  "Core Principle": "from-rose-400 via-pink-500 to-red-600",
  "Welcome": "from-blue-400 via-indigo-500 to-purple-600"
} as const;

const CATEGORY_CLASSES = {
  "Critique": "category-critique",
  "Paradigm Shift": "category-paradigm-shift", 
  "Core Insight": "category-core-insight",
  "Definition": "category-definition",
  "Identity": "category-identity",
  "Core Theory": "category-core-theory",
  "Mechanics": "category-mechanics",
  "Framework": "category-framework",
  "Core Principle": "category-core-principle",
  "Welcome": "category-welcome"
} as const;

const SlideshowContainer: React.FC<SlideshowContainerProps> = ({
  slides,
  className = ''
}) => {
  // Performance monitoring
  usePerformanceMonitor('SlideshowContainer');

  // Slideshow logic
  const {
    currentSlide,
    direction,
    isPlaying,
    nextSlide,
    prevSlide,
    goToSlide,
    togglePlayback,
    setHovered,
    setFocused,
    currentSlideData
  } = useSlideshow(slides, {
    autoPlay: true,
    interval: 7000,
    pauseOnHover: true,
    keyboardNavigation: true
  });

  const getCategoryGradient = (category: string) => {
    return CATEGORY_GRADIENTS[category as keyof typeof CATEGORY_GRADIENTS] || "from-gray-400 to-gray-600";
  };

  const getCategoryClass = (category: string) => {
    return CATEGORY_CLASSES[category as keyof typeof CATEGORY_CLASSES] || "category-default";
  };

  return (
    <div 
      className={`relative w-full max-w-4xl mx-auto mb-16 h-60 md:h-72 lg:h-80 ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      role="region"
      aria-label="Digital Organism Theory concepts slideshow"
      aria-live="polite"
    >
      {/* Main container with glass effect */}
      <div className="relative h-full bg-card/80 backdrop-blur-3xl rounded-[1.5rem] border border-border/20 shadow-2xl overflow-hidden">
        {/* Slide content area */}
        <div className="relative h-full">
          <AnimatePresence mode="wait" custom={direction}>
            <SlideContent
              key={currentSlide}
              slide={currentSlideData}
              direction={direction}
              categoryGradient={getCategoryGradient(currentSlideData.category)}
              categoryClass={getCategoryClass(currentSlideData.category)}
            />
          </AnimatePresence>
        </div>

        {/* Navigation and controls */}
        <SlideNavigation
          onPrevious={prevSlide}
          onNext={nextSlide}
          currentSlide={currentSlide}
          onGoToSlide={goToSlide}
          categoryGradients={CATEGORY_GRADIENTS}
          slides={slides}
        />

        {/* Controls positioned at bottom right */}
        <div className="absolute bottom-6 right-6">
          <SlideControls
            isPlaying={isPlaying}
            onTogglePlayback={togglePlayback}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(SlideshowContainer);
