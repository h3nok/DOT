import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface PlatformMetrics {
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

interface DashboardMetrics {
  members: number;
  articles: number;
  discussions: number;
  integrations: number;
}

interface HistoricalMetrics {
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

interface ResearchMetrics {
  total_research_articles: number;
  peer_reviewed_articles: number;
  total_citations: number;
  average_citations: number;
  total_downloads: number;
  peer_review_rate: number;
  by_type: Record<string, number>;
}

interface Integration {
  id: number;
  name: string;
  description: string;
  integration_type: string;
  status: string;
  version: string | null;
  api_endpoint: string | null;
  documentation_url: string | null;
  created_by_id: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_health_check: string | null;
  health_status: string;
  total_requests: number;
  last_used: string | null;
  usage_count_30d: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp?: string;
  message?: string;
}

class PlatformMetricsService {
  private static instance: PlatformMetricsService;

  public static getInstance(): PlatformMetricsService {
    if (!PlatformMetricsService.instance) {
      PlatformMetricsService.instance = new PlatformMetricsService();
    }
    return PlatformMetricsService.instance;
  }

  // Get simplified dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response: AxiosResponse<ApiResponse<DashboardMetrics>> = await axios.get(
        `${API_BASE_URL}/metrics/dashboard`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch dashboard metrics');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  // Get comprehensive platform metrics
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    try {
      const response: AxiosResponse<ApiResponse<PlatformMetrics>> = await axios.get(
        `${API_BASE_URL}/metrics/platform`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch platform metrics');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching platform metrics:', error);
      throw error;
    }
  }

  // Get historical metrics for charts
  async getHistoricalMetrics(days: number = 30): Promise<HistoricalMetrics> {
    try {
      const response: AxiosResponse<ApiResponse<HistoricalMetrics>> = await axios.get(
        `${API_BASE_URL}/metrics/historical?days=${days}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch historical metrics');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching historical metrics:', error);
      throw error;
    }
  }

  // Get research-specific metrics
  async getResearchMetrics(): Promise<ResearchMetrics> {
    try {
      const response: AxiosResponse<ApiResponse<ResearchMetrics>> = await axios.get(
        `${API_BASE_URL}/metrics/research`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch research metrics');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching research metrics:', error);
      throw error;
    }
  }

  // Get all integrations
  async getIntegrations(): Promise<Integration[]> {
    try {
      const response: AxiosResponse<ApiResponse<Integration[]>> = await axios.get(
        `${API_BASE_URL}/integrations`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch integrations');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    }
  }

  // Create new integration
  async createIntegration(integrationData: {
    name: string;
    description?: string;
    integration_type: string;
    status?: string;
    version?: string;
    api_endpoint?: string;
    documentation_url?: string;
    created_by_id: number;
  }): Promise<Integration> {
    try {
      const response: AxiosResponse<ApiResponse<Integration>> = await axios.post(
        `${API_BASE_URL}/integrations`,
        integrationData
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create integration');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }

  // Log integration usage
  async logIntegrationUsage(integrationId: number, usageData: {
    user_id?: number;
    endpoint?: string;
    method?: string;
    response_code?: number;
    response_time_ms?: number;
  }): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axios.post(
        `${API_BASE_URL}/integrations/${integrationId}/usage`,
        usageData
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to log integration usage');
      }
    } catch (error) {
      console.error('Error logging integration usage:', error);
      // Don't throw - usage logging failures shouldn't break the app
    }
  }

  // Update integration health
  async updateIntegrationHealth(integrationId: number, healthStatus: 'healthy' | 'warning' | 'error' | 'unknown'): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await axios.put(
        `${API_BASE_URL}/integrations/${integrationId}/health`,
        { health_status: healthStatus }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update integration health');
      }
    } catch (error) {
      console.error('Error updating integration health:', error);
      throw error;
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
      const response: AxiosResponse<ApiResponse<{ status: string }>> = await axios.get(
        `${API_BASE_URL}/metrics/health`
      );
      
      return response.data.success && response.data.data.status === 'healthy';
    } catch (error) {
      console.error('Metrics service health check failed:', error);
      return false;
    }
  }

  // Get metrics summary for quick overview
  async getMetricsSummary(): Promise<{
    totalUsers: number;
    totalContent: number;
    totalEngagement: number;
    systemHealth: string;
  }> {
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
}

export default PlatformMetricsService.getInstance();
export type { 
  PlatformMetrics,
  DashboardMetrics, 
  HistoricalMetrics, 
  ResearchMetrics,
  Integration
};
