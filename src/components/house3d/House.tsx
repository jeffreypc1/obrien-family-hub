'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { TextureLoader } from 'three';

interface RoomZone {
  id: string;
  label: string;
  app: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  glowColor: string;
}

// Room click zones positioned relative to the model
// These will need fine-tuning once we see the model in scene
const ROOM_GEOMETRY: Record<string, { position: [number, number, number]; size: [number, number, number]; color: string; glowColor: string }> = {
  kitchen:  { position: [2, 1.5, 1.5], size: [2, 2, 0.5], color: '#FF6B35', glowColor: '#FF8C5A' },
  living:   { position: [-2, 1.5, 1.5], size: [2, 2, 0.5], color: '#4A90D9', glowColor: '#6DB3F8' },
  inlaw:    { position: [-4.5, 1.5, 1.5], size: [2, 2, 0.5], color: '#E91E8C', glowColor: '#FF4DA6' },
  garage:   { position: [4.5, 1, 1.5], size: [2.5, 2, 0.5], color: '#10B981', glowColor: '#34D399' },
  door:     { position: [0, 1.2, 2.5], size: [1.2, 2.5, 0.5], color: '#8B5CF6', glowColor: '#A78BFA' },
  garden:   { position: [-5, 0.5, 4], size: [2.5, 1.5, 2], color: '#06B6D4', glowColor: '#22D3EE' },
  porch:    { position: [0, 2.5, 3], size: [2, 1, 1], color: '#F59E0B', glowColor: '#FBBF24' },
  mailbox:  { position: [4, 0.5, 5], size: [1, 1.2, 1], color: '#F43F5E', glowColor: '#FB7185' },
};

const DEFAULT_MAPPINGS: Array<{ id: string; label: string; app: string }> = [
  { id: 'kitchen', label: '🍳 Kitchen', app: '/recipes' },
  { id: 'living', label: '📺 Living Room', app: '/german' },
  { id: 'inlaw', label: '🎤 In-Law Suite', app: 'https://eurovision-family.vercel.app' },
  { id: 'garage', label: '✅ Garage', app: '/todos' },
  { id: 'door', label: '📅 Front Door', app: '/events' },
  { id: 'garden', label: '✈️ Garden', app: '/travel' },
  { id: 'porch', label: '💡 Porch', app: '/recommendations' },
  { id: 'mailbox', label: '📸 Mailbox', app: '/photos' },
];

export function buildRoomZones(customMappings?: Array<{ id: string; label: string; app: string }> | null): RoomZone[] {
  const mappings = customMappings || DEFAULT_MAPPINGS;
  return mappings.map((m) => {
    const geo = ROOM_GEOMETRY[m.id] || ROOM_GEOMETRY.door;
    return { ...geo, id: m.id, label: m.label, app: m.app };
  });
}

export default function House({ onRoomHover, onRoomClick, roomZones }: {
  onRoomHover: (room: string | null) => void;
  onRoomClick: (room: string) => void;
  roomZones: RoomZone[];
}) {
  const { scene } = useGLTF('/american_house.glb');
  const grassTex = useLoader(TextureLoader, '/tex-grass.jpg');
  const grassNor = useLoader(TextureLoader, '/tex-grass-nor.jpg');

  useMemo(() => {
    [grassTex, grassNor].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(30, 30);
    });
  }, [grassTex, grassNor]);

  // Configure model materials for nighttime
  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Make windows glow
        if (mesh.name && (mesh.name.includes('Window') || mesh.name.includes('Curtain'))) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.isMeshStandardMaterial) {
            mat.emissive = new THREE.Color('#FFCC66');
            mat.emissiveIntensity = 0.3;
          }
        }
      }
    });
  }, [scene]);

  return (
    <group position={[0, -1, 0]}>
      {/* Textured ground */}
      <mesh position={[0, -0.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial map={grassTex} normalMap={grassNor} normalScale={new THREE.Vector2(0.8, 0.8)} roughness={0.95} />
      </mesh>

      {/* The 3D house model */}
      <primitive object={scene} scale={1} position={[0, 0, 0]} />

      {/* Warm interior lights shining through windows */}
      <pointLight position={[-2, 2, 0]} color="#FFCC66" intensity={2} distance={6} decay={2} />
      <pointLight position={[2, 2, 0]} color="#FF9944" intensity={2} distance={6} decay={2} />
      <pointLight position={[0, 2, 0]} color="#FFE088" intensity={1.5} distance={5} decay={2} />
      <pointLight position={[4.5, 1.5, 0]} color="#88CCAA" intensity={1} distance={4} decay={2} />

      {/* Porch / exterior lights */}
      <pointLight position={[0, 3, 3]} color="#FFCC55" intensity={3} distance={8} decay={2} />
      <pointLight position={[-3, 2, 3]} color="#FFDD77" intensity={1.5} distance={5} decay={2} />
      <pointLight position={[3, 2, 3]} color="#FFDD77" intensity={1.5} distance={5} decay={2} />


      {/* Interactive room zones */}
      {roomZones.map((room) => (
        <mesh key={room.id} position={room.position}
          onPointerEnter={(e) => { e.stopPropagation(); onRoomHover(room.id); document.body.style.cursor = 'pointer'; }}
          onPointerLeave={() => { onRoomHover(null); document.body.style.cursor = 'default'; }}
          onClick={(e) => { e.stopPropagation(); onRoomClick(room.id); }}>
          <boxGeometry args={room.size} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

// Preload the model
useGLTF.preload('/american_house.glb');
