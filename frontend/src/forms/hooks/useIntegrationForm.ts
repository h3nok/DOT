import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { integrationSchema, type IntegrationFormData } from '../schemas/integration';

interface UseIntegrationFormProps {
  onSubmit: (data: IntegrationFormData) => Promise<void>;
  onError?: (error: Error) => void;
  defaultValues?: Partial<IntegrationFormData>;
}

export function useIntegrationForm({
  onSubmit,
  onError,
  defaultValues = {}
}: UseIntegrationFormProps) {
  const form = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      name: '',
      type: '',
      url: '',
      apiKey: '',
      description: '',
      ...defaultValues,
    },
    mode: 'onBlur',
  });

  const handleSubmit = async (data: IntegrationFormData) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error('Integration form submission error:', error);
      onError?.(error instanceof Error ? error : new Error('Submission failed'));
    }
  };

  return {
    form,
    handleSubmit: form.handleSubmit(handleSubmit),
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
    watch: form.watch,
    setValue: form.setValue,
    reset: form.reset,
  };
}
