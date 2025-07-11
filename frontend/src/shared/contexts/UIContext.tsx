import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// UI state types
export interface UIState {
  isMobileMenuOpen: boolean;
  isSidebarOpen: boolean;
  currentPage: string;
  breadcrumbs: string[];
  loadingStates: Record<string, boolean>;
  modal: {
    isOpen: boolean;
    type?: string;
    props?: Record<string, any>;
  };
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: number;
    dismissible?: boolean;
  }>;
}

export interface UIContextState {
  ui: UIState;
  lastUpdated: number;
}

// UI actions
export type UIAction =
  | { type: 'TOGGLE_MOBILE_MENU'; payload?: boolean }
  | { type: 'TOGGLE_SIDEBAR'; payload?: boolean }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SET_BREADCRUMBS'; payload: string[] }
  | { type: 'SET_LOADING_STATE'; payload: { key: string; loading: boolean } }
  | { type: 'CLEAR_LOADING_STATES' }
  | { type: 'OPEN_MODAL'; payload: { type: string; props?: Record<string, any> } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<UIState['notifications'][0], 'id'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'RESET_UI' };

// Initial state
const initialState: UIContextState = {
  ui: {
    isMobileMenuOpen: false,
    isSidebarOpen: false,
    currentPage: '/',
    breadcrumbs: ['Home'],
    loadingStates: {},
    modal: {
      isOpen: false,
    },
    notifications: [],
  },
  lastUpdated: Date.now(),
};

// Reducer function
function uiReducer(state: UIContextState, action: UIAction): UIContextState {
  switch (action.type) {
    case 'TOGGLE_MOBILE_MENU':
      return {
        ...state,
        ui: {
          ...state.ui,
          isMobileMenuOpen: action.payload !== undefined ? action.payload : !state.ui.isMobileMenuOpen,
        },
        lastUpdated: Date.now(),
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          isSidebarOpen: action.payload !== undefined ? action.payload : !state.ui.isSidebarOpen,
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
            [action.payload.key]: action.payload.loading,
          },
        },
        lastUpdated: Date.now(),
      };

    case 'CLEAR_LOADING_STATES':
      return {
        ...state,
        ui: { ...state.ui, loadingStates: {} },
        lastUpdated: Date.now(),
      };

    case 'OPEN_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modal: {
            isOpen: true,
            type: action.payload.type,
            props: action.payload.props,
          },
        },
        lastUpdated: Date.now(),
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modal: { isOpen: false },
        },
        lastUpdated: Date.now(),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [
            ...state.ui.notifications,
            {
              ...action.payload,
              id: Date.now().toString() + Math.random().toString(36).substring(2),
            },
          ],
        },
        lastUpdated: Date.now(),
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload),
        },
        lastUpdated: Date.now(),
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        ui: { ...state.ui, notifications: [] },
        lastUpdated: Date.now(),
      };

    case 'RESET_UI':
      return {
        ...initialState,
        lastUpdated: Date.now(),
      };

    default:
      return state;
  }
}

// Context
interface UIContextType {
  state: UIContextState;
  dispatch: React.Dispatch<UIAction>;
  // Convenience methods
  toggleMobileMenu: (open?: boolean) => void;
  toggleSidebar: (open?: boolean) => void;
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  setLoadingState: (key: string, loading: boolean) => void;
  clearLoadingStates: () => void;
  openModal: (type: string, props?: Record<string, any>) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  // Computed properties
  isLoading: (key?: string) => boolean;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

// Provider component
interface UIProviderProps {
  children: ReactNode;
  initialPage?: string;
}

export function UIProvider({ children, initialPage = '/' }: UIProviderProps) {
  const [state, dispatch] = useReducer(uiReducer, {
    ...initialState,
    ui: { ...initialState.ui, currentPage: initialPage },
  });

  // Convenience methods
  const toggleMobileMenu = (open?: boolean) => {
    dispatch({ type: 'TOGGLE_MOBILE_MENU', payload: open });
  };

  const toggleSidebar = (open?: boolean) => {
    dispatch({ type: 'TOGGLE_SIDEBAR', payload: open });
  };

  const setCurrentPage = (page: string) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  };

  const setBreadcrumbs = (breadcrumbs: string[]) => {
    dispatch({ type: 'SET_BREADCRUMBS', payload: breadcrumbs });
  };

  const setLoadingState = (key: string, loading: boolean) => {
    dispatch({ type: 'SET_LOADING_STATE', payload: { key, loading } });
  };

  const clearLoadingStates = () => {
    dispatch({ type: 'CLEAR_LOADING_STATES' });
  };

  const openModal = (type: string, props?: Record<string, any>) => {
    dispatch({ type: 'OPEN_MODAL', payload: { type, props } });
  };

  const closeModal = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  };

  const addNotification = (notification: Omit<UIState['notifications'][0], 'id'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  const isLoading = (key?: string) => {
    if (key) {
      return state.ui.loadingStates[key] || false;
    }
    return Object.values(state.ui.loadingStates).some(loading => loading);
  };

  const contextValue: UIContextType = {
    state,
    dispatch,
    toggleMobileMenu,
    toggleSidebar,
    setCurrentPage,
    setBreadcrumbs,
    setLoadingState,
    clearLoadingStates,
    openModal,
    closeModal,
    addNotification,
    removeNotification,
    clearNotifications,
    isLoading,
  };

  return <UIContext.Provider value={contextValue}>{children}</UIContext.Provider>;
}

// Hook
export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
