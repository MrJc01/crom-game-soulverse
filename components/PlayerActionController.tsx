import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { InputState } from '../types';
import { dispatchHotbarSlot, dispatchAbilityUse } from '../utils/gameEvents';
import { useVFX } from './effects/VFXManager';

interface ActionControllerProps {
  input: InputState;
  playerPos: THREE.Vector3;
  onAttack: (slot: number, direction: THREE.Vector3) => void;
}

export const PlayerActionController: React.FC<ActionControllerProps> = ({ input, playerPos, onAttack }) => {
  const [activeSlot, setActiveSlot] = useState(1);
  const { camera, raycaster } = useThree();
  const { spawnProjectile, spawnEffect } = useVFX();

  // Cooldown Tracking
  const cooldowns = useRef<Record<number, number>>({});
  
  const SPELL_CONFIG: Record<number, { type: 'PROJECTILE' | 'AOE' | 'WALL', id: string, cd: number }> = {
    1: { type: 'PROJECTILE', id: 'FIREBALL', cd: 500 },
    2: { type: 'AOE', id: 'HEAL_BURST', cd: 5000 },
    3: { type: 'WALL', id: 'EARTH_WALL', cd: 8000 },
  };

  // Slot Selection (1-0)
  useEffect(() => {
    let newSlot = activeSlot;
    if (input.keys['Digit1']) newSlot = 1;
    if (input.keys['Digit2']) newSlot = 2;
    if (input.keys['Digit3']) newSlot = 3;
    if (input.keys['Digit4']) newSlot = 4;
    if (input.keys['Digit5']) newSlot = 5;
    if (input.keys['Digit6']) newSlot = 6;
    if (input.keys['Digit7']) newSlot = 7;
    if (input.keys['Digit8']) newSlot = 8;
    if (input.keys['Digit9']) newSlot = 9;
    if (input.keys['Digit0']) newSlot = 10;

    if (newSlot !== activeSlot) {
        setActiveSlot(newSlot);
        dispatchHotbarSlot(newSlot);
    }
  }, [input.keys, activeSlot]);

  // Attack Logic (Right Mouse Button)
  useFrame(() => {
    if (input.mouse.right) {
      const now = Date.now();
      const config = SPELL_CONFIG[activeSlot];
      const cdDuration = config ? config.cd : 300; 

      if (!cooldowns.current[activeSlot] || now > cooldowns.current[activeSlot]) {
        
        // Raycast logic
        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const ndc = new THREE.Vector2(
            (input.mouse.x / window.innerWidth) * 2 - 1,
            -(input.mouse.y / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(ndc, camera);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(floorPlane, target);

        // Calculate Direction
        const direction = new THREE.Vector3().subVectors(target, playerPos).normalize();
        direction.y = 0; // Keep flat

        // Execute Ability
        if (config) {
            if (config.type === 'PROJECTILE') {
                // OFFSET SPAWN: 1.5 units forward + 1 unit up
                const spawnOrigin = playerPos.clone()
                    .add(direction.clone().multiplyScalar(1.5))
                    .add(new THREE.Vector3(0, 1, 0));
                
                spawnProjectile('FIREBALL', spawnOrigin, direction);
            } else if (config.type === 'AOE') {
                spawnEffect('HEAL_BURST', target);
            } else if (config.type === 'WALL') {
                spawnEffect('EARTH_WALL', target);
            }
        } else {
            // Melee
            onAttack(activeSlot, direction);
        }

        // Apply Cooldown
        cooldowns.current[activeSlot] = now + cdDuration;
        dispatchAbilityUse(activeSlot, cdDuration);
      }
    }
  });

  // Visual Feedback
  const getSlotColor = () => {
    const colors = [
        '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', 
        '#ec4899', '#06b6d4', '#f97316', '#64748b', '#ffffff'
    ];
    return colors[(activeSlot - 1) % colors.length];
  };

  return (
    <group position={[0, 1.2, 0]}>
      <mesh>
        <octahedronGeometry args={[0.08, 0]} />
        <meshBasicMaterial color={getSlotColor()} wireframe />
      </mesh>
    </group>
  );
};