import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Reading state types
export interface ReadingState {
  currentArticle: string | null;
  readingProgress: Record<string, number>;
  bookmarks: string[];
  readingHistory: Array<{
    id: string;
    title: string;
    timestamp: number;
    progress: number;
    url?: string;
    tags?: string[];
  }>;
  readingGoals: {
    dailyMinutes?: number;
    weeklyArticles?: number;
    currentStreak: number;
    longestStreak: number;
  };
  readingSettings: {
    autoProgress: boolean;
    showProgress: boolean;
    pauseOnScroll: boolean;
    estimateReadTime: boolean;
  };
}

export interface ReadingContextState {
  reading: ReadingState;
  lastUpdated: number;
}

// Reading actions
export type ReadingAction =
  | { type: 'SET_CURRENT_ARTICLE'; payload: string | null }
  | { type: 'UPDATE_READING_PROGRESS'; payload: { articleId: string; progress: number } }
  | { type: 'ADD_BOOKMARK'; payload: string }
  | { type: 'REMOVE_BOOKMARK'; payload: string }
  | { type: 'TOGGLE_BOOKMARK'; payload: string }
  | { type: 'ADD_TO_HISTORY'; payload: { id: string; title: string; progress: number; url?: string; tags?: string[] } }
  | { type: 'REMOVE_FROM_HISTORY'; payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'UPDATE_READING_GOALS'; payload: Partial<ReadingState['readingGoals']> }
  | { type: 'UPDATE_READING_SETTINGS'; payload: Partial<ReadingState['readingSettings']> }
  | { type: 'INCREMENT_STREAK' }
  | { type: 'RESET_STREAK' }
  | { type: 'RESET_READING_STATE' };

// Initial state
const initialState: ReadingContextState = {
  reading: {
    currentArticle: null,
    readingProgress: {},
    bookmarks: [],
    readingHistory: [],
    readingGoals: {
      currentStreak: 0,
      longestStreak: 0,
    },
    readingSettings: {
      autoProgress: true,
      showProgress: true,
      pauseOnScroll: false,
      estimateReadTime: true,
    },
  },
  lastUpdated: Date.now(),
};

// Reducer function
function readingReducer(state: ReadingContextState, action: ReadingAction): ReadingContextState {
  switch (action.type) {
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
            [action.payload.articleId]: action.payload.progress,
          },
        },
        lastUpdated: Date.now(),
      };

    case 'ADD_BOOKMARK':
      if (state.reading.bookmarks.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        reading: {
          ...state.reading,
          bookmarks: [...state.reading.bookmarks, action.payload],
        },
        lastUpdated: Date.now(),
      };

    case 'REMOVE_BOOKMARK':
      return {
        ...state,
        reading: {
          ...state.reading,
          bookmarks: state.reading.bookmarks.filter(id => id !== action.payload),
        },
        lastUpdated: Date.now(),
      };

    case 'TOGGLE_BOOKMARK':
      const isBookmarked = state.reading.bookmarks.includes(action.payload);
      return {
        ...state,
        reading: {
          ...state.reading,
          bookmarks: isBookmarked
            ? state.reading.bookmarks.filter(id => id !== action.payload)
            : [...state.reading.bookmarks, action.payload],
        },
        lastUpdated: Date.now(),
      };

    case 'ADD_TO_HISTORY':
      // Remove existing entry if it exists, then add new one at the beginning
      const filteredHistory = state.reading.readingHistory.filter(
        item => item.id !== action.payload.id
      );
      return {
        ...state,
        reading: {
          ...state.reading,
          readingHistory: [
            {
              ...action.payload,
              timestamp: Date.now(),
            },
            ...filteredHistory,
          ].slice(0, 100), // Keep only last 100 items
        },
        lastUpdated: Date.now(),
      };

    case 'REMOVE_FROM_HISTORY':
      return {
        ...state,
        reading: {
          ...state.reading,
          readingHistory: state.reading.readingHistory.filter(item => item.id !== action.payload),
        },
        lastUpdated: Date.now(),
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        reading: { ...state.reading, readingHistory: [] },
        lastUpdated: Date.now(),
      };

    case 'UPDATE_READING_GOALS':
      return {
        ...state,
        reading: {
          ...state.reading,
          readingGoals: { ...state.reading.readingGoals, ...action.payload },
        },
        lastUpdated: Date.now(),
      };

    case 'UPDATE_READING_SETTINGS':
      return {
        ...state,
        reading: {
          ...state.reading,
          readingSettings: { ...state.reading.readingSettings, ...action.payload },
        },
        lastUpdated: Date.now(),
      };

    case 'INCREMENT_STREAK':
      const newStreak = state.reading.readingGoals.currentStreak + 1;
      const longestStreak = Math.max(newStreak, state.reading.readingGoals.longestStreak);
      return {
        ...state,
        reading: {
          ...state.reading,
          readingGoals: {
            ...state.reading.readingGoals,
            currentStreak: newStreak,
            longestStreak,
          },
        },
        lastUpdated: Date.now(),
      };

    case 'RESET_STREAK':
      return {
        ...state,
        reading: {
          ...state.reading,
          readingGoals: { ...state.reading.readingGoals, currentStreak: 0 },
        },
        lastUpdated: Date.now(),
      };

    case 'RESET_READING_STATE':
      return {
        ...initialState,
        lastUpdated: Date.now(),
      };

    default:
      return state;
  }
}

