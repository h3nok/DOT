import { useEffect, useCallback, useRef } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

export interface UseAutoSaveOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  onSave: (data: T) => Promise<void> | void;
  delay?: number;
  enabled?: boolean;
  triggerFields?: (keyof T)[];
}

export function useAutoSave<T extends FieldValues>({
  form,
  onSave,
  delay = 2000,
  enabled = true,
  triggerFields,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<number | undefined>(undefined);
  const lastSavedData = useRef<string>('');
  const isSaving = useRef(false);

  const saveData = useCallback(async () => {
    if (isSaving.current) return;

    const currentData = form.getValues();
    const currentDataString = JSON.stringify(currentData);

    // Only save if data has changed
    if (currentDataString === lastSavedData.current) {
      return;
    }

    try {
      isSaving.current = true;
      await onSave(currentData);
      lastSavedData.current = currentDataString;
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSaving.current = false;
    }
  }, [form, onSave]);

  const scheduleAutoSave = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = window.setTimeout(saveData, delay);
  }, [enabled, delay, saveData]);

  const manualSave = useCallback(async () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    await saveData();
  }, [saveData]);

  const resetAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    lastSavedData.current = JSON.stringify(form.getValues());
  }, [form]);

  // Watch for form changes
  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch((_data, { name }) => {
      // If specific trigger fields are defined, only auto-save when those fields change
      if (triggerFields && name && !triggerFields.includes(name as keyof T)) {
        return;
      }

      scheduleAutoSave();
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [form, enabled, triggerFields, scheduleAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    manualSave,
    resetAutoSave,
    isSaving: isSaving.current,
  };
}
