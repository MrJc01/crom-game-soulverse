import { useCallback } from 'react';
import { useBattle } from '../context/BattleContext';
import { ActiveEntity } from '../utils/worldState';
import { applyDamageToEntity } from '../utils/combatLogic';
import { MONSTER_DATABASE, BIOME_DATA } from '../data/monsters';
import { CHUNK_SIZE, Biome } from '../types';

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
  const { startBattle, gainFragments } = useBattle();

  /**
   * Deterministically spawns mobs for a given chunk.
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
          
          // --- FRAGMENT DROP SYSTEM ---
          // Access the definition
          const def = MONSTER_DATABASE[entity.defId];
          // Drops 1-3 fragments
          const fragmentAmount = 1 + Math.floor(Math.random() * 3);
          gainFragments(fragmentAmount);
          console.log(`[Loot] ${entity.defId} dropped ${fragmentAmount} Fragments.`);
        }
      }
    });

    return {
      hitCount: hits.length,
      kills,
      battleTriggered
    };
  }, [startBattle, gainFragments]);

  return {
    spawnMobsForChunk,
    processAttackOnMobs
  };
};