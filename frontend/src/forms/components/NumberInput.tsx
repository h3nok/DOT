import React from 'react';
import { cn } from '../../lib/utils';

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'min' | 'max' | 'step'> {
  label?: string;
  description?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  allowNegative?: boolean;
  showStepper?: boolean;
  prefix?: string;
  suffix?: string;
  containerClassName?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    className,
    label,
    description,
    error,
    min,
    max,
    step = 1,
    precision,
    allowNegative = true,
    showStepper = true,
    prefix,
    suffix,
    containerClassName,
    id,
    value,
    onChange,
    ...props 
  }, ref) => {
    const inputId = id || `number-${Math.random().toString(36).substr(2, 9)}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove non-numeric characters except decimal point and minus
      if (!allowNegative) {
        inputValue = inputValue.replace(/[^0-9.]/g, '');
      } else {
        inputValue = inputValue.replace(/[^0-9.-]/g, '');
      }

      // Handle precision
      if (precision !== undefined && inputValue.includes('.')) {
        const [whole, decimal] = inputValue.split('.');
        if (decimal && decimal.length > precision) {
          inputValue = `${whole}.${decimal.slice(0, precision)}`;
        }
      }

      // Create synthetic event with cleaned value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: inputValue
        }
      };

      onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    };

    const increment = () => {
      const currentValue = parseFloat(value as string) || 0;
      const newValue = currentValue + step;
      
      if (max === undefined || newValue <= max) {
        const syntheticEvent = {
          target: { value: newValue.toString() }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      }
    };

    const decrement = () => {
      const currentValue = parseFloat(value as string) || 0;
      const newValue = currentValue - step;
      
      if (min === undefined || newValue >= min) {
        const syntheticEvent = {
          target: { value: newValue.toString() }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      }
    };

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
        
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {prefix}
            </span>
          )}
          
          <input
            type="number"
            id={inputId}
            ref={ref}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              prefix && "pl-8",
              suffix && "pr-12",
              showStepper && "pr-16",
              !showStepper && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              className
            )}
            aria-describedby={description ? `${inputId}-description` : undefined}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
          
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {suffix}
            </span>
          )}
          
          {showStepper && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
              <button
                type="button"
                onClick={increment}
                className="h-4 w-6 rounded-sm bg-transparent hover:bg-muted focus:bg-muted text-xs"
                aria-label="Increment"
                tabIndex={-1}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={decrement}
                className="h-4 w-6 rounded-sm bg-transparent hover:bg-muted focus:bg-muted text-xs"
                aria-label="Decrement"
                tabIndex={-1}
              >
                ▼
              </button>
            </div>
          )}
        </div>

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

NumberInput.displayName = "NumberInput";

export default NumberInput;
