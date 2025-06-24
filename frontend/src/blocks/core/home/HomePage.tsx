import React, { useState, useEffect } from 'react';
import PlatformMetricsService, { DashboardMetrics } from '../../../services/PlatformMetricsService';
import HeroSection from './HeroSection';
import DOTConcepts from './DOTConcepts';
import CommunityInsights from './CommunityInsights';
import FeaturesSection from './FeaturesSection';
import ResearchHighlights from './ResearchHighlights';
import RecentArticles from './RecentArticles';
import TechnicalCallToAction from './TechnicalCallToAction';

const HomePage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await PlatformMetricsService.getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to load metrics:', error);
        // Fallback to sample data for demo purposes
        setMetrics({
          members: 1247,
          articles: 89,
          discussions: 456,
          integrations: 23
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <DOTConcepts />
      <CommunityInsights metrics={metrics} isLoading={isLoading} />
      <FeaturesSection />
      <ResearchHighlights />
      <RecentArticles />
      <TechnicalCallToAction />
    </div>
  );
};

export default HomePage;
