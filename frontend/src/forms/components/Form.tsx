import { ReactNode } from 'react';
import { UseFormReturn, FormProvider, FieldValues } from 'react-hook-form';
import { cn } from '../../lib/utils';

export interface FormProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  autoComplete?: 'on' | 'off';
}

export function Form<T extends FieldValues = FieldValues>({
  form,
  onSubmit,
  children,
  className,
  disabled = false,
  autoComplete = 'off',
}: FormProps<T>) {
  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      // Handle form-level errors if needed
    }
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn('space-y-6', className)}
        autoComplete={autoComplete}
        noValidate
      >
        <fieldset disabled={disabled || form.formState.isSubmitting}>
          {children}
        </fieldset>
      </form>
    </FormProvider>
  );
}
