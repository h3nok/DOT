import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/button';
import ModernThemeToggle from '../../../shared/components/ui/ModernThemeToggle';
import { HGLogo } from '../../../shared/components/ui/HGLogo';
import { siteConfig } from '../../../content/site.config';
import {
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';

interface NavigationProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/DOT' || location.pathname === '/DOT/';

  if (isHomePage) return null;

  return (
    <nav className="sticky top-0 z-50 bg-card/85 backdrop-blur-md border-b border-border/40 transition-colors duration-300 select-none">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 group">
            <HGLogo
              size={36}
              interactive={true}
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col text-left">
              <div className="flex items-center space-x-1.5">
                <span className="font-sans font-extrabold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
                  {siteConfig.name}
                </span>
                <span className="text-[7.5px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shadow-sm uppercase tracking-wide">
                  COCKPIT
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[11px] text-muted-foreground font-sans tracking-normal leading-none">
                  {siteConfig.tagline}
                </span>
              </div>
            </div>
          </Link>

          {/* Unified Singular Route Navigation: ONLY Return to Cockpit */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-sans font-semibold tracking-normal text-muted-foreground hover:text-primary hover:bg-primary/5 border border-border/40 hover:border-primary/30 transition-all duration-200 flex items-center space-x-1.5 md:space-x-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Return to Cockpit</span>
              <span className="sm:hidden">Return</span>
            </Link>
          </div>

          {/* Right Side - Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Link
              to="/invite"
              className="hidden sm:inline-flex items-center text-xs font-sans font-semibold tracking-normal text-sky-400 hover:text-sky-500 hover:scale-[1.02] transition-all duration-200 border border-sky-500/20 rounded px-3 py-1.5 bg-sky-500/5 hover:bg-sky-500/10"
            >
              Request invite
            </Link>
            <Link
              to="/ui"
              className="hidden sm:inline-flex items-center text-xs font-sans font-semibold tracking-normal text-muted-foreground hover:text-primary transition-all duration-200 border border-border/40 rounded px-3 py-1.5 bg-background/50 hover:bg-primary/5 hover:border-primary/30"
            >
              Design system
            </Link>
            <div className="hidden md:block">
              <ModernThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden w-10 h-10 p-0 rounded-lg hover:bg-accent/50"
              onClick={onToggle}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/30 animate-fade-in">
            <div className="flex flex-col space-y-3 px-2">
              <Link
                to="/"
                onClick={onToggle}
                className="w-full px-4 py-3 rounded-lg text-sm font-sans font-semibold tracking-normal text-muted-foreground hover:text-primary hover:bg-primary/5 border border-border/40 hover:border-primary/30 transition-all duration-200 flex items-center justify-center space-x-2 bg-card"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Cockpit</span>
              </Link>

              <Link
                to="/invite"
                onClick={onToggle}
                className="w-full px-4 py-3 rounded-lg text-sm font-sans font-semibold tracking-normal text-sky-400 hover:text-sky-500 hover:bg-sky-500/5 border border-sky-500/20 hover:border-sky-500/30 transition-all duration-200 flex items-center justify-center space-x-2 bg-card"
              >
                <span>Request invite</span>
              </Link>

              {/* Theme Toggle - Mobile */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-border/20 mt-2 pt-4">
                <span className="text-xs text-muted-foreground font-mono">Theme Mode</span>
                <ModernThemeToggle />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
