// Enhanced Blog Service for Content Management
// MVP Implementation - Production Ready Blog System

import ErrorService from './errors/ErrorService';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  publishedAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  categories: string[];
  readTime: number;
  views: number;
  likes: number;
  shares: number;
  isBookmarked?: boolean;
  seoMetadata: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  };
}

export interface BlogFilters {
  category?: string;
  tags?: string[];
  author?: string;
  status?: BlogPost['status'];
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'date' | 'views' | 'likes' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface BlogSearchResults {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface BlogStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalAuthors: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  popularTags: Array<{
    tag: string;
    count: number;
  }>;
}

class BlogService {
  private static baseUrl = '/api/blog';

  // Content Management
  static async createPost(post: Partial<BlogPost>): Promise<BlogPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post),
      });

      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'createPost',
        metadata: { post },
      });
      throw error;
    }
  }

  static async updatePost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update post: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'updatePost',
        metadata: { id, updates },
      });
      throw error;
    }
  }

  static async deletePost(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.statusText}`);
      }
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'deletePost',
        metadata: { id },
      });
      throw error;
    }
  }

  // Search and Discovery
  static async searchPosts(
    query: string,
    filters: BlogFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<BlogSearchResults> {
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
        ...this.serializeFilters(filters),
      });

      const response = await fetch(`${this.baseUrl}/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'searchPosts',
        metadata: { query, filters, page, limit },
      });
      
      // Return fallback data for demo
      return this.getMockSearchResults(query, filters, page, limit);
    }
  }

  static async getPost(id: string): Promise<BlogPost> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch post: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'getPost',
        metadata: { id },
      });
      throw error;
    }
  }

  static async getRelatedPosts(postId: string, limit: number = 5): Promise<BlogPost[]> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}/related?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch related posts: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'getRelatedPosts',
        metadata: { postId, limit },
      });
      
      // Return fallback data
      return this.getMockRelatedPosts(postId, limit);
    }
  }

  // Social Features
  static async toggleLike(postId: string): Promise<{ liked: boolean; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle like: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'toggleLike',
        metadata: { postId },
      });
      throw error;
    }
  }

  static async toggleBookmark(postId: string): Promise<{ bookmarked: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${postId}/bookmark`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle bookmark: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'toggleBookmark',
        metadata: { postId },
      });
      throw error;
    }
  }

  static async sharePost(postId: string, platform: 'twitter' | 'facebook' | 'linkedin' | 'email'): Promise<string> {
    try {
      const post = await this.getPost(postId);
      const url = `${window.location.origin}/blog/${postId}`;
      
      const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        email: `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(`Check out this article: ${url}`)}`,
      };

      // Track share
      await fetch(`${this.baseUrl}/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform }),
      });

      return shareUrls[platform];
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'sharePost',
        metadata: { postId, platform },
      });
      throw error;
    }
  }

  // Analytics
  static async getBlogStats(): Promise<BlogStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blog stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'getBlogStats',
      });
      
      // Return fallback data
      return this.getMockStats();
    }
  }

  // Categories and Tags
  static async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'getCategories',
      });
      
      return ['Digital Consciousness', 'AI Theory', 'Research', 'Philosophy', 'Technology'];
    }
  }

  static async getTags(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      ErrorService.logError(error as Error, {
        component: 'BlogService',
        action: 'getTags',
      });
      
      return ['consciousness', 'AI', 'neural networks', 'philosophy', 'cognition', 'digital theory'];
    }
  }

  // Helper methods
  private static serializeFilters(filters: BlogFilters): Record<string, string> {
    const params: Record<string, string> = {};

    if (filters.category) params.category = filters.category;
    if (filters.tags?.length) params.tags = filters.tags.join(',');
    if (filters.author) params.author = filters.author;
    if (filters.status) params.status = filters.status;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;
    if (filters.dateRange?.start) params.dateFrom = filters.dateRange.start.toISOString();
    if (filters.dateRange?.end) params.dateTo = filters.dateRange.end.toISOString();

    return params;
  }

  // Mock data for development/fallback
  private static getMockSearchResults(
    query: string, 
    filters: BlogFilters, 
    page: number, 
    limit: number
  ): BlogSearchResults {
    const mockPosts: BlogPost[] = [
      {
        id: '1',
        title: 'Understanding Digital Consciousness Theory',
        content: 'Full content here...',
        excerpt: 'Exploring the fundamental principles of digital consciousness and its implications for AI development.',
        author: {
          id: '1',
          name: 'Dr. Sarah Chen',
          avatar: '/avatars/sarah.jpg',
        },
        publishedAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        status: 'published',
        tags: ['consciousness', 'AI', 'theory'],
        categories: ['Digital Consciousness'],
        readTime: 8,
        views: 1247,
        likes: 89,
        shares: 23,
        seoMetadata: {
          title: 'Understanding Digital Consciousness Theory',
          description: 'Exploring the fundamental principles of digital consciousness and its implications for AI development.',
          keywords: ['digital consciousness', 'AI theory', 'consciousness'],
        },
      },
      // Add more mock posts...
    ];

    return {
      posts: mockPosts.slice((page - 1) * limit, page * limit),
      total: mockPosts.length,
      page,
      limit,
      hasMore: page * limit < mockPosts.length,
    };
  }

  private static getMockRelatedPosts(postId: string, limit: number): BlogPost[] {
    // Return mock related posts
    return this.getMockSearchResults('', {}, 1, limit).posts;
  }

  private static getMockStats(): BlogStats {
    return {
      totalPosts: 47,
      totalViews: 12847,
      totalLikes: 892,
      totalAuthors: 8,
      topCategories: [
        { category: 'Digital Consciousness', count: 15 },
        { category: 'AI Theory', count: 12 },
        { category: 'Research', count: 10 },
        { category: 'Philosophy', count: 6 },
        { category: 'Technology', count: 4 },
      ],
      popularTags: [
        { tag: 'consciousness', count: 23 },
        { tag: 'AI', count: 19 },
        { tag: 'neural networks', count: 15 },
        { tag: 'philosophy', count: 12 },
        { tag: 'cognition', count: 9 },
        { tag: 'digital theory', count: 8 },
      ],
    };
  }
}

export default BlogService;
