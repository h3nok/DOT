import { useEffect, useRef, useCallback } from 'react';

export interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  componentName?: string;
}

export const usePerformanceMonitor = (componentName?: string) => {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTime.current;
    
    renderCount.current += 1;
    renderTimes.current.push(renderTime);
    
    // Keep only last 100 render times for average calculation
    if (renderTimes.current.length > 100) {
      renderTimes.current.shift();
    }
    
    lastRenderTime.current = currentTime;

    // Log performance warnings in development
    if (import.meta.env.DEV) {
      if (renderTime > 16) { // 60fps threshold
        console.warn(
          `Slow render detected in ${componentName || 'Unknown Component'}: ${renderTime.toFixed(2)}ms`
        );
      }
      
      if (renderCount.current % 50 === 0) {
        const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
        console.debug(
          `Performance stats for ${componentName || 'Unknown Component'}:`,
          {
            renders: renderCount.current,
            avgRenderTime: avgRenderTime.toFixed(2) + 'ms',
            lastRenderTime: renderTime.toFixed(2) + 'ms'
          }
        );
      }
    }
  });

  const getMetrics = useCallback((): PerformanceMetrics => {
    const avgRenderTime = renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0;

    return {
      renderCount: renderCount.current,
      lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0,
      averageRenderTime: avgRenderTime,
      componentName
    };
  }, [componentName]);

  const resetMetrics = useCallback(() => {
    renderCount.current = 0;
    renderTimes.current = [];
    lastRenderTime.current = performance.now();
  }, []);

  return {
    getMetrics,
    resetMetrics,
    renderCount: renderCount.current
  };
};
