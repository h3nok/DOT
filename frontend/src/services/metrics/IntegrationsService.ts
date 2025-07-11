import { BaseApiService } from '../api/BaseApiService';

export interface Integration {
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

export interface CreateIntegrationData {
  name: string;
  description?: string;
  integration_type: string;
  status?: string;
  version?: string;
  api_endpoint?: string;
  documentation_url?: string;
  created_by_id: number;
}

export interface IntegrationUsageData {
  user_id?: number;
  endpoint?: string;
  method?: string;
  response_code?: number;
  response_time_ms?: number;
}

export type HealthStatus = 'healthy' | 'warning' | 'error' | 'unknown';

class IntegrationsService extends BaseApiService {
  private static instance: IntegrationsService;

  public static getInstance(): IntegrationsService {
    if (!IntegrationsService.instance) {
      IntegrationsService.instance = new IntegrationsService();
    }
    return IntegrationsService.instance;
  }

  // Get all integrations
  async getIntegrations(): Promise<Integration[]> {
    try {
      const response = await this.get<Integration[]>('/integrations');
      return response.data;
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw error;
    }
  }

  // Get a specific integration by ID
  async getIntegration(id: number): Promise<Integration> {
    try {
      const response = await this.get<Integration>(`/integrations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching integration ${id}:`, error);
      throw error;
    }
  }

  // Create new integration
  async createIntegration(integrationData: CreateIntegrationData): Promise<Integration> {
    try {
      const response = await this.post<Integration>('/integrations', integrationData);
      return response.data;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }

  // Update an existing integration
  async updateIntegration(id: number, integrationData: Partial<CreateIntegrationData>): Promise<Integration> {
    try {
      const response = await this.put<Integration>(`/integrations/${id}`, integrationData);
      return response.data;
    } catch (error) {
      console.error(`Error updating integration ${id}:`, error);
      throw error;
    }
  }

  // Delete an integration
  async deleteIntegration(id: number): Promise<void> {
    try {
      await this.delete<void>(`/integrations/${id}`);
    } catch (error) {
      console.error(`Error deleting integration ${id}:`, error);
      throw error;
    }
  }

  // Log integration usage
  async logIntegrationUsage(integrationId: number, usageData: IntegrationUsageData): Promise<void> {
    try {
      await this.post<void>(`/integrations/${integrationId}/usage`, usageData);
    } catch (error) {
      console.error('Error logging integration usage:', error);
      // Don't throw - usage logging failures shouldn't break the app
    }
  }

  // Update integration health
  async updateIntegrationHealth(integrationId: number, healthStatus: HealthStatus): Promise<void> {
    try {
      await this.put<void>(`/integrations/${integrationId}/health`, { health_status: healthStatus });
    } catch (error) {
      console.error('Error updating integration health:', error);
      throw error;
    }
  }

  // Get integration usage statistics
  async getIntegrationUsage(integrationId: number, days: number = 30): Promise<{
    total_requests: number;
    average_response_time: number;
    error_rate: number;
    daily_usage: Array<{
      date: string;
      requests: number;
      errors: number;
      avg_response_time: number;
    }>;
  }> {
    try {
      const response = await this.get<any>(`/integrations/${integrationId}/usage`, { days });
      return response.data;
    } catch (error) {
      console.error(`Error fetching integration usage for ${integrationId}:`, error);
      throw error;
    }
  }

  // Test integration connectivity
  async testIntegration(integrationId: number): Promise<{
    success: boolean;
    response_time_ms: number;
    error?: string;
  }> {
    try {
      const response = await this.post<any>(`/integrations/${integrationId}/test`);
      return response.data;
    } catch (error) {
      console.error(`Error testing integration ${integrationId}:`, error);
      throw error;
    }
  }

  // Get integrations by type
  async getIntegrationsByType(integrationType: string): Promise<Integration[]> {
    try {
      const response = await this.get<Integration[]>('/integrations', { type: integrationType });
      return response.data;
    } catch (error) {
      console.error(`Error fetching integrations by type ${integrationType}:`, error);
      throw error;
    }
  }

  // Get integration types available in the system
  async getIntegrationTypes(): Promise<string[]> {
    try {
      const response = await this.get<string[]>('/integrations/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching integration types:', error);
      throw error;
    }
  }

  // Utility methods
  getHealthStatusColor(status: HealthStatus): string {
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

  getHealthStatusIcon(status: HealthStatus): string {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'unknown':
      default:
        return '❓';
    }
  }

  formatResponseTime(timeMs: number): string {
    if (timeMs < 1000) {
      return `${timeMs}ms`;
    }
    return `${(timeMs / 1000).toFixed(2)}s`;
  }
}

export default IntegrationsService.getInstance();
