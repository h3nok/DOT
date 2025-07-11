import { useCallback } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { z } from 'zod';

export interface UseFormValidationOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  schema: z.ZodSchema<T>;
  onValidationError?: (errors: z.ZodError) => void;
}

export function useFormValidation<T extends FieldValues>({
  form,
  schema,
  onValidationError,
}: UseFormValidationOptions<T>) {
  const validateField = useCallback(
    (fieldName: keyof T, value: any) => {
      try {
        // For field-level validation, we'll use the full schema and extract the field error
        const testData = { ...form.getValues(), [fieldName]: value } as T;
        schema.parse(testData);
        form.clearErrors(fieldName as any);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find(err => 
            err.path.length > 0 && err.path[0] === fieldName
          );
          
          if (fieldError) {
            form.setError(fieldName as any, {
              type: 'validation',
              message: fieldError.message,
            });
          }
          return false;
        }
      }
      return true;
    },
    [form, schema]
  );

  const validateForm = useCallback(
    async (data: T) => {
      try {
        schema.parse(data);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          onValidationError?.(error);
          
          // Set form errors
          error.errors.forEach((err) => {
            const fieldName = err.path.join('.') as keyof T;
            form.setError(fieldName as any, {
              type: 'validation',
              message: err.message,
            });
          });
          
          return false;
        }
        return false;
      }
    },
    [form, schema, onValidationError]
  );

  const validateAndSubmit = useCallback(
    async (onSubmit: (data: T) => Promise<void> | void) => {
      const data = form.getValues();
      const isValid = await validateForm(data);
      
      if (isValid) {
        try {
          await onSubmit(data);
        } catch (error) {
          console.error('Form submission error:', error);
          throw error;
        }
      }
    },
    [form, validateForm]
  );

  return {
    validateField,
    validateForm,
    validateAndSubmit,
  };
}
