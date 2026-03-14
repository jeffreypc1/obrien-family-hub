'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Html, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import House, { ROOM_ZONES } from './House';
import UFO from './UFO';

// Camera controller that handles the intro animation and room zoom
function CameraController({
  phase,
  progress,
  targetRoom,
  onPhaseComplete,
}: {
  phase: string;
  progress: number;
  targetRoom: string | null;
  onPhaseComplete: () => void;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 4, 18));
  const targetLook = useRef(new THREE.Vector3(0, 1.5, 0));

  useFrame(() => {
    if (phase === 'flying-in') {
      // Camera watches UFO from distance
      const p = Math.min(progress, 1);
      targetPos.current.set(8 - p * 4, 6 + (1 - p) * 4, 20 - p * 5);
      targetLook.current.set(0, 4, 0);
    } else if (phase === 'beaming') {
      // Pan down to see house being beamed
      const p = Math.min(progress, 1);
      targetPos.current.set(4 - p * 2, 5 - p * 1.5, 15 + p * 1);
      targetLook.current.set(0, 2 - p * 0.5, 0);
    } else if (phase === 'departing' || phase === 'idle') {
      // Normal viewing angle
      targetPos.current.set(2, 3.5, 16);
      targetLook.current.set(0, 1.5, 0);
    }

    // Room zoom override
    if (targetRoom && phase === 'idle') {
      const room = ROOM_ZONES.find((r) => r.id === targetRoom);
      if (room) {
        const [rx, ry, rz] = room.position;
        targetPos.current.set(rx, ry + 0.5, rz + 5);
        targetLook.current.set(rx, ry, rz);
      }
    }

    // Smooth camera movement
    camera.position.lerp(targetPos.current, 0.03);
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const desired = targetLook.current.clone().sub(camera.position).normalize();
    currentLook.lerp(desired, 0.03);
    camera.lookAt(
      camera.position.x + currentLook.x * 10,
      camera.position.y + currentLook.y * 10,
      camera.position.z + currentLook.z * 10
    );
  });

  // Detect phase completion
  useEffect(() => {
    if (progress >= 1) onPhaseComplete();
  }, [progress, onPhaseComplete]);

  return null;
}

