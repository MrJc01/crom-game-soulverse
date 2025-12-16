import * as THREE from 'three';
import { ActiveEntity } from './worldState';

/**
 * Combat Logic Utility
 * Handles the math for detecting hits and the rules for damage application.
 */

/**
 * Checks which entities are hit by a directional attack using a Cone (Sector) check.
 * Optimized to use Squared Distances and Dot Products to avoid expensive square roots / trig.
 * 
 * @param origin - Attacker position
 * @param direction - Normalized direction vector of attack
 * @param range - Max hit distance
 * @param angleRad - Field of view of the attack (e.g. PI/3 for 60 deg)
 * @param entities - List of active entities to check against
 */
export const checkAttackHit = (
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  range: number,
  angleRad: number,
  entities: ActiveEntity[]
): ActiveEntity[] => {
  const rangeSq = range * range;
  // Pre-calculate cosine of half angle for Dot Product comparison
  const cosThreshold = Math.cos(angleRad / 2);

  return entities.filter(entity => {
    if (entity.isDead) return false;

    // 1. Squared Distance Check (Performance)
    // We compute vector from Origin -> Entity
    const toEntity = new THREE.Vector3().subVectors(entity.position, origin);
    
    // Ignore Y height difference for "2.5D" feel
    toEntity.y = 0; 
    
    const distSq = toEntity.lengthSq();
    
    if (distSq > rangeSq) return false;
    
    // 2. Angle Check (Dot Product)
    // Normalize toEntity to get direction
    toEntity.normalize();
    const dot = direction.dot(toEntity); // 1.0 = exact front, 0 = side, -1 = back
    
    return dot > cosThreshold;
  });
};

/**
 * Determines damage outcome.
 * @returns true if target died
 */
export const applyDamageToEntity = (entity: ActiveEntity, damage: number): boolean => {
  entity.currentHp -= damage;
  if (entity.currentHp <= 0) {
    entity.currentHp = 0;
    entity.isDead = true;
    return true;
  }
  return false;
};