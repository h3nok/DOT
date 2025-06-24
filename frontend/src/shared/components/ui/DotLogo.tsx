import React from 'react';

interface DotLogoProps {
  size?: number;
  className?: string;
  variant?: 'icon' | 'full';
}

const DotLogo: React.FC<DotLogoProps> = ({ size = 32, className = "", variant = "full" }) => {
  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <div
          className="relative flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          {/* Outer emergence rings */}
          <div
            className="absolute inset-0 rounded-full border-2 opacity-30 animate-pulse"
            style={{
              borderColor: 'hsl(var(--primary))',
              borderWidth: `${Math.max(1, size * 0.03)}px`,
              animationDelay: '0s',
              animationDuration: '3s',
            }}
          />
          <div
            className="absolute rounded-full border-2 opacity-50 animate-pulse"
            style={{
              width: size * 0.8,
              height: size * 0.8,
              top: '10%',
              left: '10%',
              borderColor: 'hsl(var(--primary))',
              borderWidth: `${Math.max(1, size * 0.04)}px`,
              animationDelay: '1s',
              animationDuration: '3s',
            }}
          />
          <div
            className="absolute rounded-full border-2 opacity-70"
            style={{
              width: size * 0.6,
              height: size * 0.6,
              top: '20%',
              left: '20%',
              borderColor: 'hsl(var(--primary))',
              borderWidth: `${Math.max(1, size * 0.05)}px`,
            }}
          />
            {/* Central ultra-bright emergence dot */}
          <div
            className="relative z-20 rounded-full animate-pulse"
            style={{
              width: size * 0.28,
              height: size * 0.28,
              background: `
                radial-gradient(circle at 25% 25%, 
                  rgba(255,255,255,1) 0%, 
                  rgba(255,255,255,1) 10%,
                  rgba(255,255,255,0.98) 25%, 
                  rgba(255,255,255,0.9) 35%,
                  hsl(var(--primary)) 60%, 
                  hsl(var(--accent)) 85%,
                  rgba(255,255,255,0.2) 100%
                )
              `,
              boxShadow: `
                0 0 ${size * 0.08}px rgba(255,255,255,1),
                0 0 ${size * 0.15}px rgba(255,255,255,1),
                0 0 ${size * 0.25}px rgba(255,255,255,0.9),
                0 0 ${size * 0.35}px rgba(255,255,255,0.7),
                0 0 ${size * 0.45}px hsl(var(--primary)),
                0 0 ${size * 0.6}px hsl(var(--accent)),
                0 0 ${size * 0.8}px rgba(255,255,255,0.3),
                inset 0 ${size * 0.02}px ${size * 0.06}px rgba(255,255,255,1),
                inset 0 -${size * 0.01}px ${size * 0.03}px rgba(255,255,255,0.8)
              `,
              animationDuration: '1.5s',
              filter: 'brightness(1.2) saturate(1.1)',
            }}
          />
          
          {/* Emergence sparkles */}
          <div
            className="absolute rounded-full opacity-80 animate-ping"
            style={{
              width: size * 0.08,
              height: size * 0.08,
              top: '15%',
              right: '25%',
              background: 'rgba(255,255,255,0.9)',
              animationDelay: '0.5s',
              animationDuration: '2s',
            }}
          />
          <div
            className="absolute rounded-full opacity-60 animate-ping"
            style={{
              width: size * 0.06,
              height: size * 0.06,
              bottom: '20%',
              left: '30%',
              background: 'hsl(var(--primary))',
              animationDelay: '1.2s',
              animationDuration: '2.5s',
            }}
          />
        </div>
      </div>
    );
  }
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        className="relative flex items-center justify-center font-bold gradient-text"
        style={{
          width: size * 0.7,
          height: size,
          fontSize: size * 0.8,
          fontFamily: 'Orbitron, monospace',
        }}
      >
        D
      </div>
      <div
        className="relative mx-2 flex items-center justify-center"
        style={{ width: size * 1.4, height: size * 1.4 }}
      >
        {/* Outer emergence rings */}
        <div
          className="absolute rounded-full border-2 opacity-30 animate-pulse"
          style={{
            width: size * 1.2,
            height: size * 1.2,
            top: '10%',
            left: '10%',
            borderColor: 'hsl(var(--primary))',
            borderWidth: `${Math.max(1, size * 0.03)}px`,
            animationDelay: '0s',
            animationDuration: '4s',
          }}
        />
        <div
          className="absolute rounded-full border-2 opacity-50 animate-pulse"
          style={{
            width: size,
            height: size,
            top: '20%',
            left: '20%',
            borderColor: 'hsl(var(--primary))',
            borderWidth: `${Math.max(1, size * 0.04)}px`,
            animationDelay: '1s',
            animationDuration: '3s',
          }}
        />
        <div
          className="absolute rounded-full border-2 opacity-70"
          style={{
            width: size * 0.7,
            height: size * 0.7,
            top: '35%',
            left: '35%',
            borderColor: 'hsl(var(--primary))',
            borderWidth: `${Math.max(1, size * 0.05)}px`,
          }}
        />
          {/* Central ultra-bright emergence dot */}
        <div
          className="relative z-20 rounded-full animate-pulse"
          style={{
            width: size * 0.32,
            height: size * 0.32,
            top: '34%',
            left: '34%',
            background: `
              radial-gradient(circle at 25% 25%, 
                rgba(255,255,255,1) 0%, 
                rgba(255,255,255,1) 8%,
                rgba(255,255,255,0.98) 20%, 
                rgba(255,255,255,0.92) 30%,
                hsl(var(--primary)) 50%, 
                hsl(var(--accent)) 75%,
                rgba(255,255,255,0.3) 100%
              )
            `,
            boxShadow: `
              0 0 ${size * 0.1}px rgba(255,255,255,1),
              0 0 ${size * 0.18}px rgba(255,255,255,1),
              0 0 ${size * 0.28}px rgba(255,255,255,0.9),
              0 0 ${size * 0.4}px rgba(255,255,255,0.7),
              0 0 ${size * 0.55}px hsl(var(--primary)),
              0 0 ${size * 0.7}px hsl(var(--accent)),
              0 0 ${size * 0.9}px rgba(255,255,255,0.4),
              inset 0 ${size * 0.025}px ${size * 0.08}px rgba(255,255,255,1),
              inset 0 -${size * 0.015}px ${size * 0.04}px rgba(255,255,255,0.9)
            `,
            animationDuration: '1.8s',
            filter: 'brightness(1.3) saturate(1.15)',
          }}
        />
        
        {/* Emergence sparkles around the dot */}
        <div
          className="absolute rounded-full opacity-80 animate-ping"
          style={{
            width: size * 0.08,
            height: size * 0.08,
            top: '20%',
            right: '35%',
            background: 'rgba(255,255,255,0.9)',
            animationDelay: '0.3s',
            animationDuration: '2.5s',
          }}
        />
        <div
          className="absolute rounded-full opacity-70 animate-ping"
          style={{
            width: size * 0.06,
            height: size * 0.06,
            bottom: '25%',
            left: '25%',
            background: 'hsl(var(--primary))',
            animationDelay: '1.5s',
            animationDuration: '3s',
          }}
        />
        <div
          className="absolute rounded-full opacity-60 animate-ping"
          style={{
            width: size * 0.05,
            height: size * 0.05,
            top: '60%',
            right: '20%',
            background: 'hsl(var(--accent))',
            animationDelay: '0.8s',
            animationDuration: '2.2s',
          }}
        />
      </div>
      <div
        className="relative flex items-center justify-center font-bold gradient-text"
        style={{
          width: size * 0.7,
          height: size,
          fontSize: size * 0.8,
          fontFamily: 'Orbitron, monospace',
        }}
      >
        T
      </div>
    </div>
  );
};

export default DotLogo;
