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

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * The base the reader's own system asked for.
 *
 * This used to be hard-coded to light, so a reader whose machine was in dark
 * mode was handed a white page at night — and the first render wrote that
 * choice straight to storage, which pinned it permanently before they had
 * expressed any preference at all. Their operating system already carries the
 * answer; the only honest default is to use it.
 */
const systemTheme = (): string => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
};

const resolveTheme = (theme: string | null | undefined) =>
  theme && THEMES[theme] ? theme : systemTheme();

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
  const [theme, setTheme] = useState<string>(systemTheme);

  useEffect(() => {
    const stored = localStorage.getItem('dot_theme');
    const resolved = resolveTheme(stored);
    // Deliberately not written back. Storage means "the reader chose this";
    // persisting a value they never picked would freeze them out of their own
    // system setting for good.
    applyThemeToDOM(resolved);
    setTheme(resolved);

    if (stored && THEMES[stored]) return;
    if (!window.matchMedia) return;

    // Until they choose, keep following the system — someone whose machine
    // turns dark at sunset should not have to come back and tell us.
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      if (localStorage.getItem('dot_theme')) return;
      const next = mql.matches ? 'dark' : 'light';
      applyThemeToDOM(next);
      setTheme(next);
    };
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  const applyThemeToDOM = (newTheme: string) => {
    newTheme = resolveTheme(newTheme);

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
    }
    newTheme = resolveTheme(newTheme);

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
