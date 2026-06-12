import React from "react";
import { Sparkles } from "lucide-react";

interface BionicReadingToggleProps {
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export const BionicReadingToggle: React.FC<BionicReadingToggleProps> = ({
  enabled,
  onToggle,
  className = "",
}) => {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/10 hover:bg-secondary/25 border border-border/40 text-[10px] font-mono font-bold transition-all text-muted-foreground hover:text-foreground active:scale-95 ${className}`}
      title="Toggles recursive character bolding on the first 45% of words to optimize gaze fixation."
      type="button"
    >
      <Sparkles
        className={`w-3 h-3 ${enabled ? "text-primary" : "text-neutral-500"}`}
      />
      BIONIC READING: {enabled ? "ON" : "OFF"}
    </button>
  );
};
