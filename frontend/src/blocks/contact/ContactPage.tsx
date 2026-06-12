import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Send,
  Linkedin,
  Github,
  Twitter,
  ShieldCheck,
  Sparkles,
  Zap,
  Lock,
  Globe
} from 'lucide-react';
import {
  PremiumText,
  PremiumTitle,
  PremiumGlassCard,
  HighContrastBadge,
  PremiumButton,
  PremiumInput,
  PremiumTextArea
} from '../../shared/components/ui/design-system-primitives';
import { AquaticBackground } from '../../shared/components/ui/aquatic-background';
import FloatingNav from '../../shared/components/ui/floating-nav';
import { siteConfig } from '../../content/site.config';

type CollabType = 'Systems Architecture' | 'Agentic AI Sandboxing' | 'HIPAA Compliance' | 'Smart Contracts' | 'Other Ventures';

export const ContactPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [collabType, setCollabType] = useState<CollabType>('Systems Architecture');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !message) {
      setErrorMessage('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    // Simulate secure transmission
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
      setEmail('');
      setName('');
      setMessage('');
    } catch (err) {
      setErrorMessage('An error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const collabOptions: { type: CollabType; desc: string; icon: React.ReactNode }[] = [
    {
      type: 'Systems Architecture',
      desc: 'High-availability infrastructure, backend routing, DB optimization',
      icon: <Zap className="w-4 h-4 text-[#00f2fe]" />
    },
    {
      type: 'Agentic AI Sandboxing',
      desc: 'Securing agent runtimes, prompt injection containment protocols',
      icon: <Lock className="w-4 h-4 text-[#2563eb]" />
    },
    {
      type: 'HIPAA Compliance',
      desc: 'Secure PHI storage, healthcare transport workflows & audits',
      icon: <ShieldCheck className="w-4 h-4 text-[#0f766e]" />
    },
    {
      type: 'Smart Contracts',
      desc: 'Cryptographic milestone escrows, secure Web3 dApp services',
      icon: <Sparkles className="w-4 h-4 text-[#fbbf24]" />
    },
    {
      type: 'Other Ventures',
      desc: 'General consulting, seed rounds, and architectural design reviews',
      icon: <Globe className="w-4 h-4 text-muted-foreground" />
    },
  ];

  return (
    <AquaticBackground className="py-20 md:py-28">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-5 flex justify-center"
          >
            <HighContrastBadge glowColor="success" pulse={true}>
              <Mail className="w-3 h-3 text-emerald-500" />
              <span>Secure Gateway</span>
            </HighContrastBadge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
            className="mb-5"
          >
            <PremiumTitle tag="h1" variant="gradient" className="font-orbitron tracking-tight">
              Initiate a Venture Collaboration
            </PremiumTitle>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.2 }}
          >
            <PremiumText variant="vibrant" size="base" className="font-inter">
              Whether scaling high-stakes systems architecture, engineering isolated LLM agent runtimes, or designing Web3 escrow systems, let's connect.
            </PremiumText>
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* LEFT SIDE: Contact Channels & Credentials */}
          <div className="lg:col-span-5 space-y-8">
            <PremiumGlassCard
              enable3D={true}
              innerClassName="p-7 relative overflow-hidden"
            >
              {/* Thin gradient border line */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              <PremiumTitle tag="h3" variant="solid" className="mb-4">
                <span className="flex items-center space-x-2.5">
                  <Zap className="w-4 h-4 text-primary animate-pulse" />
                  <span>Venture Desk Info</span>
                </span>
              </PremiumTitle>

              <PremiumText variant="vibrant" className="mb-6 font-inter text-sm">
                All communications are routed through secure, encrypted gateways. Responses regarding qualified architectural, venture, or advisory partnerships are usually returned within 24 hours.
              </PremiumText>

              <div className="space-y-4">
                <div className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-muted/30 border border-border/20 dark:bg-black/20">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                      Direct Email
                    </span>
                    <a href={`mailto:${siteConfig.email}`} className="text-sm font-semibold hover:text-primary transition-colors duration-200">
                      {siteConfig.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 p-3.5 rounded-xl bg-muted/30 border border-border/20 dark:bg-black/20">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                      PGP Fingerprint
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-foreground">
                      8F2B 9CE4 DE13 0AA2
                    </span>
                  </div>
                </div>
              </div>
            </PremiumGlassCard>

            {/* Social Grid */}
            <PremiumGlassCard
              enable3D={true}
              innerClassName="p-7"
            >
              <PremiumTitle tag="h3" variant="solid" className="mb-5">
                Verified Channels
              </PremiumTitle>

              <div className="grid grid-cols-3 gap-3">
                <a
                  href={siteConfig.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center py-4 bg-muted/30 border border-border/20 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group"
                >
                  <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                  <span className="text-[9px] font-mono font-bold mt-2 text-muted-foreground group-hover:text-foreground tracking-widest uppercase">
                    LinkedIn
                  </span>
                </a>

                <a
                  href={siteConfig.socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center justify-center py-4 bg-muted/30 border border-border/20 rounded-xl hover:border-secondary/40 hover:bg-secondary/5 transition-all duration-300 group"
                >
                  <Github className="w-5 h-5 text-muted-foreground group-hover:text-secondary transition-colors duration-200" />
                  <span className="text-[9px] font-mono font-bold mt-2 text-muted-foreground group-hover:text-foreground tracking-widest uppercase">
                    GitHub
                  </span>
                </a>

                {siteConfig.socials.twitter && (
                  <a
                    href={siteConfig.socials.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center py-4 bg-muted/30 border border-border/20 rounded-xl hover:border-accent/40 hover:bg-accent/5 transition-all duration-300 group"
                  >
                    <Twitter className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors duration-200" />
                    <span className="text-[9px] font-mono font-bold mt-2 text-muted-foreground group-hover:text-foreground tracking-widest uppercase">
                      Twitter
                    </span>
                  </a>
                )}
              </div>
            </PremiumGlassCard>
          </div>

          {/* RIGHT SIDE: Interactive Inquiry Console */}
          <div className="lg:col-span-7">
            <PremiumGlassCard
              innerClassName="p-8 relative"
            >
              <AnimatePresence mode="wait">

                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-16 flex flex-col items-center"
                  >
                    <div className="w-16 h-16 bg-secondary/10 border border-secondary/30 rounded-full flex items-center justify-center text-secondary mb-6 animate-pulse">
                      <ShieldCheck className="w-8 h-8" />
                    </div>

                    <PremiumTitle tag="h3" variant="gradient" className="mb-2">
                      Transmission Confirmed
                    </PremiumTitle>

                    <PremiumText variant="vibrant" size="sm" className="max-w-sm mb-8 font-inter">
                      Thank you. Your inquiry regarding <span className="font-bold text-foreground">{collabType}</span> has been securely logged on our serverless database.
                    </PremiumText>

                    <PremiumButton
                      onClick={() => setIsSubmitted(false)}
                      variant="glass"
                      className="px-6 h-12 text-xs font-bold font-mono tracking-widest cursor-pointer"
                    >
                      Send Another Transmission
                    </PremiumButton>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="border-b border-border/10 pb-4 mb-6">
                      <PremiumTitle tag="h3" variant="gradient">
                        Secure Inquiry Console
                      </PremiumTitle>
                      <PremiumText variant="vibrant" size="xs" mono className="mt-1 uppercase tracking-wider">
                        Please select your collaboration vector and details below.
                      </PremiumText>
                    </div>

                    {errorMessage && (
                      <div className="p-3.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-semibold font-mono uppercase tracking-wider">
                        {errorMessage}
                      </div>
                    )}

                    {/* Selector: Collaboration Type */}
                    <div className="space-y-3">
                      <span className="text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-wider text-foreground/80">
                        Collaboration Vector
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {collabOptions.map((opt) => {
                          const isSelected = collabType === opt.type;
                          return (
                            <button
                              key={opt.type}
                              type="button"
                              onClick={() => setCollabType(opt.type)}
                              className={`p-4 rounded-xl text-left border transition-all duration-300 flex space-x-3 items-start cursor-pointer group/opt relative ${
                                isSelected
                                  ? 'bg-primary/10 border-primary/50 shadow-[0_0_20px_color-mix(in_oklch,var(--primary)_15%,transparent)]'
                                  : 'bg-card/40 border-white/5 dark:border-white/5 hover:border-primary/40 hover:bg-card/75'
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg border bg-background mt-0.5 transition-colors duration-300 ${isSelected ? 'border-primary/40 text-primary' : 'border-border/30 bg-card'}`}>
                                {opt.icon}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-xs font-bold font-orbitron tracking-tight transition-colors duration-300 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                  {opt.type}
                                </span>
                                <span className="text-[10px] text-foreground/85 mt-1 leading-normal group-hover/opt:text-foreground transition-colors duration-300">
                                  {opt.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PremiumInput
                        label="Your Name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                      />

                      <PremiumInput
                        label="Email Address"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. john@company.com"
                      />
                    </div>

                    {/* Textarea */}
                    <PremiumTextArea
                      label="Detailed Project Spec or Message"
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Detail your goals, stack parameters, timelines, or regulatory criteria..."
                    />

                    {/* Submit Button */}
                    <PremiumButton
                      type="submit"
                      variant="primary"
                      glow={true}
                      disabled={isSubmitting}
                      className="w-full h-12 text-xs font-bold tracking-widest font-mono uppercase cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-b-white rounded-full animate-spin" />
                          <span>Establishing Secure Route...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Send className="w-4 h-4" />
                          <span>Transmit Secure Message</span>
                        </div>
                      )}
                    </PremiumButton>
                  </motion.form>
                )}

              </AnimatePresence>
            </PremiumGlassCard>
          </div>

        </div>

      </div>
      <FloatingNav />
    </AquaticBackground>
  );
};

export default ContactPage;
