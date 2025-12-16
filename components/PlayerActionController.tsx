import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { InputState } from '../types';

interface ActionControllerProps {
  input: InputState;
  playerPos: THREE.Vector3;
  onAttack: (slot: number, direction: THREE.Vector3) => void;
}

export const PlayerActionController: React.FC<ActionControllerProps> = ({ input, playerPos, onAttack }) => {
  const [activeSlot, setActiveSlot] = useState(1);
  const { mouse, camera } = useThree();
  const lastAttackTime = useRef(0);
  const COOLDOWN = 500; // ms

  // Slot Selection (1-5)
  useEffect(() => {
    if (input.action1) setActiveSlot(1);
    if (input.action2) setActiveSlot(2);
    if (input.action3) setActiveSlot(3);
    if (input.action4) setActiveSlot(4);
    if (input.action5) setActiveSlot(5);
  }, [input.action1, input.action2, input.action3, input.action4, input.action5]);

  // Attack Logic (Space)
  useFrame(() => {
    if (input.attack) {
      const now = Date.now();
      if (now - lastAttackTime.current > COOLDOWN) {
        // Calculate Attack Direction (Mouse relative to Player)
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        
        // Raycast against infinite floor plane at Y=0
        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(floorPlane, target);
        
        // Direction from Player to Mouse
        const direction = new THREE.Vector3().subVectors(target, playerPos).normalize();
        
        onAttack(activeSlot, direction);
        lastAttackTime.current = now;
      }
    }
  });

  // Visual Feedback: Floating Orb color based on active slot
  const getSlotColor = () => {
    switch(activeSlot) {
      case 1: return '#ef4444'; // Red (Physical/Fire)
      case 2: return '#3b82f6'; // Blue (Magic/Ice)
      case 3: return '#22c55e'; // Green (Nature/Heal)
      case 4: return '#eab308'; // Yellow (Light)
      case 5: return '#a855f7'; // Purple (Void)
      default: return '#ffffff';
    }
  };

  return (
    <group position={[0, 1.2, 0]}>
      {/* Floating Indicator (Diegetic UI) */}
      <mesh>
        <octahedronGeometry args={[0.08, 0]} />
        <meshBasicMaterial color={getSlotColor()} wireframe />
      </mesh>
      <mesh scale={0.5}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshBasicMaterial color={getSlotColor()} transparent opacity={0.5} />
      </mesh>
    </group>
  );
};