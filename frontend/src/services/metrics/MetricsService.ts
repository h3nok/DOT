import { BaseApiService } from '../api/BaseApiService';

export interface PlatformMetrics {
  members: {
    total: number;
    active_7d: number;
    active_30d: number;
    new_today: number;
    growth_rate_7d: number;
    engagement_rate: number;
  };
  articles: {
    total: number;
    published: number;
    research_articles: number;
    published_this_month: number;
    average_views: number;
    total_citations: number;
    top_articles: Array<{
      id: number;
      title: string;
      views: number;
      author: string;
    }>;
  };
  discussions: {
    total: number;
    active_7d: number;
    total_comments: number;
    average_comments: number;
    resolution_rate: number;
    by_type: Record<string, number>;
    top_discussions: Array<{
      id: number;
      title: string;
      views: number;
      comments: number;
    }>;
  };
  integrations: {
    total: number;
    active: number;
    api_requests_30d: number;
    average_response_time_ms: number;
    by_type: Record<string, number>;
    health_status: Record<string, number>;
    top_integrations: Array<{
      name: string;
      total_requests: number;
      last_used: string | null;
    }>;
  };
}

export interface DashboardMetrics {
  members: number;
  articles: number;
  discussions: number;
  integrations: number;
}

export interface HistoricalMetrics {
  historical: Array<{
    id: number;
    date: string;
    total_members: number;
    active_members_7d: number;
    active_members_30d: number;
    new_members_today: number;
    total_articles: number;
    published_articles: number;
    total_discussions: number;
    active_discussions: number;
    total_integrations: number;
    active_integrations: number;
    created_at: string;
  }>;
  growth_trends: {
    members_growth: number;
    articles_growth: number;
    discussions_growth: number;
    integrations_growth: number;
  };
}

export interface ResearchMetrics {
  total_research_articles: number;
  peer_reviewed_articles: number;
  total_citations: number;
  average_citations: number;
  total_downloads: number;
  peer_review_rate: number;
  by_type: Record<string, number>;
}

export interface MetricsSummary {
  totalUsers: number;
  totalContent: number;
  totalEngagement: number;
  systemHealth: string;
}

class MetricsService extends BaseApiService {
  private static instance: MetricsService;

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  // Get simplified dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await this.get<DashboardMetrics>('/metrics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  // Get comprehensive platform metrics
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    try {
      const response = await this.get<PlatformMetrics>('/metrics/platform');
      return response.data;
    } catch (error) {
      console.error('Error fetching platform metrics:', error);
      throw error;
    }
  }

  // Get historical metrics for charts
  async getHistoricalMetrics(days: number = 30): Promise<HistoricalMetrics> {
    try {
      const response = await this.get<HistoricalMetrics>('/metrics/historical', { days });
      return response.data;
    } catch (error) {
      console.error('Error fetching historical metrics:', error);
      throw error;
    }
  }

  // Get research-specific metrics
  async getResearchMetrics(): Promise<ResearchMetrics> {
    try {
      const response = await this.get<ResearchMetrics>('/metrics/research');
      return response.data;
    } catch (error) {
      console.error('Error fetching research metrics:', error);
      throw error;
    }
  }

  // Get metrics summary for quick overview
  async getMetricsSummary(): Promise<MetricsSummary> {
    try {
      const [platformMetrics, isHealthy] = await Promise.all([
        this.getPlatformMetrics(),
        this.healthCheck()
      ]);

      return {
        totalUsers: platformMetrics.members.total,
        totalContent: platformMetrics.articles.published + platformMetrics.discussions.total,
        totalEngagement: platformMetrics.discussions.total_comments + platformMetrics.articles.total_citations,
        systemHealth: isHealthy ? 'healthy' : 'degraded'
      };
    } catch (error) {
      console.error('Error getting metrics summary:', error);
      return {
        totalUsers: 0,
        totalContent: 0,
        totalEngagement: 0,
        systemHealth: 'error'
      };
    }
  }

  // Format metrics for display
  formatMetricValue(value: number, type: 'number' | 'percentage' | 'currency' = 'number'): string {
    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(value);
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  }

  // Calculate metric growth color (green for positive, red for negative)
  getGrowthColor(growthRate: number): string {
    if (growthRate > 0) return 'text-green-600';
    if (growthRate < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  // Get health status color
  getHealthStatusColor(status: string): string {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'unknown':
      default:
        return 'text-gray-600';
    }
  }

  // Check if metrics are real-time or cached
  isMetricsStale(timestamp: string, maxAgeMinutes: number = 5): boolean {
    const metricTime = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - metricTime.getTime()) / (1000 * 60);
    return diffMinutes > maxAgeMinutes;
  }

  // Health check for the metrics service
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get<{ status: string }>('/metrics/health');
      return response.success && response.data.status === 'healthy';
    } catch (error) {
      console.error('Metrics service health check failed:', error);
      return false;
    }
  }
}

export default MetricsService.getInstance();
