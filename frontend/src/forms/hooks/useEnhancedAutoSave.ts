import { useEffect, useRef, useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';

export interface AutoSaveOptions {
  /** Auto-save interval in milliseconds */
  interval?: number;
  /** Key for localStorage persistence */
  storageKey?: string;
  /** Function to call when auto-saving */
  onAutoSave?: (data: any) => Promise<void> | void;
  /** Function to call when loading saved data */
  onLoadSaved?: (data: any) => void;
  /** Fields to exclude from auto-save */
  excludeFields?: string[];
  /** Only save when form is valid */
  onlyWhenValid?: boolean;
  /** Debounce time for auto-save */
  debounceMs?: number;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  savedData: any;
}

/**
 * Hook for auto-saving form data with localStorage persistence and remote save support
 */
export const useAutoSave = <T extends Record<string, any>>(
  form: UseFormReturn<T>,
  options: AutoSaveOptions = {}
) => {
  const {
    interval = 30000, // 30 seconds
    storageKey,
    onAutoSave,
    onLoadSaved,
    excludeFields = [],
    onlyWhenValid = false,
    debounceMs = 1000
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    savedData: null
  });

  const autoSaveIntervalRef = useRef<number | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);
  const lastSavedDataRef = useRef<any>(null);

  const { watch, getValues, formState: { isValid } } = form;
  const allValues = watch();

  // Filter data for saving
  const getFilteredData = useCallback(() => {
    const data = getValues();
    const filtered = { ...data };
    
    excludeFields.forEach(field => {
      delete filtered[field as keyof T];
    });
    
    return filtered;
  }, [getValues, excludeFields]);

  // Save to localStorage
  const saveToStorage = useCallback((data: any) => {
    if (!storageKey) return;
    
    try {
      const saveData = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(storageKey, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [storageKey]);

  // Load from localStorage
  const loadFromStorage = useCallback(() => {
    if (!storageKey) return null;
    
    try {
      const savedItem = localStorage.getItem(storageKey);
      if (!savedItem) return null;
      
      const parsed = JSON.parse(savedItem);
      return parsed.data;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }, [storageKey]);

  // Clear storage
  const clearStorage = useCallback(() => {
    if (!storageKey) return;
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Perform auto-save
  const performAutoSave = useCallback(async () => {
    if (onlyWhenValid && !isValid) return;
    
    const currentData = getFilteredData();
    
    // Check if data has actually changed
    if (JSON.stringify(currentData) === JSON.stringify(lastSavedDataRef.current)) {
      return;
    }

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      // Save to localStorage
      saveToStorage(currentData);
      
      // Call custom save function if provided
      if (onAutoSave) {
        await onAutoSave(currentData);
      }
      
      lastSavedDataRef.current = currentData;
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        savedData: currentData
      }));
    } catch (error) {
      console.error('Auto-save failed:', error);
      setState(prev => ({ ...prev, isSaving: false }));
    }
  }, [onlyWhenValid, isValid, getFilteredData, saveToStorage, onAutoSave]);

  // Debounced auto-save
  const debouncedAutoSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(performAutoSave, debounceMs);
  }, [performAutoSave, debounceMs]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    await performAutoSave();
  }, [performAutoSave]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData && onLoadSaved) {
      onLoadSaved(savedData);
      setState(prev => ({ ...prev, savedData }));
    }
  }, [loadFromStorage, onLoadSaved]);

  // Watch for form changes
  useEffect(() => {
    const currentData = getFilteredData();
    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(lastSavedDataRef.current);
    
    setState(prev => ({ ...prev, hasUnsavedChanges: hasChanges }));
    
    if (hasChanges) {
      debouncedAutoSave();
    }
  }, [allValues, getFilteredData, debouncedAutoSave]);

  // Set up auto-save interval
  useEffect(() => {
    if (interval > 0) {
      autoSaveIntervalRef.current = setInterval(performAutoSave, interval);
    }
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [interval, performAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        performAutoSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges, performAutoSave]);

  return {
    ...state,
    saveNow,
    clearStorage,
    loadFromStorage,
    isAutoSaveEnabled: Boolean(onAutoSave || storageKey),
  };
};
