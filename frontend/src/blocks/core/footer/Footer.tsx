import React from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../../content/site.config';
import { Github, Linkedin, Twitter, Mail, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/5 dark:border-white/5 bg-[#07070a]/90 backdrop-blur-xl py-12 px-6 relative z-20 select-none overflow-hidden">
      {/* Visual top highlighting line */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 text-left relative z-10">
        {/* Left Column: Brand & Bio */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-center">
              <span className="font-mono font-extrabold text-xs text-primary">HG</span>
            </div>
            <span className="font-sans font-extrabold text-sm tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm font-sans">
            {siteConfig.bio}
          </p>
        </div>

        {/* Middle Column: Technical Verticals */}
        <div className="md:col-span-4 space-y-4">
          <h4 className="font-mono text-[10px] font-bold tracking-widest text-foreground/50 uppercase">
            // ACTIVE VENTURES
          </h4>
          <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono">
            {siteConfig.projects.map((project) => (
              <li key={project.slug}>
                <Link
                  to={`/work/${project.slug}`}
                  className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center space-x-1"
                >
                  <span className="opacity-30">›</span>
                  <span>{project.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Portal Gateway & Connections */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="font-mono text-[10px] font-bold tracking-widest text-foreground/50 uppercase">
            // GATEWAY CONNECTIONS
          </h4>
          <div className="flex space-x-3">
            {siteConfig.socials.github && (
              <a
                href={siteConfig.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-border/40 hover:border-primary/40 bg-background/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300"
                aria-label="GitHub Profile"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            {siteConfig.socials.linkedin && (
              <a
                href={siteConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-border/40 hover:border-primary/40 bg-background/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
            {siteConfig.socials.twitter && (
              <a
                href={siteConfig.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-border/40 hover:border-primary/40 bg-background/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300"
                aria-label="Twitter Profile"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {siteConfig.email && (
              <a
                href={`mailto:${siteConfig.email}`}
                className="w-8 h-8 rounded-lg border border-border/40 hover:border-primary/40 bg-background/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all duration-300"
                aria-label="Email Habte"
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="flex flex-col space-y-1 pt-1.5 text-[10px] font-mono">
            <Link
              to="/ui"
              className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center space-x-1"
            >
              <Cpu className="w-3 h-3 opacity-50" />
              <span>Design System Showcase</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/5 dark:border-white/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[9px] font-mono text-muted-foreground/60">
        <span>© {new Date().getFullYear()} HABTE GHEBRECHRISTOS. ALL RIGHTS RESERVED.</span>
        <div className="flex space-x-4 mt-2 sm:mt-0">
          <Link to="/" className="hover:text-primary transition-colors">COCKPIT</Link>
          <span>•</span>
          <Link to="/about" className="hover:text-primary transition-colors">BIO</Link>
          <span>•</span>
          <Link to="/contact" className="hover:text-primary transition-colors">GATEWAY</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
