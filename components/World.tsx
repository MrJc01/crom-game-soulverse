import React, { useMemo } from 'react';
import * as THREE from 'three';
import { createGrassTexture } from '../utils/graphicsUtils';

export const World: React.FC = () => {
  // Memoize texture generation so it doesn't recreate on re-renders
  const groundTexture = useMemo(() => {
    const tex = createGrassTexture();
    // Ensure we tile it significantly.
    // 100 units wide. Texture is 64x64px. 
    // If we want 1 tile per unit (approx), we repeat 100 times.
    tex.repeat.set(50, 50); 
    return tex;
  }, []);

  return (
    <group>
      {/* Lighting Setup */}
      <ambientLight intensity={0.6} color="#ffffff" />
      
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />

      {/* The Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial map={groundTexture} />
      </mesh>

      {/* No Grid Helper - Pure Texture now */}
    </group>
  );
};