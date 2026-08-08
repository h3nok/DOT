import { Crosshair, Funnel, RotateCcw, Waves, Zap } from "lucide-react";

const modelLoopAccent = "oklch(0.76 0.1 84)";

export const EXPERIENCE_LOOP_STEPS = [
  {
    label: "Reality Stream",
    orbitTitle: "Moment arrives",
    everydayTitle: "A moment reaches you",
    description: 'Your phone lights up: "Can we talk?"',
    role: "Input",
    color: modelLoopAccent,
    Icon: Waves,
  },
  {
    label: "Painting",
    orbitTitle: "History interprets",
    everydayTitle: "Your history gives it meaning",
    description:
      "Past conflict makes the message feel dangerous before you know what it means.",
    role: "Interpretation",
    color: modelLoopAccent,
    Icon: Funnel,
  },
  {
    label: "Intent",
    orbitTitle: "Commit",
    everydayTitle: "You choose what to do",
    description: "React, wait, or ask what happened. More than one response is possible.",
    role: "Commitment",
    color: modelLoopAccent,
    Icon: Crosshair,
  },
  {
    label: "Rendering",
    orbitTitle: "Body acts",
    everydayTitle: "You act on the choice",
    description:
      'You pause, then write: "Yes. What\'s going on?"',
    role: "Action",
    color: modelLoopAccent,
    Icon: Zap,
  },
  {
    label: "Return",
    orbitTitle: "Consequence",
    everydayTitle: "The result changes what comes next",
    description:
      "Their calm answer softens what you expect the next time your phone lights up.",
    role: "Consequence",
    color: modelLoopAccent,
    Icon: RotateCcw,
  },
] as const;

export type ExperienceLoopStep = (typeof EXPERIENCE_LOOP_STEPS)[number]["label"];
