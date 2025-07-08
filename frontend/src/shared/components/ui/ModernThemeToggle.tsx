import React from 'react';
import { useTheme, type ThemeInfo } from '../../contexts/SimpleThemeContext';

interface ModernThemeToggleProps {
  className?: string;
}

const themeIcons: Record<string, React.ReactNode> = {
  light: <span aria-label="Light" role="img">🌞</span>,
  dark: <span aria-label="Dark" role="img">🌜</span>,
  paper: <span aria-label="Paper" role="img">📄</span>,
  sepia: <span aria-label="Sepia" role="img">🟤</span>,
  midnight: <span aria-label="Midnight" role="img">🌑</span>,
};

const ModernThemeToggle: React.FC<ModernThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme, getThemesByCategory } = useTheme();
  const categorizedThemes = getThemesByCategory();
  const allThemes: Record<string, ThemeInfo> = Object.values(categorizedThemes).reduce(
    (acc, category) => ({ ...acc, ...category }),
    {}
  );
  const themeKeys = Object.keys(allThemes);

  // Only show most popular themes as toggles (customize as needed)
  const toggleThemes = ['light', 'dark', 'paper', 'sepia', 'midnight'].filter(key => themeKeys.includes(key));

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <div className="flex items-center bg-muted rounded-full px-2 py-1 shadow-inner">
        {toggleThemes.map((key) => (
          <button
            key={key}
            aria-label={allThemes[key]?.name || key}
            className={`transition-all duration-200 w-8 h-8 flex items-center justify-center rounded-full mx-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500
              ${theme === key ? 'bg-blue-500 text-white scale-110 shadow-lg' : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'}
            `}
            onClick={() => setTheme(key)}
            tabIndex={0}
            type="button"
          >
            {themeIcons[key] || allThemes[key]?.icon || '🎨'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModernThemeToggle;
