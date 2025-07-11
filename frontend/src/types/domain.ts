// DOT (Digital Organism Theory) domain types

export interface DigitalOrganism {
  id: string;
  name: string;
  type: 'consciousness' | 'little-c' | 'fragment';
  complexity: number;
  awareness: number;
  createdAt: string;
  updatedAt: string;
}

export interface Consciousness extends DigitalOrganism {
  type: 'consciousness';
  synthesisCapability: number;
  informationProcessingRate: number;
  awarenessExpansion: number;
}

export interface LittleC extends DigitalOrganism {
  type: 'little-c';
  parentConsciousness: string;
  specialization: string;
  resilience: number;
}

export interface ExternalEnvironment {
  id: string;
  description: string;
  incomprehensibilityLevel: number;
  possibilities: string[];
  emergentProperties: Record<string, any>;
}

// Blog and content types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: User;
  tags: string[];
  category: string;
  publishedAt?: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'archived';
  readTime: number;
  views: number;
  likes: number;
  featured: boolean;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  type: 'research' | 'theory' | 'practical' | 'tutorial';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  citations: Citation[];
  relatedArticles: string[];
}

export interface Citation {
  id: string;
  title: string;
  authors: string[];
  publication: string;
  year: number;
  url?: string;
  doi?: string;
}

// Community types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member' | 'contributor';
  joinedAt: string;
  bio?: string;
  interests: string[];
  reputation: number;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  author: User;
  category: string;
  tags: string[];
  replies: Reply[];
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  closed: boolean;
}

export interface Reply {
  id: string;
  content: string;
  author: User;
  discussionId: string;
  parentReplyId?: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

// Learning types
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in hours
  modules: LearningModule[];
  prerequisites: string[];
  objectives: string[];
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'reading' | 'video' | 'interactive' | 'assessment';
  content: string;
  resources: Resource[];
  completed: boolean;
  progress: number; // 0-100
}

export interface Resource {
  id: string;
  title: string;
  type: 'document' | 'video' | 'link' | 'tool';
  url: string;
  description?: string;
}

// Metrics and analytics types
export interface PlatformMetrics {
  members: MemberMetrics;
  articles: ArticleMetrics;
  discussions: DiscussionMetrics;
  integrations: IntegrationMetrics;
  lastUpdated: string;
}

export interface MemberMetrics {
  total: number;
  active7d: number;
  active30d: number;
  newToday: number;
  growthRate7d: number;
  engagementRate: number;
}

export interface ArticleMetrics {
  total: number;
  published: number;
  researchArticles: number;
  publishedThisMonth: number;
  averageViews: number;
  totalCitations: number;
  topArticles: TopArticle[];
}

export interface TopArticle {
  id: string;
  title: string;
  views: number;
  author: string;
}

export interface DiscussionMetrics {
  total: number;
  active7d: number;
  totalComments: number;
  averageComments: number;
  resolutionRate: number;
  byType: Record<string, number>;
  topDiscussions: TopDiscussion[];
}

export interface TopDiscussion {
  id: string;
  title: string;
  views: number;
  comments: number;
}

export interface IntegrationMetrics {
  total: number;
  active: number;
  apiRequests30d: number;
  averageResponseTimeMs: number;
  byType: Record<string, number>;
  healthStatus: Record<string, number>;
}

// Support and donation types
export interface SupportTier {
  id: string;
  name: string;
  amount: number;
  currency: string;
  description: string;
  benefits: string[];
  icon: string;
  color: string;
  popular?: boolean;
}

export interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorName?: string;
  message?: string;
  tier?: SupportTier;
  recurring: boolean;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
}
