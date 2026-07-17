'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 1400;

/**
 * Three brand colors (amber, rust, purple) matching the gradient
 * tokens defined in tailwind.config.ts / globals.css, so the 3D
 * scene visually matches the rest of the design system rather than
 * using arbitrary colors.
 */
const BRAND_COLORS = [
  new THREE.Color('#f2b34e'), // amber
  new THREE.Color('#e0663f'), // rust
  new THREE.Color('#9d6fd6'), // purple
];

function useMousePosition() {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  return mouse;
}

function ParticleField({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 4;

      const color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const t = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.02;

    // Gentle parallax: the whole field drifts slightly toward the
    // mouse position, lerped for a smooth (not snappy) feel.
    pointsRef.current.rotation.x += (mouse.current.y * 0.15 - pointsRef.current.rotation.x) * 0.03;
    pointsRef.current.rotation.y += (mouse.current.x * 0.15 - pointsRef.current.rotation.y) * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.75} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function FloatingWireframe({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.08;
    meshRef.current.rotation.y = t * 0.1;
    meshRef.current.position.y = Math.sin(t * 0.4) * 0.3;

    meshRef.current.rotation.x += mouse.current.y * 0.08;
    meshRef.current.rotation.y += mouse.current.x * 0.08;
  });

  return (
    <mesh ref={meshRef} position={[2.5, 0.5, -3]}>
      <icosahedronGeometry args={[1.4, 1]} />
      <meshBasicMaterial color="#f2b34e" wireframe transparent opacity={0.25} />
    </mesh>
  );
}

function Scene() {
  const mouse = useMousePosition();

  return (
    <>
      <ParticleField mouse={mouse} />
      <FloatingWireframe mouse={mouse} />
    </>
  );
}

export function InteractiveBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const handler = () => setReducedMotion(query.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  if (reducedMotion) {
    // Static gradient fallback - no motion at all for users who have
    // requested reduced motion at the OS level.
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-secondary/40"
      />
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]}>
        <Scene />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}