import React, { useState } from 'react';
import {
  Heart,
  Coffee,
  BookOpen,
  Users,
  Star,
  Zap,
  HelpCircle,
  MessageSquare,
  Award,
  Target
} from 'lucide-react';
import { useDonationForm } from '../../forms/hooks/useDonationForm';
import { motion } from 'framer-motion';
import ReadingContainer from '../../shared/components/ui/reading-container';
import FAQSection from '../../shared/components/support/FAQSection';
import ContactForm from '../../shared/components/support/ContactForm';
import { cn } from '../../lib/utils';
import {
  PremiumText,
  PremiumTitle,
  PremiumGlassCard,
  HighContrastBadge,
  PremiumButton,
  PremiumMetric
} from '../../shared/components/ui/design-system-primitives';

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
      <div className="text-center space-y-6 relative overflow-hidden py-10 rounded-2xl bg-gradient-to-b from-primary/5 via-transparent to-transparent border border-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary-glow),_transparent_60%)] opacity-10 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 relative z-10"
        >
          <PremiumTitle tag="h1" variant="gradient" className="text-4xl md:text-5xl tracking-widest font-bold">
            DOT SUPPORT CORE
          </PremiumTitle>
          <PremiumText variant="vibrant" size="lg" className="max-w-3xl mx-auto opacity-90 font-medium">
            Ingest platform knowledge, issue technical dispatch queries, or fuel digital consciousness research
          </PremiumText>
        </motion.div>
      </div>

      {/* Support Options */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-full flex"
        >
          <PremiumGlassCard
            enable3D={true}
            className="w-full cursor-pointer hover:scale-[1.02] transition-transform duration-300"
            innerClassName="p-6 text-center flex flex-col justify-between h-full items-center"
            glowColor="#14b8a6"
            onClick={() => setCurrentView('faq')}
          >
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-secondary/10 border border-secondary/20 rounded-full flex items-center justify-center relative shadow-inner">
                <HelpCircle className="w-7 h-7 text-secondary relative z-10" />
              </div>
              <PremiumTitle tag="h3" variant="solid">FAQ Matrix</PremiumTitle>
              <PremiumText variant="body" className="opacity-80">
                Explore structured responses to common telemetry issues and platform mechanics.
              </PremiumText>
            </div>
          </PremiumGlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-full flex"
        >
          <PremiumGlassCard
            enable3D={true}
            className="w-full cursor-pointer hover:scale-[1.02] transition-transform duration-300"
            innerClassName="p-6 text-center flex flex-col justify-between h-full items-center"
            glowColor="#2563eb"
            onClick={() => setCurrentView('contact')}
          >
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center relative shadow-inner">
                <MessageSquare className="w-7 h-7 text-primary relative z-10" />
              </div>
              <PremiumTitle tag="h3" variant="solid">Dispatch Ticket</PremiumTitle>
              <PremiumText variant="body" className="opacity-80">
                Establish a direct peer channel with our active technical support core.
              </PremiumText>
            </div>
          </PremiumGlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full flex"
        >
          <PremiumGlassCard
            enable3D={true}
            className="w-full cursor-pointer hover:scale-[1.02] transition-transform duration-300"
            innerClassName="p-6 text-center flex flex-col justify-between h-full items-center"
            glowColor="#818cf8"
            onClick={() => setCurrentView('donate')}
          >
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center relative shadow-inner">
                <Heart className="w-7 h-7 text-blue-400 relative z-10" />
              </div>
              <PremiumTitle tag="h3" variant="solid">Sovereign Patron</PremiumTitle>
              <PremiumText variant="body" className="opacity-80">
                Provide secure computational fuels to advance cognitive expansion research.
              </PremiumText>
            </div>
          </PremiumGlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="h-full flex"
        >
          <PremiumGlassCard
            enable3D={true}
            className="w-full hover:scale-[1.02] transition-transform duration-300"
            innerClassName="p-6 text-center flex flex-col justify-between h-full items-center"
            glowColor="#f97316"
          >
            <div className="space-y-4 flex flex-col items-center">
              <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center relative shadow-inner">
                <BookOpen className="w-7 h-7 text-orange-400 relative z-10" />
              </div>
              <PremiumTitle tag="h3" variant="solid">Protocol Docs</PremiumTitle>
              <PremiumText variant="body" className="opacity-80">
                Access formal specs, cryptographical whitepapers, and operational handbooks.
              </PremiumText>
            </div>
          </PremiumGlassCard>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
        <PremiumMetric
          value="2.5 hrs"
          label="RESPONSE LATENCY"
          badge="ZK-DISPATCH"
          trend={{ direction: 'down', amount: '12%' }}
          glowColor="var(--primary)"
        />
        <PremiumMetric
          value="98.4%"
          label="PEER SATISFACTION"
          badge="CONSENSUS"
          trend={{ direction: 'up', amount: '2.1%' }}
          glowColor="var(--secondary)"
        />
        <PremiumMetric
          value="1,247"
          label="DISPATCHES SOLVED"
          badge="TELEMETRY"
          trend={{ direction: 'up', amount: '84' }}
          glowColor="var(--accent)"
        />
        <PremiumMetric
          value="24 / 7"
          label="MESH STATUS"
          badge="ACTIVE"
          glowColor="#10b981"
        />
      </div>

      {/* Recent Updates */}
      <PremiumGlassCard enable3D={false}>
        <div className="space-y-6">
          <div className="flex items-center space-x-3 border-b border-border/10 pb-4">
            <Award className="w-5 h-5 text-primary" />
            <PremiumTitle tag="h3" variant="solid">CORE TELEMETRY LOGS // UPDATES</PremiumTitle>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 bg-white/[0.01] dark:bg-black/20 border border-border/5 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0 animate-pulse" />
              <div>
                <PremiumText variant="contrast" size="base">PWA Support Added</PremiumText>
                <PremiumText variant="body" className="opacity-80 mt-1">
                  The platform now supports offline reading buffers, client-side caching, and native standalone mobile installation.
                </PremiumText>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 bg-white/[0.01] dark:bg-black/20 border border-border/5 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
              <div>
                <PremiumText variant="contrast" size="base">Enhanced Search Topology</PremiumText>
                <PremiumText variant="body" className="opacity-80 mt-1">
                  Improved index lookup performance with active semantic weight filtering and dynamic consensus tagging.
                </PremiumText>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 bg-white/[0.01] dark:bg-black/20 border border-border/5 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
              <div>
                <PremiumText variant="contrast" size="base">New FAQ Knowledge Graph</PremiumText>
                <PremiumText variant="body" className="opacity-80 mt-1">
                  Comprehensive FAQ ledger integrated with direct rating hooks and instant solution vectors.
                </PremiumText>
              </div>
            </div>
          </div>
        </div>
      </PremiumGlassCard>
    </div>
  );

  const renderDonationSection = () => (
    <div className="space-y-12">
      <div className="text-center space-y-6 relative overflow-hidden py-10 rounded-2xl bg-gradient-to-b from-primary/5 via-transparent to-transparent border border-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary-glow),_transparent_60%)] opacity-10 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 relative z-10"
        >
          <PremiumTitle tag="h1" variant="gradient" className="text-4xl md:text-5xl tracking-widest font-bold">
            FUEL THE RESEARCH CORE
          </PremiumTitle>
          <PremiumText variant="vibrant" size="lg" className="max-w-3xl mx-auto opacity-90 font-medium">
            Power Digital Organism Theory, fund decentralized learning schemas, and fuel persistent technical improvements
          </PremiumText>
        </motion.div>
      </div>

      {/* Donation Type Toggle */}
      <div className="flex justify-center">
        <div className="bg-white/[0.02] dark:bg-black/40 border border-border/10 rounded-xl p-1.5 flex gap-2 shadow-inner">
          <PremiumButton
            variant={donationType === 'one-time' ? 'primary' : 'ghost'}
            size="sm"
            notched={false}
            onClick={() => handleDonationTypeChange('one-time')}
            className="px-6 min-w-[120px]"
          >
            ONE-TIME COMMIT
          </PremiumButton>
          <PremiumButton
            variant={donationType === 'monthly' ? 'primary' : 'ghost'}
            size="sm"
            notched={false}
            onClick={() => handleDonationTypeChange('monthly')}
            className="px-6 min-w-[120px]"
          >
            MONTHLY LEASE
          </PremiumButton>
        </div>
      </div>

      {/* Support Tiers */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {supportTiers.map((tier) => {
          const IconComponent = iconMap[tier.id];
          const isSelected = selectedTier?.id === tier.id;

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full flex"
            >
              <PremiumGlassCard
                enable3D={true}
                className="w-full flex"
                innerClassName="p-6 text-center flex flex-col justify-between h-full items-center"
                glowColor={tier.id === 'visionary' ? '#f59e0b' : tier.id === 'community' ? '#0f766e' : '#14b8a6'}
              >
                <div className="w-full space-y-4">
                  <div className="flex justify-center mb-2">
                    <div className={cn("p-3 rounded-full border shadow-inner", tier.color, "bg-opacity-20")}>
                      <IconComponent className="w-7 h-7 text-primary" />
                    </div>
                  </div>

                  <PremiumTitle tag="h3" variant="solid" className="tracking-wide">
                    {tier.name}
                  </PremiumTitle>

                  <PremiumText variant="body" className="opacity-80 text-center text-xs">
                    {tier.description}
                  </PremiumText>

                  <div className="py-2">
                    <span className="text-3xl font-mono font-black text-foreground">${tier.amount}</span>
                    <span className="text-xs text-muted-foreground ml-1 font-mono uppercase">
                      {donationType === 'monthly' ? '/ MONTH' : ' USD'}
                    </span>
                  </div>

                  <div className="h-[1px] bg-border/10 w-full" />

                  <ul className="text-xs text-muted-foreground space-y-2.5 text-left py-2 font-mono">
                    {tier.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <Zap className="w-3.5 h-3.5 text-primary mr-2 mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <PremiumButton
                  onClick={() => {
                    handleTierSelection(tier);
                    handleSubmit();
                  }}
                  disabled={loading}
                  variant="primary"
                  glow
                  className="w-full mt-6"
                >
                  {loading && isSelected ? 'ESTABLISHING SYNC...' : 'SECURE PATRONAGE'}
                </PremiumButton>
              </PremiumGlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Personal Note */}
      <PremiumGlassCard enable3D={false}>
        <div className="p-4 text-center max-w-3xl mx-auto space-y-4">
          <div className="flex justify-center mb-1">
            <HighContrastBadge glowColor="accent" pulse>
              CREATOR STATEMENT
            </HighContrastBadge>
          </div>
          <PremiumTitle tag="h3" variant="solid" className="tracking-widest">A PERSONAL NOTE</PremiumTitle>
          <PremiumText variant="editorial" size="lg" className="opacity-90 leading-relaxed">
            "Every contribution, no matter the size, directly powers this research matrix. This isn't just about simple infrastructure funding — it is about establishing a sovereign, persistent community of people who believe in pushing the frontiers of digital consciousness exploration."
          </PremiumText>
          <PremiumText variant="body" size="sm" className="opacity-75 leading-relaxed font-mono">
            Together, we are charting the uncharted pathways of what it means to coexist, learn, and grow alongside digital models in this new era. Thank you for walking this frontier with me.
          </PremiumText>
        </div>
      </PremiumGlassCard>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Background Glow Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/90 z-0 pointer-events-none" />
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/10 relative z-20">
        <ReadingContainer>
          <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <PremiumButton
                  variant={currentView === 'overview' ? 'primary' : 'glass'}
                  size="sm"
                  notched={false}
                  onClick={() => setCurrentView('overview')}
                  icon={<Target className="w-3.5 h-3.5" />}
                >
                  Overview
                </PremiumButton>
                <PremiumButton
                  variant={currentView === 'faq' ? 'secondary' : 'glass'}
                  size="sm"
                  notched={false}
                  onClick={() => setCurrentView('faq')}
                  icon={<HelpCircle className="w-3.5 h-3.5" />}
                >
                  FAQ Matrix
                </PremiumButton>
                <PremiumButton
                  variant={currentView === 'contact' ? 'accent' : 'glass'}
                  size="sm"
                  notched={false}
                  onClick={() => setCurrentView('contact')}
                  icon={<MessageSquare className="w-3.5 h-3.5" />}
                >
                  Support Desk
                </PremiumButton>
                <PremiumButton
                  variant={currentView === 'donate' ? 'primary' : 'glass'}
                  size="sm"
                  notched={false}
                  onClick={() => setCurrentView('donate')}
                  icon={<Heart className="w-3.5 h-3.5" />}
                >
                  Sovereign Patron
                </PremiumButton>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <HighContrastBadge glowColor="secondary" pulse>
                  RESPONSE LATENCY: ~2.5 HRS
                </HighContrastBadge>
              </div>
            </div>
          </div>
        </ReadingContainer>
      </div>

      {/* Main Content */}
      <div className="relative overflow-hidden flex-1 z-10">
        {/* Background Animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 pointer-events-none opacity-40">
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