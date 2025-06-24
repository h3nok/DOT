import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@mui/material/styles';

interface Props {
  mode: 'light' | 'dark';
  intensity?: 'low' | 'medium' | 'high';
}

/**
 * A responsive, cursor-reactive "neural network" backdrop implemented with Three.js.
 *
 * 1. Renders N moving points.
 * 2. Draws dynamic lines between points that are close to each other **or** the mouse.
 * 3. On click, emits a burst animation by slightly randomising nearby points.
 */
const NetworkScene: React.FC<{ color: string; count: number }> = ({ color, count }) => {
  // ----- geometry -----------------------------------------------------------
  const pointsRef = useRef<THREE.Points>(null!);
  const velocities = useMemo(() => {
    // random velocities per point
    const v = new Float32Array(count * 3);
    for (let i = 0; i < v.length; i++) v[i] = (Math.random() - 0.5) * 0.02;
    return v;
  }, [count]);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] = (Math.random() - 0.5) * 60;
      arr[i + 1] = (Math.random() - 0.5) * 60;
      arr[i + 2] = (Math.random() - 0.5) * 60;
    }
    return arr;
  }, [count]);

  // ----- dynamic lines ------------------------------------------------------
  const lineRef = useRef<THREE.LineSegments>(null!);
  const { camera, pointer, viewport, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouseWorld = useMemo(() => new THREE.Vector3(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const tempA = new THREE.Vector3();
  const tempB = new THREE.Vector3();

  // click burst
  React.useEffect(() => {
    function handleClick() {
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(plane, mouseWorld);
      // push nearby points slightly outward
      for (let i = 0; i < count * 3; i += 3) {
        tempA.set(positions[i], positions[i + 1], positions[i + 2]);
        const dist = tempA.distanceTo(mouseWorld);
        if (dist < 10) {
          const dir = tempA.clone().sub(mouseWorld).normalize();
          positions[i] += dir.x * 5;
          positions[i + 1] += dir.y * 5;
          positions[i + 2] += dir.z * 5;
        }
      }
    }
    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [camera, pointer, plane, positions, count, gl, raycaster, mouseWorld]);

  // ----- frame loop ---------------------------------------------------------
  useFrame(() => {
    // update positions
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] += velocities[i];
      positions[i + 1] += velocities[i + 1];
      positions[i + 2] += velocities[i + 2];
      // simple bounds
      if (positions[i] > 80 || positions[i] < -80) velocities[i] *= -1;
      if (positions[i + 1] > 80 || positions[i + 1] < -80) velocities[i + 1] *= -1;
      if (positions[i + 2] > 80 || positions[i + 2] < -80) velocities[i + 2] *= -1;
    }
    const geom = pointsRef.current.geometry as THREE.BufferGeometry;
    geom.attributes.position.needsUpdate = true;

    // dynamic lines
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(plane, mouseWorld);
    const verts: number[] = [];
    const maxConn = 300;
    let added = 0;
    for (let i = 0; i < count * 3 && added < maxConn; i += 3) {
      tempA.set(positions[i], positions[i + 1], positions[i + 2]);
      const distToMouse = tempA.distanceTo(mouseWorld);
      const nearMouse = distToMouse < 12;
      if (nearMouse) {
        for (let j = i + 3; j < count * 3 && added < maxConn; j += 9) {
          tempB.set(positions[j], positions[j + 1], positions[j + 2]);
          const dist = tempA.distanceTo(tempB);
          if (dist < 14) {
            verts.push(tempA.x, tempA.y, tempA.z, tempB.x, tempB.y, tempB.z);
            added++;
          }
        }
      }
    }
    const lGeom = lineRef.current.geometry as THREE.BufferGeometry;
    lGeom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    lGeom.setDrawRange(0, verts.length / 3);
    lGeom.computeBoundingSphere();
  });

  return (
    <>
      <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial color={color} size={0.45} sizeAttenuation depthWrite={false} transparent opacity={0.9} />
      </Points>
      <lineSegments ref={lineRef} frustumCulled={false}>
        <bufferGeometry />
        <lineBasicMaterial color={color} transparent opacity={0.35} linewidth={1} />
      </lineSegments>
    </>
  );
};

const InteractiveNetworkBackground: React.FC<Props> = ({ mode, intensity = 'medium' }) => {
  const theme = useTheme();
  const color = mode === 'light' ? theme.palette.primary.main : theme.palette.primary.light;
  const count = { low: 400, medium: 800, high: 1400 }[intensity];

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
        background: 'transparent',
      }}
      camera={{ position: [0, 0, 65], fov: 70 }}
      gl={{ antialias: true, alpha: true }}
    >
      <NetworkScene color={color} count={count} />
    </Canvas>
  );
};

export default React.memo(InteractiveNetworkBackground);
