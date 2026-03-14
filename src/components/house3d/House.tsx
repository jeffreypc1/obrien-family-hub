'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useLoader } from '@react-three/fiber';
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

// Fixed geometry
const ROOM_GEOMETRY: Record<string, { position: [number, number, number]; size: [number, number, number]; color: string; glowColor: string }> = {
  kitchen:  { position: [2.2, 1.2, 2.6], size: [1.8, 1.5, 0.3], color: '#FF6B35', glowColor: '#FF8C5A' },
  living:   { position: [-2.2, 1.2, 2.6], size: [1.8, 1.5, 0.3], color: '#4A90D9', glowColor: '#6DB3F8' },
  inlaw:    { position: [-5.5, 1.2, 2.6], size: [1.8, 1.5, 0.3], color: '#E91E8C', glowColor: '#FF4DA6' },
  garage:   { position: [5, 0.9, 2.6], size: [2.2, 1.5, 0.3], color: '#10B981', glowColor: '#34D399' },
  door:     { position: [0, 0.9, 2.7], size: [1, 2, 0.3], color: '#8B5CF6', glowColor: '#A78BFA' },
  garden:   { position: [-5, 0.2, 4.5], size: [2.5, 1.5, 2], color: '#06B6D4', glowColor: '#22D3EE' },
  porch:    { position: [0, 2.5, 3.5], size: [1.5, 1, 1], color: '#F59E0B', glowColor: '#FBBF24' },
  mailbox:  { position: [3.5, 0.4, 6], size: [1, 1.2, 1], color: '#F43F5E', glowColor: '#FB7185' },
};

