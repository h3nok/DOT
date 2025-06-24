import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface NetworkBackgroundProps {
  mode: 'light' | 'dark';
  /**
   * Controls particle count.
   * - low: ~300
   * - medium: ~600 (default)
   * - high: ~1200
   */
  intensity?: 'low' | 'medium' | 'high';
}

/**
 * Light-weight Three.js replacement for the old tsparticles background.
 * Renders a rotating star-field using Points + PointMaterial.
 */
const StarField: React.FC<{ color: string; positions: Float32Array }> = ({ color, positions }) => {
  const pointsRef = useRef<THREE.Points>(null!);

  // Slow rotation animation + slight wobble from mouse influence
  useFrame(({ pointer }, delta) => {
    if (pointsRef.current) {
      // base rotation
      pointsRef.current.rotation.y += delta * 0.05;
      // wobble based on pointer position
      pointsRef.current.rotation.x = pointer.y * 0.3;
      pointsRef.current.rotation.z = pointer.x * 0.3;
    }
  });

  return (
    <Points positions={positions} ref={pointsRef} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
};

/**
 * Dynamically draws lines between nearby points around the mouse pointer
 */
const DynamicConnections: React.FC<{ positions: Float32Array; color: string }> = ({ positions, color }) => {
  const lineRef = useRef<THREE.LineSegments>(null!);
  const { camera, pointer } = useThree();
  const maxConnections = 200;
  const connectionDistance = 8; // world units
  const tempVec = new THREE.Vector3();
  const mouseWorld = new THREE.Vector3();
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const raycaster = new THREE.Raycaster();

  useFrame(() => {
    // project pointer to world coordinates at z=0 plane
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(planeZ, mouseWorld);

    const verts: number[] = [];
    let added = 0;
    for (let i = 0; i < positions.length && added < maxConnections; i += 3) {
      tempVec.set(positions[i], positions[i + 1], positions[i + 2]);
      if (tempVec.distanceTo(mouseWorld) < connectionDistance) {
        // connect to a few nearby points
        for (let j = i + 3; j < positions.length && added < maxConnections; j += 15) {
          const other = new THREE.Vector3(positions[j], positions[j + 1], positions[j + 2]);
          if (tempVec.distanceTo(other) < connectionDistance) {
            verts.push(tempVec.x, tempVec.y, tempVec.z, other.x, other.y, other.z);
            added++;
          }
        }
      }
    }
    const lineGeom = lineRef.current.geometry as THREE.BufferGeometry;
    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    lineGeom.setDrawRange(0, verts.length / 3);
    lineGeom.computeBoundingSphere();
  });

  return (
    <lineSegments ref={lineRef} frustumCulled={false}>
      <bufferGeometry />
      <lineBasicMaterial color={color} transparent opacity={0.35} />
    </lineSegments>
  );
};

const ThreeNetworkBackground: React.FC<NetworkBackgroundProps> = ({
  mode,
  intensity = 'medium',
}) => {
  const primary = mode === 'light' ? '#0066cc' : '#3b82f6'; // Blue colors for light/dark
  const count = {
    low: 300,
    medium: 600,
    high: 1200,
  }[intensity];

  // Generate positions ONCE and share for both components
  const starPositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      arr[i] = (Math.random() - 0.5) * 80;
      arr[i + 1] = (Math.random() - 0.5) * 80;
      arr[i + 2] = (Math.random() - 0.5) * 80;
    }
    return arr;
  }, [count]);

  return (
    <Canvas
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        // background: 'red', // DEBUG: set to red for visibility
        transition: 'background-color 0.5s ease',
      }}
      camera={{ position: [0, 0, 50], fov: 75 }}
      gl={{ antialias: true, alpha: true }}
    >
      <StarField color={primary} positions={starPositions} />
      <DynamicConnections positions={starPositions} color={primary} />
    </Canvas>
  );
};

export default React.memo(ThreeNetworkBackground);