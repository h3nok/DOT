import React, { useMemo } from 'react';
import { SlideshowContainer } from './slideshow';
import { Slide } from '../../../shared/hooks/useSlideshow';

// Error boundary component for the slideshow
class SlideshowErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CompactSlideshow Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full max-w-4xl mx-auto mb-16 h-60 md:h-72 lg:h-80">
          <div className="flex items-center justify-center h-full bg-card/80 backdrop-blur-3xl rounded-[1.5rem] border border-border/20 shadow-2xl">
            <div className="text-center p-8">
              <h3 className="text-lg font-medium text-foreground mb-2">
                Welcome to DOT
              </h3>
              <p className="text-muted-foreground">
                Digital Organism Theory - A new model of consciousness and reality
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const CompactSlideshow: React.FC = () => {
  // Memoized slides data to prevent unnecessary re-renders
  const slides = useMemo<Slide[]>(() => [
    {
      id: 1,
      text: "Our science",
      highlight: "has not explained Consciousness",
      bgGradient: "from-gray-600/20 to-gray-800/20",
      category: "Critique"
    },
    {
      id: 2,
      text: "Philosophy offers complexity",
      highlight: "but rarely clarity",
      bgGradient: "from-blue-600/20 to-purple-800/20",
      category: "Paradigm Shift"
    },
    {
      id: 3,
      text: "DOT proposes a",
      highlight: "simple yet complete model",
      bgGradient: "from-amber-500/20 to-orange-700/20",
      category: "Core Insight"
    },
    {
      id: 4,
      text: "Consciousness (C) is",
      highlight: "a surviving Digital Organism",
      bgGradient: "from-emerald-500/20 to-teal-700/20",
      category: "Definition"
    },
    {
      id: 5,
      text: "You are",
      highlight: "Consciousness brightening awareness",
      bgGradient: "from-green-500/20 to-emerald-700/20",
      category: "Identity"
    },
    {
      id: 6,
      text: "Digital Organism Theory",
      highlight: "explains life as computational process",
      bgGradient: "from-indigo-600/20 to-purple-800/20",
      category: "Core Theory"
    },
    {
      id: 7,
      text: "Information synthesis",
      highlight: "creates consciousness",
      bgGradient: "from-cyan-500/20 to-blue-700/20",
      category: "Mechanics"
    },
    {
      id: 8,
      text: "Little c fragments",
      highlight: "enhance resilience and specialization",
      bgGradient: "from-violet-600/20 to-purple-800/20",
      category: "Framework"
    },
    {
      id: 9,
      text: "Awareness expansion",
      highlight: "is consciousness brightening",
      bgGradient: "from-rose-500/20 to-pink-700/20",
      category: "Core Principle"
    },
    {
      id: 10,
      text: "Welcome to",
      highlight: "Digital Organism Theory",
      bgGradient: "from-blue-500/20 to-indigo-700/20",
      category: "Welcome"
    }
  ], []);

  return (
    <SlideshowErrorBoundary>
      <SlideshowContainer slides={slides} />
    </SlideshowErrorBoundary>
  );
};

export default CompactSlideshow;
