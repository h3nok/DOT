import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Types for different state slices
export interface UserPreferences {
  fontSize: 'base' | 'lg' | 'xl';
  focusMode: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  autoSave: boolean;
  notifications: boolean;
}

export interface UIState {
  isMobileMenuOpen: boolean;
  isSidebarOpen: boolean;
  currentPage: string;
  breadcrumbs: string[];
  loadingStates: Record<string, boolean>;
}

export interface ReadingState {
  currentArticle: string | null;
  readingProgress: Record<string, number>;
  bookmarks: string[];
  readingHistory: Array<{
    id: string;
    title: string;
    timestamp: number;
    progress: number;
  }>;
}

export interface AppState {
  userPreferences: UserPreferences;
  ui: UIState;
  reading: ReadingState;
  lastUpdated: number;
}

// Action types
export type AppAction =
  | { type: 'SET_FONT_SIZE'; payload: UserPreferences['fontSize'] }
  | { type: 'TOGGLE_FOCUS_MODE'; payload?: boolean }
  | { type: 'SET_REDUCE_MOTION'; payload: boolean }
  | { type: 'SET_HIGH_CONTRAST'; payload: boolean }
  | { type: 'SET_AUTO_SAVE'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS'; payload: boolean }
  | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
  | { type: 'TOGGLE_SIDEBAR'; payload?: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SET_BREADCRUMBS'; payload: string[] }
  | { type: 'SET_LOADING_STATE'; payload: { key: string; loading: boolean } }
  | { type: 'SET_CURRENT_ARTICLE'; payload: string | null }
  | { type: 'UPDATE_READING_PROGRESS'; payload: { articleId: string; progress: number } }
  | { type: 'ADD_BOOKMARK'; payload: string }
  | { type: 'REMOVE_BOOKMARK'; payload: string }
  | { type: 'ADD_TO_HISTORY'; payload: { id: string; title: string; progress: number } }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  userPreferences: {
    fontSize: 'lg',
    focusMode: false,
    reduceMotion: false,
    highContrast: false,
    autoSave: true,
    notifications: true,
  },
  ui: {
    isMobileMenuOpen: false,
    isSidebarOpen: false,
    currentPage: '/',
    breadcrumbs: ['Home'],
    loadingStates: {},
  },
  reading: {
    currentArticle: null,
    readingProgress: {},
    bookmarks: [],
    readingHistory: [],
  },
  lastUpdated: Date.now(),
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FONT_SIZE':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, fontSize: action.payload },
        lastUpdated: Date.now(),
      };

    case 'TOGGLE_FOCUS_MODE':
      return {
        ...state,
        userPreferences: { 
          ...state.userPreferences, 
          focusMode: action.payload !== undefined ? action.payload : !state.userPreferences.focusMode 
        },
        lastUpdated: Date.now(),
      };

    case 'SET_REDUCE_MOTION':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, reduceMotion: action.payload },
        lastUpdated: Date.now(),
      };

    case 'SET_HIGH_CONTRAST':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, highContrast: action.payload },
        lastUpdated: Date.now(),
      };

    case 'SET_AUTO_SAVE':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, autoSave: action.payload },
        lastUpdated: Date.now(),
      };

    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, notifications: action.payload },
        lastUpdated: Date.now(),
      };

    case 'TOGGLE_MOBILE_MENU':
      return {
        ...state,
        ui: { 
          ...state.ui, 
          isMobileMenuOpen: action.payload !== undefined ? action.payload : !state.ui.isMobileMenuOpen 
        },
        lastUpdated: Date.now(),
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: { 
          ...state.ui, 
          isSidebarOpen: action.payload !== undefined ? action.payload : !state.ui.isSidebarOpen 
        },
        lastUpdated: Date.now(),
      };

    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        ui: { ...state.ui, currentPage: action.payload },
        lastUpdated: Date.now(),
      };

    case 'SET_BREADCRUMBS':
      return {
        ...state,
        ui: { ...state.ui, breadcrumbs: action.payload },
        lastUpdated: Date.now(),
      };

    case 'SET_LOADING_STATE':
      return {
        ...state,
        ui: { 
          ...state.ui, 
          loadingStates: { 
            ...state.ui.loadingStates, 
            [action.payload.key]: action.payload.loading 
          } 
        },
        lastUpdated: Date.now(),
      };

    case 'SET_CURRENT_ARTICLE':
      return {
        ...state,
        reading: { ...state.reading, currentArticle: action.payload },
        lastUpdated: Date.now(),
      };

    case 'UPDATE_READING_PROGRESS':
      return {
        ...state,
        reading: { 
          ...state.reading, 
          readingProgress: { 
            ...state.reading.readingProgress, 
            [action.payload.articleId]: action.payload.progress 
          } 
        },
        lastUpdated: Date.now(),
      };

    case 'ADD_BOOKMARK':
      return {
        ...state,
        reading: { 
          ...state.reading, 
          bookmarks: state.reading.bookmarks.includes(action.payload) 
            ? state.reading.bookmarks 
            : [...state.reading.bookmarks, action.payload] 
        },
        lastUpdated: Date.now(),
      };

    case 'REMOVE_BOOKMARK':
      return {
        ...state,
        reading: { 
          ...state.reading, 
          bookmarks: state.reading.bookmarks.filter(id => id !== action.payload) 
        },
        lastUpdated: Date.now(),
      };

    case 'ADD_TO_HISTORY':
      const existingIndex = state.reading.readingHistory.findIndex(item => item.id === action.payload.id);
      const newHistory = existingIndex >= 0 
        ? state.reading.readingHistory.map((item, index) => 
            index === existingIndex 
              ? { ...action.payload, timestamp: Date.now() }
              : item
          )
        : [{ ...action.payload, timestamp: Date.now() }, ...state.reading.readingHistory.slice(0, 9)];
      
      return {
        ...state,
        reading: { ...state.reading, readingHistory: newHistory },
        lastUpdated: Date.now(),
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context interface
interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience methods
  setFontSize: (size: UserPreferences['fontSize']) => void;
  toggleFocusMode: (enabled?: boolean) => void;
  toggleMobileMenu: (open?: boolean) => void;
  updateReadingProgress: (articleId: string, progress: number) => void;
  addBookmark: (articleId: string) => void;
  removeBookmark: (articleId: string) => void;
  addToHistory: (article: { id: string; title: string; progress: number }) => void;
  setLoading: (key: string, loading: boolean) => void;
}

