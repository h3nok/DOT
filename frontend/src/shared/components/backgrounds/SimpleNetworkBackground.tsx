import React from 'react';

interface SimpleNetworkBackgroundProps {
  mode: 'light' | 'dark';
  intensity?: 'low' | 'medium' | 'high';
}

const SimpleNetworkBackground: React.FC<SimpleNetworkBackgroundProps> = ({
  mode,
  intensity = 'medium'
}) => {
  const particleCount = {
    low: 30,
    medium: 50,
    high: 80
  }[intensity];
  // Create highly visible particle elements
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const size = Math.random() * 12 + 6; // Even larger particles
    const animationDuration = Math.random() * 8 + 3; // Faster animation
    const delay = Math.random() * 5;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    return (
      <div
        key={i}
        className={`absolute rounded-full ${
          mode === 'dark' 
            ? 'bg-blue-400' 
            : 'bg-blue-600'
        }`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          left: `${x}%`,
          top: `${y}%`,
          opacity: 0.8, // More visible
          boxShadow: `0 0 30px currentColor, 0 0 60px currentColor`, // Stronger glow
          animation: `float ${animationDuration}s ease-in-out infinite alternate`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">      {/* Highly visible background gradient */}
      <div 
        className={`absolute inset-0 ${
          mode === 'dark' 
            ? 'bg-gradient-to-br from-blue-900/30 via-blue-800/10 to-indigo-900/30' 
            : 'bg-gradient-to-br from-blue-200/40 via-blue-100/20 to-indigo-200/40'
        }`}
      />
      
      {/* Floating particles */}
      <div className="relative w-full h-full">
        {particles}
      </div>
      
      {/* Pulsing overlay */}
      <div 
        className={`absolute inset-0 ${
          mode === 'dark' ? 'bg-blue-500/5' : 'bg-blue-600/5'
        }`}
        style={{
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />
      
      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-20px) translateX(10px); opacity: 0.4; }
        }      `}</style>
    </div>
  );
};

export default React.memo(SimpleNetworkBackground);
