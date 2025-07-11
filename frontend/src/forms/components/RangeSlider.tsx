import React from 'react';
import { cn } from '../../lib/utils';

export interface RangeSliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  description?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  showValue?: boolean;
  showTicks?: boolean;
  marks?: Array<{ value: number; label: string }>;
  containerClassName?: string;
  trackClassName?: string;
  thumbClassName?: string;
  formatValue?: (value: number) => string;
}

const RangeSlider = React.forwardRef<HTMLInputElement, RangeSliderProps>(
  ({ 
    className,
    label,
    description,
    error,
    min = 0,
    max = 100,
    step = 1,
    value = 0,
    onChange,
    showValue = true,
    showTicks = false,
    marks = [],
    containerClassName,
    trackClassName,
    thumbClassName,
    formatValue = (val) => val.toString(),
    id,
    disabled,
    ...props 
  }, ref) => {
    const sliderId = id || `slider-${Math.random().toString(36).substr(2, 9)}`;
    const percentage = ((value - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      onChange?.(newValue);
    };

    // Generate tick marks
    const tickMarks = showTicks || marks.length > 0 
      ? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step)
      : [];

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <div className="flex justify-between items-center">
            <label
              htmlFor={sliderId}
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                error && "text-destructive"
              )}
            >
              {label}
            </label>
            {showValue && (
              <span className={cn(
                "text-sm font-mono",
                error ? "text-destructive" : "text-muted-foreground"
              )}>
                {formatValue(value)}
              </span>
            )}
          </div>
        )}

        <div className="relative">
          {/* Track */}
          <div 
            className={cn(
              "relative h-2 w-full rounded-full bg-secondary",
              disabled && "opacity-50",
              trackClassName
            )}
          >
            {/* Progress */}
            <div
              className="absolute h-2 rounded-full bg-primary"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Input */}
          <input
            type="range"
            id={sliderId}
            ref={ref}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              "absolute top-0 h-2 w-full appearance-none bg-transparent cursor-pointer",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm",
              "[&::-webkit-slider-thumb]:hover:bg-primary/90 [&::-webkit-slider-thumb]:transition-colors",
              "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
              "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "focus-visible:ring-destructive",
              className,
              thumbClassName
            )}
            aria-describedby={description ? `${sliderId}-description` : undefined}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />

          {/* Tick marks */}
          {(showTicks || marks.length > 0) && (
            <div className="relative mt-2">
              {tickMarks.map((tick) => {
                const tickPercentage = ((tick - min) / (max - min)) * 100;
                const mark = marks.find(m => m.value === tick);
                
                return (
                  <div
                    key={tick}
                    className="absolute transform -translate-x-1/2"
                    style={{ left: `${tickPercentage}%` }}
                  >
                    {showTicks && (
                      <div className="w-0.5 h-2 bg-border" />
                    )}
                    {mark && (
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        {mark.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Min/Max labels */}
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatValue(min)}</span>
            <span>{formatValue(max)}</span>
          </div>
        </div>

        {description && (
          <p
            id={`${sliderId}-description`}
            className={cn(
              "text-xs text-muted-foreground",
              error && "text-destructive"
            )}
          >
            {description}
          </p>
        )}
        
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

RangeSlider.displayName = "RangeSlider";

export default RangeSlider;