// Context creation
const AppStateContext = createContext<AppStateContextValue | null>(null);

// Provider component
interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('appState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Only restore user preferences and reading state, not UI state
        Object.keys(parsedState.userPreferences || {}).forEach(key => {
          if (key in initialState.userPreferences) {
            dispatch({ 
              type: `SET_${key.toUpperCase()}` as any, 
              payload: parsedState.userPreferences[key] 
            });
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load app state from localStorage:', error);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      const stateToSave = {
        userPreferences: state.userPreferences,
        reading: state.reading,
        lastUpdated: state.lastUpdated,
      };
      localStorage.setItem('appState', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save app state to localStorage:', error);
    }
  }, [state.userPreferences, state.reading, state.lastUpdated]);

  // Convenience methods
  const setFontSize = (size: UserPreferences['fontSize']) => {
    dispatch({ type: 'SET_FONT_SIZE', payload: size });
  };

  const toggleFocusMode = (enabled?: boolean) => {
    dispatch({ type: 'TOGGLE_FOCUS_MODE', payload: enabled });
  };

  const toggleMobileMenu = (open?: boolean) => {
    dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: open });
  };

  const updateReadingProgress = (articleId: string, progress: number) => {
    dispatch({ type: 'UPDATE_READING_PROGRESS', payload: { articleId, progress } });
  };

  const addBookmark = (articleId: string) => {
    dispatch({ type: 'ADD_BOOKMARK', payload: articleId });
  };

  const removeBookmark = (articleId: string) => {
    dispatch({ type: 'REMOVE_BOOKMARK', payload: articleId });
  };

  const addToHistory = (article: { id: string; title: string; progress: number }) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: article });
  };

  const setLoading = (key: string, loading: boolean) => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { key, loading } });
  };

  const contextValue: AppStateContextValue = {
    state,
    dispatch,
    setFontSize,
    toggleFocusMode,
    toggleMobileMenu,
    updateReadingProgress,
    addBookmark,
    removeBookmark,
    addToHistory,
    setLoading,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook to use the context
export const useAppState = (): AppStateContextValue => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// Selector hooks for specific state slices
export const useUserPreferences = () => {
  const { state } = useAppState();
  return state.userPreferences;
};

export const useUIState = () => {
  const { state } = useAppState();
  return state.ui;
};

export const useReadingState = () => {
  const { state } = useAppState();
  return state.reading;
}; 