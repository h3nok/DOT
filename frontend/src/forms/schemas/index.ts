// Blog post schemas and types
export {
  blogPostSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  draftBlogPostSchema,
  validateBlogPost,
  validateDraftBlogPost,
  validateTitle,
  validateContent,
  validateCategory,
  validateTags,
} from './blogPost';

export type {
  BlogPostFormData,
  CreateBlogPostData,
  UpdateBlogPostData,
  DraftBlogPostData,
} from './blogPost';

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
} from './userSettings';

export type {
  UserPreferencesData,
  UserProfileData,
  AccountSettingsData,
} from './userSettings';

// Settings page schemas and types
export {
  settingsPageSchema,
  validateSettingsPage,
  defaultSettingsValues,
} from './settingsPage';

export type {
  SettingsPageData,
} from './settingsPage';

// Donation schemas and types
export {
  donationSchema,
  supportTiers,
  type DonationFormData,
  type SupportTier
} from './donation';

// Integration schemas and types
export {
  integrationSchema,
  integrationTypes,
  type IntegrationFormData,
} from './integration';

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
