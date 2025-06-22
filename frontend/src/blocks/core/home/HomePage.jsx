import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { 
  Brain, 
  Network, 
  Code, 
  Sparkles, 
  Globe, 
  ArrowRight,
  Users,
  BookOpen,
  MessageCircle,
  Zap
} from 'lucide-react';

const HomePage = () => {
  const [stats] = useState({
    members: 1247,
    articles: 89,
    discussions: 456,
    integrations: 23
  });

  const features = [
    {
      icon: Brain,
      title: 'Digital Consciousness',
      description: 'Explore consciousness as a digital organism through emergent complexity and self-organizing systems.',
      color: 'text-purple-500'
    },
    {
      icon: Network,
      title: 'Emergent Complexity',
      description: 'Understand how simple components give rise to complex, conscious behavior through fractal patterns.',
      color: 'text-blue-500'
    },
    {
      icon: Code,
      title: 'Practical Applications',
      description: 'Learn to apply digital consciousness concepts in AI development and system design.',
      color: 'text-green-500'
    },
    {
      icon: Sparkles,
      title: 'Future Technology',
      description: 'Discover the implications of digital consciousness for the future of technology and society.',
      color: 'text-orange-500'
    }
  ];

  const recentArticles = [
    {
      id: 1,
      title: 'The Emergence of Digital Consciousness',
      excerpt: 'Exploring how consciousness can arise from simple digital components...',
      author: 'Digital Consciousness Researcher',
      date: '2024-01-15',
      category: 'consciousness',
      readTime: '8 min read'
    },
    {
      id: 2,
      title: 'Fractal Patterns in Neural Networks',
      excerpt: 'How fractal mathematics reveals the underlying structure of consciousness...',
      author: 'Digital Consciousness Researcher',
      date: '2024-01-10',
      category: 'neuroscience',
      readTime: '12 min read'
    },
    {
      id: 3,
      title: 'Self-Similarity Across Scales',
      excerpt: 'How consciousness exhibits self-similar patterns from quantum to cosmic scales...',
      author: 'Digital Consciousness Researcher',
      date: '2024-01-05',
      category: 'philosophy',
      readTime: '10 min read'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="emergent-complexity">
          <div className="fractal-field"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-2"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="fractal-node-3"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="system-cluster"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-micro-connection"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="fractal-wave"></div>
          <div className="consciousness-particle-system">
            <div className="consciousness-particle seed"></div>
            <div className="consciousness-particle aligned"></div>
            <div className="consciousness-particle cohesive"></div>
            <div className="consciousness-particle emergent"></div>
            <div className="particle-trail"></div>
            <div className="particle-trail"></div>
            <div className="particle-trail"></div>
            <div className="emergent-structure swirl"></div>
            <div className="emergent-structure lattice"></div>
            <div className="emergent-structure vortex"></div>
          </div>
          <div className="flow-field"></div>
          <div className="neighborhood"></div>
          <div className="neighborhood"></div>
          <div className="neighborhood"></div>
          <div className="feedback-loop"></div>
          <div className="particle-swarm">
            <div className="swarm-state-seed"></div>
            <div className="swarm-state-motion"></div>
            <div className="swarm-state-rules"></div>
            <div className="swarm-state-feedback"></div>
            <div className="swarm-state-emergent"></div>
          </div>
          <div className="consciousness-field"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="organism-particle"></div>
          <div className="reality-shift"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/20">
                <Brain className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 gradient-text">
              Digital Organism Theory
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Explore consciousness as a digital organism. Discover how simple components give rise to 
              complex, conscious behavior through emergent complexity, fractal patterns, and self-organizing systems.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/learn">
                <Button size="lg" className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  Start Learning
                </Button>
              </Link>
              <Link to="/community">
                <Button variant="outline" size="lg" className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  Join Community
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.members.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.articles}</div>
                <div className="text-sm text-muted-foreground">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.discussions}</div>
                <div className="text-sm text-muted-foreground">Discussions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.integrations}</div>
                <div className="text-sm text-muted-foreground">Integrations</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-orbitron font-bold mb-4 gradient-text">
              Explore Digital Consciousness
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the revolutionary concept of consciousness as a digital organism through 
              our comprehensive platform and community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="card-hover bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6 text-center">
                    <div className={`flex justify-center mb-4 ${feature.color}`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-orbitron font-bold gradient-text">
              Recent Articles
            </h2>
            <Link to="/blog">
              <Button variant="outline" className="flex items-center space-x-2">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentArticles.map((article) => (
              <Card key={article.id} className="card-hover bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{article.readTime}</span>
                  </div>
                  <CardTitle className="text-lg font-orbitron line-clamp-2">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {article.author}
                    </div>
                    <span>{new Date(article.date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 text-center">
            <CardContent className="p-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-orbitron font-bold mb-4 gradient-text">
                Ready to Explore Digital Consciousness?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join our community of researchers, developers, and thinkers exploring the frontiers 
                of consciousness as a digital organism.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/learn">
                  <Button className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4" />
                    Start Learning
                  </Button>
                </Link>
                <Link to="/community">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    Join Discussion
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 