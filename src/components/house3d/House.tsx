'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface RoomZone {
  id: string;
  label: string;
  app: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  glowColor: string;
}

export const ROOM_ZONES: RoomZone[] = [
  { id: 'kitchen', label: '🍳 Kitchen', app: '/recipes', position: [2.2, 1.2, 1.2], size: [2, 1.8, 0.1], color: '#FF6B35', glowColor: '#FF8C5A' },
  { id: 'living', label: '📺 Living Room', app: '/german', position: [-2.2, 1.2, 1.2], size: [2, 1.8, 0.1], color: '#4A90D9', glowColor: '#6DB3F8' },
  { id: 'attic', label: '🎤 Music Room', app: 'https://eurovision-family.vercel.app', position: [0, 4.2, 1.2], size: [1.8, 1.2, 0.1], color: '#E91E8C', glowColor: '#FF4DA6' },
  { id: 'garage', label: '✅ Garage', app: '/todos', position: [5, 0.9, 1.2], size: [2, 1.4, 0.1], color: '#10B981', glowColor: '#34D399' },
  { id: 'door', label: '📅 Front Door', app: '/events', position: [0, 0.9, 1.25], size: [1.2, 2, 0.1], color: '#8B5CF6', glowColor: '#A78BFA' },
  { id: 'garden', label: '✈️ Garden', app: '/travel', position: [-4.5, 0.3, 3], size: [2, 1, 0.1], color: '#06B6D4', glowColor: '#22D3EE' },
  { id: 'porch', label: '💡 Porch', app: '/recommendations', position: [0, 2.8, 1.3], size: [1, 0.6, 0.1], color: '#F59E0B', glowColor: '#FBBF24' },
  { id: 'mailbox', label: '📸 Mailbox', app: '/photos', position: [3.5, 0.5, 4], size: [0.6, 1, 0.1], color: '#F43F5E', glowColor: '#FB7185' },
];

