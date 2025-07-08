import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '../../contexts/AppStateContext';
import { withLogoOptimization } from './LogoOptimization';

// Enhanced accessibility with preference detection - integrated with app state
const usePrefersReducedMotion = () => {
  const { state } = useAppState();
  const [systemPreference, setSystemPreference] = useState(false);
  
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemPreference(mq.matches);
    const handler = () => setSystemPreference(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  
  // Respect both user preference and system preference
  return state.userPreferences.reduceMotion || systemPreference;
};

// Enhanced performance with intersection observer - memoized for better performance
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  useEffect(() => {
    if (!ref.current) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, memoizedOptions);

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [memoizedOptions]);

  return [ref, isIntersecting] as const;
};

// Enhanced TypeScript interfaces with better validation
interface DotLogoProps {
  size?: number;
  className?: string;
  variant?: 'icon' | 'full' | 'organism';
  interactive?: boolean;
  onHover?: () => void;
  onClick?: () => void;
  'aria-label'?: string;
  testId?: string;
  priority?: 'high' | 'low'; // For loading priority
  errorFallback?: React.ReactNode;
}

const DotLogo: React.FC<DotLogoProps> = memo(({ 
  size = 32, 
  className = "", 
  variant = "full",
  interactive = false,
  onHover,
  onClick,
  'aria-label': ariaLabel,
  testId,
  priority = 'low',
  errorFallback
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [logoRef, isVisible] = useIntersectionObserver({ 
    threshold: 0.1,
    rootMargin: priority === 'high' ? '50px' : '10px'
  });
  
  // Performance optimization: simplified animation logic
  const shouldAnimate = !reducedMotion && isVisible;
  
  // Memoized computed styles for better performance
  const computedStyles = useMemo(() => ({
    container: {
      width: size,
      height: size,
    },
    dot: {
      width: size * 0.6,
      height: size * 0.6,
      background: '#2563eb', // Bright blue to match theme
    },
    highlight: {
      width: size * 0.2,
      height: size * 0.2,
      top: '25%',
      left: '25%',
    },
    letter: {
      width: size * 0.8,
      height: size,
      fontSize: size * 0.7,
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      color: 'var(--foreground)',
    }
  }), [size]);

  // Enhanced interaction handlers with error boundaries
  const handleMouseEnter = useCallback(() => {
    try {
      if (interactive) {
        setIsHovered(true);
        onHover?.();
      }
    } catch (error) {
      console.warn('DotLogo: Error in hover handler:', error);
    }
  }, [interactive, onHover]);

  const handleMouseLeave = useCallback(() => {
    try {
      if (interactive) {
        setIsHovered(false);
      }
    } catch (error) {
      console.warn('DotLogo: Error in leave handler:', error);
    }
  }, [interactive]);

  const handleClick = useCallback(() => {
    try {
      if (interactive) {
        onClick?.();
      }
    } catch (error) {
      console.warn('DotLogo: Error in click handler:', error);
    }
  }, [interactive, onClick]);

  // Memoized animation props
  const animationProps = useMemo(() => {
    const baseAnimation = isHovered 
      ? { scale: [1, 1.1, 1] }
      : shouldAnimate 
        ? { scale: [1, 1.05, 1] }
        : { scale: 1 };
    
    return {
      whileHover: interactive ? { scale: 1.05 } : undefined,
      whileTap: interactive ? { scale: 0.95 } : undefined,
      transition: { type: "spring", stiffness: 400, damping: 17 },
      animate: baseAnimation,
      animationTransition: {
        duration: isHovered ? 0.3 : 3,
        repeat: shouldAnimate ? Infinity : 0,
        ease: "easeInOut"
      }
    };
  }, [interactive, isHovered, shouldAnimate]);

  // Error boundary fallback
  if (errorFallback && !size) {
    return <>{errorFallback}</>;
  }

  // Organism variant - just the blue dot with optimizations
  if (variant === 'organism') {
    return (
      <motion.div
        ref={logoRef}
        data-testid={testId}
        className={`relative inline-flex items-center justify-center cursor-pointer ${className}`}
        role="img"
        aria-label={ariaLabel || "Digital Organism"}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        whileHover={animationProps.whileHover}
        whileTap={animationProps.whileTap}
        transition={animationProps.transition}
      >
        <motion.div
          className="relative flex items-center justify-center"
          style={computedStyles.container}
        >
          <motion.div
            className="relative z-20 rounded-full"
            style={computedStyles.dot}
            animate={animationProps.animate}
            transition={animationProps.animationTransition}
          >
            <div
              className="absolute rounded-full bg-white opacity-30"
              style={computedStyles.highlight}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }
  
  // Icon variant - optimized with shared logic
  if (variant === 'icon') {
    return (
      <motion.div
        ref={logoRef}
        data-testid={testId}
        className={`relative inline-flex items-center justify-center cursor-pointer ${className}`}
        role="img"
        aria-label={ariaLabel || "DOT logo"}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        whileHover={animationProps.whileHover}
        whileTap={animationProps.whileTap}
        transition={animationProps.transition}
      >
        <motion.div
          className="relative flex items-center justify-center"
          style={computedStyles.container}
        >
          <motion.div
            className="relative z-20 rounded-full"
            style={computedStyles.dot}
            animate={animationProps.animate}
            transition={animationProps.animationTransition}
          >
            <div
              className="absolute rounded-full bg-white opacity-30"
              style={computedStyles.highlight}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }
  
  // Full variant - D.O.T with optimized rendering
  return (
    <div 
      ref={logoRef}
      data-testid={testId}
      className={`relative inline-flex items-center ${className}`} 
      role="img" 
      aria-label={ariaLabel || "DOT logo"}
    >
      {/* D letter */}
      <div
        className="relative flex items-center justify-center font-bold"
        style={computedStyles.letter}
      >
        D
      </div>
      
      {/* O as blue dot */}
      <div
        className="relative mx-1 flex items-center justify-center"
        style={{ width: size * 0.8, height: size }}
      >
        <motion.div
          className="relative z-20 rounded-full"
          style={{
            width: size * 0.5,
            height: size * 0.5,
            background: '#2563eb', // Bright blue to match theme
          }}
          animate={shouldAnimate ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={{ 
            duration: 3, 
            repeat: shouldAnimate ? Infinity : 0,
            ease: "easeInOut" 
          }}
        >
          {/* Simple white highlight - matching homepage style */}
          <div
            className="absolute rounded-full bg-white opacity-30"
            style={{
              width: size * 0.15,
              height: size * 0.15,
              top: '25%',
              left: '25%',
            }}
          />
        </motion.div>
      </div>
      
      {/* T letter */}
      <div
        className="relative flex items-center justify-center font-bold"
        style={computedStyles.letter}
      >
        T
      </div>
    </div>
  );
});

// Display name for better debugging
DotLogo.displayName = 'DotLogo';

// Export the optimized version as default
const OptimizedDotLogo = withLogoOptimization(DotLogo);

// Export the base component for advanced usage
export { DotLogo as DotLogoBase };

// A4 container utility (for blog post content)
export const A4_CONTAINER_STYLE: React.CSSProperties = {
  maxWidth: '900px', // Increased width for more comfortable reading
  minHeight: '1123px', // A4 height at 96dpi
  margin: '0 auto',
  background: 'var(--a4-bg, var(--background, #fff))', // Use theme background variable, fallback to white
  borderRadius: '16px',
  boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
  padding: '2.5rem 2.2rem',
  boxSizing: 'border-box',
  fontSize: '1.13rem',
  lineHeight: 1.7,
  fontFamily: 'Inter, system-ui, sans-serif',
  color: 'var(--a4-fg, var(--foreground, #222))', // Use theme foreground variable, fallback to dark
  overflowWrap: 'break-word',
};

export default OptimizedDotLogo;
