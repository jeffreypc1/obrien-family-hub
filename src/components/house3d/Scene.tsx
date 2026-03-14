'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Html, Cloud, Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import House, { buildRoomZones } from './House';

// Cinematic intro sweep, then user takes control
function CameraIntro({ intro, introProgress, onIntroComplete }: {
  intro: boolean; introProgress: number; onIntroComplete: () => void;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!intro) return;
    const p = Math.min(introProgress, 1);
    const e = 1 - Math.pow(1 - p, 2);

    const angle = e * 0.8;
    const radius = 22 - e * 8;
    const height = 10 - e * 6;

    const targetPos = new THREE.Vector3(
      Math.sin(angle) * radius,
      height,
      Math.cos(angle) * radius
    );
    const targetLook = new THREE.Vector3(0, 2 - e * 0.5, 0);

    camera.position.lerp(targetPos, 0.05);
    camera.lookAt(targetLook);

    if (p >= 1) onIntroComplete();
  });

  return null;
}

// Moon
function Moon() {
  return (
    <group position={[-15, 20, -25]}>
      <mesh>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial color="#F5F0D8" emissive="#FFFDE7" emissiveIntensity={0.6} roughness={0.8} />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshStandardMaterial color="#FFFDE7" emissive="#DDEEFF" emissiveIntensity={0.15} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#CCDDFF" intensity={1.2} distance={80} decay={1} />
    </group>
  );
}

function NightClouds() {
  return (
    <group>
      <Cloud position={[-10, 12, -15]} speed={0.1} opacity={0.12} color="#334466" />
      <Cloud position={[12, 14, -20]} speed={0.08} opacity={0.08} color="#2A3D5C" />
      <Cloud position={[0, 16, -25]} speed={0.05} opacity={0.06} color="#3A4D6C" />
    </group>
  );
}

