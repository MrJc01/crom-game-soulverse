import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Projectile, VisualEffect, ProjectileType, EffectType } from '../../types';
import { getActiveEntities } from '../../utils/worldState';
import { applyDamageToEntity } from '../../utils/combatLogic';
import { useMobManager } from '../../hooks/useMobManager';

interface VFXContextType {
  spawnProjectile: (type: ProjectileType, pos: THREE.Vector3, dir: THREE.Vector3) => void;
  spawnEffect: (type: EffectType, pos: THREE.Vector3) => void;
}

const VFXContext = createContext<VFXContextType | undefined>(undefined);

export const VFXProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [effects, setEffects] = useState<VisualEffect[]>([]);

  const spawnProjectile = useCallback((type: ProjectileType, pos: THREE.Vector3, dir: THREE.Vector3) => {
    const speed = 15; // Speed for fireball
    const velocity = dir.clone().normalize().multiplyScalar(speed);
    
    setProjectiles(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      position: pos.clone(),
      velocity,
      damage: 25,
      radius: 0.5,
      createdAt: Date.now(),
      lifespan: 2000 // 2 seconds
    }]);
  }, []);

  const spawnEffect = useCallback((type: EffectType, pos: THREE.Vector3) => {
    setEffects(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      position: pos.clone(),
      createdAt: Date.now(),
      duration: type === 'EARTH_WALL' ? 8000 : 1000
    }]);
  }, []);

  // Expose the update functions to the renderer via ref binding or just state sharing
  // For React, we pass the state down to the Renderer component
  return (
    <VFXContext.Provider value={{ spawnProjectile, spawnEffect }}>
      <VFXRenderer projectiles={projectiles} setProjectiles={setProjectiles} effects={effects} setEffects={setEffects} />
      {children}
    </VFXContext.Provider>
  );
};

export const useVFX = () => {
  const context = useContext(VFXContext);
  if (!context) throw new Error("useVFX must be used within VFXProvider");
  return context;
};

// --- RENDERER COMPONENT ---

const VFXRenderer = ({ 
  projectiles, setProjectiles,
  effects, setEffects 
}: { 
  projectiles: Projectile[], setProjectiles: React.Dispatch<React.SetStateAction<Projectile[]>>,
  effects: VisualEffect[], setEffects: React.Dispatch<React.SetStateAction<VisualEffect[]>>
}) => {
  
  const { processAttackOnMobs } = useMobManager();

  useFrame((state, delta) => {
    const now = Date.now();
    const entities = getActiveEntities();

    // 1. UPDATE PROJECTILES
    if (projectiles.length > 0) {
      let needsUpdate = false;
      const nextProjectiles = projectiles.filter(p => {
        // Lifespan check
        if (now - p.createdAt > p.lifespan) {
            needsUpdate = true;
            return false;
        }

        // Movement
        p.position.addScaledVector(p.velocity, delta);

        // Collision Check (Simple Sphere)
        let hit = false;
        for (const entity of entities) {
            if (entity.isDead) continue;
            // Ignore Y for top-down generosity
            const distSq = new THREE.Vector2(p.position.x, p.position.z).distanceToSquared(new THREE.Vector2(entity.position.x, entity.position.z));
            const hitboxSum = p.radius + 0.5; // Approx entity radius
            
            if (distSq < hitboxSum * hitboxSum) {
                // HIT!
                processAttackOnMobs([entity], p.damage);
                hit = true;
                break; // One hit per projectile
            }
        }

        if (hit) {
            needsUpdate = true;
            return false; 
        }

        return true;
      });

      if (needsUpdate || nextProjectiles.length !== projectiles.length) {
          setProjectiles(nextProjectiles);
      }
    }

    // 2. UPDATE EFFECTS (Cleanup)
    if (effects.length > 0) {
        const activeEffects = effects.filter(e => now - e.createdAt < e.duration);
        if (activeEffects.length !== effects.length) {
            setEffects(activeEffects);
        }
    }
  });

  return (
    <group>
      {/* Render Projectiles */}
      {projectiles.map(p => (
        <group key={p.id} position={p.position}>
          {p.type === 'FIREBALL' && (
             <mesh>
               <sphereGeometry args={[0.3, 8, 8]} />
               <meshBasicMaterial color="#ef4444" />
               <pointLight color="#fca5a5" intensity={2} distance={4} decay={2} />
               {/* Trail */}
               <mesh position={[0, 0, -0.4]} scale={0.6}>
                  <sphereGeometry args={[0.3, 4, 4]} />
                  <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} />
               </mesh>
             </mesh>
          )}
        </group>
      ))}

      {/* Render Effects */}
      {effects.map(e => (
        <group key={e.id} position={e.position}>
          {e.type === 'HEAL_BURST' && <HealBurstEffect />}
          {e.type === 'EARTH_WALL' && <EarthWallEffect />}
        </group>
      ))}
    </group>
  );
};

// --- SUB-EFFECT COMPONENTS ---

const HealBurstEffect = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (ref.current) {
        ref.current.scale.x += delta * 4;
        ref.current.scale.z += delta * 4;
        ref.current.scale.y += delta * 2;
        if (Array.isArray(ref.current.material)) return;
        (ref.current.material as THREE.MeshBasicMaterial).opacity -= delta * 1.5;
    }
  });
  return (
    <mesh ref={ref} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 16]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
};

const EarthWallEffect = () => {
  const ref = useRef<THREE.Group>(null);
  const [targetY] = useState(0.5); // Final height
  
  useFrame((state, delta) => {
     if (ref.current && ref.current.position.y < 0) {
         ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, 0, delta * 5);
     }
  });

  return (
    <group ref={ref} position={[0, -2, 0]}>
       {/* Main Stone Block */}
       <mesh position={[0, 1, 0]}>
         <boxGeometry args={[3, 2, 0.5]} />
         <meshStandardMaterial color="#57534e" roughness={0.9} />
       </mesh>
       {/* Debris */}
       <mesh position={[1, 0, 0.4]} rotation={[0.2, 0.5, 0]}>
         <dodecahedronGeometry args={[0.4]} />
         <meshStandardMaterial color="#44403c" />
       </mesh>
       <mesh position={[-0.8, 0, -0.4]} rotation={[-0.2, 0.1, 0]}>
         <dodecahedronGeometry args={[0.5]} />
         <meshStandardMaterial color="#44403c" />
       </mesh>
    </group>
  );
};