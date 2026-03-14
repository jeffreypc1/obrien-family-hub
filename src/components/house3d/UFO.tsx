'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface UFOProps {
  phase: 'flying-in' | 'beaming' | 'departing' | 'gone';
  progress: number; // 0-1 for each phase
}

export default function UFO({ phase, progress }: UFOProps) {
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;

    if (phase === 'flying-in') {
      // Fly in from top-right, getting closer
      const p = Math.min(progress, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      groupRef.current.position.set(
        15 - eased * 15,
        12 - eased * 5,
        -10 + eased * 10
      );
      groupRef.current.rotation.y = t * 2;
      // Slight wobble
      groupRef.current.position.y += Math.sin(t * 3) * 0.1;
    } else if (phase === 'beaming') {
      // Hover above house
      groupRef.current.position.set(0, 7 + Math.sin(t * 1.5) * 0.2, 0);
      groupRef.current.rotation.y = t * 1.5;

      // Beam grows
      if (beamRef.current) {
        const beamScale = Math.min(progress * 2, 1);
        beamRef.current.scale.set(beamScale, 1, beamScale);
        (beamRef.current.material as THREE.MeshStandardMaterial).opacity = 0.15 + Math.sin(t * 4) * 0.05;
      }
    } else if (phase === 'departing') {
      const p = Math.min(progress, 1);
      const eased = p * p; // ease-in
      groupRef.current.position.set(
        eased * -20,
        7 + eased * 15,
        eased * -15
      );
      groupRef.current.rotation.y = t * 3;

      if (beamRef.current) {
        beamRef.current.scale.set(1 - p, 1, 1 - p);
      }
    }
  });

  if (phase === 'gone') return null;

  return (
    <group ref={groupRef}>
      {/* UFO body - saucer shape */}
      <group>
        {/* Main disc */}
        <mesh castShadow>
          <cylinderGeometry args={[1.2, 1.5, 0.3, 32]} />
          <meshStandardMaterial color="#888" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Top dome */}
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.6, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#AADDFF"
            transparent
            opacity={0.6}
            roughness={0.1}
            metalness={0.3}
            emissive="#4488FF"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Bottom rim with lights */}
        <mesh position={[0, -0.15, 0]}>
          <torusGeometry args={[1.35, 0.08, 8, 32]} />
          <meshStandardMaterial
            color="#66CCFF"
            emissive="#44AAFF"
            emissiveIntensity={2}
            roughness={0.1}
          />
        </mesh>

        {/* Rotating lights on rim */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <pointLight
              key={i}
              position={[Math.cos(angle) * 1.3, -0.2, Math.sin(angle) * 1.3]}
              color={i % 2 === 0 ? '#FF4444' : '#44FF44'}
              intensity={0.5}
              distance={2}
              decay={2}
            />
          );
        })}

        {/* Center bottom light */}
        <pointLight position={[0, -0.5, 0]} color="#88CCFF" intensity={5} distance={15} decay={2} />
      </group>

      {/* Beam cone */}
      {(phase === 'beaming' || phase === 'departing') && (
        <mesh ref={beamRef} position={[0, -4, 0]}>
          <coneGeometry args={[3, 7, 32, 1, true]} />
          <meshStandardMaterial
            color="#88CCFF"
            emissive="#4488FF"
            emissiveIntensity={0.5}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
