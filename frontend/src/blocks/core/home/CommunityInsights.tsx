import React from 'react';
import { DashboardMetrics } from '../../../services/PlatformMetricsService';

interface CommunityInsightsProps {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
}

const CommunityInsights: React.FC<CommunityInsightsProps> = ({ metrics, isLoading }) => {
  const insights = [
    {
      value: isLoading ? '—' : (metrics?.members?.toLocaleString() || '1,247'),
      label: 'Thoughtful Minds',
      description: 'Exploring Together',
      gradient: 'from-primary/10 to-accent/10'
    },
    {
      value: isLoading ? '—' : (metrics?.articles || '89'),
      label: 'Deep Insights',
      description: 'Research & Discovery',
      gradient: 'from-accent/10 to-secondary/10'
    },
    {
      value: isLoading ? '—' : (metrics?.discussions || '456'),
      label: 'Meaningful Dialogues',
      description: 'Questions & Answers',
      gradient: 'from-secondary/10 to-primary/10'
    },
    {
      value: isLoading ? '—' : (metrics?.integrations || '23'),
      label: 'Real Applications',
      description: 'Theory to Practice',
      gradient: 'from-accent/10 to-primary/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
      {insights.map((insight, index) => (
        <div key={index} className="text-center group">
          <div className="relative">
            <div className={`absolute -inset-3 bg-gradient-to-br ${insight.gradient} rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500`}></div>
            <div className="relative p-8 bg-card/50 backdrop-blur-xl rounded-2xl border border-border/30 shadow-xl group-hover:shadow-2xl transition-all duration-500">              <div className="text-4xl lg:text-5xl font-normal text-foreground mb-3 group-hover:scale-110 transition-transform duration-300">
                {insight.value}
              </div>
              <div className="text-lg font-medium text-muted-foreground mb-2">{insight.label}</div>
              <div className="text-sm text-muted-foreground/70">
                {insight.description}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommunityInsights;
