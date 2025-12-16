import * as THREE from 'three';

/**
 * World State Registry
 * 
 * Since entities (Bots) are spawned procedurally inside Chunk components,
 * they are disconnected from the Player's React Context.
 * 
 * We use this mutable registry to track active entities in the scene for
 * physics checks like Hit Detection AND runtime combat stats.
 */

export interface ActiveEntity {
  id: string;
  position: THREE.Vector3; // Reference to the actual THREE.Object3D.position
  defId: string; // Monster Definition ID
  ref: THREE.Group; 
  
  // Combat Stats (Runtime)
  currentHp: number;
  maxHp: number;
  isDuelist: boolean;
  isDead: boolean;
}

// Map for O(1) access by ID
export const ACTIVE_ENTITIES = new Map<string, ActiveEntity>();

export const registerEntity = (id: string, entity: ActiveEntity) => {
  ACTIVE_ENTITIES.set(id, entity);
};

export const unregisterEntity = (id: string) => {
  ACTIVE_ENTITIES.delete(id);
};

export const getActiveEntities = (): ActiveEntity[] => {
  return Array.from(ACTIVE_ENTITIES.values());
};

export const getEntityById = (id: string): ActiveEntity | undefined => {
  return ACTIVE_ENTITIES.get(id);
};