// User settings schemas and types
export {
  userPreferencesSchema,
  userProfileSchema,
  accountSettingsSchema,
  validateUserPreferences,
  validateUserProfile,
  validateAccountSettings,
  validateDisplayName,
  validateEmail,
  validatePassword,
} from "./userSettings";

export type {
  UserPreferencesData,
  UserProfileData,
  AccountSettingsData,
} from "./userSettings";

// Common validation utilities
export const createFieldValidator = <T>(schema: any) => {
  return (value: T) => {
    const result = schema.safeParse(value);
    return result.success ? null : result.error.errors[0]?.message;
  };
};

// Form field states
export interface FieldState<T = any> {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T = any> {
  values: T;
  errors: Record<string, string | null>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}
