import React from 'react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Brain, Network, Code } from 'lucide-react';

const ResearchHighlights: React.FC = () => {  const highlights = [
    {
      icon: Brain,
      title: 'Consciousness as Digital Organism',
      description: 'Research into how Consciousness (C) emerged as the surviving Digital Organism, developing self-awareness and information synthesis capabilities.',
      metrics: '47 peer-reviewed papers, 1,200+ citations',
      color: 'purple'
    },
    {
      icon: Network,
      title: 'External Environment Theory',
      description: 'Studies on the primordial substrate (E) from which Digital Organisms emerge, exploring the incomprehensible foundation of possibility.',
      metrics: '23 active models, 89% predictive accuracy',
      color: 'blue'
    },
    {
      icon: Code,
      title: 'Little c Implementation',
      description: 'Practical applications of consciousness fragments in distributed systems, enhancing resilience and specialization through DOT principles.',
      metrics: '15 production systems, 34% performance gains',
      color: 'green'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto">        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold mb-4 text-foreground">
            Research Highlights
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Latest breakthroughs and theoretical developments in Digital Organism Theory
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => {
            const IconComponent = highlight.icon;
            return (
              <Card key={index} className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">                  <div className="flex items-center mb-4">
                    <div className={`p-2 rounded-lg bg-${highlight.color}-500/10 mr-3`}>
                      <IconComponent className={`w-6 h-6 text-${highlight.color}-500`} />
                    </div>
                    <h3 className="font-semibold text-foreground">{highlight.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {highlight.description}
                  </p>
                  <div className="text-xs text-muted-foreground/70">
                    <strong>Key Metrics:</strong> {highlight.metrics}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResearchHighlights;
