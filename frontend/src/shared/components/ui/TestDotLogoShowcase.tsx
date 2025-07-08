import React from 'react';
import { DotLogoShowcase } from './DotLogoExamples';

// Simple test component to verify the subtitle is visible
export const TestDotLogoShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DotLogoShowcase />
    </div>
  );
};

export default TestDotLogoShowcase;
