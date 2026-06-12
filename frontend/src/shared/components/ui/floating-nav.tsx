import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  User,
  BookOpen,
  MessageSquare,
  Layers,
  Heart,
  Sparkles
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: Home, color: 'var(--primary)' },
  { label: 'About', path: '/about', icon: User, color: 'var(--secondary)' },
  { label: 'Blog', path: '/blog', icon: BookOpen, color: 'var(--primary)' },
  { label: 'Contact', path: '/contact', icon: MessageSquare, color: 'var(--accent)' },
  { label: 'Integrations', path: '/integration', icon: Layers, color: 'var(--secondary)' },
  { label: 'Support', path: '/support', icon: Heart, color: 'var(--destructive)' },
];

export const FloatingNav: React.FC = () => {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Self-hide on homepage since it's the central graphic cockpit menu router
  if (location.pathname === '/') {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-auto relative flex items-center gap-1.5 rounded-full border border-white/10 dark:border-white/5 bg-background/50 dark:bg-black/40 backdrop-blur-xl px-4 py-2.5 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.3),_inset_0_1px_1px_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-gradient-to-r before:from-primary/5 before:to-accent/5"
      >
        {/* Sleek bottom border active line indicator */}
        <div className="absolute inset-x-8 -bottom-[1px] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative p-2.5 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-300 flex items-center justify-center group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Dynamic glass bubble backdrop on hover */}
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.span
                    layoutId="floating-nav-bubble"
                    className="absolute inset-0 bg-white/[0.08] dark:bg-white/[0.04] border border-white/5 rounded-full -z-10"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </AnimatePresence>

              {/* Glowing ring active state bubble */}
              {isActive && (
                <motion.span
                  layoutId="floating-nav-active"
                  className="absolute inset-0 bg-gradient-to-tr from-primary/15 to-secondary/15 border border-primary/20 dark:border-primary/10 rounded-full -z-20 shadow-[0_0_15px_color-mix(in_oklch,var(--primary)_15%,transparent)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon Container with Micro-Tilt Spring Expansion */}
              <motion.div
                animate={{
                  scale: hoveredIndex === index ? 1.15 : isActive ? 1.05 : 1,
                  y: hoveredIndex === index ? -3 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="relative z-10"
              >
                <Icon className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  isActive ? "text-primary drop-shadow-[0_0_8px_color-mix(in_oklch,var(--primary)_40%,transparent)]" : "text-muted-foreground group-hover:text-foreground"
                )} />

                {/* Subtle active center dot */}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                )}
              </motion.div>

              {/* Tooltip Monospace Badge */}
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: -45, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md border border-white/10 bg-black/85 backdrop-blur-md text-[10px] font-mono text-white tracking-widest uppercase shadow-xl select-none pointer-events-none whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-accent animate-pulse" />
                      {item.label}
                    </div>
                    {/* Tooltip triangle tail */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-t-4 border-transparent border-t-black/85" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
};

export default FloatingNav;
