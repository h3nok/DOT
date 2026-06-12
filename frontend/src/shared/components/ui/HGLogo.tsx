import React from 'react';
import { motion } from 'framer-motion';

interface HGLogoProps {
  size?: number;
  interactive?: boolean;
  className?: string;
}

export const HGLogo: React.FC<HGLogoProps> = ({
  size = 40,
  interactive = true,
  className = ''
}) => {
  return (
    <motion.div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      whileHover={interactive ? { scale: 1.05 } : {}}
      whileTap={interactive ? { scale: 0.95 } : {}}
    >
      {/* Dynamic Aura Glow in background */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent blur-md -z-10"
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Cybernetic Outer Frame */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
      >
        {/* Hexagonal Outer Shield */}
        <polygon
          points="50,5 90,25 90,75 50,95 10,75 10,25"
          className="stroke-foreground/15 dark:stroke-white/10"
          strokeWidth="1.5"
        />

        {/* Inner Notched Hexagon with Active Glow */}
        <motion.polygon
          points="50,10 85,28 85,72 50,90 15,72 15,28"
          className="stroke-primary/40 dark:stroke-primary/30"
          strokeWidth="2.5"
          strokeDasharray="15 8"
          animate={{
            strokeDashoffset: [0, -46],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Core solid reticle circle */}
        <circle
          cx="50"
          cy="50"
          r="26"
          className="fill-card/90 stroke-border/45 dark:fill-black/40"
          strokeWidth="1"
        />
      </svg>

      {/* Monogram Text Centered */}
      <span className="font-mono font-extrabold text-[13px] tracking-wide text-foreground dark:text-white select-none relative z-10">
        HG
      </span>

      {/* Breathing Tech Status LED Dot */}
      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
    </motion.div>
  );
};

export default HGLogo;
