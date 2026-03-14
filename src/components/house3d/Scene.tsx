'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import House, { ROOM_ZONES } from './House';
import UFO from './UFO';

function CameraController({ phase, progress, targetRoom, onPhaseComplete }: {
  phase: string; progress: number; targetRoom: string | null; onPhaseComplete: () => void;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(2, 3.5, 16));
  const targetLook = useRef(new THREE.Vector3(0, 1.5, 0));

  useFrame(() => {
    if (phase === 'flying-in') {
      const p = Math.min(progress, 1);
      const e = 1 - Math.pow(1 - p, 3);
      targetPos.current.set(10 - e * 6, 8 - e * 3, 22 - e * 6);
      targetLook.current.set(0, 5 - e * 2, 0);
    } else if (phase === 'beaming') {
      const p = Math.min(progress, 1);
      targetPos.current.set(4 - p * 1.5, 5 - p * 1.5, 16 + p * 0.5);
      targetLook.current.set(0, 2 - p * 0.5, 0);
    } else if (phase === 'departing' || phase === 'idle') {
      targetPos.current.set(2, 3, 16);
      targetLook.current.set(0, 1.2, 0);
    }

    // Room zoom
    if (targetRoom && phase === 'idle') {
      const room = ROOM_ZONES.find((r) => r.id === targetRoom);
      if (room) {
        const [rx, ry, rz] = room.position;
        targetPos.current.set(rx * 0.5, ry + 0.3, rz + 6);
        targetLook.current.set(rx, ry - 0.2, rz);
      }
    }

    camera.position.lerp(targetPos.current, 0.04);
    const dir = targetLook.current.clone().sub(camera.position).normalize();
    const currentDir = new THREE.Vector3();
    camera.getWorldDirection(currentDir);
    currentDir.lerp(dir, 0.04);
    camera.lookAt(camera.position.clone().add(currentDir.multiplyScalar(10)));
  });

  useEffect(() => {
    if (progress >= 1) onPhaseComplete();
  }, [progress, onPhaseComplete]);

  return null;
}

