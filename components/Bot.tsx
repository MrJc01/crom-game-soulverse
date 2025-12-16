import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSpriteAnimator } from '../hooks/useSpriteAnimator';
import { createCharacterSpriteSheet } from '../utils/graphicsUtils';
import { UNIT_SIZE } from '../types';
import { MONSTER_DATABASE } from '../data/monsters';
import { registerEntity, unregisterEntity, getEntityById } from '../utils/worldState';

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
  
  // Local Death State
  const [isDead, setIsDead] = useState(false);
  const [deathScale, setDeathScale] = useState(1); // Animation value

  // Visuals
  const texture = useMemo(() => createCharacterSpriteSheet(definition.physical.spriteColor), [definition]);
  const [isHovered, setIsHovered] = useState(false);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const auraRef = useRef<THREE.Mesh>(null);

  // Animation Hook
  const isMoving = behaviorState !== 'IDLE' && !isDead;
  useSpriteAnimator(texture, 4, 0.15, isMoving);

  const stateTimer = useRef(0);
  const nextDecisionTime = useRef(Math.random() * 3);

  // --- HIT DETECTION & STATS REGISTRATION ---
  useEffect(() => {
    if (groupRef.current) {
      registerEntity(String(id), {
        id: String(id),
        position: groupRef.current.position, // Live ref to position
        defId: defId,
        ref: groupRef.current,
        // Combat Stats
        currentHp: definition.physical.baseHp,
        maxHp: definition.physical.baseHp,
        isDuelist: definition.physical.isDuelist,
        isDead: false
      });
    }
    return () => unregisterEntity(String(id));
  }, [id, defId, definition]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // --- 1. HANDLE DEATH ANIMATION ---
    const entityRecord = getEntityById(String(id));
    
    // Check if dead in registry
    if (entityRecord && entityRecord.isDead) {
       if (!isDead) setIsDead(true);
       
       // Shrink and fade
       if (deathScale > 0) {
          setDeathScale(prev => Math.max(0, prev - delta * 4));
          groupRef.current.scale.set(deathScale, deathScale, deathScale);
       }
       return; // Stop AI logic
    }

    // --- 2. HIT FLASH EFFECT ---
    if (entityRecord && entityRecord.currentHp < entityRecord.maxHp) {
       // Simple logic: if recent damage, flash red. 
       // For prototype, we just detect if color is not white and lerp back
       if (materialRef.current) {
          // If we want to flash red on hit, the attacker sets the color to red.
          // Here we just recover.
          if (materialRef.current.color.r < 1 || materialRef.current.color.g < 1 || materialRef.current.color.b < 1) {
             // Recover to original tint
             const targetColor = isHovered ? new THREE.Color(1, 0.7, 0.7) : new THREE.Color(1, 1, 1);
             materialRef.current.color.lerp(targetColor, delta * 5);
          }
       }
    }

    stateTimer.current += delta;
    const currentPos = groupRef.current.position;

    // AURA ANIMATION (Duelist)
    if (auraRef.current) {
        auraRef.current.rotation.z -= delta;
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        auraRef.current.scale.set(scale, scale, 1);
    }

    // --- 3. AI LOGIC ---
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
             setBehaviorState('IDLE');
         }
      }
    }

    // Decision Making (IDLE/WANDER)
    if (behaviorState === 'IDLE' || behaviorState === 'WANDER') {
        if (stateTimer.current > nextDecisionTime.current) {
            stateTimer.current = 0;
            nextDecisionTime.current = 2 + Math.random() * 4;

            if (Math.random() > 0.5) {
                setBehaviorState('WANDER');
                const angle = Math.random() * Math.PI * 2;
                const dist = 1 + Math.random() * 3;
                targetPos.current.set(initialX + Math.cos(angle)*dist, 0, initialZ + Math.sin(angle)*dist);
            } else {
                setBehaviorState('IDLE');
            }
        }
    }

    // Movement
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
    if (groupRef.current && !isDead) {
      onSelect(String(id), groupRef.current.position);
    }
  };

  // If animation finished, unmount effectively by rendering null
  if (deathScale <= 0.01) return null;

  return (
    <group 
      ref={groupRef} 
      position={[initialX, 0, initialZ]}
      onClick={handleClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; setIsHovered(true); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setIsHovered(false); }}
    >
      {/* DUELIST AURA */}
      {definition.physical.isDuelist && (
          <mesh ref={auraRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
             <ringGeometry args={[0.5, 0.6, 16]} />
             <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
      )}

      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh position={[0, 0.5 * UNIT_SIZE, 0]} scale={[facingRight ? 1 : -1, 1, 1]}>
          <planeGeometry args={[UNIT_SIZE, UNIT_SIZE]} />
          <meshBasicMaterial 
            ref={materialRef}
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