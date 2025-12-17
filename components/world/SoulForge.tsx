import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface SoulForgeProps {
  position: [number, number, number];
  playerRef: React.RefObject<THREE.Group>;
  onToggleCrafting: (isOpen: boolean) => void;
  isOpen: boolean;
}

export const SoulForge: React.FC<SoulForgeProps> = ({ position, playerRef, onToggleCrafting, isOpen }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [canInteract, setCanInteract] = useState(false);

  // Proximity Check
  useFrame(() => {
    if (playerRef.current && groupRef.current) {
      const dist = playerRef.current.position.distanceTo(groupRef.current.position);
      const inRange = dist < 3.0; // 3 units interaction range
      
      if (inRange !== canInteract) {
        setCanInteract(inRange);
      }
      
      // Auto-close if walked away
      if (isOpen && !inRange) {
        onToggleCrafting(false);
      }
    }
  });

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (canInteract && e.code === 'KeyE') {
        onToggleCrafting(!isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canInteract, isOpen, onToggleCrafting]);

  return (
    <group ref={groupRef} position={position}>
      {/* --- Visuals: Anvil/Pedestal --- */}
      {/* Base */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1.5, 1, 1.5]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      
      {/* Top Slab */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[2, 0.2, 1.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Floating Rune */}
      <mesh position={[0, 2, 0]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.4]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2} wireframe />
        <pointLight color="#f59e0b" intensity={3} distance={5} />
      </mesh>

      {/* --- UI Hint --- */}
      {canInteract && !isOpen && (
        <Text
          position={[0, 3, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="black"
        >
          [E] FORGE
        </Text>
      )}
      
      {/* Interaction Range Ring */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[2.8, 3, 32]} />
        <meshBasicMaterial color={canInteract ? "#f59e0b" : "#475569"} opacity={0.5} transparent />
      </mesh>
    </group>
  );
};