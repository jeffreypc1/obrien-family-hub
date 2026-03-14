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
  { id: 'kitchen', label: '🍳 Kitchen', app: '/recipes', position: [2.2, 1.2, 2.6], size: [1.8, 1.5, 0.3], color: '#FF6B35', glowColor: '#FF8C5A' },
  { id: 'living', label: '📺 Living Room', app: '/german', position: [-2.2, 1.2, 2.6], size: [1.8, 1.5, 0.3], color: '#4A90D9', glowColor: '#6DB3F8' },
  { id: 'attic', label: '🎤 Music Room', app: 'https://eurovision-family.vercel.app', position: [0, 4.2, 2.6], size: [1.5, 1, 0.3], color: '#E91E8C', glowColor: '#FF4DA6' },
  { id: 'garage', label: '✅ Garage', app: '/todos', position: [5, 0.9, 2.6], size: [2.2, 1.5, 0.3], color: '#10B981', glowColor: '#34D399' },
  { id: 'door', label: '📅 Front Door', app: '/events', position: [0, 0.9, 2.7], size: [1, 2, 0.3], color: '#8B5CF6', glowColor: '#A78BFA' },
  { id: 'garden', label: '✈️ Garden', app: '/travel', position: [-5, 0.2, 4], size: [2.5, 1.5, 2], color: '#06B6D4', glowColor: '#22D3EE' },
  { id: 'porch', label: '💡 Porch Light', app: '/recommendations', position: [0, 2.5, 3.5], size: [1.5, 1, 1], color: '#F59E0B', glowColor: '#FBBF24' },
  { id: 'mailbox', label: '📸 Photos', app: '/photos', position: [3.5, 0.4, 5.5], size: [1, 1.2, 1], color: '#F43F5E', glowColor: '#FB7185' },
];

