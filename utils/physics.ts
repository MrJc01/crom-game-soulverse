import * as THREE from 'three';
import { WorldEntity } from '../types';

/**
 * Checks if a proposed position overlaps with any entity in the list.
 * 
 * @param position - The candidate position (Vector3)
 * @param entities - List of static objects (Trees, Rocks)
 * @param playerRadius - The radius of the moving entity
 * @returns boolean - True if collision detected
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
    const minDist = playerRadius + entity.radius * entity.scale; // Scale affects collision size
    
    // Check Squared Distance for performance (avoids sqrt)
    if (distSq < minDist * minDist) {
      return true;
    }
  }
  return false;
};
