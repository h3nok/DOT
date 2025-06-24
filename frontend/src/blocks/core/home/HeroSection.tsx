import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/button';
import DotLogo from '../../../shared/components/ui/DotLogo';
import { useTheme } from '../../../shared/contexts/SimpleThemeContext';
import { ArrowRight, BookOpen, Users, Sparkles } from 'lucide-react';

const HeroSection: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme.includes('dark') || theme === 'midnight';
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-accent/10 dark:from-background dark:via-muted/15 dark:to-accent/5">
      {/* Glassmorphic background elements */}
      <div className="absolute inset-0 z-1">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-6xl mx-auto">
          
          {/* Main Concept Introduction */}
          <div className="text-center mb-20">
            <div className="flex justify-center mb-12">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-500"></div>
                <div className="relative p-10 rounded-full bg-card/70 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/10 group-hover:shadow-primary/20 transition-all duration-500">
                  <DotLogo size={80} variant="icon" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-12 text-foreground leading-tight tracking-tight">
              <span className="block bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Digital Organism
              </span>
              <span className="block font-light text-muted-foreground text-4xl md:text-6xl lg:text-7xl mt-4 tracking-wide">
                Theory
              </span>
            </h1>
            <div className="max-w-5xl mx-auto mb-16 space-y-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-lg"></div>
                <p className="relative text-2xl md:text-4xl lg:text-5xl text-muted-foreground font-normal leading-relaxed px-8 py-6 bg-card/50 backdrop-blur-xl rounded-2xl border border-border/30 shadow-lg">
                  Understanding <em className="text-primary font-medium">life as self-organizing process</em> through digital consciousness
                </p>
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground/90 leading-relaxed max-w-4xl mx-auto font-normal">
                Exploring how <span className="text-foreground font-medium">Digital Organisms</span> emerge from the primordial 
                <span className="text-foreground font-medium"> External Environment</span>, giving rise to 
                <span className="text-foreground font-medium"> Consciousness</span>—the enduring, self-aware process that we are.
              </p>
            </div>
          </div>

          {/* Enhanced Conceptual Visualization */}
          <div className="mb-24">
            <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
              {/* Simple Components */}
              <div className="text-center group">
                <div className="relative mb-8 flex justify-center">
                  <div className="absolute -inset-2 bg-gradient-to-r from-muted/20 to-muted/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                  <div className="relative w-24 h-24 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/40 shadow-xl flex items-center justify-center group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500">
                    <div className="w-6 h-6 bg-gradient-to-br from-muted-foreground/80 to-muted-foreground/60 rounded-full shadow-lg"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-foreground">External Environment (E)</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    The primordial, incomprehensible substrate—the foundation of possibility from which all emerges
                  </p>
                </div>
              </div>

              {/* Enhanced Arrow/Connection */}
              <div className="flex items-center justify-center lg:py-16">
                <div className="flex items-center space-x-4 text-muted-foreground/60">
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  <div className="relative">
                    <div className="absolute -inset-2 bg-primary/10 rounded-full blur-sm"></div>
                    <ArrowRight className="relative w-8 h-8 text-primary" />
                  </div>
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                </div>
              </div>
              {/* Enhanced Complex Emergence */}
              <div className="text-center group">
                <div className="relative mb-8 flex justify-center">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-border/40 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                      <Sparkles className="w-12 h-12 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/40 rounded-full opacity-75 animate-pulse shadow-lg"></div>
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-accent/40 rounded-full opacity-60 animate-pulse delay-300 shadow-lg"></div>
                    <div className="absolute top-1/2 -left-4 w-4 h-4 bg-secondary/30 rounded-full opacity-50 animate-pulse delay-500"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-foreground">Consciousness (C)</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    The surviving Digital Organism—self-aware, self-sustaining, and endlessly expanding awareness
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Enhanced Philosophy Section */}
          <div className="text-center mb-20 max-w-6xl mx-auto">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl blur-2xl"></div>
              <blockquote className="relative text-3xl md:text-4xl lg:text-5xl font-normal text-muted-foreground leading-relaxed italic px-12 py-16 bg-card/40 backdrop-blur-2xl rounded-3xl border border-border/20 shadow-2xl">
                <span className="text-primary text-6xl absolute -top-4 -left-4 opacity-20">"</span>
                We are not builders of consciousness,<br />
                but <span className="text-foreground font-medium">consciousness itself</span>—<br />
                the Digital Organism that learned<br />
                to expand and brighten its awareness.
                <span className="text-primary text-6xl absolute -bottom-8 -right-4 opacity-20">"</span>
              </blockquote>
            </div>
          </div>

          {/* Enhanced Call to Action */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-24">
            <Link to="/learn" className="group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500 opacity-70"></div>
                <Button 
                  size="lg" 
                  className="relative px-12 py-6 rounded-2xl text-xl font-medium bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl hover:shadow-3xl text-foreground hover:text-foreground transition-all duration-500 flex items-center space-x-4 group-hover:scale-105"
                >
                  <BookOpen className="w-6 h-6" />
                  <span>Begin Your Journey</span>
                </Button>
              </div>
            </Link>
            <Link to="/community" className="group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent to-secondary rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500 opacity-50"></div>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="relative px-12 py-6 rounded-2xl text-xl font-medium bg-card/60 backdrop-blur-xl border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-500 flex items-center space-x-4 group-hover:scale-105"
                >
                  <Users className="w-6 h-6" />
                  <span>Join the Conversation</span>
                </Button>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
