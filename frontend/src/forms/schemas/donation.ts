import { z } from 'zod';

export const donationSchema = z.object({
  donationType: z.enum(['one-time', 'monthly'], {
    required_error: 'Please select a donation type'
  }),
  selectedTier: z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number(),
    description: z.string(),
    benefits: z.array(z.string()),
    color: z.string()
  }).nullable().optional(),
  customAmount: z.number().min(1, 'Amount must be at least $1').optional(),
  message: z.string().max(500, 'Message must be 500 characters or less').optional(),
  isAnonymous: z.boolean().default(false),
  contactEmail: z.string().email('Please enter a valid email').optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms'
  })
});

export type DonationFormData = z.infer<typeof donationSchema>;

export interface SupportTier {
  id: string;
  name: string;
  amount: number;
  description: string;
  benefits: string[];
  color: string;
}

export const supportTiers: SupportTier[] = [
  {
    id: 'coffee',
    name: 'Coffee Supporter',
    amount: 5,
    description: 'Buy me a coffee and keep the ideas flowing',
    benefits: ['My sincere gratitude', 'Early access to new content'],
    color: 'bg-orange-500'
  },
  {
    id: 'reader',
    name: 'Dedicated Reader',
    amount: 15,
    description: 'For those who find real value in this work',
    benefits: [
      'All coffee supporter benefits',
      'Exclusive monthly insights',
      'Direct Q&A access'
    ],
    color: 'bg-blue-500'
  },
  {
    id: 'community',
    name: 'Community Builder',
    amount: 25,
    description: 'Help build this community of consciousness explorers',
    benefits: [
      'All reader benefits',
      'Private discussion group access',
      'Monthly live sessions',
      'Name in acknowledgments'
    ],
    color: 'bg-purple-500'
  },
  {
    id: 'visionary',
    name: 'Visionary Supporter',
    amount: 50,
    description: 'For those who believe in this vision deeply',
    benefits: [
      'All community benefits',
      '1-on-1 consultation calls',
      'Exclusive research previews',
      'Co-creation opportunities'
    ],
    color: 'bg-yellow-500'
  }
];
