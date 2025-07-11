import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  currentSlide: number;
  onGoToSlide: (index: number) => void;
  categoryGradients: Record<string, string>;
  slides: Array<{ id: number; category: string }>;
}

const SlideNavigation: React.FC<SlideNavigationProps> = ({
  onPrevious,
  onNext,
  currentSlide,
  onGoToSlide,
  categoryGradients,
  slides
}) => {
  return (
    <>
      {/* Arrow Navigation */}
      <motion.button
        onClick={onPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-card/50 backdrop-blur-sm border border-border/20 text-muted-foreground hover:text-foreground transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>

      <motion.button
        onClick={onNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-card/50 backdrop-blur-sm border border-border/20 text-muted-foreground hover:text-foreground transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            const gradient = categoryGradients[slide.category] || "from-gray-400 to-gray-600";
            
            return (
              <motion.button
                key={slide.id}
                onClick={() => onGoToSlide(index)}
                className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                  isActive ? 'scale-110' : 'scale-100 opacity-60 hover:opacity-80'
                }`}
                whileHover={{ scale: isActive ? 1.2 : 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to slide ${index + 1}`}
              >
                <div 
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${gradient}`}
                />
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default React.memo(SlideNavigation);
