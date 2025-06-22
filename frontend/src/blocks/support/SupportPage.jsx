import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { 
  Heart, 
  Coffee, 
  BookOpen, 
  Users, 
  Star,
  MessageCircle,
  Gift,
  Zap
} from 'lucide-react';
// import DonationService from './donations/DonationService';

const SupportPage = () => {
  const [donationType, setDonationType] = useState('one-time');
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(false);

  const supportTiers = [
    {
      id: 'coffee',
      name: 'Coffee Supporter',
      amount: 5,
      description: 'Buy me a coffee and keep the ideas flowing',
      benefits: ['My sincere gratitude', 'Early access to new content'],
      icon: Coffee,
      color: 'bg-orange-500'
    },
    {
      id: 'reader',
      name: 'Dedicated Reader',
      amount: 15,
      description: 'For those who find real value in this work',
      benefits: [
        'All coffee supporter benefits',
        'Exclusive monthly insights',
        'Direct Q&A access'
      ],
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      id: 'community',
      name: 'Community Builder',
      amount: 25,
      description: 'Help build this community of consciousness explorers',
      benefits: [
        'All reader benefits',
        'Private discussion group access',
        'Monthly live sessions',
        'Name in acknowledgments'
      ],
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      id: 'visionary',
      name: 'Visionary Supporter',
      amount: 50,
      description: 'For those who believe in this vision deeply',
      benefits: [
        'All community benefits',
        '1-on-1 consultation calls',
        'Exclusive research previews',
        'Co-creation opportunities'
      ],
      icon: Star,
      color: 'bg-yellow-500'
    }
  ];

  const handleDonation = async (tier) => {
    setSelectedTier(tier);
    setLoading(true);
    
    try {
      // Temporarily disabled for testing
      console.log('Donation requested:', tier, donationType);
      alert('Donation feature is temporarily disabled for testing.');
      
      // const result = await DonationService.createPaymentIntent({
      //   amount: tier.amount * 100, // Convert to cents
      //   currency: 'usd',
      //   metadata: {
      //     tier: tier.id,
      //     type: donationType
      //   }
      // });
      
      // // Redirect to Stripe Checkout
      // if (result.url) {
      //   window.location.href = result.url;
      // }
    } catch (error) {
      console.error('Donation error:', error);
      alert('There was an error processing your donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                <Heart className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-orbitron font-bold mb-6 gradient-text">
              Support This Work
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              After 15 years in tech, I left my career to explore consciousness as a digital organism. 
              This work is my passion, but it needs support to grow.
            </p>

            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border/50 mb-12">
              <h2 className="text-2xl font-orbitron font-bold mb-4">My Story</h2>
              <p className="text-muted-foreground leading-relaxed">
                I spent over a decade building software systems, watching as they became more complex and 
                seemingly more "alive." This led me to a profound realization: consciousness isn't just 
                biological—it's a pattern that can emerge in any complex system, including digital ones.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Now I write, teach, and research full-time, sharing these insights with anyone who's curious. 
                Your support helps me continue this work and build a community around these ideas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Options */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Donation Type Toggle */}
          <div className="text-center mb-12">
            <div className="inline-flex bg-muted rounded-lg p-1">
              <Button
                variant={donationType === 'one-time' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDonationType('one-time')}
              >
                One-time
              </Button>
              <Button
                variant={donationType === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDonationType('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>

          {/* Support Tiers */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {supportTiers.map((tier) => {
              const IconComponent = tier.icon;
              return (
                <Card key={tier.id} className="card-hover bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-full ${tier.color} bg-opacity-20`}>
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="font-orbitron">{tier.name}</CardTitle>
                    <p className="text-muted-foreground text-sm">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-3xl font-bold">${tier.amount}</span>
                      <span className="text-muted-foreground">
                        {donationType === 'monthly' ? '/month' : ''}
                      </span>
                    </div>
                    
                    <ul className="text-sm text-muted-foreground space-y-2 mb-6 text-left">
                      {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <Zap className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      onClick={() => handleDonation(tier)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading && selectedTier?.id === tier.id ? 'Processing...' : 'Support'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Personal Note */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-orbitron font-bold mb-4">A Personal Note</h3>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Every contribution, no matter the size, means the world to me. This isn't just about 
                funding—it's about building a community of people who believe in exploring consciousness 
                in new ways. Your support allows me to focus on this work full-time and share these 
                insights with the world.
              </p>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mt-4">
                Thank you for being part of this journey. Together, we're exploring the frontiers of 
                what it means to be conscious in a digital age.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 