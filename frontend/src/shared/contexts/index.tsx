import { ReactNode } from 'react';
import { UserPreferencesProvider } from './UserPreferencesContext';
import { UIProvider } from './UIContext';
import { ReadingProvider, useReading } from './ReadingContext';

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

export { useReading, ReadingProvider };
export type { ReadingState, ReadingContextState } from './ReadingContext';