export default function House({ onRoomHover }: { onRoomHover: (room: string | null) => void }) {
  const houseRef = useRef<THREE.Group>(null);

  return (
    <group ref={houseRef} position={[0, -1, 0]}>
      {/* ===== FOUNDATION / BASE ===== */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[10, 0.3, 6]} />
        <meshStandardMaterial color="#4A4A4A" roughness={0.9} />
      </mesh>

      {/* ===== MAIN HOUSE BODY ===== */}
      {/* First floor */}
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 2, 5]} />
        <meshStandardMaterial color="#E8DCC8" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Second floor */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 1.7, 5]} />
        <meshStandardMaterial color="#DDD0BC" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* ===== ROOF ===== */}
      <RoofSection position={[0, 4.6, 0]} width={7.8} depth={5.8} height={1.8} />

      {/* ===== CHIMNEY ===== */}
      <mesh position={[2.5, 5.8, -1]} castShadow>
        <boxGeometry args={[0.6, 1.6, 0.6]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      <mesh position={[2.5, 6.65, -1]}>
        <boxGeometry args={[0.75, 0.15, 0.75]} />
        <meshStandardMaterial color="#6B3410" roughness={0.9} />
      </mesh>

      {/* ===== GARAGE (attached right) ===== */}
      <mesh position={[5, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.8, 5]} />
        <meshStandardMaterial color="#D5C8B4" roughness={0.75} />
      </mesh>
      {/* Garage roof */}
      <RoofSection position={[5, 2.3, 0]} width={3.6} depth={5.6} height={1} />
      {/* Garage door */}
      <mesh position={[5, 0.85, 2.51]}>
        <boxGeometry args={[2.4, 1.6, 0.05]} />
        <meshStandardMaterial color="#6B6B6B" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Garage door lines */}
      {[0.4, 0.8, 1.2].map((y) => (
        <mesh key={y} position={[5, y, 2.53]}>
          <boxGeometry args={[2.3, 0.02, 0.02]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      ))}

      {/* ===== FRONT DOOR ===== */}
      <mesh position={[0, 1, 2.51]} castShadow>
        <boxGeometry args={[1, 1.9, 0.08]} />
        <meshStandardMaterial color="#5D2E0C" roughness={0.6} />
      </mesh>
      {/* Door frame */}
      <mesh position={[0, 1, 2.52]}>
        <boxGeometry args={[1.2, 2.1, 0.03]} />
        <meshStandardMaterial color="#3D1E06" roughness={0.8} />
      </mesh>
      {/* Door knob */}
      <mesh position={[0.35, 0.9, 2.57]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#C9A84C" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* ===== PORCH ===== */}
      <mesh position={[0, 0.05, 3]} receiveShadow>
        <boxGeometry args={[4, 0.1, 2]} />
        <meshStandardMaterial color="#8B7355" roughness={0.8} />
      </mesh>
      {/* Porch columns */}
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 1.2, 3.8]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 2.2, 8]} />
          <meshStandardMaterial color="#E0D5C5" roughness={0.6} />
        </mesh>
      ))}
      {/* Porch roof */}
      <mesh position={[0, 2.35, 3.3]}>
        <boxGeometry args={[4.2, 0.12, 2.8]} />
        <meshStandardMaterial color="#7A6B55" roughness={0.7} />
      </mesh>
      {/* Porch light */}
      <PorchLight position={[0, 2.6, 2.55]} />

      {/* ===== WINDOWS ===== */}
      {/* First floor - left */}
      <Window position={[-2.2, 1.2, 2.51]} size={[1.4, 1.2]} glowColor="#4A90D9" />
      {/* First floor - right */}
      <Window position={[2.2, 1.2, 2.51]} size={[1.4, 1.2]} glowColor="#FF8C5A" />
      {/* Second floor - left */}
      <Window position={[-2.2, 3.2, 2.51]} size={[1.2, 1]} glowColor="#E8C55A" />
      {/* Second floor - right */}
      <Window position={[2.2, 3.2, 2.51]} size={[1.2, 1]} glowColor="#7EC8E3" />
      {/* Attic window */}
      <Window position={[0, 4.4, 2.51]} size={[1.2, 0.8]} glowColor="#E91E8C" />

      {/* Side windows */}
      <Window position={[-3.51, 1.3, 0]} size={[1.2, 1.2]} glowColor="#90BE6D" rotation={[0, Math.PI / 2, 0]} />
      <Window position={[3.51, 1.3, 0]} size={[1.2, 1.2]} glowColor="#F9C74F" rotation={[0, Math.PI / 2, 0]} />

      {/* ===== STEPS ===== */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, -0.1 + i * -0.12, 3.8 + i * 0.4]} receiveShadow>
          <boxGeometry args={[1.8 + i * 0.3, 0.12, 0.4]} />
          <meshStandardMaterial color="#888" roughness={0.8} />
        </mesh>
      ))}

      {/* ===== DRIVEWAY ===== */}
      <mesh position={[5, -0.14, 5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 6]} />
        <meshStandardMaterial color="#666" roughness={0.9} />
      </mesh>

      {/* ===== MAILBOX ===== */}
      <mesh position={[3.5, 0.1, 5.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>
      <mesh position={[3.5, 0.65, 5.5]} castShadow>
        <boxGeometry args={[0.4, 0.3, 0.25]} />
        <meshStandardMaterial color="#2255AA" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* ===== TREES ===== */}
      <Tree position={[-5, 0, 2]} scale={1.2} />
      <Tree position={[-6, 0, -1]} scale={0.9} />
      <Tree position={[7.5, 0, -1.5]} scale={1} />
      <Tree position={[7, 0, 2.5]} scale={0.7} />

      {/* ===== BUSHES ===== */}
      {[-1.5, 1.5, -3, 3].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 2.3 + (i % 2) * 0.2]} castShadow>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color="#2D5A1E" roughness={0.9} />
        </mesh>
      ))}

      {/* ===== FENCE ===== */}
      {Array.from({ length: 12 }).map((_, i) => (
        <group key={i} position={[-6.5 + i * 1.2, 0, 6]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.06, 0.7, 0.06]} />
            <meshStandardMaterial color="#F5F0E6" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <coneGeometry args={[0.06, 0.1, 4]} />
            <meshStandardMaterial color="#F5F0E6" roughness={0.8} />
          </mesh>
          {i < 11 && (
            <>
              <mesh position={[0.6, 0.25, 0]}>
                <boxGeometry args={[1.2, 0.06, 0.04]} />
                <meshStandardMaterial color="#F0EBD8" roughness={0.8} />
              </mesh>
              <mesh position={[0.6, 0.5, 0]}>
                <boxGeometry args={[1.2, 0.06, 0.04]} />
                <meshStandardMaterial color="#F0EBD8" roughness={0.8} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {/* ===== INTERACTIVE ROOM ZONES ===== */}
      {ROOM_ZONES.map((room) => (
        <mesh
          key={room.id}
          position={room.position}
          onPointerEnter={() => onRoomHover(room.id)}
          onPointerLeave={() => onRoomHover(null)}
          visible={false}
        >
          <boxGeometry args={room.size} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

function RoofSection({ position, width, depth, height }: { position: [number, number, number]; width: number; depth: number; height: number }) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(0, height);
  shape.lineTo(width / 2, 0);
  shape.lineTo(-width / 2, 0);

  const extrudeSettings = { depth, bevelEnabled: false };

  return (
    <mesh position={[position[0], position[1], position[2] - depth / 2]} castShadow rotation={[Math.PI / 2, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color="#5C3A21" roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

function Window({ position, size, glowColor, rotation }: { position: [number, number, number]; size: [number, number]; glowColor: string; rotation?: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(clock.elapsedTime * 0.5 + position[0]) * 0.3;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[size[0] + 0.15, size[1] + 0.15, 0.06]} />
        <meshStandardMaterial color="#3D3D3D" roughness={0.5} />
      </mesh>
      {/* Glass pane with warm glow */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.6}
          transparent
          opacity={0.85}
          roughness={0.1}
        />
      </mesh>
      {/* Window dividers */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.04, size[1], 0.02]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[size[0], 0.04, 0.02]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {/* Light source */}
      <pointLight ref={lightRef} position={[0, 0, 1]} color={glowColor} intensity={1.5} distance={4} decay={2} />
    </group>
  );
}

function PorchLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 3 + Math.sin(clock.elapsedTime * 2) * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.15, 0.25, 0.15]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#FFF5CC" emissive="#FFCC44" emissiveIntensity={2} />
      </mesh>
      <pointLight ref={lightRef} position={[0, -0.2, 0.3]} color="#FFCC44" intensity={3} distance={6} decay={2} />
    </group>
  );
}

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 1.2, 8]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.9} />
      </mesh>
      {/* Foliage layers */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[0.8, 1.2, 8]} />
        <meshStandardMaterial color="#1A4D1A" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow>
        <coneGeometry args={[0.6, 1, 8]} />
        <meshStandardMaterial color="#1E5C1E" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow>
        <coneGeometry args={[0.4, 0.8, 8]} />
        <meshStandardMaterial color="#226B22" roughness={0.9} />
      </mesh>
    </group>
  );
}
