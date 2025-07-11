import { z } from 'zod';
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

export interface ValidationRule {
  field: string;
  validate: (value: any, allValues: any) => string | boolean;
  message: string;
  debounce?: number;
}

export interface ConditionalField {
  field: string;
  condition: (allValues: any) => boolean;
  requiredWhen?: (allValues: any) => boolean;
}

/**
 * Hook for advanced form validation with real-time feedback, 
 * cross-field validation, and conditional fields
 */
export const useAdvancedValidation = <T extends Record<string, any>>(
  form: UseFormReturn<T>,
  options: {
    crossFieldRules?: ValidationRule[];
    conditionalFields?: ConditionalField[];
    realTimeValidation?: boolean;
    debounceMs?: number;
  } = {}
) => {
  const {
    crossFieldRules = [],
    conditionalFields = [],
    realTimeValidation = true,
    debounceMs = 300
  } = options;

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [conditionalFieldsState, setConditionalFieldsState] = useState<Record<string, {
    visible: boolean;
    required: boolean;
  }>>({});

  const { watch, setError, clearErrors, trigger } = form;
  const allValues = watch();

  // Debounced validation
  useEffect(() => {
    if (!realTimeValidation) return;

    const timeoutId = setTimeout(async () => {
      setIsValidating(true);
      
      // Cross-field validation
      const newFieldErrors: Record<string, string> = {};
      
      for (const rule of crossFieldRules) {
        const fieldValue = allValues[rule.field];
        const result = rule.validate(fieldValue, allValues);
        
        if (typeof result === 'string') {
          newFieldErrors[rule.field] = result;
          setError(rule.field as any, { message: result });
        } else if (result === false) {
          newFieldErrors[rule.field] = rule.message;
          setError(rule.field as any, { message: rule.message });
        } else {
          clearErrors(rule.field as any);
        }
      }
      
      setFieldErrors(newFieldErrors);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [allValues, realTimeValidation, debounceMs, crossFieldRules, setError, clearErrors]);

  // Conditional fields management
  useEffect(() => {
    const newConditionalState: Record<string, { visible: boolean; required: boolean }> = {};
    
    for (const conditionalField of conditionalFields) {
      const isVisible = conditionalField.condition(allValues);
      const isRequired = conditionalField.requiredWhen ? conditionalField.requiredWhen(allValues) : false;
      
      newConditionalState[conditionalField.field] = {
        visible: isVisible,
        required: isRequired
      };
      
      // Clear field value if not visible
      if (!isVisible && allValues[conditionalField.field] !== undefined) {
        form.setValue(conditionalField.field as any, '' as any);
        clearErrors(conditionalField.field as any);
      }
    }
    
    setConditionalFieldsState(newConditionalState);
  }, [allValues, conditionalFields, form, clearErrors]);

  const isFieldVisible = (fieldName: string): boolean => {
    return conditionalFieldsState[fieldName]?.visible ?? true;
  };

  const isFieldRequired = (fieldName: string): boolean => {
    return conditionalFieldsState[fieldName]?.required ?? false;
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return fieldErrors[fieldName];
  };

  const validateField = async (fieldName: string) => {
    await trigger(fieldName as any);
  };

  const validateAllFields = async () => {
    const isValid = await trigger();
    return isValid;
  };

  return {
    isValidating,
    fieldErrors,
    conditionalFieldsState,
    isFieldVisible,
    isFieldRequired,
    getFieldError,
    validateField,
    validateAllFields
  };
};

/**
 * Common validation schemas for advanced validation
 */
export const advancedValidationSchemas = {
  // Password strength validation
  strongPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  // Email with domain validation
  businessEmail: z.string()
    .email('Please enter a valid email address')
    .refine(
      (email) => !email.endsWith('@gmail.com') && !email.endsWith('@yahoo.com'),
      'Please use a business email address'
    ),

  // URL validation
  validUrl: z.string()
    .url('Please enter a valid URL')
    .refine(
      (url) => url.startsWith('https://'),
      'URL must use HTTPS'
    ),

  // Phone number validation
  phoneNumber: z.string()
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number'),

  // Date range validation
  futureDate: z.date()
    .refine(
      (date) => date > new Date(),
      'Date must be in the future'
    ),

  // File size validation
  fileSize: (maxSizeMB: number) => z.instanceof(File)
    .refine(
      (file) => file.size <= maxSizeMB * 1024 * 1024,
      `File size must be less than ${maxSizeMB}MB`
    ),

  // Array length validation
  minItems: (min: number) => z.array(z.any())
    .min(min, `Please select at least ${min} item(s)`),

  // Custom validation with dependencies
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
};

/**
 * Common cross-field validation rules
 */
export const commonCrossFieldRules = {
  confirmPassword: (passwordField: string, confirmField: string): ValidationRule => ({
    field: confirmField,
    validate: (value, allValues) => {
      return allValues[passwordField] === value || 'Passwords do not match';
    },
    message: 'Passwords do not match'
  }),

  dateRange: (startField: string, endField: string): ValidationRule => ({
    field: endField,
    validate: (value, allValues) => {
      const startDate = new Date(allValues[startField]);
      const endDate = new Date(value);
      return endDate > startDate || 'End date must be after start date';
    },
    message: 'End date must be after start date'
  }),

  conditionalRequired: (field: string, condition: (values: any) => boolean, message: string): ValidationRule => ({
    field,
    validate: (value, allValues) => {
      if (condition(allValues)) {
        return value !== undefined && value !== '' && value !== null;
      }
      return true;
    },
    message
  })
};

/**
 * Common conditional field configurations
 */
export const commonConditionalFields = {
  showWhenChecked: (triggerField: string, targetField: string): ConditionalField => ({
    field: targetField,
    condition: (values) => Boolean(values[triggerField]),
    requiredWhen: (values) => Boolean(values[triggerField])
  }),

  showWhenEquals: (triggerField: string, targetField: string, expectedValue: any): ConditionalField => ({
    field: targetField,
    condition: (values) => values[triggerField] === expectedValue,
    requiredWhen: (values) => values[triggerField] === expectedValue
  }),

  showWhenNotEmpty: (triggerField: string, targetField: string): ConditionalField => ({
    field: targetField,
    condition: (values) => Boolean(values[triggerField] && values[triggerField].length > 0)
  })
};
