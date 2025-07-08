import { useEffect, useCallback, useRef } from 'react';
import { useLogoContext } from '../contexts/LogoContext';

// Performance monitoring hook for logos
export const useLogoPerformanceMonitor = () => {
  const { state, incrementRenderCount, incrementErrorCount, setPerformanceMode } = useLogoContext();
  const renderTimes = useRef<number[]>([]);
  const errorTimes = useRef<number[]>([]);
  const lastRenderTime = useRef<number>(0);
  
  // Record render performance
  const recordRender = useCallback(() => {
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    
    if (lastRenderTime.current > 0) {
      renderTimes.current.push(renderTime);
      
      // Keep only last 10 render times
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }
      
      // Calculate average render time
      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
      
      // Adjust performance mode based on render times
      if (avgRenderTime > 16) { // 16ms = 60fps threshold
        setPerformanceMode('low');
      } else if (avgRenderTime > 8) {
        setPerformanceMode('balanced');
      } else {
        setPerformanceMode('high');
      }
    }
    
    lastRenderTime.current = now;
    incrementRenderCount();
  }, [incrementRenderCount, setPerformanceMode]);
  
  // Record error
  const recordError = useCallback((error: Error) => {
    console.warn('Logo performance error:', error);
    errorTimes.current.push(Date.now());
    incrementErrorCount();
    
    // If too many errors in short time, switch to low performance mode
    const recentErrors = errorTimes.current.filter(time => Date.now() - time < 10000); // 10 seconds
    if (recentErrors.length > 3) {
      setPerformanceMode('low');
    }
  }, [incrementErrorCount, setPerformanceMode]);
  
  // Auto-reset counters periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Reset old render times
      renderTimes.current = renderTimes.current.slice(-5);
      errorTimes.current = errorTimes.current.filter(time => Date.now() - time < 60000); // Keep errors from last minute
    }, 30000); // Clean up every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    recordRender,
    recordError,
    performanceMode: state.performanceMode,
    renderCount: state.renderCount,
    errorCount: state.errorCount,
  };
};

// FPS monitor hook
export const useFPSMonitor = () => {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsValues = useRef<number[]>([]);
  
  const measureFPS = useCallback(() => {
    frameCount.current++;
    const now = performance.now();
    const delta = now - lastTime.current;
    
    if (delta >= 1000) { // Update every second
      const fps = Math.round((frameCount.current * 1000) / delta);
      fpsValues.current.push(fps);
      
      // Keep only last 10 FPS measurements
      if (fpsValues.current.length > 10) {
        fpsValues.current.shift();
      }
      
      frameCount.current = 0;
      lastTime.current = now;
      
      return fps;
    }
    
    return null;
  }, []);
  
  const getAverageFPS = useCallback(() => {
    if (fpsValues.current.length === 0) return 0;
    return fpsValues.current.reduce((a, b) => a + b, 0) / fpsValues.current.length;
  }, []);
  
  return {
    measureFPS,
    getAverageFPS,
    currentFPSReadings: fpsValues.current,
  };
};
