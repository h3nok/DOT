import { Crosshair, Funnel, RotateCcw, Waves, Zap } from "lucide-react";

const modelLoopAccent = "oklch(0.76 0.1 84)";

export const EXPERIENCE_LOOP_STEPS = [
  {
    label: "Reality Stream",
    description: "A moment arrives through the Reality Stream.",
    agency: "Received, not commanded",
    color: modelLoopAccent,
    Icon: Waves,
  },
  {
    label: "Painting",
    description:
      "The accumulated Painting filters the Stream: some features pass clearly, some are amplified, and others recede before Little c encounters a decision.",
    agency: "Filters the visible possibilities",
    color: modelLoopAccent,
    Icon: Funnel,
  },
  {
    label: "Intent",
    description:
      "Little c selects one visible pre-Intent draft. That movement from proposal to commitment is Intent.",
    agency: "Selection becomes commitment",
    color: modelLoopAccent,
    Icon: Crosshair,
  },
  {
    label: "Rendering",
    description: "The body carries the action into the Frame.",
    agency: "The body executes lawfully",
    color: modelLoopAccent,
    Icon: Zap,
  },
  {
    label: "Return",
    description:
      "The Reality Frame returns consequence to Little c; the Canvas carries forward what changed.",
    agency: "Returns to Little c",
    color: modelLoopAccent,
    Icon: RotateCcw,
  },
] as const;

export type ExperienceLoopStep = (typeof EXPERIENCE_LOOP_STEPS)[number]["label"];