const DEFAULT_MAPPINGS: Array<{ id: string; label: string; app: string }> = [
  { id: 'kitchen', label: '🍳 Kitchen', app: '/recipes' },
  { id: 'living', label: '📺 Living Room', app: '/german' },
  { id: 'inlaw', label: '🎤 In-Law Suite', app: 'https://eurovision-family.vercel.app' },
  { id: 'garage', label: '✅ Garage', app: '/todos' },
  { id: 'door', label: '📅 Front Door', app: '/events' },
  { id: 'garden', label: '✈️ Garden', app: '/travel' },
  { id: 'porch', label: '💡 Porch Light', app: '/recommendations' },
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
  // Load PBR textures
  const brickTex = useLoader(TextureLoader, '/tex-brick.jpg');
  const brickNor = useLoader(TextureLoader, '/tex-brick-nor.jpg');
  const brickRough = useLoader(TextureLoader, '/tex-brick-rough.jpg');
  const grassTex = useLoader(TextureLoader, '/tex-grass.jpg');
  const grassNor = useLoader(TextureLoader, '/tex-grass-nor.jpg');
  const roofTex = useLoader(TextureLoader, '/tex-roof.jpg');
  const roofNor = useLoader(TextureLoader, '/tex-roof-nor.jpg');
  const roofRough = useLoader(TextureLoader, '/tex-roof-rough.jpg');
  const woodTex = useLoader(TextureLoader, '/tex-wood.jpg');
  const woodNor = useLoader(TextureLoader, '/tex-wood-nor.jpg');
  const concreteTex = useLoader(TextureLoader, '/tex-concrete.jpg');

  // Configure texture repeats
  useMemo(() => {
    [brickTex, brickNor, brickRough].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); });
    [grassTex, grassNor].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(25, 25); });
    [roofTex, roofNor, roofRough].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3); });
    [woodTex, woodNor].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); });
    concreteTex.wrapS = concreteTex.wrapT = THREE.RepeatWrapping; concreteTex.repeat.set(6, 1);
  }, [brickTex, brickNor, brickRough, grassTex, grassNor, roofTex, roofNor, roofRough, woodTex, woodNor, concreteTex]);

  return (
    <group position={[0, -1, 0]}>
      {/* ===== TEXTURED GROUND ===== */}
      <mesh position={[0, -0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={grassTex} normalMap={grassNor} normalScale={new THREE.Vector2(0.8, 0.8)} roughness={0.95} />
      </mesh>

      {/* ===== FOUNDATION ===== */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[12, 0.25, 6.5]} />
        <meshStandardMaterial map={concreteTex} roughness={0.9} color="#888" />
      </mesh>

      {/* ===== MAIN HOUSE — BRICK TEXTURED ===== */}
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 2.5, 5.5]} />
        <meshStandardMaterial map={brickTex} normalMap={brickNor} roughnessMap={brickRough} normalScale={new THREE.Vector2(1.2, 1.2)} />
      </mesh>

      {/* Second floor accent (different brick tone) */}
      <mesh position={[0, 2.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.05, 0.5, 5.55]} />
        <meshStandardMaterial map={brickTex} normalMap={brickNor} color="#D8C8B0" roughness={0.75} />
      </mesh>

      {/* ===== IN-LAW SUITE (attached left, replaces attic) ===== */}
      <mesh position={[-5.5, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2, 5]} />
        <meshStandardMaterial map={brickTex} normalMap={brickNor} color="#C4B49E" roughness={0.8} />
      </mesh>
      <RoofSection position={[-5.5, 2.6, 0]} width={3.6} depth={5.6} height={1.2} roofTex={roofTex} roofNor={roofNor} roofRough={roofRough} />
      <WindowWithInterior position={[-5.5, 1.2, 2.52]} size={[1.4, 1.2]} glowColor="#E91E8C" items="music" />

      {/* ===== TEXTURED ROOF ===== */}
      <RoofSection position={[0, 3.35, 0]} width={7.8} depth={6.2} height={2} roofTex={roofTex} roofNor={roofNor} roofRough={roofRough} />

      {/* Roof trim */}
      <mesh position={[0, 3.35, 3.15]}>
        <boxGeometry args={[7.85, 0.15, 0.15]} />
        <meshStandardMaterial color="#F5F0E0" roughness={0.5} />
      </mesh>

      {/* ===== CHIMNEY ===== */}
      <mesh position={[2.5, 4.8, -1]} castShadow>
        <boxGeometry args={[0.7, 2, 0.7]} />
        <meshStandardMaterial map={brickTex} normalMap={brickNor} color="#A0705A" roughness={0.85} />
      </mesh>
      <mesh position={[2.5, 5.85, -1]}>
        <boxGeometry args={[0.85, 0.12, 0.85]} />
        <meshStandardMaterial color="#555" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* ===== GARAGE ===== */}
      <mesh position={[5, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2, 5.5]} />
        <meshStandardMaterial map={brickTex} normalMap={brickNor} color="#C8B898" roughness={0.8} />
      </mesh>
      <RoofSection position={[5, 2.5, 0]} width={3.6} depth={6} height={1.2} roofTex={roofTex} roofNor={roofNor} roofRough={roofRough} />
      {/* Garage door */}
      <mesh position={[5, 0.95, 2.77]}>
        <boxGeometry args={[2.5, 1.8, 0.06]} />
        <meshStandardMaterial color="#666" roughness={0.4} metalness={0.4} />
      </mesh>
      {[0.35, 0.75, 1.15, 1.55].map((y) => (
        <mesh key={y} position={[5, y, 2.8]}>
          <boxGeometry args={[2.4, 0.02, 0.02]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      ))}

      {/* ===== FRONT DOOR ===== */}
      <mesh position={[0, 1.15, 2.78]}>
        <boxGeometry args={[1.15, 2.1, 0.08]} />
        <meshStandardMaterial map={woodTex} color="#5A2E10" roughness={0.5} />
      </mesh>
      <mesh position={[0.4, 1.05, 2.84]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Transom */}
      <mesh position={[0, 2.3, 2.8]}>
        <boxGeometry args={[1, 0.3, 0.03]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.3} transparent opacity={0.6} />
      </mesh>

      {/* ===== PORCH — WOOD TEXTURED ===== */}
      <mesh position={[0, 0.12, 3.5]} receiveShadow>
        <boxGeometry args={[5, 0.12, 2.5]} />
        <meshStandardMaterial map={woodTex} normalMap={woodNor} color="#7A6B55" roughness={0.8} />
      </mesh>
      {/* Porch columns */}
      {[-2, 2].map((x) => (
        <mesh key={`col-${x}`} position={[x, 1.5, 4.5]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 2.7, 12]} />
          <meshStandardMaterial color="#E8E0D0" roughness={0.5} />
        </mesh>
      ))}
      {/* Porch overhang */}
      <mesh position={[0, 2.88, 3.8]}>
        <boxGeometry args={[5.2, 0.1, 3.2]} />
        <meshStandardMaterial map={woodTex} normalMap={woodNor} color="#5A4D3E" roughness={0.7} />
      </mesh>
      {/* Porch light */}
      <PorchLight position={[0, 2.55, 2.8]} />

      {/* ===== TEXTURED WINDOWS ===== */}
      <WindowWithInterior position={[-2.2, 1.4, 2.77]} size={[1.5, 1.3]} glowColor="#4A90D9" items="living" />
      <WindowWithInterior position={[2.2, 1.4, 2.77]} size={[1.5, 1.3]} glowColor="#FF8C5A" items="kitchen" />
      {/* Second floor */}
      <WindowWithInterior position={[-2.2, 2.9, 2.77]} size={[1.1, 0.9]} glowColor="#E8C55A" items="bedroom" />
      <WindowWithInterior position={[2.2, 2.9, 2.77]} size={[1.1, 0.9]} glowColor="#7EC8E3" items="bedroom2" />
      {/* Side windows */}
      <WindowWithInterior position={[-3.51, 1.4, 0]} size={[1.2, 1.2]} glowColor="#90BE6D" items="side" rotation={[0, Math.PI / 2, 0]} />
      <WindowWithInterior position={[3.51, 1.4, 0]} size={[1.2, 1.2]} glowColor="#F9C74F" items="side2" rotation={[0, Math.PI / 2, 0]} />

      {/* ===== STEPS ===== */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.05 + i * -0.13, 4.5 + i * 0.45]} receiveShadow>
          <boxGeometry args={[2 + i * 0.3, 0.13, 0.45]} />
          <meshStandardMaterial map={concreteTex} color="#AAA" roughness={0.85} />
        </mesh>
      ))}

      {/* ===== DRIVEWAY ===== */}
      <mesh position={[5, 0.01, 6]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.5, 8]} />
        <meshStandardMaterial map={concreteTex} color="#777" roughness={0.95} />
      </mesh>

      {/* ===== SIDEWALK ===== */}
      <mesh position={[0, 0.02, 8]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 1.5]} />
        <meshStandardMaterial map={concreteTex} color="#888" roughness={0.9} />
      </mesh>

      {/* ===== MAILBOX ===== */}
      <mesh position={[3.5, 0.3, 6.5]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshStandardMaterial color="#222" roughness={0.7} />
      </mesh>
      <mesh position={[3.5, 0.95, 6.5]} castShadow>
        <boxGeometry args={[0.45, 0.32, 0.28]} />
        <meshStandardMaterial color="#1E4D8C" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[3.73, 1.02, 6.5]}>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
        <meshStandardMaterial color="#CC2222" roughness={0.5} />
      </mesh>

      {/* ===== LANDSCAPING ===== */}
      <RealisticTree position={[-5, 0, 5.5]} scale={1.4} />
      <RealisticTree position={[-7, 0, -1]} scale={1.1} />
      <RealisticTree position={[8, 0, -1.5]} scale={1.2} />
      <RealisticTree position={[8.5, 0, 4]} scale={0.9} />
      <RealisticTree position={[-3.5, 0, -2.5]} scale={0.8} />

      {/* Bushes */}
      {[-3, -1.5, 1.5, 3].map((x, i) => (
        <group key={i} position={[x, 0.2, 3]}>
          <mesh castShadow>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#1E4E16" roughness={0.95} />
          </mesh>
        </group>
      ))}

      {/* Garden flowers */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-5.5 + (i % 4) * 0.5, 0.08, 4.5 + Math.floor(i / 4) * 0.4]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color={['#FF6B8A', '#FFD93D', '#FF8C42', '#C084FC', '#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#FB923C', '#A78BFA', '#2DD4BF', '#F87171'][i]}
            emissive={['#FF6B8A', '#FFD93D', '#FF8C42', '#C084FC', '#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#FB923C', '#A78BFA', '#2DD4BF', '#F87171'][i]}
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}

      {/* ===== FENCE ===== */}
      {Array.from({ length: 18 }).map((_, i) => (
        <group key={i} position={[-9 + i * 1.05, 0, 8.5]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.05, 0.6, 0.04]} />
            <meshStandardMaterial color="#F5F0E6" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <coneGeometry args={[0.045, 0.08, 4]} />
            <meshStandardMaterial color="#F0EBD8" roughness={0.75} />
          </mesh>
          {i < 17 && (
            <>
              <mesh position={[0.525, 0.18, 0]}><boxGeometry args={[1.05, 0.04, 0.03]} /><meshStandardMaterial color="#EDE8D5" roughness={0.8} /></mesh>
              <mesh position={[0.525, 0.42, 0]}><boxGeometry args={[1.05, 0.04, 0.03]} /><meshStandardMaterial color="#EDE8D5" roughness={0.8} /></mesh>
            </>
          )}
        </group>
      ))}

      {/* ===== INTERACTIVE ZONES ===== */}
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

