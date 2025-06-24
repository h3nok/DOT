import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme metadata interface
export interface ThemeInfo {
  name: string;
  category: string;
  icon: string;
}

// Available themes with metadata
const THEMES: Record<string, ThemeInfo> = {
  light: { name: 'Light', category: 'Quick', icon: '☀️' },
  dark: { name: 'Dark', category: 'Quick', icon: '🌙' },
  paper: { name: 'Paper', category: 'Quick', icon: '📄' },
  sepia: { name: 'Sepia', category: 'Quick', icon: '📜' },
  midnight: { name: 'Midnight', category: 'Quick', icon: '🌌' }
};

// Theme keys for easier maintenance
const THEME_KEYS = Object.keys(THEMES);
const DEFAULT_THEME = 'light';

// Context value interface
interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  getThemesByCategory: () => Record<string, Record<string, ThemeInfo>>;
}

// Provider props interface
interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<string>(DEFAULT_THEME);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && THEMES[savedTheme]) {
      applyThemeToDOM(savedTheme);
      setTheme(savedTheme);
    }
  }, []);

  const applyThemeToDOM = (newTheme: string) => {
    // Remove all existing theme classes
    THEME_KEYS.forEach(themeKey => {
      document.documentElement.classList.remove(themeKey);
    });
    
    // Add the new theme class (light theme doesn't need a class)
    if (newTheme !== DEFAULT_THEME) {
      document.documentElement.classList.add(newTheme);
    }
    
    // Set data-theme attribute for compatibility
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const applyTheme = (newTheme: string) => {
    if (!THEMES[newTheme]) {
      console.warn(`Theme "${newTheme}" not found. Using default theme.`);
      newTheme = DEFAULT_THEME;
    }

    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyThemeToDOM(newTheme);
  };

  const getThemesByCategory = (): Record<string, Record<string, ThemeInfo>> => {
    return { Quick: THEMES };
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme, getThemesByCategory }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
