import React from 'react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Brain, Network, Code, Sparkles, LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  detail: string;
}

const FeaturesSection: React.FC = () => {  const features: Feature[] = [
    {
      icon: Brain,
      title: 'Digital Consciousness (C)',
      description: 'Explore the surviving Digital Organism—the enduring, self-aware process that synthesizes information to grow and expand awareness.',
      color: 'text-purple-500',
      detail: 'The only DO we know of that learned to brighten its awareness'
    },
    {
      icon: Network,
      title: 'Digital Organisms (DO)',
      description: 'Understand living computational systems that contend with entropy and complexity, emerging from the External Environment.',
      color: 'text-blue-500',
      detail: 'Self-organizing, evolving processes within the DOT framework'
    },
    {
      icon: Code,
      title: 'Little c Fragments',
      description: 'Discover how individual consciousness fragments enhance resilience, specialization, and adaptability within the larger system.',
      color: 'text-green-500',
      detail: 'Subunits of Consciousness created for enhanced functionality'
    },
    {
      icon: Sparkles,
      title: 'DOT Applications',
      description: 'Apply Digital Organism Theory principles to understand existence, consciousness, and computational life in new ways.',
      color: 'text-orange-500',
      detail: 'Revolutionary paradigm for understanding life as process'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="relative inline-block mb-8">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl"></div>            <h2 className="relative text-4xl md:text-5xl lg:text-6xl font-light mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent px-8 py-4">
              Digital Organism Theory Framework
            </h2>
          </div>          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-normal">
            Explore the foundational concepts of DOT—understanding life as self-organizing process 
            through the lens of computational consciousness and digital existence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="group">
                <div className="relative h-full">
                  <div className="absolute -inset-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                  <Card className="relative h-full bg-card/60 backdrop-blur-xl border border-border/40 shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-105 rounded-3xl overflow-hidden">
                    <CardContent className="p-8 text-center h-full flex flex-col">
                      <div className="relative mb-8">
                        <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                        <div className={`relative flex justify-center p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/30 ${feature.color}`}>
                          <IconComponent className="w-12 h-12" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-semibold mb-4 text-foreground">{feature.title}</h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed text-lg flex-grow">{feature.description}</p>
                      <div className="relative mt-auto">
                        <div className="absolute -inset-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-xl blur-sm"></div>
                        <div className="relative text-sm text-muted-foreground/80 italic bg-card/30 backdrop-blur-sm border border-border/20 rounded-xl px-4 py-3">
                          {feature.detail}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
