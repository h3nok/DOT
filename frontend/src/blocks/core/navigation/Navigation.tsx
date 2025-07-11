import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/button';
import ModernThemeToggle from '../../../shared/components/ui/ModernThemeToggle';
import { 
  Home, 
  BookOpen, 
  Users, 
  Brain,
  FileText, 
  Heart,
  Settings,
  Menu,
  X,
  LucideIcon
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavigationProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
    const navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/blog', label: 'Blog', icon: FileText },
    { path: '/community', label: 'Community', icon: Users },
    { path: '/learn', label: 'Learn', icon: BookOpen },
    { path: '/profile', label: 'Profile', icon: Brain },
    { path: '/support', label: 'Support', icon: Heart },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };  return (
    <nav className="bg-card/50 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-1 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center text-xl font-bold">
              {/* D */}
              <span className="text-primary" style={{ 
                fontFamily: 'Orbitron, Arial, sans-serif', 
                fontWeight: 700,
                fontSize: '22px'
              }}>D</span>
              
              {/* Digital Organism O - Animated dot */}
              <div className="mx-1 flex items-center justify-center animate-pulse-slow" style={{ 
                width: 20, 
                height: 20,
                backgroundColor: '#00d4ff', // Bright cyan color that's always visible
                borderRadius: '50%',
                boxShadow: '0 0 12px #00d4ff, 0 0 24px #00d4ff',
                border: '2px solid #ffffff', // White border for contrast
                minWidth: '20px', // Ensure minimum width
                flexShrink: 0 // Prevent shrinking
              }}>
                <div className="animate-pulse" style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%'
                }}></div>
              </div>
              
              {/* T */}
              <span className="text-primary" style={{ 
                fontFamily: 'Orbitron, Arial, sans-serif', 
                fontWeight: 700,
                fontSize: '22px'
              }}>T</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Theme Toggle and Mobile Menu */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle - Desktop */}
            <div className="hidden md:block">
              <ModernThemeToggle />
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={onToggle}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-3 ${
                      isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                    onClick={onToggle}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Theme Toggle - Mobile */}
              <div className="px-4 py-3">
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
