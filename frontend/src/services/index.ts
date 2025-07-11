// API Services
export { BaseApiService } from './api/BaseApiService';
export type { ApiResponse, ApiRequestConfig } from './api/BaseApiService';

// Metrics Services
export { default as MetricsService } from './metrics/MetricsService';
export { default as IntegrationsService } from './metrics/IntegrationsService';
export type {
  PlatformMetrics,
  DashboardMetrics,
  HistoricalMetrics,
  ResearchMetrics,
  MetricsSummary,
} from './metrics/MetricsService';
export type {
  Integration,
  CreateIntegrationData,
  IntegrationUsageData,
  HealthStatus,
} from './metrics/IntegrationsService';

// Error Services
export { default as ErrorService } from './errors/ErrorService';
export type { ErrorLog, ErrorContext } from './errors/ErrorService';

// Blog Services
export { default as BlogService } from './BlogService';
export type {
  BlogPost,
  BlogFilters,
  BlogSearchResults,
  BlogStats,
} from './BlogService';

// Support Services
export { default as SupportService } from './SupportService';
export type {
  SupportTicket,
  SupportResponse,
  FAQItem,
  ContactForm,
  UserFeedback,
  SupportStats,
} from './SupportService';

// PWA Services
export { default as PWAService } from './PWAService';

// Legacy exports for backward compatibility
export { default as PlatformMetricsService } from './PlatformMetricsService';
