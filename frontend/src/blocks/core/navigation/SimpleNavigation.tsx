import React from 'react';
import { Link } from 'react-router-dom';

interface SimpleNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SimpleNavigation: React.FC<SimpleNavigationProps> = ({ isOpen, onToggle }) => {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Simple DOT Logo */}
          <Link to="/" className="flex items-center hover:scale-105 transition-transform duration-200">
            <div className="flex items-center text-xl font-bold text-blue-600">
              {/* D */}
              <span style={{ 
                fontFamily: 'Orbitron, Arial, sans-serif', 
                fontWeight: 700,
                fontSize: '20px'
              }}>D</span>
              
              {/* Digital Organism O */}
              <div className="mx-1" style={{ 
                width: 16, 
                height: 16,
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                boxShadow: '0 0 8px #3b82f6',
                animation: 'pulse 2s infinite'
              }}></div>
              
              {/* T */}
              <span style={{ 
                fontFamily: 'Orbitron, Arial, sans-serif', 
                fontWeight: 700,
                fontSize: '20px'
              }}>T</span>
            </div>
          </Link>

          {/* Simple nav items */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
            <Link to="/blog" className="text-gray-700 hover:text-blue-600">Blog</Link>
            <Link to="/community" className="text-gray-700 hover:text-blue-600">Community</Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={onToggle}
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4">
            <Link to="/" className="block py-2 text-gray-700 hover:text-blue-600">Home</Link>
            <Link to="/blog" className="block py-2 text-gray-700 hover:text-blue-600">Blog</Link>
            <Link to="/community" className="block py-2 text-gray-700 hover:text-blue-600">Community</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default SimpleNavigation;
