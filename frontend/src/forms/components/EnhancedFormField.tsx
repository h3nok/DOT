import React, { ReactNode, useEffect, useState } from 'react';
import { useFormContext, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '../../shared/components/ui/label';
import { FieldValidation } from './FieldValidation';
import { cn } from '../../lib/utils';

export interface EnhancedFormFieldProps<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label?: string;
  description?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  showValidation?: boolean;
  realTimeValidation?: boolean;
  debounceMs?: number;
  children: (field: {
    value: any;
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    name: string;
    disabled?: boolean;
    error?: string;
    isValid?: boolean;
    isValidating?: boolean;
  }) => ReactNode;
}

export function EnhancedFormField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  hint,
  required = false,
  className,
  showValidation = true,
  realTimeValidation = true,
  debounceMs = 300,
  children,
}: EnhancedFormFieldProps<T>) {
  const {
    control,
    formState: { errors },
    trigger,
    watch
  } = useFormContext<T>();

  const [isValidating, setIsValidating] = useState(false);
  const [lastValidatedValue, setLastValidatedValue] = useState<any>(null);
  
  const fieldValue = watch(name);
  const fieldError = errors[name]?.message as string;
  const hasError = Boolean(fieldError);
  const isValid = !hasError && fieldValue !== undefined && fieldValue !== '';

  // Real-time validation with debouncing
  useEffect(() => {
    if (!realTimeValidation || fieldValue === lastValidatedValue) return;

    setIsValidating(true);
    const timeoutId = setTimeout(async () => {
      await trigger(name);
      setLastValidatedValue(fieldValue);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [fieldValue, realTimeValidation, debounceMs, trigger, name, lastValidatedValue]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div>
            {children({
              ...field,
              error: fieldError,
              isValid,
              isValidating: realTimeValidation ? isValidating : false,
            })}
          </div>
        )}
      />

      {showValidation && (
        <FieldValidation
          error={fieldError}
          isValidating={realTimeValidation ? isValidating : false}
          isValid={isValid}
          hint={hint}
        />
      )}
    </div>
  );
}

// Higher-order component for adding enhanced validation to existing form fields
export function withEnhancedValidation<P extends object>(
  Component: React.ComponentType<P>
) {
  return React.forwardRef<any, P & {
    name: string;
    showValidation?: boolean;
    realTimeValidation?: boolean;
    hint?: string;
  }>((props, ref) => {
    const {
      name,
      showValidation = true,
      realTimeValidation = true,
      hint,
      ...componentProps
    } = props;

    return (
      <EnhancedFormField
        name={name}
        showValidation={showValidation}
        realTimeValidation={realTimeValidation}
        hint={hint}
      >
        {({ value, onChange, onBlur, error, isValid, isValidating }) => (
          <div>
            <Component
              {...(componentProps as P)}
              ref={ref}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              className={cn(
                'border-gray-300 dark:border-gray-600',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                isValid && 'border-green-500 focus:border-green-500 focus:ring-green-500',
                (componentProps as any).className
              )}
            />
            {showValidation && (
              <FieldValidation
                error={error}
                isValidating={isValidating}
                isValid={isValid}
                hint={hint}
              />
            )}
          </div>
        )}
      </EnhancedFormField>
    );
  });
}
