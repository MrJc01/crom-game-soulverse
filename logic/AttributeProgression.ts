import { MagicRoots, PlayerProfile, Biome } from '../types';

// XP required to reach next level: Level^2 * 100
// Level 1 -> 2: 100 XP
// Level 2 -> 3: 400 XP
// Level 10 -> 11: 10,000 XP
export const getXpForNextLevel = (currentLevel: number): number => {
  return Math.pow(currentLevel, 2) * 100;
};

/**
 * Calculates the stat multiplier for a card based on the player's affinity with that biome.
 * Example: A 'Volcanic' (Red) card forged by a player with Red Level 10 gets a bonus.
 */
export const calculateAffinityMultiplier = (player: PlayerProfile, biome: Biome): number => {
  let rootLevel = 1;
  
  switch (biome) {
    case 'VOLCANIC': rootLevel = player.magicRoots.red; break;
    case 'SWAMP':    rootLevel = player.magicRoots.black; break;
    case 'FOREST':   rootLevel = player.magicRoots.green; break;
    case 'TUNDRA':   rootLevel = player.magicRoots.blue; break;
    case 'ASTRAL':   rootLevel = player.magicRoots.white; break; // Map Astral to White/Order for now
    case 'NEUTRAL':  rootLevel = Math.max(...Object.values(player.magicRoots)); break; // Uses highest stat
  }

  // Base 1.0 + 5% per level
  return 1.0 + (rootLevel * 0.05);
};

/**
 * Adds XP to a specific root and handles leveling up.
 * Returns the new MagicRoots object.
 */
export const gainRootXP = (roots: MagicRoots, type: keyof MagicRoots, amount: number): MagicRoots => {
  // In a real implementation, we'd store XP separately from Level.
  // For this prototype, we just verify the "Level" is the state.
  // We'll simulate a level up chance for simplicity since we don't have an XP store in the type yet.
  
  const currentLevel = roots[type];
  const chanceToLevel = 0.1; // 10% chance per major action for prototype simplicity

  if (Math.random() < chanceToLevel) {
    return {
      ...roots,
      [type]: currentLevel + 1
    };
  }

  return roots;
};

export const canLearnSpell = (player: PlayerProfile, requiredRoots: Partial<MagicRoots>): boolean => {
  for (const [key, value] of Object.entries(requiredRoots)) {
    if (player.magicRoots[key as keyof MagicRoots] < (value || 0)) {
      return false;
    }
  }
  return true;
};