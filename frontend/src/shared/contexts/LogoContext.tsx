import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Logo state interface
interface LogoState {
  globalAnimationEnabled: boolean;
  interactionCount: number;
  lastInteraction: number;
  performanceMode: 'high' | 'balanced' | 'low';
  loadingPriority: 'high' | 'low';
  errorCount: number;
  renderCount: number;
}

// Logo actions
type LogoAction =
  | { type: 'TOGGLE_GLOBAL_ANIMATION'; payload?: boolean }
  | { type: 'RECORD_INTERACTION' }
  | { type: 'SET_PERFORMANCE_MODE'; payload: LogoState['performanceMode'] }
  | { type: 'SET_LOADING_PRIORITY'; payload: LogoState['loadingPriority'] }
  | { type: 'INCREMENT_ERROR_COUNT' }
  | { type: 'INCREMENT_RENDER_COUNT' }
  | { type: 'RESET_COUNTERS' };

// Initial state
const initialState: LogoState = {
  globalAnimationEnabled: true,
  interactionCount: 0,
  lastInteraction: 0,
  performanceMode: 'balanced',
  loadingPriority: 'low',
  errorCount: 0,
  renderCount: 0,
};

// Logo reducer
const logoReducer = (state: LogoState, action: LogoAction): LogoState => {
  switch (action.type) {
    case 'TOGGLE_GLOBAL_ANIMATION':
      return {
        ...state,
        globalAnimationEnabled: action.payload ?? !state.globalAnimationEnabled,
      };
    
    case 'RECORD_INTERACTION':
      return {
        ...state,
        interactionCount: state.interactionCount + 1,
        lastInteraction: Date.now(),
      };
    
    case 'SET_PERFORMANCE_MODE':
      return {
        ...state,
        performanceMode: action.payload,
      };
    
    case 'SET_LOADING_PRIORITY':
      return {
        ...state,
        loadingPriority: action.payload,
      };
    
    case 'INCREMENT_ERROR_COUNT':
      return {
        ...state,
        errorCount: state.errorCount + 1,
      };
    
    case 'INCREMENT_RENDER_COUNT':
      return {
        ...state,
        renderCount: state.renderCount + 1,
      };
    
    case 'RESET_COUNTERS':
      return {
        ...state,
        interactionCount: 0,
        errorCount: 0,
        renderCount: 0,
      };
    
    default:
      return state;
  }
};

// Context value interface
interface LogoContextValue {
  state: LogoState;
  dispatch: React.Dispatch<LogoAction>;
  
  // Convenience methods
  toggleGlobalAnimation: (enabled?: boolean) => void;
  recordInteraction: () => void;
  setPerformanceMode: (mode: LogoState['performanceMode']) => void;
  setLoadingPriority: (priority: LogoState['loadingPriority']) => void;
  incrementErrorCount: () => void;
  incrementRenderCount: () => void;
  resetCounters: () => void;
  
  // Computed properties
  shouldOptimizeForPerformance: boolean;
  recentInteraction: boolean;
}

// Context
const LogoContext = createContext<LogoContextValue | null>(null);

// Provider component
interface LogoProviderProps {
  children: ReactNode;
}

export const LogoProvider: React.FC<LogoProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(logoReducer, initialState);
  
  // Convenience methods
  const toggleGlobalAnimation = useCallback((enabled?: boolean) => {
    dispatch({ type: 'TOGGLE_GLOBAL_ANIMATION', payload: enabled });
  }, []);
  
  const recordInteraction = useCallback(() => {
    dispatch({ type: 'RECORD_INTERACTION' });
  }, []);
  
  const setPerformanceMode = useCallback((mode: LogoState['performanceMode']) => {
    dispatch({ type: 'SET_PERFORMANCE_MODE', payload: mode });
  }, []);
  
  const setLoadingPriority = useCallback((priority: LogoState['loadingPriority']) => {
    dispatch({ type: 'SET_LOADING_PRIORITY', payload: priority });
  }, []);
  
  const incrementErrorCount = useCallback(() => {
    dispatch({ type: 'INCREMENT_ERROR_COUNT' });
  }, []);
  
  const incrementRenderCount = useCallback(() => {
    dispatch({ type: 'INCREMENT_RENDER_COUNT' });
  }, []);
  
  const resetCounters = useCallback(() => {
    dispatch({ type: 'RESET_COUNTERS' });
  }, []);
  
  // Computed properties
  const shouldOptimizeForPerformance = state.performanceMode === 'low' || state.errorCount > 5;
  const recentInteraction = Date.now() - state.lastInteraction < 2000; // 2 seconds
  
  const value: LogoContextValue = {
    state,
    dispatch,
    toggleGlobalAnimation,
    recordInteraction,
    setPerformanceMode,
    setLoadingPriority,
    incrementErrorCount,
    incrementRenderCount,
    resetCounters,
    shouldOptimizeForPerformance,
    recentInteraction,
  };
  
  return (
    <LogoContext.Provider value={value}>
      {children}
    </LogoContext.Provider>
  );
};

// Custom hook
export const useLogoContext = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogoContext must be used within a LogoProvider');
  }
  return context;
};

// Export types
export type { LogoState, LogoAction, LogoContextValue };