function Ground() {
  return (
    <>
      {/* Grass — large area */}
      <mesh position={[0, -1.15, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#1A3D0C" roughness={1} />
      </mesh>
      {/* Front yard — slightly lighter grass */}
      <mesh position={[0, -1.14, 5]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#1E4510" roughness={1} />
      </mesh>
      {/* Sidewalk */}
      <mesh position={[0, -1.13, 8]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 1.2]} />
        <meshStandardMaterial color="#777" roughness={0.9} />
      </mesh>
    </>
  );
}

function RoomLabels({ hoveredRoom, zoomedRoom, onRoomClick }: {
  hoveredRoom: string | null; zoomedRoom: string | null; onRoomClick: (id: string) => void;
}) {
  return (
    <>
      {ROOM_ZONES.map((room) => {
        const isActive = hoveredRoom === room.id || zoomedRoom === room.id;
        return (
          <group key={room.id} position={[room.position[0], room.position[1] + 1, room.position[2] + 0.3]}>
            <Html center distanceFactor={10} style={{ pointerEvents: 'auto' }}>
              <div
                onClick={(e) => { e.stopPropagation(); onRoomClick(room.id); }}
                className={`cursor-pointer select-none transition-all duration-300 ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${room.color}EE, ${room.color}AA)`,
                  padding: '10px 20px',
                  borderRadius: '14px',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '15px',
                  whiteSpace: 'nowrap',
                  boxShadow: `0 6px 30px ${room.color}80, 0 0 60px ${room.color}30`,
                  border: `1px solid rgba(255,255,255,0.2)`,
                  backdropFilter: 'blur(8px)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              >
                {room.label}
                {zoomedRoom === room.id && (
                  <span style={{ display: 'block', fontSize: '11px', opacity: 0.8, marginTop: '3px', fontWeight: 500 }}>
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

// Moon
function Moon() {
  return (
    <group position={[-15, 18, -20]}>
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#FFFDE7" emissive="#FFFDE7" emissiveIntensity={0.8} />
      </mesh>
      {/* Moon glow */}
      <pointLight color="#CCDDFF" intensity={0.8} distance={60} decay={1} />
    </group>
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

  useEffect(() => {
    if (phase === 'idle' || phase === 'gone') return;
    const durations: Record<string, number> = { 'flying-in': 3500, beaming: 2500, departing: 2000 };
    const duration = durations[phase] || 3000;
    startTime.current = Date.now();
    const interval = setInterval(() => {
      setProgress(Math.min((Date.now() - startTime.current) / duration, 1));
    }, 16);
    return () => clearInterval(interval);
  }, [phase]);

  const handlePhaseComplete = useCallback(() => {
    if (phase === 'flying-in') { setPhase('beaming'); setShowHouse(true); setProgress(0); }
    else if (phase === 'beaming') { setPhase('departing'); setProgress(0); }
    else if (phase === 'departing') { setPhase('idle'); }
  }, [phase]);

  const handleSkip = () => { setPhase('idle'); setShowHouse(true); setProgress(0); };

  const handleRoomClick = (roomId: string) => {
    if (zoomedRoom === roomId) {
      const room = ROOM_ZONES.find((r) => r.id === roomId);
      if (room) onNavigate(room.app);
    } else {
      setZoomedRoom(roomId);
    }
  };

  return (
    <div className="w-full h-screen relative bg-[#050510]">
      <Canvas
        shadows
        camera={{ position: [10, 8, 22], fov: 42 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
        onPointerMissed={() => { if (zoomedRoom) setZoomedRoom(null); }}
      >
        <color attach="background" args={['#050510']} />
        <fog attach="fog" args={['#080818', 35, 90]} />

        {/* Stars */}
        <Stars radius={100} depth={50} count={4000} factor={5} saturation={0.6} />

        {/* Moon */}
        <Moon />

        {/* ===== LIGHTING - key to visibility ===== */}
        {/* Ambient fill */}
        <ambientLight intensity={0.25} color="#8899CC" />

        {/* Primary moonlight */}
        <directionalLight
          position={[-12, 18, 8]}
          intensity={0.7}
          color="#B0C4EE"
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={15}
          shadow-camera-bottom={-10}
          shadow-bias={-0.001}
        />

        {/* Fill light from the right (cool) */}
        <directionalLight position={[10, 8, 5]} intensity={0.25} color="#99AACC" />

        {/* Ground bounce light */}
        <hemisphereLight args={['#1A2040', '#0A1505', 0.3]} />

        {/* Street light / lamp post effect */}
        <pointLight position={[-8, 4, 7]} color="#FFDD88" intensity={2} distance={15} decay={2} />
        <pointLight position={[8, 4, 7]} color="#FFDD88" intensity={1.5} distance={12} decay={2} />

        {/* Camera */}
        <CameraController phase={phase} progress={progress} targetRoom={zoomedRoom} onPhaseComplete={handlePhaseComplete} />

        {/* Ground */}
        <Ground />

        {/* House */}
        {showHouse && <House onRoomHover={setHoveredRoom} onRoomClick={handleRoomClick} />}

        {/* UFO */}
        {phase !== 'idle' && <UFO phase={phase as 'flying-in' | 'beaming' | 'departing' | 'gone'} progress={progress} />}

        {/* Room labels */}
        {phase === 'idle' && (
          <RoomLabels hoveredRoom={hoveredRoom} zoomedRoom={zoomedRoom} onRoomClick={handleRoomClick} />
        )}

        {/* Post processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={0.6} />
          <Vignette offset={0.3} darkness={0.6} />
        </EffectComposer>
      </Canvas>

      {/* Skip button */}
      {phase !== 'idle' && (
        <button onClick={handleSkip}
          className="absolute bottom-8 right-8 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-all z-20">
          Skip Intro →
        </button>
      )}

      {/* Navigation overlay */}
      {phase === 'idle' && (
        <>
          <div className="absolute top-6 left-6 z-20 flex gap-3">
            <button onClick={() => onNavigate('/')}
              className="px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 text-white/40 hover:text-white text-xs transition-all">
              ← Classic View
            </button>
          </div>

          {/* Instruction */}
          {!zoomedRoom && !hoveredRoom && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-pulse">
              <p className="text-white/30 text-sm bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/5">
                ✨ Hover over the house to explore rooms
              </p>
            </div>
          )}

          {/* Enter room button */}
          {zoomedRoom && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={() => {
                  const room = ROOM_ZONES.find((r) => r.id === zoomedRoom);
                  if (room) onNavigate(room.app);
                }}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-xl shadow-purple-500/30 hover:scale-105 hover:shadow-purple-500/50 transition-all border border-white/20"
              >
                Enter {ROOM_ZONES.find((r) => r.id === zoomedRoom)?.label} →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
