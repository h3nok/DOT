import { useForm, SubmitHandler } from 'react-hook-form';
import { useState, useCallback } from 'react';
import { type DonationFormData, type SupportTier, supportTiers } from '../schemas/donation';

interface UseDonationFormOptions {
  onSubmit?: (data: DonationFormData) => Promise<void>;
  onError?: (error: Error) => void;
}

export function useDonationForm({ onSubmit, onError }: UseDonationFormOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SupportTier | null>(null);

  const form = useForm<DonationFormData>({
    defaultValues: {
      donationType: 'one-time',
      selectedTier: null,
      isAnonymous: false,
      agreeToTerms: false
    }
  });

  const handleTierSelection = useCallback((tier: SupportTier) => {
    setSelectedTier(tier);
    form.setValue('selectedTier', tier);
    form.trigger('selectedTier');
  }, [form]);

  const handleDonationTypeChange = useCallback((type: 'one-time' | 'monthly') => {
    form.setValue('donationType', type);
    form.trigger('donationType');
  }, [form]);

  const onSubmitHandler: SubmitHandler<DonationFormData> = async (data) => {
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Default donation handling
        console.log('Donation submitted:', data);
        
        // For now, show an alert since the actual payment processing is disabled
        alert('Donation feature is temporarily disabled for testing.');
        
        // Future implementation would integrate with payment service:
        // const result = await DonationService.createPaymentIntent({
        //   amount: data.selectedTier?.amount ? data.selectedTier.amount * 100 : 0,
        //   currency: 'usd',
        //   type: data.donationType,
        //   metadata: {
        //     tier: data.selectedTier?.id,
        //     message: data.message,
        //     isAnonymous: data.isAnonymous
        //   }
        // });
        // 
        // if (result.url) {
        //   window.location.href = result.url;
        // }
      }
    } catch (error) {
      console.error('Donation error:', error);
      if (onError) {
        onError(error as Error);
      } else {
        alert('There was an error processing your donation. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = form.handleSubmit(onSubmitHandler);

  const resetForm = useCallback(() => {
    form.reset();
    setSelectedTier(null);
  }, [form]);

  return {
    form,
    loading,
    selectedTier,
    supportTiers,
    handleTierSelection,
    handleDonationTypeChange,
    handleSubmit,
    resetForm,
    formState: form.formState,
    watch: form.watch,
    getValues: form.getValues,
    setValue: form.setValue
  };
}
