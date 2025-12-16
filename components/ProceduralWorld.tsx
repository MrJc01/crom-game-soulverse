import React, { useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createGrassTexture, createRockTexture, createTreeTexture } from '../utils/graphicsUtils';
import { CHUNK_SIZE, UNIT_SIZE, Biome } from '../types';
import { BIOME_DATA } from '../data/monsters';
import { Billboard } from '@react-three/drei';
import { Bot } from './Bot';
import { useMobManager } from '../hooks/useMobManager';

// Simple deterministic hash for procedural gen (pseudo-noise)
const pseudoRandom = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

const getBiomeAt = (cx: number, cy: number): Biome => {
  // Use Perlin-like noise logic (simplified to hash here)
  const val = pseudoRandom(cx * 0.1, cy * 0.1);
  if (val < 0.2) return 'VOLCANIC';
  if (val < 0.4) return 'SWAMP';
  if (val < 0.6) return 'FOREST';
  if (val < 0.8) return 'TUNDRA';
  return 'NEUTRAL';
};

interface ChunkProps {
  cx: number;
  cy: number;
  playerRef: React.RefObject<THREE.Group>;
  onSelectTarget: (id: string, pos: THREE.Vector3) => void;
  assets: {
    tree: THREE.Texture;
    rock: THREE.Texture;
  };
  spawnMobs: (cx: number, cy: number, biome: Biome) => any[];
}

const Chunk: React.FC<ChunkProps> = ({ cx, cy, playerRef, onSelectTarget, assets, spawnMobs }) => {
  const biome = useMemo(() => getBiomeAt(cx, cy), [cx, cy]);
  const config = BIOME_DATA[biome];

  // Procedural content generation
  const { props, mobs } = useMemo(() => {
    const _props = [];
    const seed = cx * 1000 + cy;

    // Generate Trees/Rocks
    const propCount = Math.floor(pseudoRandom(seed, 1) * 10) + 2;
    for (let i = 0; i < propCount; i++) {
      const px = (pseudoRandom(seed + i, 0) * CHUNK_SIZE) - (CHUNK_SIZE/2);
      const pz = (pseudoRandom(seed + i, 2) * CHUNK_SIZE) - (CHUNK_SIZE/2);
      _props.push({ 
        id: `prop-${cx}-${cy}-${i}`, 
        x: (cx * CHUNK_SIZE) + px, 
        z: (cy * CHUNK_SIZE) + pz,
        type: pseudoRandom(seed + i, 3) > 0.5 ? 'TREE' : 'ROCK',
        scale: 0.8 + pseudoRandom(seed + i, 4) * 0.5
      });
    }

    // Generate Mobs using Manager Logic
    const _mobs = spawnMobs(cx, cy, biome);

    return { props: _props, mobs: _mobs };
  }, [cx, cy, biome, config, spawnMobs]);

  return (
    <group>
      {/* Ground Plane for this Chunk */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[cx * CHUNK_SIZE, -0.01, cy * CHUNK_SIZE]} 
        receiveShadow
      >
        <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
        <meshStandardMaterial color={config.groundColor} />
      </mesh>

      {/* Render Props */}
      {props.map(prop => (
        <group key={prop.id} position={[prop.x, 0, prop.z]}>
           <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
             <mesh position={[0, 0.5 * UNIT_SIZE * prop.scale, 0]}>
               <planeGeometry args={[UNIT_SIZE * prop.scale, UNIT_SIZE * (prop.type === 'TREE' ? 1.5 : 1) * prop.scale]} />
               <meshStandardMaterial 
                 map={prop.type === 'TREE' ? assets.tree : assets.rock} 
                 transparent 
                 alphaTest={0.5} 
               />
             </mesh>
           </Billboard>
           <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
             <circleGeometry args={[0.3 * prop.scale, 16]} />
             <meshBasicMaterial color="black" opacity={0.3} transparent />
           </mesh>
        </group>
      ))}

      {/* Render Mobs */}
      {mobs.map(mob => (
        <Bot 
          key={mob.id}
          id={mob.id}
          defId={mob.defId} 
          initialX={mob.x}
          initialZ={mob.z}
          playerRef={playerRef}
          onSelect={onSelectTarget}
        />
      ))}
    </group>
  );
};

interface ProceduralWorldProps {
  playerRef: React.RefObject<THREE.Group>;
  onSelectTarget: (id: string, pos: THREE.Vector3) => void;
}

export const ProceduralWorld: React.FC<ProceduralWorldProps> = ({ playerRef, onSelectTarget }) => {
  const [currentChunk, setCurrentChunk] = useState({ x: 0, y: 0 });
  const { spawnMobsForChunk } = useMobManager();
  
  // Memoize assets
  const assets = useMemo(() => ({
    tree: createTreeTexture(),
    rock: createRockTexture(),
    grass: createGrassTexture() 
  }), []);

  // Update current chunk based on player pos
  useFrame(() => {
    if (playerRef.current) {
      const px = playerRef.current.position.x;
      const pz = playerRef.current.position.z;
      const cx = Math.round(px / CHUNK_SIZE);
      const cy = Math.round(pz / CHUNK_SIZE);
      
      if (cx !== currentChunk.x || cy !== currentChunk.y) {
        setCurrentChunk({ x: cx, y: cy });
      }
    }
  });

  // Calculate visible chunks (3x3 grid around player)
  const visibleChunks = useMemo(() => {
    const chunks = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        chunks.push({ x: currentChunk.x + x, y: currentChunk.y + y });
      }
    }
    return chunks;
  }, [currentChunk]);

  return (
    <group>
       <ambientLight intensity={0.5} />
       <directionalLight position={[20, 30, 10]} intensity={1.5} castShadow />
       
       {visibleChunks.map(chunk => (
         <Chunk 
           key={`${chunk.x},${chunk.y}`} 
           cx={chunk.x} 
           cy={chunk.y}
           playerRef={playerRef}
           onSelectTarget={onSelectTarget}
           assets={assets}
           spawnMobs={spawnMobsForChunk}
         />
       ))}
    </group>
  );
};