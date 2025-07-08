import React, { useState, useEffect } from 'react';
import DotLogo from './DotLogo';
import { LogoProvider } from '../../contexts/LogoContext';
import { withFullLogoOptimization } from './LogoOptimization';

// Example 1: Basic Usage
export const BasicLogoExample: React.FC = () => {
  return (
    <div className="flex gap-4 items-center">
      <DotLogo size={32} />
      <DotLogo size={48} variant="icon" />
      <DotLogo size={64} variant="organism" />
    </div>
  );
};

// Example 2: Interactive Logo with Callbacks
export const InteractiveLogoExample: React.FC = () => {
  const [interactionCount, setInteractionCount] = useState(0);
  const [lastInteraction, setLastInteraction] = useState<string>('');

  return (
    <div className="flex flex-col items-center gap-4">
      <DotLogo 
        size={64}
        interactive={true}
        onHover={() => {
          setLastInteraction('hover');
          setInteractionCount(prev => prev + 1);
        }}
        onClick={() => {
          setLastInteraction('click');
          setInteractionCount(prev => prev + 1);
        }}
        aria-label="Interactive DOT Logo"
        testId="interactive-logo"
      />
      <div className="text-sm text-gray-600">
        <p>Interactions: {interactionCount}</p>
        <p>Last: {lastInteraction}</p>
      </div>
    </div>
  );
};

// Example 3: Logo with Context Provider
export const ContextualLogoExample: React.FC = () => {
  return (
    <LogoProvider>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <DotLogo size={32} priority="high" />
          <DotLogo size={32} variant="icon" />
          <DotLogo size={32} variant="organism" />
        </div>
        <LogoControlPanel />
      </div>
    </LogoProvider>
  );
};

// Control panel for logo context
const LogoControlPanel: React.FC = () => {
  // This would use the actual logo context when available
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'balanced' | 'low'>('balanced');

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Logo Controls</h3>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={animationEnabled}
            onChange={(e) => setAnimationEnabled(e.target.checked)}
          />
          Enable Animations
        </label>
        <label className="flex items-center gap-2">
          Performance Mode:
          <select 
            value={performanceMode}
            onChange={(e) => setPerformanceMode(e.target.value as any)}
            className="border rounded px-2 py-1"
          >
            <option value="high">High</option>
            <option value="balanced">Balanced</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>
    </div>
  );
};

// Example 4: Performance Monitoring Demo
export const PerformanceMonitoringExample: React.FC = () => {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;

      if (delta >= 1000) {
        setFps(Math.round((frameCount * 1000) / delta));
        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, i) => (
          <DotLogo 
            key={i}
            size={32}
            variant={i % 3 === 0 ? 'full' : i % 3 === 1 ? 'icon' : 'organism'}
            interactive={true}
            priority={i < 4 ? 'high' : 'low'}
          />
        ))}
      </div>
      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
        <p>FPS: {fps}</p>
        <p>Logos: 12 rendered with different variants and priorities</p>
      </div>
    </div>
  );
};

// Example 5: Error Handling Demo
export const ErrorHandlingExample: React.FC = () => {
  const [shouldError, setShouldError] = useState(false);

  const ErrorProneComponent: React.FC = () => {
    if (shouldError) {
      throw new Error('Simulated logo error');
    }
    return <DotLogo size={48} />;
  };

  const OptimizedErrorComponent = withFullLogoOptimization(ErrorProneComponent);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <OptimizedErrorComponent />
        <button 
          onClick={() => setShouldError(!shouldError)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          {shouldError ? 'Fix Error' : 'Trigger Error'}
        </button>
      </div>
      <p className="text-sm text-gray-600">
        This example shows how the optimized logo handles errors gracefully with fallback UI.
      </p>
    </div>
  );
};

// Example 6: Responsive Logo Sizes
export const ResponsiveLogoExample: React.FC = () => {
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg'>('md');

  const getLogoSize = () => {
    switch (screenSize) {
      case 'sm': return 24;
      case 'md': return 32;
      case 'lg': return 48;
      default: return 32;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(['sm', 'md', 'lg'] as const).map(size => (
          <button
            key={size}
            onClick={() => setScreenSize(size)}
            className={`px-3 py-1 rounded ${
              screenSize === size 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {size.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex gap-4 items-center">
        <DotLogo size={getLogoSize()} />
        <DotLogo size={getLogoSize()} variant="icon" />
        <DotLogo size={getLogoSize()} variant="organism" />
      </div>
    </div>
  );
};

// Example 7: Accessibility Features Demo
export const AccessibilityExample: React.FC = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
          />
          Reduce Motion
        </label>
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={highContrast}
            onChange={(e) => setHighContrast(e.target.checked)}
          />
          High Contrast
        </label>
      </div>
      <div className={`flex gap-4 ${highContrast ? 'high-contrast' : ''}`}>
        <DotLogo 
          size={48}
          interactive={true}
          aria-label="Main application logo"
          testId="accessibility-logo"
        />
        <DotLogo 
          size={48}
          variant="icon"
          aria-label="Icon variant logo"
        />
        <DotLogo 
          size={48}
          variant="organism"
          aria-label="Digital organism representation"
        />
      </div>
    </div>
  );
};

// Main example component that showcases all features
export const DotLogoShowcase: React.FC = () => {
  const [activeExample, setActiveExample] = useState('basic');

  const examples = {
    basic: BasicLogoExample,
    interactive: InteractiveLogoExample,
    contextual: ContextualLogoExample,
    performance: PerformanceMonitoringExample,
    error: ErrorHandlingExample,
    responsive: ResponsiveLogoExample,
    accessibility: AccessibilityExample,
  };

  const ExampleComponent = examples[activeExample as keyof typeof examples];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">DotLogo Optimization Showcase</h1>
      <p className="text-lg text-gray-600 mb-6">The Application and Development of a Big TOE</p>
      
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.keys(examples).map(key => (
          <button
            key={key}
            onClick={() => setActiveExample(key)}
            className={`px-4 py-2 rounded capitalize ${
              activeExample === key 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </div>

      <div className="border rounded-lg p-6 bg-white">
        <ExampleComponent />
      </div>

      <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded">
        <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>State management with context and performance monitoring</li>
          <li>Optimized rendering with intersection observers and memoization</li>
          <li>Accessibility features including reduced motion and ARIA labels</li>
          <li>Error boundaries and graceful degradation</li>
          <li>Interactive variants with callback handling</li>
          <li>Responsive design and adaptive performance</li>
          <li>Performance monitoring and automatic optimization</li>
        </ul>
      </div>
    </div>
  );
};

export default DotLogoShowcase;
