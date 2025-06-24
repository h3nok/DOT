import React, { ReactNode } from 'react';
import { useAppState } from '../../contexts/AppStateContext';

interface ReadingOptimizedProps {
  children: ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  fontSize?: 'base' | 'lg' | 'xl';
  className?: string;
  onFocusModeChange?: (focus: boolean) => void;
}

const fontSizeMap = {
  base: 'text-[1.15rem] md:text-[1.2rem]',
  lg: 'text-[1.25rem] md:text-[1.35rem]',
  xl: 'text-[1.4rem] md:text-[1.6rem]',
};

const maxWidthMap = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

const fontSizeLabels = {
  base: 'A',
  lg: 'A+',
  xl: 'A++',
};

/**
 * A highly optimized container for reading long-form content.
 * - Sophisticated, modern, and easy on the eyes
 * - Responsive, with max-width and font size options
 * - Subtle background, high contrast, and generous spacing
 * - Supports both light and dark mode
 */
const ReadingOptimized: React.FC<ReadingOptimizedProps> = ({
  children,
  maxWidth = '2xl',
  fontSize = 'lg',
  className = '',
  onFocusModeChange,
}) => {
  const { state, setFontSize, toggleFocusMode } = useAppState();
  const currentFontSize = state.userPreferences.fontSize;
  const focusMode = state.userPreferences.focusMode;

  // Optionally notify parent
  React.useEffect(() => {
    if (onFocusModeChange) onFocusModeChange(focusMode);
  }, [focusMode, onFocusModeChange]);

  return (
    <div
      className={`
        relative
        mx-auto px-4 py-8
        ${maxWidthMap[maxWidth]}
        ${fontSizeMap[currentFontSize]}
        leading-relaxed
        font-serif md:font-sans
        bg-white/95 dark:bg-neutral-900/90
        text-neutral-900 dark:text-neutral-100
        shadow-xl rounded-2xl
        transition-all duration-300
        backdrop-blur-md
        space-y-6
        md:space-y-8
        ${focusMode ? 'z-[1000] !bg-background !text-foreground shadow-2xl' : ''}
        ${className}
      `}
      style={{
        boxShadow: '0 4px 32px 0 rgba(0,0,0,0.08)',
        letterSpacing: '0.01em',
      }}
    >
      {/* Controls */}
      <div className="flex items-center justify-end gap-2 mb-4 sticky top-0 z-20 bg-transparent">
        {/* Font size toggle */}
        {(['base', 'lg', 'xl'] as const).map((size) => (
          <button
            key={size}
            aria-label={`Set font size ${fontSizeLabels[size]}`}
            className={`px-2 py-1 rounded text-base font-bold border transition-all duration-200
              ${currentFontSize === size ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground hover:bg-accent/20'}
            `}
            onClick={() => setFontSize(size)}
          >
            {fontSizeLabels[size]}
          </button>
        ))}
        {/* Focus mode toggle */}
        <button
          aria-label="Toggle focus mode"
          className={`ml-2 px-3 py-1 rounded border font-semibold transition-all duration-200
            ${focusMode ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground hover:bg-accent/20'}
          `}
          onClick={() => toggleFocusMode()}
        >
          {focusMode ? 'Exit Focus' : 'Focus Mode'}
        </button>
      </div>
      {children}
    </div>
  );
};

export default ReadingOptimized;
