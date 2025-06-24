import React from 'react';
import { useTheme, type ThemeInfo } from '../../contexts/SimpleThemeContext';

interface StandardThemeToggleProps {
  className?: string;
}

const StandardThemeToggle: React.FC<StandardThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme, getThemesByCategory } = useTheme();
  
  // Get all themes from context (avoids duplication)
  const categorizedThemes = getThemesByCategory();
  const allThemes: Record<string, ThemeInfo> = Object.values(categorizedThemes).reduce(
    (acc, category) => ({ ...acc, ...category }), 
    {}
  );
  
  const currentTheme = allThemes[theme];
  const themeKeys = Object.keys(allThemes);
  
  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value);
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`.trim()}>
      <span className="text-lg" aria-hidden="true">
        {currentTheme?.icon || '🎨'}
      </span>
      <select
        value={theme}
        onChange={handleThemeChange}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
        aria-label="Select theme"
      >
        {themeKeys.map((themeKey) => {
          const themeInfo = allThemes[themeKey];
          return (
            <option key={themeKey} value={themeKey}>
              {themeInfo.icon} {themeInfo.name}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default StandardThemeToggle;
