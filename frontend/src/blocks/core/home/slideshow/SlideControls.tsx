import React from 'react';
import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

interface SlideControlsProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
  className?: string;
}

const SlideControls: React.FC<SlideControlsProps> = ({
  isPlaying,
  onTogglePlayback,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <motion.button
        onClick={onTogglePlayback}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-card/50 backdrop-blur-sm border border-border/20 text-muted-foreground hover:text-foreground transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </motion.button>
    </div>
  );
};

export default React.memo(SlideControls);
