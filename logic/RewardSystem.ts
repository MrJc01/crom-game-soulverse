import { PlayerProfile, MonsterDefinition, LootResult, MagicRoots, Biome } from '../types';
import { harvestMob } from './SoulHarvestManager';

const getMagicRootFromBiome = (biome: Biome): keyof MagicRoots => {
  switch (biome) {
    case 'VOLCANIC': return 'red';
    case 'SWAMP': return 'black';
    case 'FOREST': return 'green';
    case 'TUNDRA': return 'blue';
    case 'ASTRAL': return 'white';
    default: return 'white';
  }
};

/**
 * Calculates rewards after a battle victory.
 * Returns both the Loot details (for UI) and the Updated Player Profile.
 */
export const processBattleVictory = (
  mobDef: MonsterDefinition, 
  player: PlayerProfile
): { loot: LootResult, updatedProfile: PlayerProfile } => {
  
  // 1. Generate Soul Essence
  // Difficulty is roughly based on HP
  const essence = harvestMob(mobDef.name, mobDef.physical.baseHp);

  // 2. Calculate XP
  // XP Amount based on Mob HP (approx 10% of HP)
  const xpAmount = Math.ceil(mobDef.physical.baseHp * 0.5);
  const targetRoot = getMagicRootFromBiome(mobDef.biome);

  // 3. Calculate Fragments
  // Fragments based on mob HP + randomness
  const fragmentsFound = Math.floor(mobDef.physical.baseHp / 5) + Math.floor(Math.random() * 5);

  // 4. Update Player Data (Immutable pattern)
  const updatedRoots = { ...player.magicRoots };
  // Mock Level Up logic: Random chance based on XP amount, or simple threshold
  // For prototype, we just increment the stat if XP is high enough or RNG
  // Real implementation would have a specific XP bucket per root.
  let leveledUp = false;
  
  // Simple "Action Learning": 20% chance to level up skill on kill
  if (Math.random() < 0.2 || xpAmount > 50) {
    updatedRoots[targetRoot] += 1;
    leveledUp = true;
  }

  const updatedProfile: PlayerProfile = {
    ...player,
    magicRoots: updatedRoots,
    fragments: player.fragments + fragmentsFound,
    grimoire: {
      ...player.grimoire,
      essences: [...player.grimoire.essences, essence]
    }
  };

  const loot: LootResult = {
    essence,
    xpRoot: targetRoot,
    xpAmount,
    leveledUp,
    fragmentsFound
  };

  return { loot, updatedProfile };
};