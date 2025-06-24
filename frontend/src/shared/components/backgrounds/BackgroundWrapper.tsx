import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '../../theme/theme-provider';
import ThreeNetworkBackground from './ThreeNetworkBackground';
import { COSTCO_COLORS } from '../../theme/theme-provider';

interface BackgroundWrapperProps {
  children: React.ReactNode;
  variant?: 'default' | 'dense' | 'sparse';
  showGradient?: boolean;
}

/**
 * A wrapper component that provides a consistent animated background 
 * for application pages with the option to show gradient orbs.
 */
const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({
  children,
  variant = 'default',
  showGradient = true,
}) => {
  const { mode } = useTheme();
  
  // Map variant to particle intensity
  const getIntensity = () => {
    switch (variant) {
      case 'dense': return 'high';
      case 'sparse': return 'low';
      default: return 'medium';
    }
  };

  return (
    <Box 
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background: mode === 'light' ? '#f5f7fa' : '#121212',
      }}
    >
      {/* Three.js star-field background effect */}
      <ThreeNetworkBackground 
        mode={mode} 
        intensity={getIntensity() as any}
      />
      
      {/* Gradient background orbs - only shown if requested */}
      {showGradient && (
        <>
          <Box 
            sx={{
              position: 'absolute',
              width: '700px',
              height: '700px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${COSTCO_COLORS.red}40 0%, ${COSTCO_COLORS.red} 70%)`,
              top: '-300px',
              right: '-100px',
              zIndex: 0,
              filter: 'blur(100px)',
              opacity: 0.3,
              animation: 'float 15s infinite ease-in-out',
              '@keyframes float': {
                '0%, 100%': {
                  transform: 'translateY(0) scale(1)',
                },
                '50%': {
                  transform: 'translateY(-50px) scale(1.1)',
                },
              },
            }}
          />
          
          <Box 
            sx={{
              position: 'absolute',
              width: '800px',
              height: '800px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${COSTCO_COLORS.red}30 0%, transparent 70%)`,
              bottom: '-400px',
              left: '-200px',
              zIndex: 0,
              filter: 'blur(120px)',
              opacity: 0.3,
              animation: 'float2 18s infinite ease-in-out',
              '@keyframes float2': {
                '0%, 100%': {
                  transform: 'translateY(0) scale(1)',
                },
                '50%': {
                  transform: 'translateY(50px) scale(1.1)',
                },
              },
            }}
          />
        </>
      )}
      
      {/* Content with higher z-index */}
      <Box 
        sx={{ 
          position: 'relative',
          zIndex: 1,
          height: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default BackgroundWrapper; 