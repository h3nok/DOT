import React, { ComponentType, memo, Suspense } from 'react';

// Placeholder for LogoProvider - will be replaced with actual import when available
const LogoProvider: React.ComponentType<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Simple error boundary implementation
class SimpleErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('Logo error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Error fallback component for logo errors
const LogoErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div 
    className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full"
    role="img"
    aria-label="Logo unavailable"
    title={`Logo error: ${error.message}`}
  >
    <span className="text-xs text-gray-600">•</span>
  </div>
);

// Loading fallback for lazy-loaded logos
const LogoLoadingFallback: React.FC = () => (
  <div 
    className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full animate-pulse"
    role="img"
    aria-label="Logo loading"
  >
    <span className="text-xs text-gray-400">•</span>
  </div>
);

// HOC for logo optimization
export function withLogoOptimization<T extends object>(
  Component: ComponentType<T>
): ComponentType<T> {
  const OptimizedLogo = memo((props: T) => {
    return (
      <SimpleErrorBoundary fallback={LogoErrorFallback}>
        <Suspense fallback={<LogoLoadingFallback />}>
          <Component {...props} />
        </Suspense>
      </SimpleErrorBoundary>
    );
  });

  OptimizedLogo.displayName = `withLogoOptimization(${Component.displayName || Component.name})`;
  
  return OptimizedLogo;
}

// HOC for logo context provision
export function withLogoContext<T extends object>(
  Component: ComponentType<T>
): ComponentType<T> {
  const ContextualizedLogo = (props: T) => {
    return (
      <LogoProvider>
        <Component {...props} />
      </LogoProvider>
    );
  };

  ContextualizedLogo.displayName = `withLogoContext(${Component.displayName || Component.name})`;
  
  return ContextualizedLogo;
}

// Combined HOC for full logo optimization
export function withFullLogoOptimization<T extends object>(
  Component: ComponentType<T>
): ComponentType<T> {
  return withLogoOptimization(withLogoContext(Component));
}

// Logo preloader utility
export const preloadLogo = () => {
  // This could preload any logo assets if needed
  // For now, it's a placeholder for future enhancement
  return Promise.resolve();
};

// Logo performance utilities
export const logoPerformanceUtils = {
  // Check if device supports high performance animations
  supportsHighPerformance: () => {
    // Check for various performance indicators
    const hasGPU = !!(window as any).WebGLRenderingContext;
    const hasHighMemory = (navigator as any).deviceMemory ? (navigator as any).deviceMemory >= 4 : true;
    const hasHighConcurrency = navigator.hardwareConcurrency ? navigator.hardwareConcurrency >= 4 : true;
    
    return hasGPU && hasHighMemory && hasHighConcurrency;
  },
  
  // Get recommended animation settings based on device
  getRecommendedSettings: () => {
    const supportsHigh = logoPerformanceUtils.supportsHighPerformance();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    return {
      animationEnabled: !prefersReducedMotion,
      performanceMode: supportsHigh ? 'high' : 'balanced',
      priority: supportsHigh ? 'high' : 'low',
    };
  },
  
  // Monitor frame rate
  measureFrameRate: (callback: (fps: number) => void) => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measure = () => {
      frameCount++;
      const currentTime = performance.now();
      const delta = currentTime - lastTime;
      
      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        callback(fps);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
  },
};
