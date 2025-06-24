import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Initialize Stripe (you'll need to add your publishable key to .env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

interface DonationResponse {
  success: boolean;
  payment_intent_id: string;
  amount: number;
  tier: string;
  message?: string;
}

interface SubscriptionResponse {
  success: boolean;
  subscription_id: string;
  tier: string;
  amount: number;
  message?: string;
}

interface DonationStats {
  total_amount: number;
  total_donations: number;
  monthly_goal: number;
  monthly_progress: number;
  supporter_count: number;
  patron_count: number;
  research_papers_funded: number;
  hours_of_research_supported: number;
}

interface UserSubscription {
  subscription_id: string;
  tier: string;
  amount: number;
  status: string;
  created_at: string;
  next_payment_date?: string;
}

interface SupporterAnalytics {
  monthly_revenue: number;
  supporter_growth: number;
  retention_rate: number;
  tier_distribution: {
    supporter: number;
    patron: number;
  };
  research_impact_metrics: {
    papers_published: number;
    citation_count: number;
    research_hours_funded: number;
    community_engagement_score: number;
  };
}

interface ThankYouEmailResponse {
  success: boolean;
  message: string;
}

type SupportTier = 'supporter' | 'patron' | 'custom';

// Research reading preferences for tier recommendations
interface ReadingPreferences {
  monthlyReadingHours: number;
  favoriteTopics: string[];
  engagementLevel: 'casual' | 'regular' | 'dedicated';
}

class DonationService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  constructor() {
    this.initializeStripe();
  }

  async initializeStripe(): Promise<void> {
    this.stripe = await stripePromise;
  }

  // Create a one-time donation
  async createOneTimeDonation(
    amount: number, 
    email: string, 
    tier: SupportTier = 'custom'
  ): Promise<DonationResponse> {
    try {
      // Create payment intent on backend
      const response: AxiosResponse<PaymentIntentResponse> = await axios.post(
        `${API_BASE_URL}/donations/create-payment-intent`,
        {
          amount: amount * 100, // Convert to cents
          currency: 'usd',
          description: `Digital Organisms Theory Research Support - ${tier}`,
          email,
          tier
        }
      );

      const { client_secret, payment_intent_id } = response.data;

      if (!this.stripe || !this.elements) {
        throw new Error('Stripe not initialized');
      }

      // Confirm payment with Stripe
      const { error } = await this.stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: this.elements.getElement('card')!,
          billing_details: {
            email: email,
          },
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Confirm payment on backend
      const confirmResponse: AxiosResponse<DonationResponse> = await axios.post(
        `${API_BASE_URL}/donations/confirm-payment`,
        {
          payment_intent_id,
          amount: amount * 100,
          email,
          tier
        }
      );

      return confirmResponse.data;
    } catch (error) {
      console.error('Donation error:', error);
      throw error;
    }
  }

  // Create a recurring subscription
  async createSubscription(
    amount: number, 
    email: string, 
    tier: SupportTier
  ): Promise<SubscriptionResponse> {
    try {
      const response: AxiosResponse<SubscriptionResponse> = await axios.post(
        `${API_BASE_URL}/donations/create-subscription`,
        {
          amount: amount * 100, // Convert to cents
          currency: 'usd',
          interval: 'month',
          email,
          tier
        }
      );

      return response.data;
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  }

  // Get donation statistics
  async getDonationStats(): Promise<DonationStats> {
    try {
      const response: AxiosResponse<DonationStats> = await axios.get(
        `${API_BASE_URL}/donations/stats`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching donation stats:', error);
      throw error;
    }
  }

  // Get user subscription status
  async getUserSubscription(email: string): Promise<UserSubscription> {
    try {
      const response: AxiosResponse<UserSubscription> = await axios.get(
        `${API_BASE_URL}/donations/subscriptions/${email}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; message: string }> = await axios.post(
        `${API_BASE_URL}/donations/cancel-subscription`,
        {
          subscription_id: subscriptionId
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Format amount for display
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Convert from cents
  }
  // Get tier benefits - optimized for research content consumption
  getTierBenefits(tier: SupportTier): string[] {
    const benefits: Record<SupportTier, string[]> = {
      supporter: [
        'Research supporter badge on profile',
        'Early access to new Digital Organisms Theory papers',
        'Monthly DOT research newsletter',
        'Access to research methodology notes',
        'Gratitude from an independent researcher'
      ],
      patron: [
        'All Research Supporter benefits',
        'Exclusive deep-dive analysis articles',
        'Behind-the-scenes research process insights',
        'Priority access to experimental findings',
        'Direct input on research directions and topics',
        'Quarterly comprehensive research reports',
        'Access to research data sets and models'
      ],
      custom: [
        'My sincere gratitude',
        'Support for independent Digital Organisms Theory research',
        'Contribution to advancing understanding of digital consciousness'
      ]
    };
    return benefits[tier] || [];
  }

  // Get supporter analytics
  async getSupporterAnalytics(): Promise<SupporterAnalytics> {
    try {
      const response: AxiosResponse<SupporterAnalytics> = await axios.get(
        `${API_BASE_URL}/donations/analytics`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching supporter analytics:', error);
      throw error;
    }
  }

  // Send supporter thank you email
  async sendThankYouEmail(
    email: string, 
    tier: SupportTier, 
    amount: number
  ): Promise<ThankYouEmailResponse> {
    try {
      const response: AxiosResponse<ThankYouEmailResponse> = await axios.post(
        `${API_BASE_URL}/donations/thank-you`,
        {
          email,
          tier,
          amount
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending thank you email:', error);
      throw error;
    }
  }

  // Get research impact metrics for display
  async getResearchImpactMetrics(): Promise<{
    papers_published: number;
    total_citations: number;
    research_hours_funded: number;
    supporter_funded_discoveries: string[];
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/donations/research-impact`);
      return response.data;
    } catch (error) {
      console.error('Error fetching research impact metrics:', error);
      throw error;
    }
  }
  // Get suggested donation amounts based on research goals (optimized for readers)
  getSuggestedAmounts(): { tier: SupportTier; amount: number; impact: string; readingBenefit: string }[] {
    return [
      {
        tier: 'supporter',
        amount: 500, // $5
        impact: 'Funds 1 hour of Digital Organisms Theory research',
        readingBenefit: 'Unlocks early access to 1-2 new research articles monthly'
      },
      {
        tier: 'supporter',
        amount: 1000, // $10
        impact: 'Supports research materials and tools for 2 hours',
        readingBenefit: 'Full supporter access + enhanced reading tools'
      },
      {
        tier: 'supporter',
        amount: 1500, // $15
        impact: 'Enables 3 hours of focused consciousness research',
        readingBenefit: 'Premium reading experience + methodology insights'
      },
      {
        tier: 'patron',
        amount: 2500, // $25
        impact: 'Funds 5 hours of deep emergence pattern analysis',
        readingBenefit: 'Exclusive deep-dive content + research data access'
      },
      {
        tier: 'patron',
        amount: 5000, // $50
        impact: 'Supports full day of comprehensive digital organism research',
        readingBenefit: 'Complete patron access + direct researcher interaction'
      }
    ];
  }
  // Calculate research impact from donation amount (optimized for reading context)
  calculateResearchImpact(amount: number): string {
    const amountInDollars = amount / 100; // Convert from cents
    const hours = Math.floor(amountInDollars / 5); // $5 per research hour
    
    if (amountInDollars < 5) {
      return 'Contributes to ongoing Digital Organisms Theory research';
    } else if (hours === 1) {
      return 'Funds 1 hour of focused research that could produce 1-2 articles you\'ll read';
    } else if (hours < 8) {
      return `Funds ${hours} hours of dedicated research - equivalent to ${Math.floor(hours * 1.5)} research articles`;
    } else if (hours < 40) {
      const days = Math.floor(hours / 8);
      const articles = Math.floor(hours * 1.5);
      return `Supports ${days} days of full-time research - producing ~${articles} articles and insights`;
    } else {
      const weeks = Math.floor(hours / 40);
      const papers = Math.floor(weeks * 2);
      return `Enables ${weeks} weeks of comprehensive research - potentially ${papers} major papers`;
    }
  }

  // Get tier recommendation based on reading patterns
  getRecommendedTier(monthlyReadingHours: number): {
    tier: SupportTier;
    reason: string;
    suggestedAmount: number;
  } {
    if (monthlyReadingHours >= 10) {
      return {
        tier: 'patron',
        reason: 'You\'re a dedicated researcher who would benefit from exclusive deep-dive content',
        suggestedAmount: 2500 // $25
      };
    } else if (monthlyReadingHours >= 3) {
      return {
        tier: 'supporter',
        reason: 'You regularly engage with Digital Organisms Theory content',
        suggestedAmount: 1000 // $10
      };
    } else {
      return {
        tier: 'custom',
        reason: 'Any support helps advance independent research',
        suggestedAmount: 500 // $5
      };
    }
  }

  // Set Stripe elements (to be called when setting up payment form)
  setElements(elements: StripeElements): void {
    this.elements = elements;
  }

  // Get reading engagement metrics for research content
  async getReadingEngagementMetrics(userId?: string): Promise<{
    totalReadingTime: number;
    articlesRead: number;
    favoriteTopics: string[];
    engagementScore: number;
    recommendedSupportLevel: SupportTier;
  }> {
    try {
      const endpoint = userId 
        ? `${API_BASE_URL}/analytics/reading-engagement/${userId}`
        : `${API_BASE_URL}/analytics/reading-engagement`;
      const response = await axios.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching reading engagement metrics:', error);
      throw error;
    }
  }

  // Get content access levels for different support tiers
  getContentAccessLevels(): Record<SupportTier, {
    articles: string[];
    features: string[];
    restrictions: string[];
  }> {
    return {
      custom: {
        articles: ['Public research articles', 'Basic DOT theory overviews'],
        features: ['Standard reading interface', 'Basic search functionality'],
        restrictions: ['No access to premium research papers', 'Limited to public content']
      },
      supporter: {
        articles: [
          'All public content',
          'Early access research papers',
          'Monthly methodology insights',
          'Research progress updates'
        ],
        features: [
          'Enhanced reading interface',
          'Advanced search with research filters',
          'Reading progress tracking',
          'Bookmark and note-taking tools'
        ],
        restrictions: ['Limited access to raw research data']
      },
      patron: {
        articles: [
          'All supporter content',
          'Exclusive deep-dive analyses',
          'Behind-the-scenes research process',
          'Experimental findings and hypotheses',
          'Quarterly comprehensive reports'
        ],
        features: [
          'Premium reading experience',
          'Full-text search across all content',
          'Advanced analytics dashboard',
          'Direct researcher communication',
          'Access to research datasets and models',
          'Priority content requests'
        ],
        restrictions: ['None - full access to all research content']
      }
    };
  }

  // Calculate value proposition for research supporters
  getValueProposition(tier: SupportTier, readingHours: number): {
    costPerHour: number;
    researchHoursFunded: number;
    exclusiveContentHours: number;
    communityImpact: string;
  } {
    const tierAmounts = {
      custom: 500, // $5
      supporter: 1000, // $10
      patron: 2500 // $25
    };

    const amount = tierAmounts[tier];
    const costPerHour = readingHours > 0 ? amount / 100 / readingHours : 0;
    const researchHoursFunded = Math.floor(amount / 500); // $5 per research hour
    
    let exclusiveContentHours = 0;
    if (tier === 'supporter') exclusiveContentHours = 2;
    if (tier === 'patron') exclusiveContentHours = 8;

    const communityImpact = tier === 'patron' 
      ? 'Enables breakthrough research that advances the entire field'
      : tier === 'supporter'
      ? 'Supports consistent research output and community growth'
      : 'Contributes to independent research sustainability';

    return {
      costPerHour,
      researchHoursFunded,
      exclusiveContentHours,
      communityImpact
    };
  }

  // Get research milestone tracking
  async getResearchMilestones(): Promise<{
    current_milestone: string;
    progress_percentage: number;
    funding_needed: number;
    estimated_completion: string;
    supporter_contributions: {
      supporter_count: number;
      patron_count: number;
      total_funding: number;
    };
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/research/milestones`);
      return response.data;
    } catch (error) {
      console.error('Error fetching research milestones:', error);
      throw error;
    }
  }

  // Get personalized reading recommendations based on support tier
  async getPersonalizedRecommendations(
    userId: string, 
    tier: SupportTier
  ): Promise<{
    recommended_articles: Array<{
      title: string;
      description: string;
      reading_time: number;
      complexity_level: 'beginner' | 'intermediate' | 'advanced';
      access_level: SupportTier;
    }>;
    upcoming_content: string[];
    research_updates: string[];
  }> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/content/recommendations/${userId}?tier=${tier}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      throw error;
    }
  }

  // Track reading session for analytics
  async trackReadingSession(data: {
    userId?: string;
    articleId: string;
    readingTime: number;
    completionPercentage: number;
    engagementScore: number;
  }): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/analytics/reading-session`, data);
    } catch (error) {
      console.error('Error tracking reading session:', error);
      // Don't throw - analytics failures shouldn't break reading experience
    }
  }
}

export default new DonationService();
export type { 
  SupportTier, 
  DonationResponse, 
  SubscriptionResponse, 
  DonationStats, 
  UserSubscription, 
  SupporterAnalytics,
  ThankYouEmailResponse,
  ReadingPreferences
};
