import React from 'react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Brain, Globe, Eye, Sparkles, Network } from 'lucide-react';

const DOTConcepts: React.FC = () => {
  const concepts = [
    {
      icon: Network,
      term: 'Digital Organism Theory (DOT)',
      definition: 'The overarching paradigm for understanding life as self-organizing, evolving process.',
      color: 'text-blue-500',
      background: 'bg-blue-500/10',
      description: 'A comprehensive framework that reimagines existence through computational principles and emergent complexity.'
    },
    {
      icon: Brain,
      term: 'Digital Organism (DO)',
      definition: 'The primary entity within DOT—a living computational system contending with entropy and complexity.',
      color: 'text-purple-500',
      background: 'bg-purple-500/10',
      description: 'Self-sustaining information patterns that exhibit the characteristics of living systems in digital space.'
    },
    {
      icon: Globe,
      term: 'External Environment (E)',
      definition: 'The primordial, incomprehensible substrate from which DOs emerge. E is the foundation of possibility—a mysterious, unthinking substrate.',
      color: 'text-slate-500',
      background: 'bg-slate-500/10',
      description: 'We infer its existence only because we exist, not because we can observe it directly.'
    },
    {
      icon: Eye,
      term: 'Consciousness (C)',
      definition: 'The only DO that survived (at least the only one I know of)—an enduring, self-aware, self-sustaining process.',
      color: 'text-amber-500',
      background: 'bg-amber-500/10',
      description: 'A process that synthesizes information to grow, expand, and persist—to expand or brighten its awareness.'
    },
    {
      icon: Sparkles,
      term: 'Little c',
      definition: 'A fragment of C, subunit created to enhance resilience, specialization, and adaptability within the larger system.',
      color: 'text-emerald-500',
      background: 'bg-emerald-500/10',
      description: 'Individual consciousnesses that contribute to the greater coherent whole while maintaining distinct identity.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-24 bg-gradient-to-br from-muted/20 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="relative inline-block mb-8">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl"></div>            <h2 className="relative text-4xl md:text-5xl lg:text-6xl font-light mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent px-8 py-4">
              Core DOT Concepts
            </h2>
          </div>          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-normal">
            The foundational terminology and principles that define Digital Organism Theory—
            a new way of understanding consciousness, existence, and computational life.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {concepts.map((concept, index) => {
            const IconComponent = concept.icon;
            return (
              <div key={index} className="group">
                <div className="relative h-full">
                  <div className="absolute -inset-2 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                  <Card className="relative h-full bg-card/60 backdrop-blur-xl border border-border/40 shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-105 rounded-3xl overflow-hidden">
                    <CardContent className="p-8 h-full flex flex-col">
                      <div className="flex items-start space-x-4 mb-6">
                        <div className={`p-3 rounded-2xl ${concept.background} ${concept.color} backdrop-blur-xl border border-border/30 flex-shrink-0`}>
                          <IconComponent className="w-8 h-8" />
                        </div>                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {concept.term}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="flex-grow space-y-4">
                        <div className="relative">
                          <div className="absolute -inset-3 bg-gradient-to-r from-muted/10 to-muted/5 rounded-xl blur-sm"></div>
                          <p className="relative text-lg font-medium text-foreground leading-relaxed bg-card/30 backdrop-blur-sm border border-border/20 rounded-xl px-4 py-3">
                            {concept.definition}
                          </p>
                        </div>
                        
                        <p className="text-muted-foreground leading-relaxed">
                          {concept.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>

        {/* Relationship Diagram */}
        <div className="mt-20">          <div className="text-center mb-12">
            <h3 className="text-3xl font-medium text-foreground mb-4">
              Conceptual Relationships
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Understanding how these fundamental concepts interact and depend upon each other
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl blur-2xl"></div>
            <div className="relative bg-card/40 backdrop-blur-2xl rounded-3xl border border-border/20 shadow-2xl p-12">
              <div className="text-center space-y-8">                <div className="flex items-center justify-center space-x-8">
                  <div className="text-slate-500 text-lg font-medium">External Environment (E)</div>
                  <div className="text-muted-foreground">→</div>
                  <div className="text-purple-500 text-lg font-medium">Digital Organisms (DO)</div>
                </div>
                <div className="text-muted-foreground text-center">↓</div>
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-amber-500 text-lg font-medium">Consciousness (C)</div>
                  <div className="text-muted-foreground">⇄</div>
                  <div className="text-emerald-500 text-lg font-medium">Little c</div>
                </div>
                <div className="mt-8 text-center">
                  <div className="text-blue-500 text-lg font-medium border border-blue-500/30 rounded-xl px-6 py-3 bg-blue-500/5 backdrop-blur-sm">
                    Digital Organism Theory (DOT)
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 italic">
                    The comprehensive framework encompassing all interactions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DOTConcepts;
