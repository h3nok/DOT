import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { settingsPageSchema, type SettingsPageData, defaultSettingsValues } from '../schemas/settingsPage';
import { useAutoSave } from './useAutoSave';

interface UseSettingsOptions {
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
  onSave?: (data: SettingsPageData) => Promise<void>;
  onReset?: () => void;
}

export const useSettings = (options: UseSettingsOptions = {}) => {
  const {
    enableAutoSave = false,
    autoSaveDelay = 2000,
    onSave,
    onReset,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const form = useForm<SettingsPageData>({
    resolver: zodResolver(settingsPageSchema),
    defaultValues: defaultSettingsValues,
    mode: 'onChange',
  });

  const { watch, reset, getValues, formState: { isDirty, isValid } } = form;

  // Auto-save functionality
  const { manualSave: triggerAutoSave, resetAutoSave, isSaving: isAutoSaving } = useAutoSave({
    form,
    onSave: async (data) => {
      if (onSave && isDirty && isValid) {
        setSaveStatus('saving');
        try {
          await onSave(data);
          setLastSaved(new Date());
          setSaveStatus('saved');
          // Reset form state to mark as clean
          reset(data, { keepValues: true });
        } catch (error) {
          console.error('Auto-save failed:', error);
          setSaveStatus('error');
        }
      }
    },
    delay: autoSaveDelay,
    enabled: enableAutoSave,
  });

  // Manual save function
  const handleSave = useCallback(async () => {
    if (!isValid) return;

    setIsLoading(true);
    setSaveStatus('saving');
    
    try {
      const data = getValues();
      if (onSave) {
        await onSave(data);
      }
      setLastSaved(new Date());
      setSaveStatus('saved');
      reset(data, { keepValues: true }); // Mark form as clean
      
      // Show success feedback
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [getValues, isValid, onSave, reset]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    reset(defaultSettingsValues);
    setSaveStatus('idle');
    setLastSaved(null);
    resetAutoSave();
    if (onReset) {
      onReset();
    }
  }, [reset, resetAutoSave, onReset]);

  // Load initial data
  const loadSettings = useCallback((data: Partial<SettingsPageData>) => {
    const mergedData = { ...defaultSettingsValues, ...data };
    reset(mergedData);
    setSaveStatus('idle');
  }, [reset]);

  return {
    // Form instance and state
    form,
    isLoading,
    isDirty,
    isValid,
    
    // Save state
    saveStatus,
    lastSaved,
    isAutoSaving,
    
    // Actions
    handleSave,
    handleReset,
    loadSettings,
    triggerAutoSave,
    
    // Helper functions
    getSectionData: (section: keyof SettingsPageData) => watch(section),
    updateSection: (section: keyof SettingsPageData, data: any) => {
      form.setValue(section, data, { shouldDirty: true, shouldValidate: true });
    },
  };
};

export default useSettings;