function RoofSection({ position, width, depth, height, roofTex, roofNor, roofRough }: {
  position: [number, number, number]; width: number; depth: number; height: number;
  roofTex: THREE.Texture; roofNor: THREE.Texture; roofRough?: THREE.Texture;
}) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(0, height);
  shape.lineTo(width / 2, 0);
  shape.lineTo(-width / 2, 0);

  return (
    <mesh position={[position[0], position[1], position[2] - depth / 2]} castShadow rotation={[Math.PI / 2, 0, 0]}>
      <extrudeGeometry args={[shape, { depth, bevelEnabled: false }]} />
      <meshStandardMaterial map={roofTex} normalMap={roofNor} roughnessMap={roofRough} normalScale={new THREE.Vector2(1, 1)} color="#7A5A3A" />
    </mesh>
  );
}

function WindowWithInterior({ position, size, glowColor, items, rotation }: {
  position: [number, number, number]; size: [number, number]; glowColor: string; items: string; rotation?: [number, number, number];
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (lightRef.current) lightRef.current.intensity = 1.8 + Math.sin(clock.elapsedTime * 0.3 + position[0] * 2) * 0.12;
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh><boxGeometry args={[size[0] + 0.16, size[1] + 0.16, 0.07]} /><meshStandardMaterial color="#F0EBD8" roughness={0.6} /></mesh>
      <mesh position={[0, 0, 0.02]}><boxGeometry args={size} /><meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.45} transparent opacity={0.75} roughness={0.05} /></mesh>
      <mesh position={[0, 0, 0.04]}><boxGeometry args={[0.03, size[1], 0.02]} /><meshStandardMaterial color="#E0D8C8" /></mesh>
      <mesh position={[0, 0, 0.04]}><boxGeometry args={[size[0], 0.03, 0.02]} /><meshStandardMaterial color="#E0D8C8" /></mesh>
      <InteriorSilhouette items={items} size={size} />
      <pointLight ref={lightRef} position={[0, 0, 2]} color={glowColor} intensity={1.8} distance={6} decay={2} />
    </group>
  );
}

