import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import Fontsource packages for local, high-fidelity offline fonts
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/900.css'
import '@fontsource/jetbrains-mono/300.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'

import './index.css'
import './App.css'
import './organism/organism.css'
import App from './AppOptimized'
import { ThemeProvider } from './shared/contexts/SimpleThemeContext'
import { AppProviders } from './shared/contexts'
import { OrganismProvider } from './organism'
// Import PWA service for initialization
import PWAService from './services/PWAService'

// Initialize PWA service
PWAService; // This will trigger the singleton initialization

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <ThemeProvider>
        <OrganismProvider>
          <App />
        </OrganismProvider>
      </ThemeProvider>
    </AppProviders>
  </StrictMode>,
)
