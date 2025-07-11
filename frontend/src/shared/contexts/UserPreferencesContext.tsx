import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// User preferences types
export interface UserPreferences {
  fontSize: 'base' | 'lg' | 'xl';
  focusMode: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  autoSave: boolean;
  notifications: boolean;
}

export interface UserPreferencesState {
  preferences: UserPreferences;
  lastUpdated: number;
}

// User preferences actions
export type UserPreferencesAction =
  | { type: 'SET_FONT_SIZE'; payload: UserPreferences['fontSize'] }
  | { type: 'TOGGLE_FOCUS_MODE'; payload?: boolean }
  | { type: 'SET_REDUCE_MOTION'; payload: boolean }
  | { type: 'SET_HIGH_CONTRAST'; payload: boolean }
  | { type: 'SET_AUTO_SAVE'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS'; payload: boolean }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_PREFERENCES' };

// Initial state
const initialState: UserPreferencesState = {
  preferences: {
    fontSize: 'lg',
    focusMode: false,
    reduceMotion: false,
    highContrast: false,
    autoSave: true,
    notifications: true,
  },
  lastUpdated: Date.now(),
};

// Reducer function
function userPreferencesReducer(
  state: UserPreferencesState,
  action: UserPreferencesAction
): UserPreferencesState {
  switch (action.type) {
    case 'SET_FONT_SIZE':
      return {
        ...state,
        preferences: { ...state.preferences, fontSize: action.payload },
        lastUpdated: Date.now(),
      };

    case 'TOGGLE_FOCUS_MODE':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          focusMode: action.payload !== undefined ? action.payload : !state.preferences.focusMode,
        },
        lastUpdated: Date.now(),
      };

    case 'SET_REDUCE_MOTION':
      return {
        ...state,
        preferences: { ...state.preferences, reduceMotion: action.payload },
        lastUpdated: Date.now(),
      };

    case 'SET_HIGH_CONTRAST':
      return {
        ...state,
        preferences: { ...state.preferences, highContrast: action.payload },
        lastUpdated: Date.now(),
      };

    case 'SET_AUTO_SAVE':
      return {
        ...state,
        preferences: { ...state.preferences, autoSave: action.payload },
        lastUpdated: Date.now(),
      };

    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        preferences: { ...state.preferences, notifications: action.payload },
        lastUpdated: Date.now(),
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
        lastUpdated: Date.now(),
      };

    case 'RESET_PREFERENCES':
      return {
        ...initialState,
        lastUpdated: Date.now(),
      };

    default:
      return state;
  }
}

// Context
interface UserPreferencesContextType {
  state: UserPreferencesState;
  dispatch: React.Dispatch<UserPreferencesAction>;
  // Convenience methods
  setFontSize: (size: UserPreferences['fontSize']) => void;
  toggleFocusMode: (enabled?: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setNotifications: (enabled: boolean) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Provider component
interface UserPreferencesProviderProps {
  children: ReactNode;
  initialPreferences?: Partial<UserPreferences>;
}

export function UserPreferencesProvider({ 
  children, 
  initialPreferences 
}: UserPreferencesProviderProps) {
  const [state, dispatch] = useReducer(userPreferencesReducer, {
    ...initialState,
    preferences: { ...initialState.preferences, ...initialPreferences },
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
      try {
        const preferences = JSON.parse(stored);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      } catch (error) {
        console.warn('Failed to load user preferences from localStorage:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  // Convenience methods
  const setFontSize = (size: UserPreferences['fontSize']) => {
    dispatch({ type: 'SET_FONT_SIZE', payload: size });
  };

  const toggleFocusMode = (enabled?: boolean) => {
    dispatch({ type: 'TOGGLE_FOCUS_MODE', payload: enabled });
  };

  const setReduceMotion = (enabled: boolean) => {
    dispatch({ type: 'SET_REDUCE_MOTION', payload: enabled });
  };

  const setHighContrast = (enabled: boolean) => {
    dispatch({ type: 'SET_HIGH_CONTRAST', payload: enabled });
  };

  const setAutoSave = (enabled: boolean) => {
    dispatch({ type: 'SET_AUTO_SAVE', payload: enabled });
  };

  const setNotifications = (enabled: boolean) => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: enabled });
  };

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  const resetPreferences = () => {
    dispatch({ type: 'RESET_PREFERENCES' });
  };

  const contextValue: UserPreferencesContextType = {
    state,
    dispatch,
    setFontSize,
    toggleFocusMode,
    setReduceMotion,
    setHighContrast,
    setAutoSave,
    setNotifications,
    updatePreferences,
    resetPreferences,
  };

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

// Hook
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}
