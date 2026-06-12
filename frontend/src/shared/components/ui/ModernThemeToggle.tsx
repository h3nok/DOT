import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/SimpleThemeContext';

interface ModernThemeToggleProps {
  className?: string;
}

const ModernThemeToggle: React.FC<ModernThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <button
        onClick={toggleTheme}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleTheme();
          }
        }}
        aria-label={`Switch to ${isDark ? 'Alabaster Matte Light' : 'Midnight Obsidian Dark'} Mode`}
        title={`Current: ${isDark ? 'Midnight Obsidian' : 'Alabaster Matte'}`}
        className="relative h-9 w-[76px] rounded-full bg-muted/60 hover:bg-muted/80 border border-border/10 p-1 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background group shadow-inner"
        type="button"
        tabIndex={0}
      >
        {/* Sliding Pill Indicator */}
        <span
          className={`absolute top-0.5 bottom-0.5 left-0.5 w-[34px] rounded-full bg-white dark:bg-black/45 shadow-md border border-black/[0.03] dark:border-white/[0.05] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center
            ${isDark ? 'translate-x-[36px]' : 'translate-x-0'}
          `}
        >
          {/* Accent Glow inside sliding pill */}
          <span className="absolute inset-0 rounded-full opacity-10 bg-gradient-to-tr from-primary to-secondary" />
        </span>

        {/* Icons Overlay */}
        <span className="absolute inset-0 flex justify-between items-center px-2.5 pointer-events-none">
          <Sun
            className={`w-4 h-4 transition-all duration-300
              ${isDark ? 'text-muted-foreground/45 scale-90' : 'text-primary scale-110 drop-shadow-[0_0_4px_rgba(0,0,0,0.1)]'}
            `}
          />
          <Moon
            className={`w-4 h-4 transition-all duration-300
              ${isDark ? 'text-primary scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]' : 'text-muted-foreground/45 scale-90'}
            `}
          />
        </span>
      </button>
    </div>
  );
};

export default ModernThemeToggle;
