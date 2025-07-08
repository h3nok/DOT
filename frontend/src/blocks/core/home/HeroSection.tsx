import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/button';
import DigitalOrganismsLogo from '../../../shared/components/ui/DigitalOrganismsLogo';
import CompactSlideshow from './CompactSlideshow';
import { ArrowRight, Users, Sparkles } from 'lucide-react';

const HeroSection: React.FC = () => {
  
  return (
    <div className="relative overflow-hidden min-h-screen flex items-center">
      {/* Expansive Universe Background */}
      <div className="universe-background">
        <div className="parallax-bg">
          <div className="void-depth"></div>
          <div className="cosmic-depth"></div>
          <div className="atmosphere-layer"></div>
          <div className="nebula-layer"></div>
          <div className="cosmic-dust"></div>
          <div className="galaxy-layer"></div>
          <div className="star-layer-2"></div>
          <div className="star-layer-1"></div>
          <div className="star-field"></div>
          {/* Shooting stars */}
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
        </div>
      </div>

      {/* Simplified background elements */}
      <div className="absolute inset-0 z-1">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/2 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/2 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-6xl mx-auto">
          
          {/* Main Concept Introduction */}
          <div className="text-center mb-20">
            <div className="flex justify-center mb-16">
              <DigitalOrganismsLogo size="xl" variant="horizontal" />
            </div>
            
            {/* Subtitle */}
            <div className="mb-12">
              <p className="text-2xl md:text-3xl text-muted-foreground font-light leading-relaxed">
                The Application and Development of a Big TOE
              </p>
            </div>
            
            {/* Compact slideshow replacing the subtitle */}
            <div className="my-20">
              <CompactSlideshow />
            </div>
            
            <div className="max-w-5xl mx-auto mb-16 space-y-8">
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
          {/* Enhanced Call to Action */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-24">
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

          {/* Wordmark Logo Showcase */}
          <div className="mb-24">
            <div className="text-center mb-8">
              <h2 className="text-sm font-medium text-muted-foreground/70 tracking-[0.3em] uppercase mb-8">
                Wordmark
              </h2>
              <div className="flex justify-center mb-8">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-700 opacity-60"></div>
                  <div className="relative px-8 py-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/30 shadow-xl">
                    <DigitalOrganismsLogo size="md" variant="horizontal" animated={true} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground/80 max-w-md mx-auto">
                The blue dot represents the singular emergence of consciousness from the External Environment
              </p>
            </div>
          </div>

          {/* Subtle scroll indicator */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/10 rounded-full blur-sm animate-pulse"></div>
              <div className="relative w-8 h-12 border-2 border-muted-foreground/30 rounded-full flex justify-center">
                <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-bounce"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