function InteriorSilhouette({ items, size }: { items: string; size: [number, number] }) {
  switch (items) {
    case 'kitchen':
      return (<group position={[0, -size[1] * 0.2, -0.3]}>
        <mesh><boxGeometry args={[size[0] * 0.8, 0.04, 0.1]} /><meshStandardMaterial color="#4A3525" /></mesh>
        <mesh position={[-0.2, 0.12, 0]}><cylinderGeometry args={[0.08, 0.08, 0.15, 8]} /><meshStandardMaterial color="#888" metalness={0.6} /></mesh>
        <mesh position={[0.2, 0.08, 0]}><cylinderGeometry args={[0.05, 0.04, 0.1, 8]} /><meshStandardMaterial color="#DDD" /></mesh>
      </group>);
    case 'living':
      return (<group position={[0, -size[1] * 0.25, -0.3]}>
        <mesh><boxGeometry args={[size[0] * 0.6, 0.15, 0.12]} /><meshStandardMaterial color="#3A5A8C" /></mesh>
        <mesh position={[size[0] * 0.3, 0.25, 0]}><cylinderGeometry args={[0.02, 0.02, 0.35, 6]} /><meshStandardMaterial color="#666" /></mesh>
        <mesh position={[size[0] * 0.3, 0.45, 0]}><coneGeometry args={[0.08, 0.1, 8]} /><meshStandardMaterial color="#FFE4B5" emissive="#FFE4B5" emissiveIntensity={0.5} /></mesh>
      </group>);
    case 'music':
      return (<group position={[0, -size[1] * 0.15, -0.3]}>
        <mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0.3]}><cylinderGeometry args={[0.06, 0.08, 0.25, 8]} /><meshStandardMaterial color="#8B4513" /></mesh>
        <mesh position={[0.15, 0.1, 0]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#E91E8C" emissive="#E91E8C" emissiveIntensity={1} /></mesh>
      </group>);
    case 'bedroom':
      return (<group position={[0, -size[1] * 0.2, -0.3]}>
        <mesh><boxGeometry args={[size[0] * 0.5, 0.08, 0.15]} /><meshStandardMaterial color="#445" /></mesh>
        <mesh position={[-0.12, 0.06, 0]}><boxGeometry args={[0.12, 0.05, 0.1]} /><meshStandardMaterial color="#EEE" /></mesh>
      </group>);
    default: return null;
  }
}

function PorchLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh><boxGeometry args={[0.15, 0.25, 0.15]} /><meshStandardMaterial color="#444" metalness={0.5} roughness={0.3} /></mesh>
      <mesh position={[0, -0.08, 0.05]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color="#FFF5CC" emissive="#FFBB33" emissiveIntensity={2} /></mesh>
      <pointLight position={[0, -0.3, 0.8]} color="#FFCC55" intensity={3} distance={7} decay={2} />
    </group>
  );
}

function RealisticTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.08, 0.14, 1.4, 8]} /><meshStandardMaterial color="#3A2210" roughness={0.95} /></mesh>
      <mesh position={[0, 1.8, 0]} castShadow><sphereGeometry args={[0.9, 16, 16]} /><meshStandardMaterial color="#1B4D1B" roughness={0.95} /></mesh>
      <mesh position={[0.2, 2.3, 0.15]} castShadow><sphereGeometry args={[0.7, 16, 16]} /><meshStandardMaterial color="#225522" roughness={0.95} /></mesh>
      <mesh position={[-0.15, 2.6, -0.1]} castShadow><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#2A6B2A" roughness={0.95} /></mesh>
    </group>
  );
}
