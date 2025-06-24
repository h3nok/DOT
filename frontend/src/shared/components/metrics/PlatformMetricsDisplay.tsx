import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import PlatformMetricsService, { DashboardMetrics, PlatformMetrics } from '../../../services/PlatformMetricsService';

interface MetricCardProps {
  title: string;
  value: number;
  subtitle?: string;
  growth?: number;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  growth, 
  isLoading = false,
  icon 
}) => {
  const formatValue = (val: number): string => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };

  const getGrowthColor = (growthRate?: number): string => {
    if (!growthRate) return 'text-gray-500';
    return growthRate > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="text-blue-600">{icon}</div>}
      </div>
      
      <div className="space-y-1">
        {isLoading ? (
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <div className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-gray-500">{subtitle}</span>
          )}
          {growth !== undefined && (
            <span className={`font-medium ${getGrowthColor(growth)}`}>
              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

const PlatformMetricsDisplay: React.FC = () => {
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [detailedMetrics, setDetailedMetrics] = useState<PlatformMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [dashboard, detailed] = await Promise.all([
        PlatformMetricsService.getDashboardMetrics(),
        PlatformMetricsService.getPlatformMetrics()
      ]);

      setDashboardMetrics(dashboard);
      setDetailedMetrics(detailed);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchMetrics();
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Metrics</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Metrics</h2>
          <p className="text-gray-600 text-sm mt-1">
            Real-time data from Digital Organisms Theory platform
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Members"
          value={dashboardMetrics?.members || 0}
          subtitle={detailedMetrics ? `${detailedMetrics.members.active_7d} active this week` : undefined}
          growth={detailedMetrics?.members.growth_rate_7d}
          isLoading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
        />

        <MetricCard
          title="Articles"
          value={dashboardMetrics?.articles || 0}
          subtitle={detailedMetrics ? `${detailedMetrics.articles.research_articles} research papers` : undefined}
          growth={detailedMetrics ? (detailedMetrics.articles.published_this_month / detailedMetrics.articles.published * 100) : undefined}
          isLoading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <MetricCard
          title="Discussions"
          value={dashboardMetrics?.discussions || 0}
          subtitle={detailedMetrics ? `${detailedMetrics.discussions.active_7d} active this week` : undefined}
          growth={detailedMetrics ? (detailedMetrics.discussions.active_7d / detailedMetrics.discussions.total * 100) : undefined}
          isLoading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />

        <MetricCard
          title="Integrations"
          value={dashboardMetrics?.integrations || 0}
          subtitle={detailedMetrics ? `${detailedMetrics.integrations.total} total available` : undefined}
          growth={detailedMetrics ? (detailedMetrics.integrations.active / detailedMetrics.integrations.total * 100) : undefined}
          isLoading={isLoading}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        />
      </div>

      {/* Detailed Metrics Cards */}
      {detailedMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Research Impact */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Impact</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Citations</span>
                <span className="font-medium">{detailedMetrics.articles.total_citations}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Views</span>
                <span className="font-medium">{detailedMetrics.articles.average_views.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Research Articles</span>
                <span className="font-medium">{detailedMetrics.articles.research_articles}</span>
              </div>
            </div>
          </Card>

          {/* Community Engagement */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Engagement</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Comments</span>
                <span className="font-medium">{detailedMetrics.discussions.total_comments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Comments/Discussion</span>
                <span className="font-medium">{detailedMetrics.discussions.average_comments.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resolution Rate</span>
                <span className="font-medium">{detailedMetrics.discussions.resolution_rate.toFixed(1)}%</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Data Freshness Indicator */}
      <div className="text-xs text-gray-500 text-center">
        🔄 Metrics update automatically every 5 minutes • 
        Built for production with real-time data tracking
      </div>
    </div>
  );
};

export default PlatformMetricsDisplay;
