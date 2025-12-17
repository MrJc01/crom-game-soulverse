import React, { useRef, useMemo, useState, forwardRef, useEffect } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { Billboard, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useInput } from '../hooks/useInput';
import { useSpriteAnimator } from '../hooks/useSpriteAnimator';
import { createCharacterSpriteSheet } from '../utils/graphicsUtils';
import { MOVEMENT_SPEED, UNIT_SIZE } from '../types';
import { socket } from '../utils/socketClient';
import { checkAttackHit } from '../utils/combatLogic';
import { getActiveEntities, getEntityById } from '../utils/worldState'; 
import { PlayerActionController } from './PlayerActionController';
import { SoulMinionEffect } from './effects/SoulMinionEffect';
import { MOCK_PLAYER } from '../data/gameData';
import { useMobManager } from '../hooks/useMobManager';
import { ChunkCaptureManager } from './world/ChunkCaptureManager';

// --- CUSTOM SHADER: HEALTH DESATURATION ---
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

  const { keys, mouse } = useInput();
  const { camera, raycaster } = useThree();
  const [facingRight, setFacingRight] = useState(true);
  
  // Point-and-Click State
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);

  // Hook for Mob Logic (Damage/Battle)
  const { processAttackOnMobs } = useMobManager();

  // Throttling for network emission
  const lastEmitTime = useRef(0);
  const EMIT_INTERVAL = 50; 

  const healthPercent = MOCK_PLAYER.currentHp / MOCK_PLAYER.maxHp;
  const manaPercent = MOCK_PLAYER.currentMana / MOCK_PLAYER.maxMana;

  const texture = useMemo(() => createCharacterSpriteSheet('#3b82f6'), []);
  
  // Animation state driven by whether we have a target position
  const isMoving = !locked && targetPosition !== null;
  useSpriteAnimator(texture, 4, 0.15, isMoving);

  // --- COMBAT LOGIC CALLBACK ---
  const handleAttack = (slot: number, direction: THREE.Vector3) => {
    if (locked || !groupRef.current) return;

    // 1. Get all active mobs from registry
    const activeMobs = getActiveEntities();
    
    // 2. Perform Hit Check (Cone: 4.0 units range, 45 degrees)
    const hits = checkAttackHit(
      groupRef.current.position,
      direction,
      4.0, 
      Math.PI / 4, 
      activeMobs
    );

    if (hits.length > 0) {
      // 3. Process Hits (Damage scales with slot for fun)
      const baseDamage = 10 + (slot * 5); 
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

  // --- MOUSE CLICK NAVIGATION ---
  useEffect(() => {
    if (mouse.left && !locked) {
        // Raycast to floor
        const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        
        // Map mouse screen coords to NDC
        const ndc = new THREE.Vector2(
            (mouse.x / window.innerWidth) * 2 - 1,
            -(mouse.y / window.innerHeight) * 2 + 1
        );
        
        raycaster.setFromCamera(ndc, camera);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(floorPlane, target);

        if (target) {
            setTargetPosition(target);
        }
    }
  }, [mouse.left, mouse.x, mouse.y, locked, camera, raycaster]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Shader Update
    if (materialRef.current) {
      materialRef.current.uHealth = THREE.MathUtils.lerp(materialRef.current.uHealth, healthPercent, 0.1);
      if (texture) {
        materialRef.current.uRepeat = texture.repeat;
        materialRef.current.uOffset = texture.offset;
      }
    }

    if (locked) return;

    const currentPos = groupRef.current.position;
    const oldPosition = currentPos.clone();

    // --- MOVEMENT LOGIC (Linear Interpolation towards Click) ---
    if (targetPosition) {
        const direction = new THREE.Vector3().subVectors(targetPosition, currentPos);
        const distance = direction.length();
        
        if (distance > 0.1) {
            direction.normalize();
            
            // Facing
            if (direction.x > 0.1) setFacingRight(true);
            if (direction.x < -0.1) setFacingRight(false);
            
            // Move
            const moveStep = MOVEMENT_SPEED * delta;
            // Don't overshoot
            const actualMove = Math.min(moveStep, distance);
            
            groupRef.current.position.addScaledVector(direction, actualMove);
        } else {
            // Arrived
            setTargetPosition(null);
        }
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
      
      {/* Target Marker */}
      {targetPosition && (
          <mesh position={[targetPosition.x, 0.02, targetPosition.z]} rotation={[-Math.PI/2, 0, 0]}>
              <ringGeometry args={[0.3, 0.4, 16]} />
              <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
          </mesh>
      )}

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
        input={{ keys, mouse }}
        playerPos={groupRef.current?.position || new THREE.Vector3()} 
        onAttack={handleAttack}
      />

      <ChunkCaptureManager 
         playerPos={groupRef.current?.position}
         isMining={keys['KeyL']}
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