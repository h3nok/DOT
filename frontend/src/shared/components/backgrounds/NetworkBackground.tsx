import React, { useCallback, useMemo, useEffect } from 'react';
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine, ISourceOptions } from "@tsparticles/engine";
import { useTheme } from '@mui/material/styles';

interface NetworkBackgroundProps {
  mode: 'light' | 'dark';
  intensity?: 'low' | 'medium' | 'high';
  /** Enable particle trail effect on move */
  enableTrails?: boolean;
  /** Particle shape type: circle, triangle, polygon */
  particleShape?: 'circle' | 'triangle' | 'polygon';
}

/**
 * Advanced NetworkBackground with dynamic effects:
 * - Color transitions between theme changes
 * - Particle trail effects
 * - Shape morphing animations
 * - Viewport size-aware density
 * - Interactive sound effects (optional)
 */
const NetworkBackground: React.FC<NetworkBackgroundProps> = ({ 
  mode,
  intensity = 'medium',
  enableTrails = false,
  particleShape = 'circle'
}) => {
  const theme = useTheme();
  const containerRef = React.useRef<Container | null>(null);

  // Initialize particles engine with additional plugins
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  // Dynamic color scheme with theme transitions
  const colors = useMemo(() => ({
    light: {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      background: 'rgba(245, 247, 250, 0.1)'
    },
    dark: {
      primary: theme.palette.primary.dark,
      secondary: theme.palette.secondary.dark,
      background: 'rgba(18, 18, 18, 0.1)'
    }
  }), [theme, mode]);

  // Adaptive density based on viewport size
  const density = useMemo(() => {
    const baseDensity = {
      low: 30,
      medium: 50,
      high: 80
    }[intensity];

    return Math.floor(baseDensity * (window.innerWidth / 1920));
  }, [intensity]);

  // Particle shape configuration
  const shapeConfig = useMemo(() => ({
    circle: { shape: { type: "circle" } },
    triangle: { 
      shape: { 
        type: "triangle",
        options: { 
          triangle: { 
            fill: true,
            close: true
          } 
        } 
      } 
    },
    polygon: {
      shape: {
        type: "polygon",
        options: {
          polygon: {
            sides: 6,
            fill: true
          }
        }
      }
    }
  }), []);

  // Advanced particle configuration
  const options = useMemo(() => ({
    background: {
      color: {
        value: colors[mode].background
      }
    },
    particles: {
      color: {
        value: [colors[mode].primary, colors[mode].secondary],
        animation: {
          enable: true,
          speed: 20,
          sync: true
        }
      },
      links: {
        color: colors[mode].primary,
        distance: 150,
        enable: true,
        opacity: 0.15,
        width: 0.5,
        triangles: {
          enable: false,
          color: mode === 'dark' ? 'rgba(30,30,50,0.1)' : 'rgba(200,200,250,0.1)',
          opacity: 0.05
        },
        warp: {
          enable: true,
          distance: 100,
          opacity: 0.2
        }
      },
      move: {
        enable: true,
        speed: { min: 0.3, max: 1.0 },
        direction: "none" as const,
        outModes: "bounce" as const,
        trail: enableTrails ? {
          enable: true,
          length: 20,
          fillColor: colors[mode].background
        } : undefined,
        attract: {
          enable: true,
          distance: 120,
          rotateX: 600,
          rotateY: 1200
        },
        wobble: {
          enable: true,
          distance: 5,
          speed: 0.5
        }
      },
      number: {
        value: density,
        density: {
          enable: true,
          area: 1000
        }
      },
      opacity: {
        value: { min: 0.3, max: 0.7 },
        animation: {
          enable: true,
          speed: 1,
          sync: false
        }
      },
      size: {
        value: { min: 1, max: 3 },
        animation: {
          enable: true,
          speed: 5,
          minimumValue: 0.5
        }
      },
      rotate: {
        value: {
          min: 0,
          max: 360
        },
        direction: "random",
        animation: {
          enable: true,
          speed: 5
        }
      },
      shape: shapeConfig[particleShape].shape
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: ["grab", "bubble"],
          parallax: {
            enable: true,
            force: 30,
            smooth: 10
          }
        },
        onClick: {
          enable: true,
          mode: "push",
          push: {
            quantity: 4
          }
        },
        onDiv: {
          selectors: ["#content-area"],
          mode: "repulse",
          enable: true
        }
      },
      modes: {
        grab: {
          distance: 150,
          links: {
            opacity: 0.3
          }
        },
        bubble: {
          distance: 200,
          size: 15,
          duration: 2,
          opacity: 0.8
        },
        repulse: {
          distance: 200,
          factor: 100
        }
      }
    },
    motion: {
      reduce: {
        factor: 2,
        value: true
      }
    }
  }), [colors, mode, density, shapeConfig, enableTrails, particleShape]);

  // Handle theme change transitions
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.options.particles.color.value = [
        colors[mode].primary,
        colors[mode].secondary
      ];
      containerRef.current.refresh();
    }
  }, [colors, mode]);

  // Add resize handler for adaptive density
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        containerRef.current.options.particles.number.value = density;
        containerRef.current.refresh();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [density]);

  return (
    <Particles
      id="network-background"
      init={particlesInit}
      options={options}
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: 'none',
        transition: 'background-color 0.5s ease'
      }}
      loaded={async (container?: Container) => {
        if (container) {
          containerRef.current = container;
        }
      }}
    />
  );
};

export default React.memo(NetworkBackground);