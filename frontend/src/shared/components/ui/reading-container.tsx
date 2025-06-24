import React from 'react';
import { cn } from '../../../lib/utils';

interface ReadingContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
  spacing?: 'compact' | 'normal' | 'relaxed' | 'loose';
}

const ReadingContainer: React.FC<ReadingContainerProps> = ({ 
  children, 
  className,
  maxWidth = 'xl',
  spacing = 'normal'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full'
  };

  const spacingClasses = {
    compact: 'space-y-4',
    normal: 'space-y-6',
    relaxed: 'space-y-8',
    loose: 'space-y-12'
  };

  return (
    <div className={cn(
      'mx-auto px-4 leading-relaxed font-normal text-foreground',
      maxWidthClasses[maxWidth],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
};

export default ReadingContainer;
