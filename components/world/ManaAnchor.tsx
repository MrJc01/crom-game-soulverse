import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fetchChunk, claimChunk, saveChunk } from '../../data/worldPersistence';
import { MOCK_PLAYER } from '../../data/gameData';
import { PIXELS_PER_UNIT } from '../../types';

interface ManaAnchorProps {
  chunkX: number;
  chunkY: number;
}

export const ManaAnchor: React.FC<ManaAnchorProps> = ({ chunkX, chunkY }) => {
  const groupRef = useRef<THREE.Group>(null);
  const crystalRef = useRef<THREE.Mesh>(null);
  const [claimed, setClaimed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Animation: Pulse and Rotate
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      // Float
      groupRef.current.position.y = 0.5 + Math.sin(t) * 0.1;
    }
    if (crystalRef.current) {
      // Rotate
      crystalRef.current.rotation.y = t * 0.5;
      crystalRef.current.rotation.z = t * 0.2;
      
      // Pulse Scale
      const scale = 1 + Math.sin(t * 2) * 0.1;
      crystalRef.current.scale.set(scale, scale, scale);
    }
  });

  const handleInteract = (e: any) => {
    e.stopPropagation();
    if (claimed) return;

    // Simulate claiming logic
    const chunk = fetchChunk(chunkX, chunkY);
    const result = claimChunk(MOCK_PLAYER, chunk, 100);
    
    if (result.success) {
      if (result.chunk) saveChunk(result.chunk);
      setClaimed(true);
      alert(result.message);
    } else {
      alert(result.message);
    }
  };

  return (
    <group ref={groupRef} position={[chunkX * 16, 1, chunkY * 16]}>
      {/* Interaction Hitbox */}
      <mesh 
        onClick={handleInteract}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        visible={false}
      >
        <boxGeometry args={[2, 4, 2]} />
      </mesh>

      {/* The Crystal */}
      <mesh ref={crystalRef}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial 
          color={claimed ? "#3b82f6" : (hovered ? "#fbbf24" : "#94a3b8")}
          emissive={claimed ? "#1d4ed8" : "#000000"}
          wireframe={!claimed}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Light */}
      <pointLight 
        color={claimed ? "#3b82f6" : "#fbbf24"} 
        intensity={claimed ? 2 : 0.5} 
        distance={5} 
      />

      {/* Base Ring */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1, 0]}>
        <ringGeometry args={[0.8, 1, 6]} />
        <meshBasicMaterial 
          color={claimed ? "#3b82f6" : "#64748b"} 
          side={THREE.DoubleSide} 
          transparent 
          opacity={0.5} 
        />
      </mesh>
    </group>
  );
};