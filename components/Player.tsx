import React, { useRef, useMemo, useState, forwardRef } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { Billboard, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useInput } from '../hooks/useInput';
import { useSpriteAnimator } from '../hooks/useSpriteAnimator';
import { createCharacterSpriteSheet } from '../utils/graphicsUtils';
import { MOVEMENT_SPEED, UNIT_SIZE, PlayerProfile } from '../types';
import { socket } from '../utils/socketClient';
import { checkAttackHit } from '../utils/combatLogic';
import { getActiveEntities, getEntityById } from '../utils/worldState'; 
import { PlayerActionController } from './PlayerActionController';
import { SoulMinionEffect } from './effects/SoulMinionEffect';
import { MOCK_PLAYER } from '../data/gameData';
import { useMobManager } from '../hooks/useMobManager';

// --- CUSTOM SHADER: HEALTH DESATURATION ---
// Updated to handle UV Offset/Repeat for Sprite Sheets
const SpriteHealthMaterial = shaderMaterial(
  {
    map: new THREE.Texture(),
    uHealth: 1.0, 
    uRepeat: new THREE.Vector2(1, 1),
    uOffset: new THREE.Vector2(0, 0),
  },
  `
    varying vec2 vUv;
    uniform vec2 uRepeat;
    uniform vec2 uOffset;
    
    void main() {
      // Transform UVs based on texture sprite sheet logic
      vUv = uv * uRepeat + uOffset;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform sampler2D map;
    uniform float uHealth;
    varying vec2 vUv;
    
    void main() {
      vec4 texColor = texture2D(map, vUv);
      float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
      vec3 grayColor = vec3(gray);
      vec3 finalColor = mix(grayColor, texColor.rgb, uHealth);
      if (texColor.a < 0.5) discard;
      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `
);

extend({ SpriteHealthMaterial });

interface PlayerProps {
  locked?: boolean;
}

export const Player = forwardRef<THREE.Group, PlayerProps>(({ locked = false }, ref) => {
  const internalRef = useRef<THREE.Group>(null);
  const groupRef = (ref as React.MutableRefObject<THREE.Group>) || internalRef;
  const materialRef = useRef<any>(null);

  const input = useInput();
  const { camera } = useThree();
  const [facingRight, setFacingRight] = useState(true);
  
  // Hook for Mob Logic (Damage/Battle)
  const { processAttackOnMobs } = useMobManager();

  // Throttling for network emission
  const lastEmitTime = useRef(0);
  const EMIT_INTERVAL = 50; 

  // Player Stats (Ideally these come from context, using Mock for visuals in 3D)
  const healthPercent = MOCK_PLAYER.currentHp / MOCK_PLAYER.maxHp;
  const manaPercent = MOCK_PLAYER.currentMana / MOCK_PLAYER.maxMana;

  // --- ASSET LOADING FIX ---
  // Revert to procedural texture generation to avoid missing file errors
  const texture = useMemo(() => createCharacterSpriteSheet('#3b82f6'), []);
  
  const isMoving = !locked && (input.forward || input.backward || input.left || input.right);
  useSpriteAnimator(texture, 4, 0.15, isMoving);

  const moveVec = new THREE.Vector3();
  const nextPos = new THREE.Vector3();
  const camForward = new THREE.Vector3();
  const camRight = new THREE.Vector3();

  // --- COMBAT LOGIC ---
  const handleAttack = (slot: number, direction: THREE.Vector3) => {
    if (locked || !groupRef.current) return;

    // 1. Get all active mobs from registry
    const activeMobs = getActiveEntities();
    
    // 2. Perform Hit Check (Cone: 2.5 units range, 60 degrees (PI/3))
    const hits = checkAttackHit(
      groupRef.current.position,
      direction,
      2.5, 
      Math.PI / 3, 
      activeMobs
    );

    if (hits.length > 0) {
      // 3. Process Hits via Mob Manager
      const baseDamage = 20; 
      const result = processAttackOnMobs(hits, baseDamage);

      // 4. Feedback
      if (result.hitCount > 0) {
          hits.forEach(hit => {
              const entity = getEntityById(hit.id);
              if (entity && entity.ref) {
                 const mesh = entity.ref.children.find(c => c.type === 'Mesh') as THREE.Mesh;
                 if (mesh && mesh.material instanceof THREE.MeshBasicMaterial) {
                     mesh.material.color.setHex(0xff0000); 
                 }
              }
          });
      }
    }
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update Shader Uniforms
    if (materialRef.current) {
      materialRef.current.uHealth = THREE.MathUtils.lerp(materialRef.current.uHealth, healthPercent, 0.1);
      
      // Critical: Sync shader uniforms with texture properties driven by useSpriteAnimator
      if (texture) {
        materialRef.current.uRepeat = texture.repeat;
        materialRef.current.uOffset = texture.offset;
      }
    }

    if (locked) return;

    const currentPos = groupRef.current.position;
    const oldPosition = currentPos.clone();

    // 1. Calculate Movement Relative to Camera
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();

    camRight.crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

    moveVec.set(0, 0, 0);

    if (input.forward) moveVec.add(camForward);
    if (input.backward) moveVec.sub(camForward);
    if (input.right) moveVec.add(camRight);
    if (input.left) moveVec.sub(camRight);

    if (moveVec.lengthSq() > 0) {
      moveVec.normalize();
      
      const dot = moveVec.dot(camRight);
      if (dot > 0.1) setFacingRight(true);
      if (dot < -0.1) setFacingRight(false);

      const speed = input.run ? MOVEMENT_SPEED * 1.5 : MOVEMENT_SPEED;
      const moveAmount = speed * delta;
      
      nextPos.copy(currentPos).addScaledVector(moveVec, moveAmount);
      groupRef.current.position.copy(nextPos);
    }

    // Network Emission
    const now = Date.now();
    if (now - lastEmitTime.current > EMIT_INTERVAL) {
      if (groupRef.current.position.distanceToSquared(oldPosition) > 0.0001) {
        socket.emit('playerMovement', {
          x: groupRef.current.position.x,
          y: groupRef.current.position.y,
          z: groupRef.current.position.z,
          facingRight: facingRight
        });
        lastEmitTime.current = now;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Mana Amulet */}
      <mesh position={[facingRight ? 0.1 : -0.1, 0.5, 0.05]} scale={0.1}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          emissive="#3b82f6"
          emissiveIntensity={manaPercent * 3} 
          roughness={0.2}
        />
      </mesh>

      <PlayerActionController 
        input={input} 
        playerPos={groupRef.current?.position || new THREE.Vector3()} 
        onAttack={handleAttack}
      />

      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh 
          position={[0, 0.5 * UNIT_SIZE, 0]} 
          scale={[facingRight ? 1 : -1, 1, 1]} 
        >
          <planeGeometry args={[UNIT_SIZE, UNIT_SIZE]} />
          
          {/* @ts-ignore */}
          <spriteHealthMaterial 
            ref={materialRef} 
            map={texture} 
            transparent 
            side={THREE.DoubleSide} 
          />
        </mesh>
      </Billboard>

      <SoulMinionEffect count={3} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshBasicMaterial color="black" opacity={0.3} transparent />
      </mesh>
    </group>
  );
});