import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CHUNK_SIZE } from '../../types';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useBattle } from '../../context/BattleContext';
import { getBiomeAt } from '../../utils/procGen';

interface CaptureProps {
  playerPos?: THREE.Vector3;
  isMining: boolean;
}

export const ChunkCaptureManager: React.FC<CaptureProps> = ({ playerPos, isMining }) => {
  const { gainTerritory, playerProfile } = useBattle();
  const [captureProgress, setCaptureProgress] = useState(0);
  const [ownedChunks, setOwnedChunks] = useState<Set<string>>(new Set());
  
  const currentChunkId = useRef("");
  const MINING_SPEED = 25; // % per second approx

  const getChunkCoords = (pos: THREE.Vector3) => {
    return {
        x: Math.round(pos.x / CHUNK_SIZE),
        y: Math.round(pos.z / CHUNK_SIZE)
    };
  };

  useFrame((state, delta) => {
    if (!playerPos) return;

    const { x, y } = getChunkCoords(playerPos);
    const chunkId = `${x},${y}`;

    // Reset if moved to new chunk
    if (chunkId !== currentChunkId.current) {
        currentChunkId.current = chunkId;
        setCaptureProgress(0);
    }

    if (ownedChunks.has(chunkId)) return;

    if (isMining) {
        setCaptureProgress(prev => {
            const next = prev + MINING_SPEED * delta;
            
            // Completion Logic
            if (next >= 100) {
                setOwnedChunks(old => new Set(old).add(chunkId));
                
                // Add Land Card / Unlock Biome
                const biome = getBiomeAt(x, y);
                gainTerritory(biome);
                
                return 100;
            }
            return next;
        });
    } else {
        // Decay
        setCaptureProgress(prev => Math.max(0, prev - (MINING_SPEED * 2 * delta)));
    }
  });

  if (!playerPos) return null;

  const isOwned = ownedChunks.has(currentChunkId.current);

  return (
    <group position={[0, 1.8, 0]}> 
      {/* Only show when working on it or done */}
      {!isOwned && captureProgress > 0 && (
        <group>
           {/* Progress Bar Background */}
           <mesh position={[0, 0, 0]}>
             <planeGeometry args={[1, 0.15]} />
             <meshBasicMaterial color="black" />
           </mesh>
           {/* Progress Bar Fill */}
           <mesh position={[-(1 - captureProgress/100)/2, 0, 0.01]} scale={[captureProgress/100, 1, 1]}>
             <planeGeometry args={[1, 0.12]} />
             <meshBasicMaterial color={captureProgress > 90 ? "#4ade80" : "#facc15"} />
           </mesh>
           <Text position={[0, 0.25, 0]} fontSize={0.25} color="#facc15" outlineWidth={0.02} outlineColor="black">
             CHANNELING...
           </Text>
        </group>
      )}

      {isOwned && (
        <group>
            <Text position={[0, 0.5, 0]} fontSize={0.3} color="#4ade80" outlineWidth={0.02} outlineColor="black">
                TERRITORY OWNED
            </Text>
            <Text position={[0, 0.2, 0]} fontSize={0.2} color="#ffffff" outlineWidth={0.02} outlineColor="black">
                Biome Unlocked
            </Text>
        </group>
      )}
    </group>
  );
};