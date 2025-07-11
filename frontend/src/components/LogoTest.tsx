import React from 'react';
import DotLogo from '../shared/components/ui/DotLogo';

const LogoTest = () => {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-4">DotLogo Component Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Full Logo (Navigation Size)</h3>
          <DotLogo size={32} variant="full" />
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Full Logo (Large)</h3>
          <DotLogo size={64} variant="full" />
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Icon Only</h3>
          <DotLogo size={32} variant="icon" />
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Test Gradient Text</h3>
          <div className="text-4xl font-bold gradient-text font-orbitron">
            D❍T
          </div>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Font Test (Orbitron)</h3>
          <div className="text-4xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
            DOT
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoTest;