// Ground plane
function Ground() {
  return (
    <>
      {/* Grass */}
      <mesh position={[0, -1.15, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1A3D0C" roughness={1} />
      </mesh>
      {/* Sidewalk */}
      <mesh position={[0, -1.13, 6.5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 1.5]} />
        <meshStandardMaterial color="#777" roughness={0.9} />
      </mesh>
    </>
  );
}

// Room label tooltips
function RoomLabels({
  hoveredRoom,
  zoomedRoom,
  onRoomClick,
}: {
  hoveredRoom: string | null;
  zoomedRoom: string | null;
  onRoomClick: (roomId: string) => void;
}) {
  return (
    <>
      {ROOM_ZONES.map((room) => {
        const isHovered = hoveredRoom === room.id;
        const isZoomed = zoomedRoom === room.id;

        return (
          <group key={room.id} position={[room.position[0], room.position[1] + 0.8, room.position[2] + 0.5]}>
            <Html center distanceFactor={8} style={{ pointerEvents: isHovered || isZoomed ? 'auto' : 'none' }}>
              <div
                onClick={() => onRoomClick(room.id)}
                className={`cursor-pointer select-none transition-all duration-300 ${
                  isHovered || isZoomed ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
                style={{
                  background: `${room.color}CC`,
                  padding: '8px 16px',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  boxShadow: `0 4px 20px ${room.color}60`,
                  border: `1px solid ${room.color}`,
                }}
              >
                {room.label}
                {isZoomed && (
                  <span style={{ display: 'block', fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                    Click to enter →
                  </span>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

interface HouseSceneProps {
  onNavigate: (url: string) => void;
  skipIntro?: boolean;
}

export default function HouseScene({ onNavigate, skipIntro = false }: HouseSceneProps) {
  type Phase = 'flying-in' | 'beaming' | 'departing' | 'idle' | 'gone';
  const [phase, setPhase] = useState<Phase>(skipIntro ? 'idle' : 'flying-in');
  const [progress, setProgress] = useState(0);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [zoomedRoom, setZoomedRoom] = useState<string | null>(null);
  const [showHouse, setShowHouse] = useState(skipIntro);
  const startTime = useRef(Date.now());

  // Progress timer
  useEffect(() => {
    if (phase === 'idle' || phase === 'gone') return;

    const durations: Record<string, number> = {
      'flying-in': 3000,
      'beaming': 2500,
      'departing': 2000,
    };

    const duration = durations[phase] || 3000;
    startTime.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      setProgress(Math.min(elapsed / duration, 1));
    }, 16);

    return () => clearInterval(interval);
  }, [phase]);

  const handlePhaseComplete = useCallback(() => {
    if (phase === 'flying-in') {
      setPhase('beaming');
      setShowHouse(true);
      setProgress(0);
    } else if (phase === 'beaming') {
      setPhase('departing');
      setProgress(0);
    } else if (phase === 'departing') {
      setPhase('idle');
    }
  }, [phase]);

  const handleSkip = () => {
    setPhase('idle');
    setShowHouse(true);
    setProgress(0);
  };

  const handleRoomClick = (roomId: string) => {
    if (zoomedRoom === roomId) {
      // Already zoomed — navigate
      const room = ROOM_ZONES.find((r) => r.id === roomId);
      if (room) onNavigate(room.app);
    } else {
      setZoomedRoom(roomId);
    }
  };

  // Click away from room to unzoom
  const handleCanvasClick = () => {
    if (zoomedRoom && !hoveredRoom) {
      setZoomedRoom(null);
    }
  };

  return (
    <div className="w-full h-screen relative" onClick={handleCanvasClick}>
      <Canvas
        shadows
        camera={{ position: [8, 10, 24], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        {/* Sky / atmosphere */}
        <color attach="background" args={['#050510']} />
        <fog attach="fog" args={['#050510', 30, 80]} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.5} />

        {/* Lighting */}
        <ambientLight intensity={0.15} color="#8888CC" />
        {/* Moonlight */}
        <directionalLight
          position={[-10, 15, 5]}
          intensity={0.4}
          color="#AABBEE"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />

        {/* Camera animation */}
        <CameraController
          phase={phase}
          progress={progress}
          targetRoom={zoomedRoom}
          onPhaseComplete={handlePhaseComplete}
        />

        {/* Ground */}
        <Ground />

        {/* House (fades in during beam phase) */}
        {showHouse && <House onRoomHover={setHoveredRoom} />}

        {/* UFO */}
        {phase !== 'idle' && (
          <UFO phase={phase as 'flying-in' | 'beaming' | 'departing' | 'gone'} progress={progress} />
        )}

        {/* Room labels */}
        {phase === 'idle' && (
          <RoomLabels
            hoveredRoom={hoveredRoom}
            zoomedRoom={zoomedRoom}
            onRoomClick={handleRoomClick}
          />
        )}

        {/* Post processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={0.8} />
        </EffectComposer>
      </Canvas>

      {/* Skip button during intro */}
      {phase !== 'idle' && (
        <button
          onClick={handleSkip}
          className="absolute bottom-8 right-8 px-6 py-3 rounded-2xl bg-black/50 backdrop-blur-sm border border-white/10 text-white/50 hover:text-white text-sm font-medium transition-all z-20"
        >
          Skip Intro →
        </button>
      )}

      {/* Back to classic view */}
      {phase === 'idle' && (
        <div className="absolute top-6 left-6 z-20 flex gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 text-white/40 hover:text-white text-xs transition-all"
          >
            ← Classic View
          </button>
        </div>
      )}

      {/* Room zoom instruction */}
      {phase === 'idle' && !zoomedRoom && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <p className="text-white/20 text-sm bg-black/30 backdrop-blur-sm rounded-xl px-5 py-2">
            Hover over the house to explore rooms
          </p>
        </div>
      )}

      {/* Zoomed room - enter button */}
      {zoomedRoom && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => {
              const room = ROOM_ZONES.find((r) => r.id === zoomedRoom);
              if (room) onNavigate(room.app);
            }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform"
          >
            Enter {ROOM_ZONES.find((r) => r.id === zoomedRoom)?.label} →
          </button>
        </div>
      )}
    </div>
  );
}