// Context
interface ReadingContextType {
  state: ReadingContextState;
  dispatch: React.Dispatch<ReadingAction>;
  // Convenience methods
  setCurrentArticle: (articleId: string | null) => void;
  updateProgress: (articleId: string, progress: number) => void;
  addBookmark: (articleId: string) => void;
  removeBookmark: (articleId: string) => void;
  toggleBookmark: (articleId: string) => void;
  addToHistory: (article: { id: string; title: string; progress: number; url?: string; tags?: string[] }) => void;
  removeFromHistory: (articleId: string) => void;
  clearHistory: () => void;
  updateReadingGoals: (goals: Partial<ReadingState['readingGoals']>) => void;
  updateReadingSettings: (settings: Partial<ReadingState['readingSettings']>) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  // Computed properties
  isBookmarked: (articleId: string) => boolean;
  getProgress: (articleId: string) => number;
  getRecentHistory: (limit?: number) => ReadingState['readingHistory'];
}

const ReadingContext = createContext<ReadingContextType | undefined>(undefined);

// Provider component
interface ReadingProviderProps {
  children: ReactNode;
}

export function ReadingProvider({ children }: ReadingProviderProps) {
  const [state, dispatch] = useReducer(readingReducer, initialState);

  // Load reading data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('readingData');
    if (stored) {
      try {
        const readingData = JSON.parse(stored);
        // Merge with current state to preserve any new fields
        Object.keys(readingData).forEach(key => {
          if (key in state.reading) {
            const action = { type: 'UPDATE_READING_SETTINGS', payload: readingData } as ReadingAction;
            dispatch(action);
          }
        });
      } catch (error) {
        console.warn('Failed to load reading data from localStorage:', error);
      }
    }
  }, []);

  // Save reading data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('readingData', JSON.stringify(state.reading));
  }, [state.reading]);

  // Convenience methods
  const setCurrentArticle = (articleId: string | null) => {
    dispatch({ type: 'SET_CURRENT_ARTICLE', payload: articleId });
  };

  const updateProgress = (articleId: string, progress: number) => {
    dispatch({ type: 'UPDATE_READING_PROGRESS', payload: { articleId, progress } });
  };

  const addBookmark = (articleId: string) => {
    dispatch({ type: 'ADD_BOOKMARK', payload: articleId });
  };

  const removeBookmark = (articleId: string) => {
    dispatch({ type: 'REMOVE_BOOKMARK', payload: articleId });
  };

  const toggleBookmark = (articleId: string) => {
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: articleId });
  };

  const addToHistory = (article: { id: string; title: string; progress: number; url?: string; tags?: string[] }) => {
    dispatch({ type: 'ADD_TO_HISTORY', payload: article });
  };

  const removeFromHistory = (articleId: string) => {
    dispatch({ type: 'REMOVE_FROM_HISTORY', payload: articleId });
  };

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' });
  };

  const updateReadingGoals = (goals: Partial<ReadingState['readingGoals']>) => {
    dispatch({ type: 'UPDATE_READING_GOALS', payload: goals });
  };

  const updateReadingSettings = (settings: Partial<ReadingState['readingSettings']>) => {
    dispatch({ type: 'UPDATE_READING_SETTINGS', payload: settings });
  };

  const incrementStreak = () => {
    dispatch({ type: 'INCREMENT_STREAK' });
  };

  const resetStreak = () => {
    dispatch({ type: 'RESET_STREAK' });
  };

  // Computed properties
  const isBookmarked = (articleId: string) => {
    return state.reading.bookmarks.includes(articleId);
  };

  const getProgress = (articleId: string) => {
    return state.reading.readingProgress[articleId] || 0;
  };

  const getRecentHistory = (limit = 10) => {
    return state.reading.readingHistory.slice(0, limit);
  };

  const contextValue: ReadingContextType = {
    state,
    dispatch,
    setCurrentArticle,
    updateProgress,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    addToHistory,
    removeFromHistory,
    clearHistory,
    updateReadingGoals,
    updateReadingSettings,
    incrementStreak,
    resetStreak,
    isBookmarked,
    getProgress,
    getRecentHistory,
  };

  return <ReadingContext.Provider value={contextValue}>{children}</ReadingContext.Provider>;
}

// Hook
export function useReading() {
  const context = useContext(ReadingContext);
  if (context === undefined) {
    throw new Error('useReading must be used within a ReadingProvider');
  }
  return context;
}
