import React, { useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import GlassCard from '../../shared/components/ui/glass-card';
import ReadingContainer from '../../shared/components/ui/reading-container';
import FAQSection from '../../shared/components/support/FAQSection';
import ContactForm from '../../shared/components/support/ContactForm';
import { 
  Heart, 
  Coffee, 
  BookOpen, 
  Users, 
  Star,
  Zap,
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Shield,
  Award,
  Target
} from 'lucide-react';
import { useDonationForm } from '../../forms/hooks/useDonationForm';
import { motion } from 'framer-motion';

type SupportView = 'overview' | 'faq' | 'contact' | 'donate';

const SupportPage = () => {
  const [currentView, setCurrentView] = useState<SupportView>('overview');
  
  const {
    loading,
    selectedTier,
    supportTiers,
    handleTierSelection,
    handleDonationTypeChange,
    handleSubmit,
    watch
  } = useDonationForm({
    onSubmit: async (data) => {
      console.log('Donation submitted:', data);
      alert('Donation feature is temporarily disabled for testing.');
      
      // Future implementation would integrate with payment service
    },
    onError: (error) => {
      console.error('Donation error:', error);
      alert('There was an error processing your donation. Please try again.');
    }
  });

  const donationType = watch('donationType');

  // Icon mapping for support tiers
  const iconMap: Record<string, React.ComponentType<any>> = {
    coffee: Coffee,
    reader: BookOpen,
    community: Users,
    visionary: Star
  };

  const handleContactSuccess = (ticketId: string) => {
    alert(`Thank you! Your support ticket ${ticketId} has been created. We'll get back to you soon.`);
    setCurrentView('overview');
  };

  const renderOverview = () => (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get help, find answers, and support the Digital Organism Theory platform
          </p>
        </motion.div>
      </div>

      {/* Support Options */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer"
                     onClick={() => setCurrentView('faq')}>
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">FAQ</h3>
            <p className="text-muted-foreground text-sm">
              Find answers to frequently asked questions
            </p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer"
                     onClick={() => setCurrentView('contact')}>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Contact Us</h3>
            <p className="text-muted-foreground text-sm">
              Get personalized help from our support team
            </p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer"
                     onClick={() => setCurrentView('donate')}>
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Support Us</h3>
            <p className="text-muted-foreground text-sm">
              Help us grow and improve the platform
            </p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6 text-center hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Documentation</h3>
            <p className="text-muted-foreground text-sm">
              Comprehensive guides and tutorials
            </p>
          </GlassCard>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <GlassCard className="p-6 text-center">
          <div className="text-2xl font-bold text-primary">2.5hrs</div>
          <div className="text-sm text-muted-foreground">Average Response Time</div>
        </GlassCard>
        <GlassCard className="p-6 text-center">
          <div className="text-2xl font-bold text-primary">98%</div>
          <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
        </GlassCard>
        <GlassCard className="p-6 text-center">
          <div className="text-2xl font-bold text-primary">1,247</div>
          <div className="text-sm text-muted-foreground">Issues Resolved</div>
        </GlassCard>
        <GlassCard className="p-6 text-center">
          <div className="text-2xl font-bold text-primary">24/7</div>
          <div className="text-sm text-muted-foreground">Community Support</div>
        </GlassCard>
      </div>

      {/* Recent Updates */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Recent Updates
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <div className="font-medium">PWA Support Added</div>
              <div className="text-sm text-muted-foreground">
                The platform now supports offline reading and mobile installation
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Enhanced Search</div>
              <div className="text-sm text-muted-foreground">
                Improved search functionality with better filtering options
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <div className="font-medium">New FAQ System</div>
              <div className="text-sm text-muted-foreground">
                Comprehensive FAQ with search and rating capabilities
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );

  const renderDonationSection = () => (
    <div className="space-y-12">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Support Our Mission
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Help us advance digital consciousness research and build a better platform for everyone
          </p>
        </motion.div>
      </div>

      {/* Donation Type Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted rounded-lg p-1">
          <Button
            variant={donationType === 'one-time' ? 'default' : 'ghost'}
            onClick={() => handleDonationTypeChange('one-time')}
            className="px-6"
          >
            One-time
          </Button>
          <Button
            variant={donationType === 'monthly' ? 'default' : 'ghost'}
            onClick={() => handleDonationTypeChange('monthly')}
            className="px-6"
          >
            Monthly
          </Button>
        </div>
      </div>

      {/* Support Tiers */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {supportTiers.map((tier) => {
          const IconComponent = iconMap[tier.id];
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="card-hover h-full">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${tier.color} bg-opacity-20`}>
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="font-inter font-medium">{tier.name}</CardTitle>
                  <p className="font-inter font-light text-muted-foreground text-sm">{tier.description}</p>
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
                    onClick={() => {
                      handleTierSelection(tier);
                      handleSubmit();
                    }}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && selectedTier?.id === tier.id ? 'Processing...' : 'Support'}
                  </Button>
                </CardContent>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Personal Note */}
      <GlassCard className="">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-inter font-medium mb-4">A Personal Note</h3>
          <p className="font-inter font-light text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Every contribution, no matter the size, means the world to me. This isn't just about 
            funding—it's about building a community of people who believe in exploring consciousness 
            in new ways. Your support allows me to focus on this work full-time and share these 
            insights with the world.
          </p>
          <p className="font-inter font-light text-muted-foreground leading-relaxed max-w-2xl mx-auto mt-4">
            Thank you for being part of this journey. Together, we're exploring the frontiers of 
            what it means to be conscious in a digital age.
          </p>
        </CardContent>
      </GlassCard>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <ReadingContainer>
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant={currentView === 'overview' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('overview')}
                  className="text-sm"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Overview
                </Button>
                <Button
                  variant={currentView === 'faq' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('faq')}
                  className="text-sm"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  FAQ
                </Button>
                <Button
                  variant={currentView === 'contact' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('contact')}
                  className="text-sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                <Button
                  variant={currentView === 'donate' ? 'default' : 'ghost'}
                  onClick={() => setCurrentView('donate')}
                  className="text-sm"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Support Us
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Response time: ~2.5hrs</span>
              </div>
            </div>
          </div>
        </ReadingContainer>
      </div>

      {/* Main Content */}
      <div className="relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
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
            <div className="fractal-connection"></div>
            <div className="fractal-connection"></div>
            <div className="fractal-connection"></div>
            <div className="fractal-connection"></div>
            <div className="fractal-connection"></div>
            <div className="fractal-connection"></div>
            <div className="fractal-connection"></div>
            <div className="fractal-connection"></div>
          </div>
        </div>

        <ReadingContainer className="relative z-10 py-16">
          {currentView === 'overview' && renderOverview()}
          {currentView === 'faq' && (
            <FAQSection onContactClick={() => setCurrentView('contact')} />
          )}
          {currentView === 'contact' && (
            <ContactForm 
              onSubmitSuccess={handleContactSuccess}
              onCancel={() => setCurrentView('overview')}
            />
          )}
          {currentView === 'donate' && renderDonationSection()}
        </ReadingContainer>
      </div>
    </div>
  );
};

export default SupportPage; 