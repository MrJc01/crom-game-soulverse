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
import { SoulForge } from './components/world/SoulForge';
import { CraftingOverlay } from './components/ui/CraftingOverlay';

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
  
  // Crafting State
  const [isCrafting, setIsCrafting] = useState(false);

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
    if (isBattling || isCrafting) return;

    if (id.startsWith('mob-') || id.startsWith('bot-')) {
       startBattle(id);
       setSelectedTarget(null); 
    } else {
       setSelectedTarget({ id, pos });
    }
  };

  const handleGroundClick = () => {
    if (!isBattling && !isCrafting) {
      setSelectedTarget(null);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" style={{ minHeight: '100vh', minWidth: '100vw' }}>
      
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

      {/* Battle Interface Overlay */}
      {isBattling && (
        <BattleOverlay />
      )}

      {/* Crafting Interface Overlay */}
      {isCrafting && (
        <CraftingOverlay onClose={() => setIsCrafting(false)} />
      )}

      {/* 3D Scene */}
      <Canvas
        shadows={false}
        dpr={[1, 1.5]} // Clamp DPR to avoid high res causing crash
        gl={{ 
          antialias: false,
          stencil: false,
          depth: true,
          alpha: true,
          powerPreference: "high-performance",
          failIfMajorPerformanceCaveat: false, 
          preserveDrawingBuffer: false, // Fix: Disabled to save memory and prevent BindToCurrentSequence failed
        }}
        onPointerMissed={handleGroundClick}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); 
        }}
      >
        <Suspense fallback={null}>
          <PixelCamera targetRef={playerRef} />
          
          <ProceduralWorld 
            playerRef={playerRef}
            onSelectTarget={handleTargetSelect}
          />

          {/* ADDED: Soul Forge Object */}
          <SoulForge 
            position={[8, 0, 8]} 
            playerRef={playerRef} 
            isOpen={isCrafting}
            onToggleCrafting={setIsCrafting}
          />
          
          {selectedTarget && <SelectionRing position={selectedTarget.pos} />}

          {/* Player locked if battling or crafting */}
          <Player ref={playerRef} locked={isBattling || isTransitioning || isCrafting} />
          
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