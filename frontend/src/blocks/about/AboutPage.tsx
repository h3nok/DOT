import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Shield,
  Cpu,
  Layers,
  Sparkles,
  Download,
  Briefcase,
  Calendar,
  Code2,
  Workflow,
  Activity,
  Lock,
  ArrowUpRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../../shared/components/ui/button';
import { AquaticBackground } from '../../shared/components/ui/aquatic-background';
import FloatingNav from '../../shared/components/ui/floating-nav';
import {
  PremiumGlassCard,
  HighContrastBadge,
  PremiumTitle,
  PremiumText
} from '../../shared/components/ui/design-system-primitives';

interface TechModule {
  name: string;
  spec: string;
  status: 'EXPERT' | 'CORE' | 'SYSTEM' | 'PRODUCTION';
}

interface TechCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  modules: TechModule[];
}

export const AboutPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'registry' | 'ledger' | 'philosophy'>('registry');

  const techCategories: TechCategory[] = [
    {
      title: 'AI Engineering & Autonomy',
      icon: <Cpu className="w-4 h-5 text-blue-400" />,
      color: 'primary',
      modules: [
        { name: 'LLM Sandboxing & Isolations', spec: 'Custom gRPC container layers preventing untrusted breakout runs', status: 'EXPERT' },
        { name: 'Agentic Workflow Synthesis', spec: 'Deterministic tool-use orchestration & recursive planning graph engines', status: 'PRODUCTION' },
        { name: 'Model Context Protocol (MCP)', spec: 'Standardized client-host bridges routing contextual file/tool schemas', status: 'EXPERT' },
        { name: 'Python Core & Package Dev', spec: 'Production packages engineered for highly isolated zero-trust servers', status: 'CORE' },
      ]
    },
    {
      title: 'Systems & Cloud Infrastructure',
      icon: <Shield className="w-4 h-5 text-emerald-400" />,
      color: 'emerald',
      modules: [
        { name: 'Zero-Trust Architectures', spec: 'Immutable security perimeter constraints routing client request tokens', status: 'EXPERT' },
        { name: 'HIPAA & NEMT Compliances', spec: 'Patient data encryption, audit trails, and secure dispatch routing structures', status: 'PRODUCTION' },
        { name: 'Spring Boot Enterprise Java', spec: 'Highly transactional database integrations with strict security models', status: 'CORE' },
        { name: 'Database Scalings & Postgres', spec: 'Complex indexing, row-level locks, and multi-tenant isolation architectures', status: 'SYSTEM' },
      ]
    },
    {
      title: 'Distributed Scale & Web3',
      icon: <Layers className="w-4 h-5 text-amber-400" />,
      color: 'amber',
      modules: [
        { name: 'Smart Escrow Contract Frameworks', spec: 'Algorithmic workforce contractor skills checking & programmatic escrow logic', status: 'CORE' },
        { name: 'Cryptographic Architectures', spec: 'Secure asymmetric key encryptions & multi-signature verification flows', status: 'EXPERT' },
        { name: 'Node.js Core Microservices', spec: 'Multi-threaded cluster systems driving fast RESTful API structures', status: 'SYSTEM' },
        { name: 'Zod & Strict Schema Enforcements', spec: 'Runtime validation gateways guaranteeing immutable request compliance', status: 'PRODUCTION' },
      ]
    },
    {
      title: 'Frontend Systems & Complexity',
      icon: <Sparkles className="w-4 h-5 text-sky-400" />,
      color: 'sky',
      modules: [
        { name: 'React 19 Core Engineering', spec: 'Concurrent rendering, Suspense orchestration, and performance fiber tunings', status: 'EXPERT' },
        { name: 'Web Worker Parallelism', spec: 'Offloading complex particle & physics state models into isolated threads', status: 'SYSTEM' },
        { name: 'Tailwind CSS Core layouts', spec: 'Building bespoke design system tokens & responsive visual controls', status: 'PRODUCTION' },
        { name: 'Web Performance Optimization', spec: 'Bundle splits & core web vitals optimization yielding <1.5s LCP on 4G', status: 'CORE' },
      ]
    }
  ];

  const cvLedger = [
    {
      role: 'Creator & Lead Architect',
      company: 'Digital Organisms Theory (DOT)',
      period: '2024–PRESENT',
      summary: 'Formulated and coded a complex browser-rendered artificial life sandbox. Built multi-threaded thread fields via Web Workers to support real-time physics simulations on high-density particles.',
      achievements: [
        'Offloaded particle recalculation states into multi-threaded Web Workers, achieving steady 60 FPS on 10,000+ nodes.',
        'Synthesized deterministic Canvas visual coordinate maps with organic neural networking nodes.'
      ]
    },
    {
      role: 'Founder & Cryptographic Architect',
      company: 'Sullix',
      period: '2025–PRESENT',
      summary: 'Architected a next-generation decentralized labor market. Designed a skills validation engine integrated with automated cryptographic escrow triggers to contract, vet, and disburse secure labor.',
      achievements: [
        'Formulated custom escrow verification interfaces protecting contractor transactions under deterministic security parameters.',
        'Engineered dynamic automatic testing sandboxes validating candidate capabilities programmatically.'
      ]
    },
    {
      role: 'Lead Systems Architect',
      company: 'Avia / MedRoute',
      period: '2023–2025',
      summary: 'Directed the core platform architecture of a HIPAA-compliant medical dispatch fleet network. Connected enterprise hospital systems to real-time regional transport logistics.',
      achievements: [
        'Architected real-time routing algorithms tracking patient locations, routing multi-vehicle coordinates simultaneously.',
        'Formulated immutable clinical logs complying perfectly with rigorous healthcare regulatory standards.'
      ]
    },
    {
      role: 'Creator',
      company: 'Hermetic Knowledge Isolation (HKI)',
      period: '2024–2025',
      summary: 'Authored an isolated LLM execution sandbox standard. Created NPM and PyPI execution packages that isolate model context blocks to prevent breakout loops and payload injection risks.',
      achievements: [
        'Developed security-tight sandboxing microservices with secure gRPC channels protecting host infrastructure.',
        'Deployed standard isolation patterns safeguarding data blocks across multi-tenant enterprise agent servers.'
      ]
    }
  ];

  const containers: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  };

  const items: Variants = {
    hidden: { y: 15, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 120, damping: 18 }
    }
  };

  return (
    <AquaticBackground className="py-16 md:py-24 animate-fade-in">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">

        {/* ========================================================================= */}
        {/* SECTION 1: 3-COLUMN BENTO HEADER console                                  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">

          {/* Identity Monolith Card with 3D Float effect */}
          <PremiumGlassCard enable3D={true} className="md:col-span-9 flex flex-col justify-center items-center text-center p-8 relative overflow-hidden" glowColor="#ffffff">
            <HighContrastBadge glowColor="primary" pulse={true} className="mb-4">
              Identity Verified // Systems Architect
            </HighContrastBadge>

            <PremiumTitle tag="h1" variant="gradient" className="mb-2">
              H. Ghebrechristos
            </PremiumTitle>

            <PremiumText variant="primary" size="base" mono={true} className="uppercase tracking-widest mt-1 mb-4">
              Venture Builder // Systems Engineer
            </PremiumText>

            <PremiumText variant="vibrant" size="base" className="max-w-xl text-center">
              Deploying strict zero-trust platforms, parallel browser simulation models, and secure, compliance-critical medical routing kernels.
            </PremiumText>
          </PremiumGlassCard>

          {/* Action Control Portal Card */}
          <PremiumGlassCard className="md:col-span-3 flex flex-col justify-between p-6" glowColor="#ffffff">
            <div className="space-y-2">
              <PremiumText variant="primary" size="xs" mono={true} className="tracking-widest uppercase">
                [ACTION_TRIGGERS]
              </PremiumText>
              <PremiumText variant="vibrant" size="xs">
                Download full cryptographically certified specifications catalog below.
              </PremiumText>
            </div>

            <div className="space-y-3 mt-6">
              <Button
                className="w-full py-5 bg-gradient-to-r from-primary/15 to-primary/25 hover:from-primary/25 hover:to-primary/35 text-foreground border border-primary/45 rounded-lg transition-all duration-300 font-mono text-xs uppercase tracking-widest flex items-center justify-center space-x-2 cursor-pointer shadow-lg hover:shadow-primary/10"
                onClick={() => alert('Initiating secure system compilation... PDF Curriculum Vitae prepared for immediate download.')}
              >
                <Download className="w-4 h-4 text-primary" />
                <span>Compile CV.pdf</span>
              </Button>
              <a
                href="/#work"
                className="w-full py-2.5 bg-card hover:bg-muted/15 text-foreground border border-border/80 rounded-lg transition-all duration-300 font-mono text-xs uppercase tracking-widest flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>Ventures DB</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
              </a>
              <Link
                to="/"
                className="w-full py-2.5 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/40 rounded-lg transition-all duration-300 font-mono text-xs uppercase tracking-widest flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Cockpit</span>
              </Link>
            </div>
          </PremiumGlassCard>

        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: TWO-COLUMN MAIN BENTO CONSOLE                                  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ================== LEFT SIDEBAR: TELEMETRY & SPECS (4 cols) ============= */}
          <div className="lg:col-span-4 space-y-6">

            {/* Architectural Principles Card */}
            <PremiumGlassCard className="p-6 relative overflow-hidden" glowColor="#ffffff">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="flex items-center gap-2.5 mb-5 border-b border-border/30 pb-3">
                <Workflow className="w-4 h-4 text-primary animate-pulse" />
                <PremiumTitle tag="h3" variant="solid" mono={true}>
                  Core Constraints
                </PremiumTitle>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 border-l-2 border-primary/40 pl-3">
                  <PremiumText variant="contrast" size="xs" mono={true} className="uppercase tracking-wider">
                    1. Hermetic Containment
                  </PremiumText>
                  <PremiumText variant="vibrant" size="xs">
                    Security is binary. Runtimes and contractor database layers must operate inside locked virtual structures.
                  </PremiumText>
                </div>

                <div className="space-y-1.5 border-l-2 border-secondary/40 pl-3">
                  <PremiumText variant="secondary" size="xs" mono={true} className="uppercase tracking-wider">
                    2. High-Performance Parallelism
                  </PremiumText>
                  <PremiumText variant="vibrant" size="xs">
                    Complex models require dedicated processing pipelines. Keep particle rendering off user interface threads.
                  </PremiumText>
                </div>

                <div className="space-y-1.5 border-l-2 border-accent/40 pl-3">
                  <PremiumText variant="accent" size="xs" mono={true} className="uppercase tracking-wider">
                    3. Continuous Compliance
                  </PremiumText>
                  <PremiumText variant="vibrant" size="xs">
                    Auditability by design. Encrypt clinical fleet logs dynamically to safeguard private networks.
                  </PremiumText>
                </div>
              </div>
            </PremiumGlassCard>

            {/* Standard Security clearances */}
            <PremiumGlassCard className="p-5 flex flex-wrap gap-2 justify-center shadow-inner" glowColor="#ffffff">
              <HighContrastBadge glowColor="primary">[HIPAA_AUDITED]</HighContrastBadge>
              <HighContrastBadge glowColor="secondary">[ZERO_TRUST_CONSTRAINED]</HighContrastBadge>
              <HighContrastBadge glowColor="accent">[gRPC_ISOLATED]</HighContrastBadge>
              <HighContrastBadge glowColor="primary">[SANDBOX_CERTIFIED]</HighContrastBadge>
            </PremiumGlassCard>

          </div>

          {/* ================== RIGHT PANEL: CONSOLE DETAILS (8 cols) ================ */}
          <PremiumGlassCard className="lg:col-span-8 p-6 md:p-8 relative min-h-[500px] flex flex-col" glowColor="#ffffff">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Custom Tab Switcher - Razor Sharp */}
            <div className="flex border-b border-border/30 mb-8 max-w-full overflow-x-auto custom-scrollbar">
              {[
                { id: 'registry', label: 'Systems Registry', icon: <Code2 className="w-3.5 h-3.5" /> },
                { id: 'ledger', label: 'CV Dispatch Ledger', icon: <Briefcase className="w-3.5 h-3.5" /> },
                { id: 'philosophy', label: 'Product Principles', icon: <Workflow className="w-3.5 h-3.5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-5 py-3.5 border-b-2 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-200 relative whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/[0.05]'
                      : 'border-transparent text-foreground/85 hover:text-primary hover:bg-muted/15'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="sharp-active-tab-line"
                      className="absolute bottom-[-2px] inset-x-0 h-[2.5px] bg-primary"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Render Tab Contents */}
            <div className="flex-1">
              <AnimatePresence mode="wait">

                {/* TAB 1: TECH STACK REGISTRY */}
                {activeTab === 'registry' && (
                  <motion.div
                    key="registry"
                    variants={containers}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <PremiumText variant="primary" size="xs" mono={true} className="tracking-widest uppercase mb-4">
                      [INFO] SELECT KERNEL MODULES FROM IMMUTABLE CORE CAPABILITY SCHEMA:
                    </PremiumText>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {techCategories.map((category, idx) => (
                        <PremiumGlassCard
                          key={idx}
                          className="p-5 bg-card/65 border border-border/60 hover:border-primary/40 rounded-lg transition-colors duration-300"
                        >
                          <div className="flex items-center space-x-2.5 border-b border-border/20 pb-3 mb-4">
                            <div className="p-1.5 rounded bg-muted/40 border border-border/30 text-primary">
                              {category.icon}
                            </div>
                            <PremiumTitle tag="h4" variant="solid" mono={true}>
                              {category.title}
                            </PremiumTitle>
                          </div>

                          <div className="space-y-3.5">
                            {category.modules.map((m, mIdx) => (
                              <div key={mIdx} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="text-foreground font-extrabold tracking-tight uppercase">
                                    {m.name}
                                  </span>
                                  <HighContrastBadge glowColor={m.status === 'EXPERT' ? 'accent' : m.status === 'PRODUCTION' ? 'success' : 'primary'} className="scale-90 origin-right">
                                    {m.status}
                                  </HighContrastBadge>
                                </div>
                                <PremiumText variant="vibrant" size="xs" className="pl-2 border-l border-primary/20">
                                  {m.spec}
                                </PremiumText>
                              </div>
                            ))}
                          </div>
                        </PremiumGlassCard>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: EXPERIENCE DISPATCH LEDGER */}
                {activeTab === 'ledger' && (
                  <motion.div
                    key="ledger"
                    variants={containers}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, y: -10 }}
                    className="relative pl-6 space-y-8 before:absolute before:top-1 before:bottom-1 before:left-1.5 before:w-[1px] before:bg-border/60"
                  >
                    {cvLedger.map((item, idx) => (
                      <motion.div
                        key={idx}
                        variants={items}
                        className="relative group"
                      >
                        {/* Timeline square marker node */}
                        <div className="absolute -left-[20px] top-1.5 w-2.5 h-2.5 bg-card border border-border/80 group-hover:border-primary group-hover:bg-primary transition-all duration-300 rounded-sm flex items-center justify-center z-10">
                          <div className="w-1.5 h-1.5 bg-primary/45 group-hover:bg-card rounded-sm transition-colors duration-300" />
                        </div>

                        <PremiumGlassCard
                          className="p-5 bg-card/65 border border-border/50 hover:border-primary/30 rounded-lg transition-colors duration-300"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-border/20 pb-3 mb-3.5">
                            <div>
                              <PremiumTitle tag="h3" variant="solid">
                                {item.role}
                              </PremiumTitle>
                              <PremiumText variant="primary" size="xs" mono={true} className="mt-0.5 font-bold tracking-wider uppercase">
                                {item.company}
                              </PremiumText>
                            </div>
                            <div className="sm:self-center">
                              <HighContrastBadge glowColor="primary" className="px-3 py-1 flex items-center space-x-1.5">
                                <Calendar className="w-3.5 h-3.5 text-primary/95" />
                                <span>{item.period}</span>
                              </HighContrastBadge>
                            </div>
                          </div>

                          <PremiumText variant="vibrant" size="sm" className="mb-4">
                            {item.summary}
                          </PremiumText>

                          <div className="space-y-2 border-t border-border/10 pt-3.5">
                            <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-widest block mb-2">
                              [KEY_DELIVERABLES]
                            </span>
                            {item.achievements.map((ach, aIdx) => (
                              <div key={aIdx} className="font-sans text-xs leading-relaxed flex items-start gap-1.5">
                                <span className="text-primary font-mono select-none text-[11px] mt-0.5">•</span>
                                <PremiumText variant="vibrant" size="xs" className="pl-0.5">
                                  {ach}
                                </PremiumText>
                              </div>
                            ))}
                          </div>

                        </PremiumGlassCard>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* TAB 3: PRODUCT PHILOSOPHY & CONSTRAINTS */}
                {activeTab === 'philosophy' && (
                  <motion.div
                    key="philosophy"
                    variants={containers}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {[
                      {
                        title: 'Containment Constraint',
                        metric: 'SEC_LEVEL: ABSOLUTE',
                        description: 'Systems should be designed with deterministic barriers. By creating isolated, signed environments, we ensure LLM codes or distributed processes never spill contexts or escape memory channels.',
                        icon: <Lock className="w-4 h-4 text-foreground/75" />,
                        glow: 'neutral'
                      },
                      {
                        title: 'Parallelized Velocity',
                        metric: 'LATENCY_MAX: 12ms',
                        description: 'The quickest way to ship performance is optimization of raw pipelines. By keeping background simulations asynchronous and offloading logic into background fibers, responsive runtimes remain perfectly fluid.',
                        icon: <Activity className="w-4 h-4 text-foreground/75" />,
                        glow: 'neutral'
                      },
                      {
                        title: 'Rigorous Compliance',
                        metric: 'COMPLIANCE: HIPAA_MAX',
                        description: 'Compliance is a strict architectural feature. Systems routing personal, clinical, or financial tokens require end-to-end data encryption and verifiable blockchain-like logs.',
                        icon: <Shield className="w-4 h-4 text-foreground/75" />,
                        glow: 'neutral'
                      }
                    ].map((p, idx) => (
                      <PremiumGlassCard
                        key={idx}
                        className="p-5 bg-card/65 border border-border/50 hover:border-primary/35 rounded-lg flex flex-col justify-between transition-all duration-300"
                        glowColor="#ffffff"
                      >
                        <div>
                          <div className="p-2 w-fit rounded bg-muted/40 border border-border/30 mb-4 flex items-center justify-center text-primary">
                            {p.icon}
                          </div>
                          <PremiumTitle tag="h4" variant="solid" className="mb-2">
                            {p.title}
                          </PremiumTitle>
                          <PremiumText variant="vibrant" size="xs" className="mb-6">
                            {p.description}
                          </PremiumText>
                        </div>

                        <div className="pt-3 border-t border-border/25">
                          <HighContrastBadge glowColor={p.glow === 'primary' ? 'primary' : p.glow === 'emerald' ? 'success' : 'secondary'} className="w-full justify-center">
                            {p.metric}
                          </HighContrastBadge>
                        </div>
                      </PremiumGlassCard>
                    ))}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </PremiumGlassCard>

        </div>

      </div>
      <FloatingNav />
    </AquaticBackground>
  );
};

export default AboutPage;
