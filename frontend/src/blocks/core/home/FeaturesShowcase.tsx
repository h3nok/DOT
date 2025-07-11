import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Network, 
  Search, 
  Users, 
  BookOpen, 
  Zap, 
  Globe,
  ArrowRight,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassCard from '../../../shared/components/ui/glass-card';
import { Button } from '../../../shared/components/ui/button';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
  link: string;
  color: string;
  gradient: string;
  category: 'research' | 'community' | 'platform';
}

const features: Feature[] = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: 'Consciousness Research',
    description: 'Advanced tools for exploring digital consciousness and the nature of awareness',
    details: [
      'Digital Organism modeling',
      'Consciousness simulation environments',
      'Theoretical framework validation',
      'Research collaboration tools'
    ],
    link: '/learn/consciousness',
    color: 'text-purple-500',
    gradient: 'from-purple-500/10 to-pink-500/10',
    category: 'research'
  },
  {
    icon: <Network className="w-8 h-8" />,
    title: 'AI Integration Hub',
    description: 'Connect consciousness theory with practical AI development and implementation',
    details: [
      'API integrations with major AI platforms',
      'Consciousness-driven AI architectures',
      'Real-time model testing',
      'Performance analytics'
    ],
    link: '/integration',
    color: 'text-blue-500',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    category: 'platform'
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: 'Global Community',
    description: 'Join researchers, philosophers, and innovators from around the world',
    details: [
      'Expert-led discussions',
      'Peer review systems',
      'Collaborative research projects',
      'Knowledge sharing networks'
    ],
    link: '/community',
    color: 'text-green-500',
    gradient: 'from-green-500/10 to-teal-500/10',
    category: 'community'
  },
  {
    icon: <Search className="w-8 h-8" />,
    title: 'Knowledge Discovery',
    description: 'Powerful search and discovery tools for consciousness research',
    details: [
      'Semantic search across all content',
      'AI-powered research recommendations',
      'Citation networks and impact analysis',
      'Trend identification and insights'
    ],
    link: '/knowledge',
    color: 'text-orange-500',
    gradient: 'from-orange-500/10 to-red-500/10',
    category: 'platform'
  },
  {
    icon: <BookOpen className="w-8 h-8" />,
    title: 'Learning Pathways',
    description: 'Structured learning experiences from basics to advanced consciousness theory',
    details: [
      'Progressive curriculum design',
      'Interactive simulations',
      'Practical exercises and labs',
      'Certification programs'
    ],
    link: '/learn',
    color: 'text-indigo-500',
    gradient: 'from-indigo-500/10 to-purple-500/10',
    category: 'research'
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'Real-time Collaboration',
    description: 'Live collaboration tools for research teams and study groups',
    details: [
      'Real-time document editing',
      'Live video discussions',
      'Shared workspaces and whiteboards',
      'Instant messaging and notifications'
    ],
    link: '/collaboration',
    color: 'text-yellow-500',
    gradient: 'from-yellow-500/10 to-orange-500/10',
    category: 'community'
  }
];

const FeaturesShowcase: React.FC = () => {
  const researchFeatures = features.filter(f => f.category === 'research');
  const communityFeatures = features.filter(f => f.category === 'community');
  const platformFeatures = features.filter(f => f.category === 'platform');

  const FeatureCard = ({ feature, index }: { feature: Feature; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <GlassCard className="p-6 h-full hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        
        <div className="relative z-10">
          <div className={`${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
            {feature.icon}
          </div>
          
          <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-foreground">
            {feature.title}
          </h3>
          
          <p className="text-muted-foreground mb-4 leading-relaxed">
            {feature.description}
          </p>
          
          <ul className="space-y-2 mb-6">
            {feature.details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
          
          <Link to={feature.link}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="group/btn hover:bg-transparent hover:text-primary p-0"
            >
              <span>Explore Feature</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </GlassCard>
    </motion.div>
  );

  return (
    <section className="py-24 bg-gradient-to-br from-background via-muted/5 to-accent/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Platform Features
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Everything you need to explore, research, and apply consciousness theory
          </p>
        </motion.div>

        {/* Research Features */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Brain className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-2xl font-light text-foreground">Research & Discovery</h3>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {researchFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>

        {/* Community Features */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-2xl font-light text-foreground">Community & Collaboration</h3>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {communityFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>

        {/* Platform Features */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-2xl font-light text-foreground">Platform & Tools</h3>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {platformFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <GlassCard className="p-12 max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-light mb-4 text-foreground">
                Ready to Explore Consciousness?
              </h3>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
                Join our community of researchers and start your journey into the fascinating world of digital consciousness.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/learn">
                    <Button size="lg" className="group">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Start Learning
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/community">
                    <Button variant="outline" size="lg" className="group">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Join Community
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;
