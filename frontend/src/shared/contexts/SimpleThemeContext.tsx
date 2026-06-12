import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme metadata interface
export interface ThemeInfo {
  name: string;
  category: string;
  icon: string;
  dark: boolean;
  description?: string;
}

// Available themes with metadata
const THEMES: Record<string, ThemeInfo> = {
  light: {
    name: 'Alabaster Matte',
    category: 'Focus',
    icon: '☀️',
    dark: false,
    description: 'Luxurious warm-paper tone modeled on physical ink, designed to minimize fatigue during long sessions.'
  },
  dark: {
    name: 'Midnight Obsidian',
    category: 'Focus',
    icon: '🌙',
    dark: true,
    description: 'Deep velvet sapphire-black slate backdrop that prevents high-contrast screen glare.'
  }
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
    const savedTheme = localStorage.getItem('dot_theme') || DEFAULT_THEME;
    applyThemeToDOM(savedTheme);
    setTheme(savedTheme);
  }, []);

  const applyThemeToDOM = (newTheme: string) => {
    // Remove all existing theme classes
    THEME_KEYS.forEach(themeKey => {
      document.documentElement.classList.remove(themeKey);
    });
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.remove('light');

    // Always add the specific theme class
    document.documentElement.classList.add(newTheme);

    // Add dark or light class depending on the theme classification
    if (THEMES[newTheme]?.dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
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
    localStorage.setItem('dot_theme', newTheme);
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
