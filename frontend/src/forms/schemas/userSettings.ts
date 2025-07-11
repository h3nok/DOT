import { z } from 'zod';

// User preferences schema
export const userPreferencesSchema = z.object({
  fontSize: z
    .enum(['base', 'lg', 'xl'], {
      errorMap: () => ({ message: 'Please select a valid font size' }),
    })
    .default('base'),
  
  focusMode: z
    .boolean()
    .default(false),
  
  reduceMotion: z
    .boolean()
    .default(false),
  
  highContrast: z
    .boolean()
    .default(false),
  
  autoSave: z
    .boolean()
    .default(true),
  
  notifications: z
    .boolean()
    .default(true),
  
  theme: z
    .enum(['light', 'dark', 'system'], {
      errorMap: () => ({ message: 'Please select a valid theme' }),
    })
    .default('system'),
  
  language: z
    .enum(['en', 'es', 'fr', 'de', 'ja', 'zh'], {
      errorMap: () => ({ message: 'Please select a valid language' }),
    })
    .default('en'),
});

// User profile schema
export const userProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters')
    .trim(),
  
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  avatar: z
    .string()
    .url('Must be a valid URL')
    .optional(),
  
  website: z
    .string()
    .url('Must be a valid URL')
    .optional(),
  
  location: z
    .string()
    .max(100, 'Location must be less than 100 characters')
    .optional(),
  
  expertise: z
    .array(z.string().min(1).max(50))
    .max(5, 'Maximum 5 expertise areas allowed')
    .default([]),
  
  socialLinks: z
    .object({
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      orcid: z.string().url().optional(),
    })
    .optional(),
  
  isPublic: z
    .boolean()
    .default(true),
  
  allowMessages: z
    .boolean()
    .default(true),
});

// Account settings schema
export const accountSettingsSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    )
    .optional(),
  
  confirmPassword: z
    .string()
    .optional(),
  
  twoFactorEnabled: z
    .boolean()
    .default(false),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Type exports
export type UserPreferencesData = z.infer<typeof userPreferencesSchema>;
export type UserProfileData = z.infer<typeof userProfileSchema>;
export type AccountSettingsData = z.infer<typeof accountSettingsSchema>;

// Validation helpers
export const validateUserPreferences = (data: unknown) => {
  return userPreferencesSchema.safeParse(data);
};

export const validateUserProfile = (data: unknown) => {
  return userProfileSchema.safeParse(data);
};

export const validateAccountSettings = (data: unknown) => {
  return accountSettingsSchema.safeParse(data);
};

// Field-specific validators
export const validateDisplayName = (name: string) => {
  const result = z.string().min(1).max(100).safeParse(name);
  return result.success ? null : result.error.errors[0]?.message;
};

export const validateEmail = (email: string) => {
  const result = z.string().email().max(255).safeParse(email);
  return result.success ? null : result.error.errors[0]?.message;
};

export const validatePassword = (password: string) => {
  const result = z
    .string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .safeParse(password);
  return result.success ? null : result.error.errors[0]?.message;
};