function RoomLabels({ hoveredRoom, onNavigate, zones }: {
  hoveredRoom: string | null; onNavigate: (url: string) => void; zones: ReturnType<typeof buildRoomZones>;
}) {
  return (
    <>
      {zones.map((room) => {
        const isActive = hoveredRoom === room.id;
        return (
          <group key={room.id}>
            {/* Glowing marker light pinned to the house */}
            <mesh position={[room.position[0], room.position[1] + 0.3, room.position[2] + 0.15]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial
                color={room.color}
                emissive={room.color}
                emissiveIntensity={isActive ? 3 : 1}
                transparent
                opacity={isActive ? 1 : 0.6}
              />
            </mesh>
            {/* Small point light at marker */}
            <pointLight
              position={[room.position[0], room.position[1] + 0.3, room.position[2] + 0.3]}
              color={room.color}
              intensity={isActive ? 2 : 0.3}
              distance={isActive ? 4 : 2}
              decay={2}
            />

            {/* Label appears on hover, pinned just above the marker */}
            <group position={[room.position[0], room.position[1] + 0.7, room.position[2] + 0.2]}>
              <Html center distanceFactor={12} style={{ pointerEvents: 'auto' }}>
                <div
                  onClick={(e) => { e.stopPropagation(); onNavigate(room.app); }}
                  className={`cursor-pointer select-none transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-1 pointer-events-none'
                  }`}
                  style={{
                    background: `rgba(0,0,0,0.75)`,
                    padding: '8px 16px',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 20px ${room.color}40`,
                    borderLeft: `3px solid ${room.color}`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {room.label}
                  <span style={{ display: 'block', fontSize: '10px', opacity: 0.5, marginTop: '1px' }}>
                    Click to enter
                  </span>
                </div>
              </Html>
            </group>
          </group>
        );
      })}
    </>
  );
}

// Wrapper that signals when House has loaded
function HouseWrapper(props: Parameters<typeof House>[0] & { onLoaded: () => void }) {
  const { onLoaded, ...houseProps } = props;
  useEffect(() => { onLoaded(); }, [onLoaded]);
  return <House {...houseProps} />;
}

interface HouseSceneProps {
  onNavigate: (url: string) => void;
}

function SceneContent({ onNavigate, onLoaded }: HouseSceneProps & { onLoaded: () => void }) {
  const [intro, setIntro] = useState(true);
  const [introProgress, setIntroProgress] = useState(0);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [roomZones, setRoomZones] = useState(buildRoomZones());
  const startTime = useRef(Date.now());

  // Load custom room mappings
  useEffect(() => {
    fetch('/api/admin').then((r) => r.json()).then((data) => {
      if (data.config?.roomMappingsJson) {
        try { setRoomZones(buildRoomZones(JSON.parse(data.config.roomMappingsJson))); } catch {}
      }
    }).catch(() => {});
  }, []);

  // Intro progress timer (4 seconds)
  useEffect(() => {
    if (!intro) return;
    startTime.current = Date.now();
    const interval = setInterval(() => {
      setIntroProgress(Math.min((Date.now() - startTime.current) / 4000, 1));
    }, 16);
    return () => clearInterval(interval);
  }, [intro]);

  const handleIntroComplete = useCallback(() => setIntro(false), []);

  return (
    <>
      <color attach="background" args={['#030308']} />
      <fog attach="fog" args={['#030308', 40, 100]} />

      {/* HDRI for reflections */}
      <Environment files="/night-sky.hdr" background={false} environmentIntensity={0.25} />

      <Stars radius={100} depth={50} count={6000} factor={5} saturation={0.7} />
      <Moon />
      <NightClouds />

      {/* Lighting */}
      <ambientLight intensity={0.2} color="#8899CC" />
      <directionalLight position={[-12, 18, 8]} intensity={0.6} color="#B0C4EE" castShadow
        shadow-mapSize={[4096, 4096]} shadow-camera-far={50}
        shadow-camera-left={-20} shadow-camera-right={20}
        shadow-camera-top={15} shadow-camera-bottom={-10} shadow-bias={-0.001} />
      <directionalLight position={[10, 8, 5]} intensity={0.2} color="#99AACC" />
      <hemisphereLight args={['#1A2040', '#0A1505', 0.25]} />

      {/* Street lights */}
      <pointLight position={[-8, 4, 8]} color="#FFDD88" intensity={2} distance={15} decay={2} />
      <pointLight position={[8, 4, 8]} color="#FFDD88" intensity={1.5} distance={12} decay={2} />

      <CameraIntro intro={intro} introProgress={introProgress} onIntroComplete={handleIntroComplete} />

      {/* User-controlled orbit after intro */}
      {!intro && (
        <OrbitControls
          target={[0, 1.5, 0]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={0.2}
          autoRotate={true}
          autoRotateSpeed={0.3}
        />
      )}

      {/* House model */}
      <Suspense fallback={null}>
        <HouseWrapper onRoomHover={setHoveredRoom} roomZones={roomZones} onRoomClick={(id) => {
          const room = roomZones.find((r) => r.id === id);
          if (room) onNavigate(room.app);
        }} onLoaded={onLoaded} />
      </Suspense>

      {/* Room labels (only after intro) */}
      {!intro && <RoomLabels hoveredRoom={hoveredRoom} onNavigate={onNavigate} zones={roomZones} />}

      <EffectComposer>
        <Bloom luminanceThreshold={0.4} luminanceSmoothing={0.9} intensity={0.7} />
        <Vignette offset={0.25} darkness={0.65} />
      </EffectComposer>
    </>
  );
}

export default function HouseScene({ onNavigate }: HouseSceneProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="w-full h-screen relative bg-[#030308]">
      <Canvas
        shadows
        camera={{ position: [18, 10, 18], fov: 42 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3 }}
      >
        <Suspense fallback={null}>
          <SceneContent onNavigate={onNavigate} onLoaded={() => setLoaded(true)} />
        </Suspense>
      </Canvas>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5">
        <button onClick={() => onNavigate('/')}
          className="px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 text-white/40 hover:text-white text-xs transition-all">
          ← Classic View
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold gradient-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"
            style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            O&apos;Brien
          </h1>
          <p className="text-[10px] text-white/20 tracking-[0.25em] uppercase">Family Hub</p>
        </div>
        <div className="w-[100px]" /> {/* spacer for centering */}
      </div>

      {/* Instruction (only after loaded) */}
      {loaded && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <p className="text-white/25 text-sm bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/5">
            ✨ Drag to look around · Scroll to zoom · Hover rooms to enter
          </p>
        </div>
      )}

      {/* Loading indicator — hidden once model loads */}
      {!loaded && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">🏠</div>
            <p className="text-white/30 text-sm">Loading house...</p>
          </div>
        </div>
      )}
    </div>
  );
}
