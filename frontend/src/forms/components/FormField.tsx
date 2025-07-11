import { ReactNode } from 'react';
import { useFormContext, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Label } from '../../shared/components/ui/label';
import { cn } from '../../lib/utils';

export interface FormFieldProps<T extends FieldValues = FieldValues> {
  name: FieldPath<T>;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: (field: {
    value: any;
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    name: string;
    disabled?: boolean;
  }) => ReactNode;
}

export function FormField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  required = false,
  className,
  children,
}: FormFieldProps<T>) {
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext<T>();

  const error = errors[name]?.message as string | undefined;
  const hasError = !!error;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label 
          htmlFor={name} 
          className={cn(
            'text-sm font-medium',
            hasError && 'text-destructive',
            required && "after:content-['*'] after:ml-0.5 after:text-destructive"
          )}
        >
          {label}
        </Label>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <>
            {children({
              ...field,
              disabled: isSubmitting,
            })}
          </>
        )}
      />

      {hasError && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
