import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSpriteAnimator } from '../hooks/useSpriteAnimator';
import { createCharacterSpriteSheet } from '../utils/graphicsUtils';
import { UNIT_SIZE } from '../types';
import { MONSTER_DATABASE } from '../data/monsters';

interface BotProps {
  id: string | number;
  defId: string; // Monster Definition ID
  initialX: number;
  initialZ: number;
  playerRef: React.RefObject<THREE.Group>;
  onSelect: (id: string, pos: THREE.Vector3) => void;
}

type BotState = 'IDLE' | 'WANDER' | 'CHASE' | 'FLEE';

export const Bot: React.FC<BotProps> = ({ id, defId, initialX, initialZ, playerRef, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null);
  const definition = MONSTER_DATABASE[defId];

  // Fallback if definition missing
  if (!definition) return null;

  // AI State
  const [behaviorState, setBehaviorState] = useState<BotState>('IDLE');
  const targetPos = useRef(new THREE.Vector3(initialX, 0, initialZ));
  const [facingRight, setFacingRight] = useState(true);
  
  // Visuals
  const texture = useMemo(() => createCharacterSpriteSheet(definition.physical.spriteColor), [definition]);
  const [isHovered, setIsHovered] = useState(false);
  
  // Aura Ring Ref
  const auraRef = useRef<THREE.Mesh>(null);

  // Animation Hook
  const isMoving = behaviorState !== 'IDLE';
  useSpriteAnimator(texture, 4, 0.15, isMoving);

  const stateTimer = useRef(0);
  const nextDecisionTime = useRef(Math.random() * 3);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    stateTimer.current += delta;
    const currentPos = groupRef.current.position;

    // AURA ANIMATION
    if (auraRef.current) {
        auraRef.current.rotation.z -= delta;
    }

    // --- 1. PROXIMITY CHECK ---
    if (playerRef.current) {
      const distToPlayer = currentPos.distanceTo(playerRef.current.position);
      const aggroDist = definition.physical.aggroRadius;

      if (distToPlayer < aggroDist) {
         if (definition.physical.aiType === 'AGGRESSIVE') {
             setBehaviorState('CHASE');
         } else if (definition.physical.aiType === 'FLEE') {
             setBehaviorState('FLEE');
         }
      } else {
         if (behaviorState === 'CHASE' || behaviorState === 'FLEE') {
             setBehaviorState('IDLE'); // Lost interest
         }
      }
    }

    // --- 2. DECISION MAKING (IDLE/WANDER) ---
    if (behaviorState === 'IDLE' || behaviorState === 'WANDER') {
        if (stateTimer.current > nextDecisionTime.current) {
            stateTimer.current = 0;
            nextDecisionTime.current = 2 + Math.random() * 4;

            if (Math.random() > 0.5) {
                setBehaviorState('WANDER');
                // Pick point near spawn
                const angle = Math.random() * Math.PI * 2;
                const dist = 1 + Math.random() * 3;
                targetPos.current.set(initialX + Math.cos(angle)*dist, 0, initialZ + Math.sin(angle)*dist);
            } else {
                setBehaviorState('IDLE');
            }
        }
    }

    // --- 3. MOVEMENT EXECUTION ---
    let moveDir = new THREE.Vector3();
    const speed = definition.physical.speed * delta;

    if (behaviorState === 'CHASE' && playerRef.current) {
        moveDir.subVectors(playerRef.current.position, currentPos).normalize();
    } else if (behaviorState === 'FLEE' && playerRef.current) {
        moveDir.subVectors(currentPos, playerRef.current.position).normalize();
    } else if (behaviorState === 'WANDER') {
        moveDir.subVectors(targetPos.current, currentPos);
        if (moveDir.length() < 0.1) {
            setBehaviorState('IDLE');
            moveDir.set(0,0,0);
        } else {
            moveDir.normalize();
        }
    }

    if (moveDir.lengthSq() > 0) {
        groupRef.current.position.addScaledVector(moveDir, speed);
        if (moveDir.x > 0) setFacingRight(true);
        if (moveDir.x < 0) setFacingRight(false);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation(); 
    if (groupRef.current) {
      onSelect(String(id), groupRef.current.position);
    }
  };

  return (
    <group 
      ref={groupRef} 
      position={[initialX, 0, initialZ]}
      onClick={handleClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; setIsHovered(true); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setIsHovered(false); }}
    >
      {/* AURA OF DREAD (Difficulty Indicator) */}
      {definition.card.stats.attack >= 4 && (
          <mesh ref={auraRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
             <ringGeometry args={[0.5, 0.6, 16]} />
             <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
      )}

      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh position={[0, 0.5 * UNIT_SIZE, 0]} scale={[facingRight ? 1 : -1, 1, 1]}>
          <planeGeometry args={[UNIT_SIZE, UNIT_SIZE]} />
          <meshBasicMaterial 
            map={texture} 
            transparent 
            alphaTest={0.5} 
            side={THREE.DoubleSide}
            color={isHovered ? '#ffaaaa' : '#ffffff'} 
          />
        </mesh>
      </Billboard>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="black" opacity={0.3} transparent />
      </mesh>
    </group>
  );
};