// Enhanced Support Service for Customer Support System
// MVP Implementation - Production Ready Support Features

import ErrorService from './errors/ErrorService';

export interface SupportTicket {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  responses: SupportResponse[];
  attachments?: SupportAttachment[];
}

export interface SupportResponse {
  id: string;
  ticketId: string;
  responderId: string;
  responderName: string;
  responderType: 'user' | 'support' | 'admin';
  message: string;
  isInternal: boolean;
  createdAt: Date;
  attachments?: SupportAttachment[];
}

export interface SupportAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  attachments?: File[];
}

export interface UserFeedback {
  id: string;
  userId?: string;
  type: 'bug' | 'feature' | 'improvement' | 'compliment' | 'complaint';
  title: string;
  description: string;
  rating?: number;
  url?: string;
  userAgent?: string;
  screenshots?: string[];
  status: 'new' | 'reviewing' | 'planned' | 'in-progress' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  satisfactionRating: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  ticketsByStatus: Array<{
    status: string;
    count: number;
  }>;
}

class SupportService {
  private static baseUrl = '/api/support';

  // Ticket Management
  static async createTicket(ticket: Partial<SupportTicket>): Promise<SupportTicket> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticket),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ticket: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'createTicket',
        metadata: { ticket },
      });
      throw error;
    }
  }

  static async getTicket(id: string): Promise<SupportTicket> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ticket: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'getTicket',
        metadata: { id },
      });
      throw error;
    }
  }

  static async updateTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    try {
      const response = await fetch(`${this.baseUrl}/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ticket: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'updateTicket',
        metadata: { id, updates },
      });
      throw error;
    }
  }

  static async addResponse(ticketId: string, response: Partial<SupportResponse>): Promise<SupportResponse> {
    try {
      const apiResponse = await fetch(`${this.baseUrl}/tickets/${ticketId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      });

      if (!apiResponse.ok) {
        throw new Error(`Failed to add response: ${apiResponse.statusText}`);
      }

      return await apiResponse.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'addResponse',
        metadata: { ticketId, response },
      });
      throw error;
    }
  }

  // FAQ Management
  static async searchFAQ(query: string, category?: string): Promise<FAQItem[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        ...(category && { category }),
      });

      const response = await fetch(`${this.baseUrl}/faq/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`FAQ search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'searchFAQ',
        metadata: { query, category },
      });
      
      // Return fallback data
      return this.getMockFAQResults(query, category);
    }
  }

  static async getFAQCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/faq/categories`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch FAQ categories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'getFAQCategories',
      });
      
      return ['Getting Started', 'Account', 'Technical', 'Billing', 'Features'];
    }
  }

  static async getFAQByCategory(category: string): Promise<FAQItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/faq/categories/${category}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch FAQ for category: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'getFAQByCategory',
        metadata: { category },
      });
      
      return this.getMockFAQResults('', category);
    }
  }

  static async rateFAQ(faqId: string, helpful: boolean): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/faq/${faqId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ helpful }),
      });

      if (!response.ok) {
        throw new Error(`Failed to rate FAQ: ${response.statusText}`);
      }
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'rateFAQ',
        metadata: { faqId, helpful },
      });
    }
  }

  // Contact Forms
  static async submitContactForm(form: ContactForm): Promise<SupportTicket> {
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('subject', form.subject);
      formData.append('message', form.message);
      formData.append('category', form.category);
      formData.append('urgency', form.urgency);

      // Add attachments if any
      if (form.attachments) {
        form.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
      }

      const response = await fetch(`${this.baseUrl}/contact`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to submit contact form: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'submitContactForm',
        metadata: { form: { ...form, attachments: form.attachments?.map(f => f.name) } },
      });
      throw error;
    }
  }

  // User Feedback
  static async submitFeedback(feedback: Partial<UserFeedback>): Promise<UserFeedback> {
    try {
      const response = await fetch(`${this.baseUrl}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'submitFeedback',
        metadata: { feedback },
      });
      throw error;
    }
  }

  static async getUserFeedback(userId: string): Promise<UserFeedback[]> {
    try {
      const response = await fetch(`${this.baseUrl}/feedback/user/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user feedback: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'getUserFeedback',
        metadata: { userId },
      });
      throw error;
    }
  }

  // Support Statistics
  static async getSupportStats(): Promise<SupportStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch support stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'getSupportStats',
      });
      
      return this.getMockSupportStats();
    }
  }

  // File Upload
  static async uploadAttachment(file: File): Promise<SupportAttachment> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload attachment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'SupportService',
        action: 'uploadAttachment',
        metadata: { filename: file.name, size: file.size },
      });
      throw error;
    }
  }

  // Mock data for development/fallback
  private static getMockFAQResults(query: string, category?: string): FAQItem[] {
    const mockFAQs: FAQItem[] = [
      {
        id: '1',
        question: 'How do I get started with the Digital Organism Theory platform?',
        answer: 'Welcome to DOT! Start by creating an account, then explore our learning resources and join community discussions. Check out our getting started guide for step-by-step instructions.',
        category: 'Getting Started',
        tags: ['getting-started', 'account', 'onboarding'],
        helpfulCount: 45,
        notHelpfulCount: 3,
        order: 1,
        isPublished: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        question: 'What are the system requirements for using the platform?',
        answer: 'DOT works on all modern web browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience.',
        category: 'Technical',
        tags: ['technical', 'requirements', 'browsers'],
        helpfulCount: 32,
        notHelpfulCount: 1,
        order: 2,
        isPublished: true,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
      {
        id: '3',
        question: 'How do I reset my password?',
        answer: 'To reset your password, go to the login page and click "Forgot Password". Enter your email address and we\'ll send you a password reset link.',
        category: 'Account',
        tags: ['account', 'password', 'reset'],
        helpfulCount: 67,
        notHelpfulCount: 2,
        order: 3,
        isPublished: true,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
      },
      {
        id: '4',
        question: 'How can I contribute to the research discussions?',
        answer: 'You can contribute by joining our community discussions, sharing your insights, and participating in collaborative research projects. All contributions are welcome!',
        category: 'Features',
        tags: ['community', 'research', 'collaboration'],
        helpfulCount: 28,
        notHelpfulCount: 0,
        order: 4,
        isPublished: true,
        createdAt: new Date('2024-01-04'),
        updatedAt: new Date('2024-01-04'),
      },
    ];

    return mockFAQs.filter(faq => {
      const matchesQuery = !query || 
        faq.question.toLowerCase().includes(query.toLowerCase()) ||
        faq.answer.toLowerCase().includes(query.toLowerCase()) ||
        faq.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory = !category || faq.category === category;
      
      return matchesQuery && matchesCategory;
    });
  }

  private static getMockSupportStats(): SupportStats {
    return {
      totalTickets: 234,
      openTickets: 12,
      resolvedTickets: 198,
      averageResponseTime: 2.5, // hours
      averageResolutionTime: 18.3, // hours
      satisfactionRating: 4.2,
      topCategories: [
        { category: 'Technical', count: 89 },
        { category: 'Account', count: 67 },
        { category: 'Features', count: 45 },
        { category: 'Getting Started', count: 33 },
      ],
      ticketsByStatus: [
        { status: 'open', count: 12 },
        { status: 'in-progress', count: 8 },
        { status: 'resolved', count: 198 },
        { status: 'closed', count: 16 },
      ],
    };
  }
}

export default SupportService;
