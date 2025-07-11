import React from 'react';
import { cn } from '../../lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  description?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

const RadioGroup = React.forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  ({ 
    name, 
    options, 
    value, 
    onChange, 
    orientation = 'vertical',
    label,
    description,
    error,
    className,
    disabled,
    ...props 
  }, ref) => {
    const groupId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <fieldset
        ref={ref}
        className={cn("space-y-2", className)}
        aria-describedby={description ? `${groupId}-description` : undefined}
        aria-invalid={error ? 'true' : 'false'}
        disabled={disabled}
        {...props}
      >
        {label && (
          <legend className={cn(
            "text-sm font-medium leading-none",
            error && "text-destructive"
          )}>
            {label}
          </legend>
        )}
        
        {description && (
          <p
            id={`${groupId}-description`}
            className={cn(
              "text-xs text-muted-foreground",
              error && "text-destructive"
            )}
          >
            {description}
          </p>
        )}

        <div className={cn(
          "space-y-2",
          orientation === 'horizontal' && "flex flex-wrap gap-4 space-y-0"
        )}>
          {options.map((option) => {
            const radioId = `${name}-${option.value}`;
            const isDisabled = disabled || option.disabled;
            
            return (
              <div key={option.value} className="flex items-start space-x-2">
                <input
                  type="radio"
                  id={radioId}
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange?.(e.target.value)}
                  disabled={isDisabled}
                  className={cn(
                    "h-4 w-4 border border-input bg-background text-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-destructive focus-visible:ring-destructive"
                  )}
                  aria-describedby={option.description ? `${radioId}-description` : undefined}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={radioId}
                    className={cn(
                      "text-sm font-medium leading-none cursor-pointer",
                      isDisabled && "cursor-not-allowed opacity-70",
                      error && "text-destructive"
                    )}
                  >
                    {option.label}
                  </label>
                  {option.description && (
                    <p
                      id={`${radioId}-description`}
                      className={cn(
                        "text-xs text-muted-foreground",
                        error && "text-destructive"
                      )}
                    >
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </fieldset>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

export default RadioGroup;
