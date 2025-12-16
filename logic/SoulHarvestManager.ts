import { SoulEssence, Card, PlayerProfile, Biome, CardRarity } from '../types';
import { calculateAffinityMultiplier } from './AttributeProgression';

/**
 * Generates an Essence object when a mob is defeated.
 */
export const harvestMob = (mobId: string, difficulty: number): SoulEssence => {
  // Mock biome determination based on ID or random
  const biomePool: Biome[] = ['VOLCANIC', 'SWAMP', 'FOREST', 'TUNDRA'];
  const biome = biomePool[Math.floor(Math.random() * biomePool.length)];

  return {
    id: `essence-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    sourceName: `Spirit of ${mobId}`,
    biome: biome,
    powerLevel: Math.floor(difficulty * (0.8 + Math.random() * 0.4)), // Variance +/- 20%
    purity: Math.random(),
    collectedAt: Date.now()
  };
};

/**
 * The Forge Logic.
 * Transforms raw Essence into a Playable Card.
 */
export const forgeCardFromEssence = (essence: SoulEssence, player: PlayerProfile): Card => {
  const multiplier = calculateAffinityMultiplier(player, essence.biome);
  
  // Base Stats based on Power Level
  const baseAttack = Math.floor(essence.powerLevel / 10);
  const baseDefense = Math.floor(essence.powerLevel / 8);
  const cost = Math.max(1, Math.floor(essence.powerLevel / 15));

  // Apply Affinity Multiplier
  const finalAttack = Math.floor(baseAttack * multiplier);
  const finalDefense = Math.floor(baseDefense * multiplier);

  // Determine Rarity based on Purity
  let rarity: CardRarity = 'COMMON';
  if (essence.purity > 0.95) rarity = 'MYTHIC';
  else if (essence.purity > 0.8) rarity = 'LEGENDARY';
  else if (essence.purity > 0.6) rarity = 'RARE';

  return {
    id: `card-${Date.now()}`,
    name: `${essence.biome} Construct`,
    type: 'CREATURE',
    description: `Forged from the ${essence.sourceName}. Imbued with ${player.name}'s spirit.`,
    stats: {
      attack: Math.max(1, finalAttack),
      defense: Math.max(1, finalDefense),
      cost: cost
    },
    rarity: rarity,
    originBiome: essence.biome,
    soulWeight: cost, // Heavier cost = Heavier soul weight
    status: 'MINTED',
    durability: 100,
    requirements: {
      // Add requirement matching the biome
      [biomeToRoot(essence.biome)]: Math.floor(cost / 2)
    }
  };
};

const biomeToRoot = (biome: Biome): string => {
  switch (biome) {
    case 'VOLCANIC': return 'red';
    case 'SWAMP': return 'black';
    case 'FOREST': return 'green';
    case 'TUNDRA': return 'blue';
    case 'ASTRAL': return 'white';
    default: return 'white';
  }
};