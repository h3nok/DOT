import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Briefcase, Tag, AlertCircle, Cpu, BarChart4, ChevronLeft, ChevronRight, Globe, Github, Sparkles } from 'lucide-react';
import { siteConfig } from '../../content/site.config';
import { caseStudiesData } from '../../content/projects/caseStudiesData';
import EnhancedMarkdown from '../../shared/components/ui/EnhancedMarkdown';
import { Button } from '../../shared/components/ui/button';
import { AquaticBackground } from '../../shared/components/ui/aquatic-background';
import FloatingNav from '../../shared/components/ui/floating-nav';
import GlassCard from '../../shared/components/ui/glass-card';
import { Badge } from '../../shared/components/ui/badge';
import { motion } from 'framer-motion';

export const CaseStudyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const project = siteConfig.projects.find((p) => p.slug === id);
  const study = id ? caseStudiesData[id] : null;

  if (!project || !study) {
    return (
      <AquaticBackground className="flex items-center justify-center min-h-screen">
        <GlassCard className="p-8 text-center max-w-md border-white/10 dark:border-white/5 space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
          <h2 className="font-orbitron font-black text-xl mb-2">CASE STUDY NOT FOUND</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            We searched the work index database but could not retrieve case study identifier: "{id}"
          </p>
          <Link to="/">
            <Button variant="outline" className="rounded-xl border-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Node Map
            </Button>
          </Link>
        </GlassCard>
      </AquaticBackground>
    );
  }

  // Next and Prev Project indices
  const currentIdx = siteConfig.projects.findIndex((p) => p.slug === id);
  const prevProject = siteConfig.projects[currentIdx - 1];
  const nextProject = siteConfig.projects[currentIdx + 1];

  return (
    <AquaticBackground className="pb-24 relative overflow-hidden">

      {/* 1. Header Banner Block with blended premium transparency */}
      <div
        className="relative w-full h-[360px] md:h-[420px] flex items-end overflow-hidden border-b border-white/10"
        style={{
          background: project.gradient,
        }}
      >
        {/* Blended premium mask to let the stardust grid and floating particles pass through */}
        <div className="absolute inset-0 bg-background/20 dark:bg-black/30 backdrop-blur-[3px] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="container mx-auto px-6 max-w-5xl relative z-10 pb-12 flex flex-col items-start text-left">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <Link to="/" className="inline-flex items-center space-x-2 text-xs font-mono text-white/90 hover:text-white mb-6 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 transition-all duration-300 shadow-md">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Node Map</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="flex items-center gap-2 mb-3"
          >
            <Badge variant="pulse" className="border-white/20 bg-white/10 text-white">
              <Sparkles className="w-3 h-3 text-white" />
              <span>Deep-Dive Study</span>
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="font-orbitron font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-tight leading-none"
          >
            {project.name}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-white/90 font-inter text-sm sm:text-lg mt-3 max-w-2xl leading-relaxed font-light"
          >
            {project.tagline}
          </motion.p>
        </div>
      </div>

      {/* Main Grid Content Area */}
      <div className="container mx-auto px-6 max-w-5xl mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* 2. Left side: Detailed Meta details Card (tactile 3D tilting card) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            >
              <GlassCard
                enable3D={true}
                variant="premium"
                className="p-6 border-white/10 dark:border-white/5 space-y-6 text-left shadow-xl"
              >
                <h3 className="font-orbitron font-extrabold text-xs tracking-widest uppercase text-muted-foreground border-b border-white/5 pb-3">
                  Project Specs
                </h3>

                <div className="space-y-4 font-mono text-xs">
                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-muted-foreground block tracking-wider">My Role</span>
                      <span className="text-sm font-semibold text-foreground font-inter">{project.role}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-muted-foreground block tracking-wider">Timeline</span>
                      <span className="text-sm font-semibold text-foreground font-inter">{project.period}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-muted-foreground block tracking-wider">Status</span>
                      <Badge variant="pulse" className="text-[10px] mt-0.5">
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Core Stack Section */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block tracking-widest">
                    Core Technologies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.stack.map((tech) => (
                      <Badge key={tech} variant="cyber" className="text-muted-foreground">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Outward Repository / Live Actions */}
                <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                  {project.links.repo && (
                    <a
                      href={project.links.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl border-white/10 hover:border-primary/30 bg-white/[0.01] hover:bg-white/[0.04] text-xs font-mono text-muted-foreground hover:text-foreground transition-all duration-300"
                      >
                        <Github className="w-4 h-4 text-primary" />
                        <span>View Repository</span>
                      </Button>
                    </a>
                  )}
                  {project.links.live && project.links.live !== '/' && (
                    <a
                      href={project.links.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button
                        className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-white text-xs font-mono font-bold border-none transition-all duration-300 shadow-md"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Launch Live Platform</span>
                      </Button>
                    </a>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* 3. Right side: Problem statement summaries & Case Study Content */}
          <div className="lg:col-span-8 space-y-8">

            {/* Rapid Scannable Grid: Problem, Approach, Outcome */}
            <div className="grid grid-cols-1 gap-4 text-left">

              {/* Problem block */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <GlassCard variant="subtle" className="p-5 border-destructive/10 bg-destructive/5 hover:border-destructive/20 rounded-2xl transition-all duration-300">
                  <div className="flex items-center space-x-2 text-destructive mb-2.5">
                    <AlertCircle className="w-4 h-4" />
                    <h4 className="font-orbitron font-black text-xs tracking-wider uppercase">The Problem Constraints</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
                    {study.problem}
                  </p>
                </GlassCard>
              </motion.div>

              {/* Approach block */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <GlassCard variant="subtle" className="p-5 border-primary/15 bg-primary/5 hover:border-primary/25 rounded-2xl transition-all duration-300">
                  <div className="flex items-center space-x-2 text-primary mb-2.5">
                    <Cpu className="w-4 h-4" />
                    <h4 className="font-orbitron font-black text-xs tracking-wider uppercase">The Technical Approach</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
                    {study.approach}
                  </p>
                </GlassCard>
              </motion.div>

              {/* Outcome block */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <GlassCard variant="subtle" className="p-5 border-secondary/15 bg-secondary/5 hover:border-secondary/25 rounded-2xl transition-all duration-300">
                  <div className="flex items-center space-x-2 text-secondary mb-2.5">
                    <BarChart4 className="w-4 h-4" />
                    <h4 className="font-orbitron font-black text-xs tracking-wider uppercase">The Emergent Outcome</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
                    {study.outcome}
                  </p>
                </GlassCard>
              </motion.div>

            </div>

            {/* Deep-dive Case Study rendered in gorgeous Markdown card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="pt-6 border-t border-white/5"
            >
              <GlassCard
                variant="bright"
                className="p-6 sm:p-10 md:p-12 border-white/10 dark:border-white/5 shadow-2xl relative bg-card/75 backdrop-blur-xl rounded-2xl text-left"
              >
                <div className="prose psky-lg dark:psky-invert max-w-none">
                  <EnhancedMarkdown
                    content={study.fullContent}
                    allowMath={true}
                    allowCodeHighlight={true}
                    maxWidth="full"
                    fontSize="base"
                    lineHeight="relaxed"
                    className="psky-headings:font-orbitron psky-headings:font-bold psky-p:font-light psky-p:text-muted-foreground psky-a:text-primary hover:psky-a:text-primary/80 psky-code:rounded-md psky-code:bg-black/30 psky-code:px-1.5 psky-code:py-0.5"
                  />
                </div>
              </GlassCard>
            </motion.div>

            {/* 4. Footer Project Carousel Navs with smooth hover effects */}
            <div className="flex items-center justify-between border-t border-white/5 pt-8 mt-12">
              {prevProject ? (
                <button
                  onClick={() => navigate(`/work/${prevProject.slug}`)}
                  className="flex items-center space-x-3 text-left group cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-primary/30 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all duration-300">
                    <ChevronLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest block">Previous Spec</span>
                    <span className="text-sm font-bold font-orbitron text-foreground group-hover:text-primary transition-colors duration-300">{prevProject.name}</span>
                  </div>
                </button>
              ) : (
                <div />
              )}

              {/* Middle: Return to Cockpit button */}
              <Link
                to="/"
                className="py-2.5 px-5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 rounded-xl transition-all duration-300 font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Node Map</span>
              </Link>

              {nextProject ? (
                <button
                  onClick={() => navigate(`/work/${nextProject.slug}`)}
                  className="flex items-center space-x-3 text-right group cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                >
                  <div>
                    <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest block">Next Spec</span>
                    <span className="text-sm font-bold font-orbitron text-foreground group-hover:text-primary transition-colors duration-300">{nextProject.name}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-primary/30 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all duration-300">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              ) : (
                <div />
              )}
            </div>

          </div>

        </div>
      </div>

      <FloatingNav />
    </AquaticBackground>
  );
};
