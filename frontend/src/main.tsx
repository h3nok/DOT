import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './shared/contexts/SimpleThemeContext'
import { AppStateProvider } from './shared/contexts/AppStateContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AppStateProvider>
  </StrictMode>,
)
