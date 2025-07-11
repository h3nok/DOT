import { z } from 'zod';

export const settingsPageSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    marketing: z.boolean(),
    newArticles: z.boolean(),
    communityUpdates: z.boolean(),
  }),
  reading: z.object({
    autoOptimize: z.boolean(),
    fontSize: z.enum(['small', 'medium', 'large', 'extra-large']),
    lineHeight: z.enum(['compact', 'comfortable', 'relaxed']),
    wordSpacing: z.enum(['tight', 'normal', 'loose']),
  }),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'community', 'private']),
    activityTracking: z.boolean(),
    dataCollection: z.boolean(),
  }),
  accessibility: z.object({
    reduceMotion: z.boolean(),
    highContrast: z.boolean(),
    keyboardNavigation: z.boolean(),
  }),
});

export type SettingsPageData = z.infer<typeof settingsPageSchema>;

export const validateSettingsPage = (data: unknown) => {
  return settingsPageSchema.safeParse(data);
};

// Default values for the form
export const defaultSettingsValues: SettingsPageData = {
  notifications: {
    email: true,
    push: false,
    marketing: false,
    newArticles: true,
    communityUpdates: true,
  },
  reading: {
    autoOptimize: true,
    fontSize: 'medium',
    lineHeight: 'comfortable',
    wordSpacing: 'normal',
  },
  privacy: {
    profileVisibility: 'public',
    activityTracking: true,
    dataCollection: false,
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    keyboardNavigation: true,
  },
};
