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
        console.warn('Metrics service unavailable, using fallback data:', error);
        // This fallback should rarely be used now that the service has its own fallback
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
    <div className="min-h-screen relative">
      <HeroSection />
      
      {/* Main Content Sections with subtle background */}
      <div className="relative z-10 bg-background/95 backdrop-blur-sm">
        <div className="space-y-20">
          <DOTConcepts />
          <CommunityInsights metrics={metrics} isLoading={isLoading} />
          <FeaturesSection />
          <ResearchHighlights />
          <RecentArticles />
          <TechnicalCallToAction />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
