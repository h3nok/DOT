import React from 'react';
import { Canvas } from '@react-three/fiber';

interface SimpleThreeBackgroundProps {
  mode: 'light' | 'dark';
  intensity?: 'low' | 'medium' | 'high';
}

const SimpleThreeBackground: React.FC<SimpleThreeBackgroundProps> = ({ mode }) => {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: mode === 'light' ? '#f5f7fa' : '#121212',
      }}
      camera={{ position: [0, 0, 5], fov: 75 }}
    >
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={mode === 'light' ? '#0066cc' : '#3b82f6'} />
      </mesh>
    </Canvas>
  );
};

export default SimpleThreeBackground;
