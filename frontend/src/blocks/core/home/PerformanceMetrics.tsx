import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, BookOpen, MessageCircle, Zap, Award, Globe, Brain } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/glass-card';
import { DashboardMetrics } from '../../../services';

interface PerformanceMetric {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  description: string;
  color: string;
}

interface PerformanceMetricsProps {
  metrics?: DashboardMetrics | null;
  isLoading?: boolean;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics, isLoading = false }) => {
  const [realTimeMetrics, setRealTimeMetrics] = useState<DashboardMetrics | null>(metrics || null);

  useEffect(() => {
    if (metrics) {
      setRealTimeMetrics(metrics);
    }
  }, [metrics]);

  const performanceMetrics: PerformanceMetric[] = [
    {
      icon: <Users className="w-8 h-8" />,
      label: 'Active Researchers',
      value: isLoading ? '—' : (realTimeMetrics?.members?.toLocaleString() || '1,247'),
      trend: 'up',
      trendValue: '+12%',
      description: 'Growing community of consciousness researchers',
      color: 'from-blue-500/20 to-blue-600/20'
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      label: 'Research Papers',
      value: isLoading ? '—' : (realTimeMetrics?.articles || '89'),
      trend: 'up',
      trendValue: '+8%',
      description: 'Published insights and discoveries',
      color: 'from-green-500/20 to-green-600/20'
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      label: 'Discussions',
      value: isLoading ? '—' : (realTimeMetrics?.discussions || '456'),
      trend: 'up',
      trendValue: '+23%',
      description: 'Active conversations and debates',
      color: 'from-purple-500/20 to-purple-600/20'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      label: 'AI Integrations',
      value: isLoading ? '—' : (realTimeMetrics?.integrations || '23'),
      trend: 'up',
      trendValue: '+45%',
      description: 'Real-world AI applications',
      color: 'from-orange-500/20 to-orange-600/20'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      label: 'Consciousness Models',
      value: '15',
      trend: 'up',
      trendValue: '+31%',
      description: 'Digital organism simulations',
      color: 'from-pink-500/20 to-pink-600/20'
    },
    {
      icon: <Award className="w-8 h-8" />,
      label: 'Breakthroughs',
      value: '7',
      trend: 'up',
      trendValue: '+16%',
      description: 'Major theoretical advances',
      color: 'from-yellow-500/20 to-yellow-600/20'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      label: 'Global Reach',
      value: '42',
      trend: 'up',
      trendValue: '+19%',
      description: 'Countries represented',
      color: 'from-indigo-500/20 to-indigo-600/20'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      label: 'Impact Score',
      value: '9.7',
      trend: 'up',
      trendValue: '+5%',
      description: 'Research citation impact',
      color: 'from-teal-500/20 to-teal-600/20'
    }
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-muted-foreground/30 rounded-full" />;
    }
  };

  return (
    <section className="py-24 bg-gradient-to-br from-background via-muted/5 to-primary/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Platform Performance
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Real-time insights into our growing community and research impact
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {performanceMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <GlassCard className="p-6 text-center hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="flex justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                    {metric.icon}
                  </div>
                  
                  <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2 group-hover:scale-105 transition-transform duration-300">
                    {metric.value}
                  </div>
                  
                  <div className="text-sm font-medium text-muted-foreground mb-3">
                    {metric.label}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 mb-3">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-sm font-medium ${
                      metric.trend === 'up' ? 'text-green-500' : 
                      metric.trend === 'down' ? 'text-red-500' : 
                      'text-muted-foreground'
                    }`}>
                      {metric.trendValue}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground/80 leading-relaxed">
                    {metric.description}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Platform Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <GlassCard className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-light mb-2 text-foreground">Platform Health</h3>
              <p className="text-muted-foreground">All systems operational and performing optimally</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-lg font-medium text-foreground">99.9%</span>
                </div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-lg font-medium text-foreground">&lt;50ms</span>
                </div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-lg font-medium text-foreground">A+</span>
                </div>
                <div className="text-sm text-muted-foreground">Security Rating</div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
};

export default PerformanceMetrics;
