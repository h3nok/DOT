import React from 'react';
import { cn } from '../../lib/utils';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
  containerClassName?: string;
  allowFuture?: boolean;
  allowPast?: boolean;
  minDate?: string;
  maxDate?: string;
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    className,
    label,
    description,
    error,
    containerClassName,
    allowFuture = true,
    allowPast = true,
    minDate,
    maxDate,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `date-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate min/max dates based on allowFuture/allowPast
    const today = new Date().toISOString().split('T')[0];
    let computedMin = minDate;
    let computedMax = maxDate;
    
    if (!allowPast && !computedMin) {
      computedMin = today;
    }
    
    if (!allowFuture && !computedMax) {
      computedMax = today;
    }

    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
          </label>
        )}
        
        <input
          type="date"
          id={inputId}
          ref={ref}
          min={computedMin}
          max={computedMax}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          aria-describedby={description ? `${inputId}-description` : undefined}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />

        {description && (
          <p
            id={`${inputId}-description`}
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

DatePicker.displayName = "DatePicker";

export default DatePicker;
