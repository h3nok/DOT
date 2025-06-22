import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Initialize Stripe (you'll need to add your publishable key to .env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

class DonationService {
  constructor() {
    this.stripe = null;
    this.initializeStripe();
  }

  async initializeStripe() {
    this.stripe = await stripePromise;
  }

  // Create a one-time donation
  async createOneTimeDonation(amount, email, tier = 'custom') {
    try {
      // Create payment intent on backend
      const response = await axios.post(`${API_BASE_URL}/donations/create-payment-intent`, {
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        description: `DOT Platform Support - ${tier}`,
        email,
        tier
      });

      const { client_secret, payment_intent_id } = response.data;

      // Confirm payment with Stripe
      const { error } = await this.stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: this.elements.getElement('card'),
          billing_details: {
            email: email,
          },
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Confirm payment on backend
      const confirmResponse = await axios.post(`${API_BASE_URL}/donations/confirm-payment`, {
        payment_intent_id,
        amount: amount * 100,
        email,
        tier
      });

      return confirmResponse.data;
    } catch (error) {
      console.error('Donation error:', error);
      throw error;
    }
  }

  // Create a subscription
  async createSubscription(amount, email, tier) {
    try {
      // Create subscription on backend
      const response = await axios.post(`${API_BASE_URL}/donations/create-subscription`, {
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        tier,
        email
      });

      const { subscription_id, customer_id } = response.data;

      // Confirm subscription on backend
      const confirmResponse = await axios.post(`${API_BASE_URL}/donations/confirm-subscription`, {
        subscription_id,
        customer_id,
        amount: amount * 100,
        email,
        tier
      });

      return confirmResponse.data;
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  }

  // Get donation statistics
  async getDonationStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/donations/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching donation stats:', error);
      throw error;
    }
  }

  // Get user subscription status
  async getUserSubscription(email) {
    try {
      const response = await axios.get(`${API_BASE_URL}/donations/subscriptions/${email}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/donations/cancel-subscription`, {
        subscription_id: subscriptionId
      });
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Format amount for display
  formatAmount(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Convert from cents
  }

  // Get tier benefits
  getTierBenefits(tier) {
    const benefits = {
      supporter: [
        'Supporter badge on profile',
        'Early access to new content',
        'Monthly newsletter with insights',
        'My sincere gratitude'
      ],
      patron: [
        'All Supporter benefits',
        'Exclusive articles and insights',
        'Priority access to new content',
        'Direct input on topics to explore',
        'Quarterly research updates'
      ]
    };
    return benefits[tier] || [];
  }

  // Get supporter analytics
  async getSupporterAnalytics() {
    try {
      const response = await axios.get(`${API_BASE_URL}/donations/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching supporter analytics:', error);
      throw error;
    }
  }

  // Send supporter thank you email
  async sendThankYouEmail(email, tier, amount) {
    try {
      const response = await axios.post(`${API_BASE_URL}/donations/thank-you`, {
        email,
        tier,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error sending thank you email:', error);
      throw error;
    }
  }
}

export default new DonationService(); 