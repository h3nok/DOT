import { ReactNode } from 'react';
import { UserPreferencesProvider, useUserPreferences } from './UserPreferencesContext';
import { UIProvider, useUI } from './UIContext';
import { ReadingProvider, useReading } from './ReadingContext';

// Combined context providers for easy composition
interface AppProvidersProps {
  children: ReactNode;
  initialPage?: string;
}

export function AppProviders({ children, initialPage }: AppProvidersProps) {
  return (
    <UserPreferencesProvider>
      <UIProvider initialPage={initialPage}>
        <ReadingProvider>
          {children}
        </ReadingProvider>
      </UIProvider>
    </UserPreferencesProvider>
  );
}

// Re-export all context hooks for easy importing
export { useUserPreferences, UserPreferencesProvider };
export { useUI, UIProvider };
export { useReading, ReadingProvider };

// Re-export types
export type { UserPreferences, UserPreferencesState } from './UserPreferencesContext';
export type { UIState, UIContextState } from './UIContext';
export type { ReadingState, ReadingContextState } from './ReadingContext';

// Convenience hook that combines all contexts
export function useApp() {
  const userPreferences = useUserPreferences();
  const ui = useUI();
  const reading = useReading();

  return {
    userPreferences,
    ui,
    reading,
  };
}

// Legacy compatibility - provides the same interface as the old AppStateContext
// This allows for gradual migration
export function useLegacyAppState() {
  const { userPreferences, ui, reading } = useApp();

  return {
    // Legacy state structure
    state: {
      userPreferences: userPreferences.state.preferences,
      ui: ui.state.ui,
      reading: reading.state.reading,
      lastUpdated: Math.max(
        userPreferences.state.lastUpdated,
        ui.state.lastUpdated,
        reading.state.lastUpdated
      ),
    },
    // Legacy dispatch function (limited support)
    dispatch: (action: any) => {
      console.warn('Legacy dispatch used. Consider migrating to individual context hooks.');
      // Route actions to appropriate contexts based on type
      if (action.type.includes('FONT_SIZE') || action.type.includes('FOCUS_MODE') || 
          action.type.includes('REDUCE_MOTION') || action.type.includes('HIGH_CONTRAST') ||
          action.type.includes('AUTO_SAVE') || action.type.includes('NOTIFICATIONS')) {
        userPreferences.dispatch(action);
      } else if (action.type.includes('MOBILE_MENU') || action.type.includes('SIDEBAR') ||
                action.type.includes('CURRENT_PAGE') || action.type.includes('BREADCRUMBS') ||
                action.type.includes('LOADING_STATE')) {
        ui.dispatch(action);
      } else if (action.type.includes('ARTICLE') || action.type.includes('READING') ||
                action.type.includes('BOOKMARK') || action.type.includes('HISTORY')) {
        reading.dispatch(action);
      }
    },
  };
}
