// Application Constants
export const APP_NAME = 'DOT Platform';
export const APP_DESCRIPTION = 'Digital Organism Theory Platform';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Routes
export const ROUTES = {
  HOME: '/',
  BLOG: '/blog',
  BLOG_POST: '/blog/:id',
  BLOG_EDIT: '/blog/edit/:id',
  BLOG_NEW: '/blog/new',
  COMMUNITY: '/community',
  LEARN: '/learn',
  PROFILE: '/profile',
  SUPPORT: '/support',
  KNOWLEDGE_INTEGRATION: '/knowledge-integration'
};

// Donation Tiers
export const DONATION_TIERS = {
  SUPPORTER: {
    id: 'supporter',
    name: 'Supporter',
    amount: 5,
    benefits: [
      'Supporter badge on profile',
      'Early access to new content',
      'Monthly newsletter with insights',
      'My sincere gratitude'
    ]
  },
  PATRON: {
    id: 'patron',
    name: 'Patron',
    amount: 15,
    benefits: [
      'All Supporter benefits',
      'Exclusive articles and insights',
      'Priority access to new content',
      'Direct input on topics to explore',
      'Quarterly research updates'
    ]
  }
};

// Blog Categories
export const BLOG_CATEGORIES = [
  { id: 'consciousness', name: 'Consciousness', color: 'primary' },
  { id: 'neuroscience', name: 'Neuroscience', color: 'secondary' },
  { id: 'theory', name: 'Theory', color: 'accent' },
  { id: 'philosophy', name: 'Philosophy', color: 'muted' },
  { id: 'complexity', name: 'Complexity', color: 'destructive' },
  { id: 'future', name: 'Future', color: 'default' }
];

// Animation Durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000
};

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
};

// Pagination
export const PAGINATION = {
  POSTS_PER_PAGE: 6,
  MAX_PAGES_SHOWN: 5
};

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'dot-theme',
  USER_PREFERENCES: 'dot-user-preferences',
  DRAFT_POST: 'dot-draft-post',
  AUTH_TOKEN: 'dot-auth-token'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PAYMENT_ERROR: 'Payment failed. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  PAYMENT_SUCCESS: 'Payment processed successfully!',
  POST_SAVED: 'Post saved successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  DONATION_RECEIVED: 'Thank you for your support!'
}; 