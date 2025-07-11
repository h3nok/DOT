import React from 'react';
import DotLogo from '../shared/components/ui/DotLogo';

const LogoDebugger = () => {
  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 p-4 border rounded shadow-lg z-50">
      <h3 className="text-sm font-bold mb-2">Logo Debug</h3>
      <div className="space-y-2">
        <div>
          <span className="text-xs">Full (32px): </span>
          <DotLogo size={32} variant="full" />
        </div>
        <div>
          <span className="text-xs">Icon (32px): </span>
          <DotLogo size={32} variant="icon" />
        </div>
        <div className="text-xs">
          Font Test: <span className="font-orbitron gradient-text font-bold">DOT</span>
        </div>
      </div>
    </div>
  );
};

export default LogoDebugger;
