import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSpriteAnimator } from '../hooks/useSpriteAnimator';
import { createCharacterSpriteSheet } from '../utils/graphicsUtils';
import { UNIT_SIZE } from '../types';
import { socket } from '../utils/socketClient';

interface NetworkPlayerProps {
  id: string;
  initialPos: { x: number; y: number; z: number };
  color: string;
  initialFacingRight?: boolean;
}

export const NetworkPlayer: React.FC<NetworkPlayerProps> = ({ id, initialPos, color, initialFacingRight = true }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Target position for interpolation
  const targetPos = useRef(new THREE.Vector3(initialPos.x, initialPos.y, initialPos.z));
  const [facingRight, setFacingRight] = useState(initialFacingRight);
  const [isMoving, setIsMoving] = useState(false);

  // Generate sprite sheet (reused utility) - Use player's color
  const texture = useMemo(() => createCharacterSpriteSheet(color), [color]);
  
  // Hook up animator
  useSpriteAnimator(texture, 4, 0.15, isMoving);

  useEffect(() => {
    // Listen for updates specific to this player
    const handleMove = (data: any) => {
      if (data.id === id) {
        targetPos.current.set(data.x, data.y, data.z);
        setFacingRight(data.facingRight);
        setIsMoving(true);
      }
    };

    socket.on('playerMoved', handleMove);

    return () => {
      socket.off('playerMoved', handleMove);
    };
  }, [id]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Linear Interpolation (LERP) for smooth movement
    // 10 * delta gives a quick but smooth catch-up
    groupRef.current.position.lerp(targetPos.current, 10 * delta);

    // Check if we are close enough to stop animation
    if (groupRef.current.position.distanceTo(targetPos.current) < 0.05) {
      setIsMoving(false);
    }
  });

  return (
    <group ref={groupRef} position={[initialPos.x, initialPos.y, initialPos.z]}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh 
          position={[0, 0.5 * UNIT_SIZE, 0]} 
          scale={[facingRight ? 1 : -1, 1, 1]} 
        >
          <planeGeometry args={[UNIT_SIZE, UNIT_SIZE]} />
          
          <meshBasicMaterial 
            map={texture} 
            color={0xffffff} // Texture already colored
            transparent 
            alphaTest={0.5} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      </Billboard>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="black" opacity={0.3} transparent />
      </mesh>
    </group>
  );
};