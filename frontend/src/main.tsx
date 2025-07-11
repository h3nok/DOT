import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './AppOptimized'
import { ThemeProvider } from './shared/contexts/SimpleThemeContext'
import { AppProviders } from './shared/contexts'
// Import PWA service for initialization
import PWAService from './services/PWAService'

// Initialize PWA service
PWAService; // This will trigger the singleton initialization

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AppProviders>
  </StrictMode>,
)
