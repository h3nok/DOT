// API Services
export { BaseApiService } from "./api/BaseApiService";
export type { ApiResponse, ApiRequestConfig } from "./api/BaseApiService";

// Metrics Services
export { default as MetricsService } from "./metrics/MetricsService";
export { default as IntegrationsService } from "./metrics/IntegrationsService";
export type {
  PlatformMetrics,
  DashboardMetrics,
  HistoricalMetrics,
  ResearchMetrics,
  MetricsSummary,
} from "./metrics/MetricsService";
export type {
  Integration,
  CreateIntegrationData,
  IntegrationUsageData,
  HealthStatus,
} from "./metrics/IntegrationsService";

// Error Services
export { default as ErrorService } from "./errors/ErrorService";
export type { ErrorLog, ErrorContext } from "./errors/ErrorService";

// PWA Services
export { default as PWAService } from "./PWAService";

// Orchestrator Services
export {
  createPublicationRelease,
  fetchOrchestratorReadiness,
  fetchPublicDeliveryManifest,
  fetchProfileDeliveryManifest,
  fetchPublicationProjects,
  fetchPublicationReleases,
  PROFILE_DELIVERY_OWNER_ID,
  PROFILE_DELIVERY_SLUG,
  ORCHESTRATOR_OWNER_ID,
  ORCHESTRATOR_URL,
  validatePublicationProject,
} from "./OrchestratorPublicationService";
export type {
  OrchestratorReadiness,
  PublicationProjectRead,
  PublicationReleaseManifest,
  PublicationReleaseManifestSection,
  PublicationReleaseRead,
  PublicationValidationRead,
} from "./OrchestratorPublicationService";
export {
  createAndProcessRssImport,
  createFootprintAccount,
  createFootprintImport,
  fetchFootprintImports,
  fetchFootprintGraphSnapshot,
  processFootprintImport,
} from "./OrchestratorGraphService";
export type {
  FootprintAccountCreate,
  FootprintAccountRead,
  FootprintEdgeRead,
  FootprintGraphSnapshot,
  FootprintImportCreate,
  FootprintImportRead,
  FootprintNodeRead,
} from "./OrchestratorGraphService";

// Legacy exports for backward compatibility
export { default as PlatformMetricsService } from "./PlatformMetricsService";
