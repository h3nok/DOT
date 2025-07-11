import React from 'react';
import { motion } from 'framer-motion';
import { Slide } from '../../../../shared/hooks/useSlideshow';

interface SlideContentProps {
  slide: Slide;
  direction: number;
  categoryGradient: string;
  categoryClass: string;
}

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

const SlideContent: React.FC<SlideContentProps> = ({
  slide,
  direction,
  categoryGradient,
  categoryClass
}) => {
  return (
    <motion.div
      key={slide.id}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="relative text-center max-w-2xl mx-auto px-6">
        {/* Background gradient */}
        <div 
          className={`absolute inset-0 rounded-3xl opacity-10 blur-3xl bg-gradient-to-br ${slide.bgGradient}`}
          aria-hidden="true"
        />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Category badge */}
          <div className={`inline-flex items-center mb-6 ${categoryClass}`}>
            <div 
              className={`w-3 h-3 rounded-full bg-gradient-to-r ${categoryGradient} mr-2`}
              aria-hidden="true"
            />
            <span className="text-sm font-medium opacity-90">
              {slide.category}
            </span>
          </div>

          {/* Main text */}
          <div className="space-y-4">
            <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-tight text-foreground/90">
              {slide.text}{' '}
              <span className="font-medium text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {slide.highlight}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(SlideContent);