export default function House({ onRoomHover, onRoomClick }: {
  onRoomHover: (room: string | null) => void;
  onRoomClick: (room: string) => void;
}) {
  return (
    <group position={[0, -1, 0]}>
      {/* ===== FOUNDATION ===== */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[10, 0.3, 6]} />
        <meshStandardMaterial color="#5A5A5A" roughness={0.9} />
      </mesh>

      {/* ===== MAIN HOUSE ===== */}
      {/* First floor walls */}
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 2, 5]} />
        <meshStandardMaterial color="#D4C4A8" roughness={0.75} />
      </mesh>

      {/* Second floor */}
      <mesh position={[0, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 1.7, 5]} />
        <meshStandardMaterial color="#C8B898" roughness={0.75} />
      </mesh>

      {/* Horizontal trim between floors */}
      <mesh position={[0, 2.1, 2.52]}>
        <boxGeometry args={[7.1, 0.08, 0.08]} />
        <meshStandardMaterial color="#F5F0E0" roughness={0.6} />
      </mesh>

      {/* ===== TRADITIONAL ROOF WITH SHINGLES ===== */}
      <RoofSection position={[0, 4.6, 0]} width={7.8} depth={5.8} height={1.8} />
      {/* Roof trim / fascia */}
      <mesh position={[0, 3.85, 2.95]}>
        <boxGeometry args={[7.85, 0.12, 0.12]} />
        <meshStandardMaterial color="#F5F0E0" roughness={0.6} />
      </mesh>

      {/* ===== CHIMNEY ===== */}
      <mesh position={[2.5, 5.8, -1]} castShadow>
        <boxGeometry args={[0.7, 1.8, 0.7]} />
        <meshStandardMaterial color="#8B4513" roughness={0.85} />
      </mesh>
      {/* Chimney cap */}
      <mesh position={[2.5, 6.75, -1]}>
        <boxGeometry args={[0.85, 0.12, 0.85]} />
        <meshStandardMaterial color="#6B3410" roughness={0.9} />
      </mesh>

      {/* ===== GARAGE ===== */}
      <mesh position={[5, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.8, 5]} />
        <meshStandardMaterial color="#C8B898" roughness={0.8} />
      </mesh>
      <RoofSection position={[5, 2.3, 0]} width={3.6} depth={5.6} height={1} />
      {/* Garage door */}
      <mesh position={[5, 0.85, 2.52]}>
        <boxGeometry args={[2.4, 1.6, 0.06]} />
        <meshStandardMaterial color="#7A7A7A" roughness={0.4} metalness={0.3} />
      </mesh>
      {[0.3, 0.7, 1.1, 1.5].map((y) => (
        <mesh key={y} position={[5, y, 2.55]}>
          <boxGeometry args={[2.3, 0.02, 0.02]} />
          <meshStandardMaterial color="#666" />
        </mesh>
      ))}
      {/* Garage interior glow */}
      <GlowInterior position={[5, 0.85, 2.48]} color="#10B981" items="garage" />

      {/* ===== FRONT DOOR ===== */}
      <mesh position={[0, 1, 2.54]}>
        <boxGeometry args={[1.15, 2, 0.08]} />
        <meshStandardMaterial color="#4A1E08" roughness={0.5} />
      </mesh>
      {/* Door panels (recessed) */}
      {[0.55, 1.35].map((y) => (
        <mesh key={y} position={[0, y, 2.59]}>
          <boxGeometry args={[0.8, 0.5, 0.03]} />
          <meshStandardMaterial color="#3D1606" roughness={0.6} />
        </mesh>
      ))}
      {/* Door handle */}
      <mesh position={[0.4, 0.95, 2.63]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Transom window above door */}
      <mesh position={[0, 2.1, 2.58]}>
        <boxGeometry args={[1, 0.35, 0.03]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.3} transparent opacity={0.6} />
      </mesh>

      {/* ===== PORCH ===== */}
      <mesh position={[0, 0.05, 3.2]} receiveShadow>
        <boxGeometry args={[4.5, 0.12, 2.2]} />
        <meshStandardMaterial color="#7A6B55" roughness={0.8} />
      </mesh>
      {/* Porch railing */}
      {[-1.8, 1.8].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.5, 4.1]} castShadow>
            <boxGeometry args={[0.06, 0.9, 0.06]} />
            <meshStandardMaterial color="#F0EBD8" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Porch rail top */}
      <mesh position={[0, 0.95, 4.1]}>
        <boxGeometry args={[3.66, 0.05, 0.06]} />
        <meshStandardMaterial color="#F0EBD8" roughness={0.7} />
      </mesh>
      {/* Porch columns */}
      {[-1.8, 1.8].map((x) => (
        <mesh key={`col-${x}`} position={[x, 1.4, 4.1]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 2.6, 12]} />
          <meshStandardMaterial color="#E8E0D0" roughness={0.5} />
        </mesh>
      ))}
      {/* Porch overhang */}
      <mesh position={[0, 2.75, 3.5]}>
        <boxGeometry args={[4.8, 0.1, 3]} />
        <meshStandardMaterial color="#6B5D4A" roughness={0.7} />
      </mesh>

      {/* ===== PORCH LIGHT (single, stable) ===== */}
      <PorchLight position={[0, 2.4, 2.6]} />

      {/* ===== WINDOWS WITH INTERIORS ===== */}
      {/* Living room - left first floor */}
      <WindowWithInterior position={[-2.2, 1.2, 2.52]} size={[1.6, 1.3]} glowColor="#4A90D9" items="living" />
      {/* Kitchen - right first floor */}
      <WindowWithInterior position={[2.2, 1.2, 2.52]} size={[1.6, 1.3]} glowColor="#FF8C5A" items="kitchen" />
      {/* Bedroom left - second floor */}
      <WindowWithInterior position={[-2.2, 3.2, 2.52]} size={[1.2, 1]} glowColor="#E8C55A" items="bedroom" />
      {/* Bedroom right - second floor */}
      <WindowWithInterior position={[2.2, 3.2, 2.52]} size={[1.2, 1]} glowColor="#7EC8E3" items="bedroom2" />
      {/* Attic / music room */}
      <WindowWithInterior position={[0, 4.3, 2.52]} size={[1.2, 0.8]} glowColor="#E91E8C" items="music" />
      {/* Side windows */}
      <WindowWithInterior position={[-3.51, 1.3, 0]} size={[1.2, 1.2]} glowColor="#90BE6D" items="side" rotation={[0, Math.PI / 2, 0]} />
      <WindowWithInterior position={[3.51, 1.3, 0]} size={[1.2, 1.2]} glowColor="#F9C74F" items="side2" rotation={[0, Math.PI / 2, 0]} />

      {/* ===== STEPS ===== */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, -0.05 + i * -0.13, 4.1 + i * 0.45]} receiveShadow>
          <boxGeometry args={[2 + i * 0.3, 0.13, 0.45]} />
          <meshStandardMaterial color="#999" roughness={0.85} />
        </mesh>
      ))}

      {/* ===== DRIVEWAY ===== */}
      <mesh position={[5, -0.13, 5.5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 7]} />
        <meshStandardMaterial color="#555" roughness={0.95} />
      </mesh>

      {/* ===== MAILBOX ===== */}
      <mesh position={[3.5, 0.15, 6]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 8]} />
        <meshStandardMaterial color="#222" roughness={0.7} />
      </mesh>
      <mesh position={[3.5, 0.75, 6]} castShadow>
        <boxGeometry args={[0.45, 0.32, 0.28]} />
        <meshStandardMaterial color="#1E4D8C" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Mailbox flag */}
      <mesh position={[3.73, 0.82, 6]}>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
        <meshStandardMaterial color="#CC2222" roughness={0.5} />
      </mesh>

      {/* ===== LANDSCAPING ===== */}
      {/* Trees */}
      <RealisticTree position={[-5.5, 0, 3]} scale={1.3} />
      <RealisticTree position={[-6.5, 0, -1]} scale={1} />
      <RealisticTree position={[7.5, 0, -1]} scale={1.1} />
      <RealisticTree position={[8, 0, 3.5]} scale={0.8} />
      <RealisticTree position={[-4, 0, -2.5]} scale={0.7} />

      {/* Bushes along house front */}
      {[-2.8, -1.2, 1.2, 2.8].map((x, i) => (
        <group key={i} position={[x, 0.15, 2.7]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3 + (i % 2) * 0.08, 12, 12]} />
            <meshStandardMaterial color="#2A5E1A" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* Garden area - left side */}
      <mesh position={[-5, -0.12, 4]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial color="#1E4D12" roughness={1} />
      </mesh>
      {/* Garden flowers */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-4.5 + (i % 3) * 0.7, 0.1, 3.5 + Math.floor(i / 3) * 0.6]} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color={['#FF6B8A', '#FFD93D', '#FF8C42', '#C084FC', '#60A5FA', '#34D399', '#F472B6', '#FBBF24'][i]}
            emissive={['#FF6B8A', '#FFD93D', '#FF8C42', '#C084FC', '#60A5FA', '#34D399', '#F472B6', '#FBBF24'][i]}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}

      {/* ===== WHITE PICKET FENCE ===== */}
      {Array.from({ length: 16 }).map((_, i) => (
        <group key={i} position={[-8 + i * 1.1, 0, 7]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.06, 0.6, 0.05]} />
            <meshStandardMaterial color="#F5F0E6" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <coneGeometry args={[0.05, 0.08, 4]} />
            <meshStandardMaterial color="#F0EBD8" roughness={0.75} />
          </mesh>
          {i < 15 && (
            <>
              <mesh position={[0.55, 0.2, 0]}>
                <boxGeometry args={[1.1, 0.05, 0.03]} />
                <meshStandardMaterial color="#EDE8D5" roughness={0.8} />
              </mesh>
              <mesh position={[0.55, 0.45, 0]}>
                <boxGeometry args={[1.1, 0.05, 0.03]} />
                <meshStandardMaterial color="#EDE8D5" roughness={0.8} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {/* ===== INTERACTIVE CLICK ZONES ===== */}
      {ROOM_ZONES.map((room) => (
        <mesh
          key={room.id}
          position={room.position}
          onPointerEnter={(e) => { e.stopPropagation(); onRoomHover(room.id); document.body.style.cursor = 'pointer'; }}
          onPointerLeave={() => { onRoomHover(null); document.body.style.cursor = 'default'; }}
          onClick={(e) => { e.stopPropagation(); onRoomClick(room.id); }}
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

  return (
    <mesh position={[position[0], position[1], position[2] - depth / 2]} castShadow rotation={[Math.PI / 2, 0, 0]}>
      <extrudeGeometry args={[shape, { depth, bevelEnabled: false }]} />
      <meshStandardMaterial color="#5C3A21" roughness={0.85} />
    </mesh>
  );
}

// Window with visible interior elements
function WindowWithInterior({ position, size, glowColor, items, rotation }: {
  position: [number, number, number]; size: [number, number]; glowColor: string; items: string; rotation?: [number, number, number];
}) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      // Very gentle flicker, not jarring
      lightRef.current.intensity = 1.8 + Math.sin(clock.elapsedTime * 0.3 + position[0] * 2) * 0.15;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[size[0] + 0.16, size[1] + 0.16, 0.07]} />
        <meshStandardMaterial color="#F0EBD8" roughness={0.6} />
      </mesh>
      {/* Glass with interior glow */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.5} transparent opacity={0.75} roughness={0.05} />
      </mesh>
      {/* Window cross dividers */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.035, size[1], 0.02]} />
        <meshStandardMaterial color="#E0D8C8" />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[size[0], 0.035, 0.02]} />
        <meshStandardMaterial color="#E0D8C8" />
      </mesh>

      {/* Interior silhouettes behind the glass */}
      <InteriorSilhouette items={items} size={size} />

      {/* Light casting outward */}
      <pointLight ref={lightRef} position={[0, 0, 2]} color={glowColor} intensity={2} distance={6} decay={2} castShadow />
    </group>
  );
}

// Interior silhouettes visible through windows
function InteriorSilhouette({ items, size }: { items: string; size: [number, number] }) {
  const scale = Math.min(size[0], size[1]) * 0.3;

  switch (items) {
    case 'kitchen':
      return (
        <group position={[0, -size[1] * 0.2, -0.3]}>
          {/* Counter/shelf */}
          <mesh><boxGeometry args={[size[0] * 0.8, 0.04, 0.1]} /><meshStandardMaterial color="#4A3525" /></mesh>
          {/* Pot */}
          <mesh position={[-0.2, 0.12, 0]}><cylinderGeometry args={[0.08, 0.08, 0.15, 8]} /><meshStandardMaterial color="#888" metalness={0.6} /></mesh>
          {/* Cup */}
          <mesh position={[0.2, 0.08, 0]}><cylinderGeometry args={[0.05, 0.04, 0.1, 8]} /><meshStandardMaterial color="#DDD" /></mesh>
        </group>
      );
    case 'living':
      return (
        <group position={[0, -size[1] * 0.25, -0.3]}>
          {/* Couch silhouette */}
          <mesh><boxGeometry args={[size[0] * 0.6, 0.15, 0.12]} /><meshStandardMaterial color="#3A5A8C" /></mesh>
          {/* Lamp */}
          <mesh position={[size[0] * 0.3, 0.25, 0]}><cylinderGeometry args={[0.02, 0.02, 0.35, 6]} /><meshStandardMaterial color="#666" /></mesh>
          <mesh position={[size[0] * 0.3, 0.45, 0]}><coneGeometry args={[0.08, 0.1, 8]} /><meshStandardMaterial color="#FFE4B5" emissive="#FFE4B5" emissiveIntensity={0.5} /></mesh>
        </group>
      );
    case 'music':
      return (
        <group position={[0, -size[1] * 0.15, -0.3]}>
          {/* Guitar shape */}
          <mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.06, 0.08, 0.25, 8]} />
            <meshStandardMaterial color="#8B4513" />
          </mesh>
          {/* Music notes (small spheres) */}
          <mesh position={[0.15, 0.1, 0]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#E91E8C" emissive="#E91E8C" emissiveIntensity={1} /></mesh>
          <mesh position={[0.25, 0.05, 0]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#FF4DA6" emissive="#FF4DA6" emissiveIntensity={1} /></mesh>
        </group>
      );
    case 'bedroom':
      return (
        <group position={[0, -size[1] * 0.2, -0.3]}>
          {/* Bed */}
          <mesh><boxGeometry args={[size[0] * 0.5, 0.08, 0.15]} /><meshStandardMaterial color="#445" /></mesh>
          {/* Pillow */}
          <mesh position={[-0.12, 0.06, 0]}><boxGeometry args={[0.12, 0.05, 0.1]} /><meshStandardMaterial color="#EEE" /></mesh>
        </group>
      );
    default:
      return null;
  }
}

function GlowInterior({ position, color }: { position: [number, number, number]; color: string; items: string }) {
  return (
    <group position={position}>
      <pointLight position={[0, 0, 0.5]} color={color} intensity={1} distance={4} decay={2} />
    </group>
  );
}

function PorchLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.15, 0.25, 0.15]} />
        <meshStandardMaterial color="#444" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.08, 0.05]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#FFF5CC" emissive="#FFBB33" emissiveIntensity={2} />
      </mesh>
      {/* Stable light - no animation to prevent flicker */}
      <pointLight position={[0, -0.3, 0.8]} color="#FFCC55" intensity={3} distance={7} decay={2} />
    </group>
  );
}

function RealisticTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 1.4, 8]} />
        <meshStandardMaterial color="#4A2E12" roughness={0.95} />
      </mesh>
      {/* Canopy layers - fuller, rounder */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.9, 12, 12]} />
        <meshStandardMaterial color="#1B4D1B" roughness={0.95} />
      </mesh>
      <mesh position={[0.2, 2.2, 0.15]} castShadow>
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshStandardMaterial color="#225522" roughness={0.95} />
      </mesh>
      <mesh position={[-0.15, 2.5, -0.1]} castShadow>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color="#2A6B2A" roughness={0.95} />
      </mesh>
    </group>
  );
}
