import { useCallback } from 'react';
import { useBattle } from '../context/BattleContext';
import { ActiveEntity } from '../utils/worldState';
import { applyDamageToEntity } from '../utils/combatLogic';
import { MONSTER_DATABASE, BIOME_DATA } from '../data/monsters';
import { CHUNK_SIZE, Biome } from '../types';
import { MOCK_PLAYER } from '../data/gameData';

export interface CombatInteractionResult {
  hitCount: number;
  kills: string[];
  battleTriggered: boolean;
}

// Deterministic pseudo-random for mob placement
const pseudoRandom = (seed: number) => {
  const n = Math.sin(seed) * 43758.5453;
  return n - Math.floor(n);
};

export const useMobManager = () => {
  const { startBattle } = useBattle();

  /**
   * Deterministically spawns mobs for a given chunk.
   * This logic is extracted here so ProceduralWorld delegates the "What" to spawn,
   * while maintaining the "Where" (Chunk grid).
   */
  const spawnMobsForChunk = useCallback((cx: number, cy: number, biome: Biome) => {
    const seed = cx * 1000 + cy;
    const config = BIOME_DATA[biome];
    const mobs = [];

    // 40% chance to spawn a mob in a chunk (if pool exists)
    if (pseudoRandom(seed) > 0.6 && config.monsterPool.length > 0) {
      // Pick random mob from pool
      const mobIndex = Math.floor(pseudoRandom(seed + 1) * config.monsterPool.length);
      const mobType = config.monsterPool[mobIndex];
      const def = MONSTER_DATABASE[mobType];
      
      if (def) {
        mobs.push({
            id: `mob-${cx}-${cy}`,
            defId: mobType,
            // Random position within chunk
            x: (cx * CHUNK_SIZE) + (pseudoRandom(seed + 2) * CHUNK_SIZE - CHUNK_SIZE/2),
            z: (cy * CHUNK_SIZE) + (pseudoRandom(seed + 3) * CHUNK_SIZE - CHUNK_SIZE/2),
            definition: def
        });
      }
    }
    return mobs;
  }, []);

  /**
   * Processes an attack on a list of hit entities.
   * Handles the divergence between "Trash Mobs" (Real-time death) and "Duelists" (Card Battle).
   */
  const processAttackOnMobs = useCallback((hits: ActiveEntity[], baseDamage: number): CombatInteractionResult => {
    const kills: string[] = [];
    let battleTriggered = false;

    hits.forEach(entity => {
      // 1. DUELIST LOGIC (Bosses / Special Enemies)
      if (entity.isDuelist) {
        // Trigger Battle IMMEDIATELY on hit
        if (!battleTriggered) {
          console.log(`[Combat] Duelist ${entity.defId} challenged! Initiating Soul Battle.`);
          startBattle(entity.defId);
          battleTriggered = true;
        }
      } 
      
      // 2. TRASH MOB LOGIC (Real-time Combat)
      else {
        const isDead = applyDamageToEntity(entity, baseDamage);
        console.log(`[Combat] Hit ${entity.defId} for ${baseDamage}. HP: ${entity.currentHp}/${entity.maxHp}`);
        
        if (isDead) {
          kills.push(entity.id);
          
          // --- LOOT SYSTEM ---
          // Access the definition to find the drop table
          const def = MONSTER_DATABASE[entity.defId];
          if (def && def.physical.dropTable && def.physical.dropTable.length > 0) {
             const dropIndex = Math.floor(Math.random() * def.physical.dropTable.length);
             const droppedItem = def.physical.dropTable[dropIndex];
             
             // Add to Player Inventory (Mutating Mock Data)
             MOCK_PLAYER.backpack.items.push(droppedItem);
             console.log(`[Loot] ${entity.defId} dropped: ${droppedItem}`);
          }
        }
      }
    });

    return {
      hitCount: hits.length,
      kills,
      battleTriggered
    };
  }, [startBattle]);

  return {
    spawnMobsForChunk,
    processAttackOnMobs
  };
};