import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ProceduralWorld } from './components/ProceduralWorld';
import { Player } from './components/Player';
import { PixelCamera } from './components/PixelCamera';
import { NetworkManager } from './components/NetworkManager';
import { Stats } from '@react-three/drei';
import { initSocketConnection, disconnectSocket } from './utils/socketClient';
import { BattleOverlay } from './components/ui/BattleOverlay';
import { BattleProvider, useBattle } from './context/BattleContext';
import { TransitionEffect } from './components/effects/TransitionEffect';
import { MOCK_PLAYER } from './data/gameData';
import { LootToast } from './components/ui/LootToast';

// --- SELECTION RING COMPONENT ---
const SelectionRing = ({ position }: { position: THREE.Vector3 }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime();
      const s = 1 + Math.sin(clock.getElapsedTime() * 5) * 0.1;
      ringRef.current.scale.set(s, s, s);
    }
  });

  return (
    <mesh 
      ref={ringRef}
      position={[position.x, 0.05, position.z]} 
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0.4, 0.5, 32]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
};

// --- GAME CONTENT WRAPPER ---
const GameContent = () => {
  const { isBattling, isTransitioning, startBattle, latestLoot, clearLoot } = useBattle();
  const playerRef = useRef<THREE.Group>(null);
  const [selectedTarget, setSelectedTarget] = useState<{ id: string, pos: THREE.Vector3 } | null>(null);

  // Critical HP Logic for Vignette (Immersive UI)
  const hpPercent = MOCK_PLAYER.currentHp / MOCK_PLAYER.maxHp;
  const isCritical = hpPercent < 0.3;

  useEffect(() => {
    initSocketConnection();
    return () => {
      disconnectSocket();
    };
  }, []);

  const handleTargetSelect = (id: string, pos: THREE.Vector3) => {
    if (isBattling) return;

    if (id.startsWith('mob-') || id.startsWith('bot-')) {
       // Extract mob type if needed, or just start battle
       startBattle(id);
       setSelectedTarget(null); 
    } else {
       setSelectedTarget({ id, pos });
    }
  };

  const handleGroundClick = () => {
    if (!isBattling) {
      setSelectedTarget(null);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* VFX: Battle Transition */}
      <TransitionEffect isActive={isTransitioning} />

      {/* LOOT FEEDBACK */}
      {latestLoot && <LootToast loot={latestLoot} onClose={clearLoot} />}

      {/* IMMERSIVE UI: CRITICAL HP VIGNETTE */}
      <div 
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-1000 ease-in-out"
        style={{
            opacity: isCritical ? 1 : 0,
            background: 'radial-gradient(circle, transparent 40%, rgba(50,0,0,0.8) 100%)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9)'
        }}
      />
      {isCritical && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center animate-pulse opacity-20 text-red-600 font-bold text-9xl">
             ♥
          </div>
      )}

      {/* Battle Interface Overlay (Only shows during Card Battles) */}
      {isBattling && (
        <BattleOverlay />
      )}

      {/* 3D Scene */}
      <Canvas
        shadows
        gl={{ 
          antialias: false, 
          pixelRatio: window.devicePixelRatio, 
          powerPreference: "high-performance"
        }}
        onPointerMissed={handleGroundClick}
      >
        <Suspense fallback={null}>
          <PixelCamera targetRef={playerRef} />
          
          {/* Replaced Static World with Procedural Chunk Manager */}
          <ProceduralWorld 
            playerRef={playerRef}
            onSelectTarget={handleTargetSelect}
          />
          
          {selectedTarget && <SelectionRing position={selectedTarget.pos} />}

          <Player ref={playerRef} locked={isBattling || isTransitioning} />
          
          <NetworkManager />
          
          <Stats className="!absolute !bottom-0 !left-auto !right-0 !top-auto" />
        </Suspense>
      </Canvas>
    </div>
  );
};

function App() {
  return (
    <BattleProvider>
      <GameContent />
    </BattleProvider>
  );
}

export default App;