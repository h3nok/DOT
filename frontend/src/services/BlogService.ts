// Enhanced Blog Service for Content Management
// MVP Implementation - Production Ready Blog System

import ErrorService from './errors/ErrorService';
import { blogPostsData } from '../content/blog/postsData';

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
    const mockPosts: BlogPost[] = blogPostsData.map(post => ({
      ...post,
      publishedAt: new Date(post.publishedAt),
      updatedAt: new Date(post.updatedAt),
    } as unknown as BlogPost));

    const filtered = mockPosts.filter(post => {
      const matchesSearch = !query ||
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      const matchesCategory = !filters.category || filters.category === 'all' || post.categories.includes(filters.category);
      return matchesSearch && matchesCategory;
    });

    return {
      posts: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
      hasMore: page * limit < filtered.length,
    };
  }

  private static getMockRelatedPosts(postId: string, limit: number): BlogPost[] {
    const mockPosts: BlogPost[] = blogPostsData.map(post => ({
      ...post,
      publishedAt: new Date(post.publishedAt),
      updatedAt: new Date(post.updatedAt),
    } as unknown as BlogPost));

    // Simple related logic: share at least one tag or category (and not the same post)
    const currentPost = mockPosts.find(p => p.id === postId);
    if (!currentPost) return mockPosts.slice(0, limit);

    const related = mockPosts.filter(p => {
      if (p.id === postId) return false;
      const sharedTag = p.tags.some(t => currentPost.tags.includes(t));
      const sharedCategory = p.categories.some(c => currentPost.categories.includes(c));
      return sharedTag || sharedCategory;
    });

    return related.length > 0 ? related.slice(0, limit) : mockPosts.filter(p => p.id !== postId).slice(0, limit);
  }

  private static getMockStats(): BlogStats {
    const mockPosts = blogPostsData;
    const totalViews = mockPosts.reduce((acc, p) => acc + p.views, 0);
    const totalLikes = mockPosts.reduce((acc, p) => acc + p.likes, 0);

    // Group categories
    const categoriesMap: Record<string, number> = {};
    mockPosts.forEach(p => {
      p.categories.forEach(c => {
        categoriesMap[c] = (categoriesMap[c] || 0) + 1;
      });
    });
    const topCategories = Object.entries(categoriesMap).map(([category, count]) => ({
      category,
      count
    })).sort((a, b) => b.count - a.count);

    // Group tags
    const tagsMap: Record<string, number> = {};
    mockPosts.forEach(p => {
      p.tags.forEach(t => {
        tagsMap[t] = (tagsMap[t] || 0) + 1;
      });
    });
    const popularTags = Object.entries(tagsMap).map(([tag, count]) => ({
      tag,
      count
    })).sort((a, b) => b.count - a.count);

    return {
      totalPosts: mockPosts.length,
      totalViews,
      totalLikes,
      totalAuthors: 1, // Only H. Ghebrechristos
      topCategories,
      popularTags,
    };
  }
}

export default BlogService;
