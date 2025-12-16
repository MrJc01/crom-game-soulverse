import * as THREE from 'three';
import { WorldEntity } from '../types';
import { ActiveEntity } from './worldState';

/**
 * Checks if a proposed position overlaps with any entity in the list.
 */
export const checkCollision = (
  position: THREE.Vector3, 
  entities: WorldEntity[], 
  playerRadius: number = 0.4
): boolean => {
  for (const entity of entities) {
    const dx = position.x - entity.x;
    const dz = position.z - entity.z;
    const distSq = dx * dx + dz * dz;
    const minDist = playerRadius + entity.radius * entity.scale; 
    
    if (distSq < minDist * minDist) {
      return true;
    }
  }
  return false;
};

/**
 * Checks which entities are hit by a directional attack.
 * Uses a Cone/Sector check.
 * 
 * @param origin - Attacker position
 * @param direction - Normalized direction vector
 * @param range - Max hit distance
 * @param angleRad - Field of view of the attack (e.g. PI/4 for 45 deg)
 * @param entities - List of active entities to check against
 */
export const checkAttackHit = (
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  range: number,
  angleRad: number,
  entities: ActiveEntity[]
): ActiveEntity[] => {
  return entities.filter(entity => {
    // 1. Distance Check
    // We clone to avoid modifying the entity's actual position
    const toEntity = new THREE.Vector3().subVectors(entity.position, origin);
    // Ignore Y difference for top-down logic usually, but here we check 3D dist
    const dist = toEntity.length();
    
    if (dist > range) return false;
    
    // 2. Angle Check
    toEntity.normalize();
    const angleToEntity = toEntity.angleTo(direction);
    
    // Check if within half the angle (centered on direction)
    return angleToEntity < (angleRad / 2);
  });
};