import { Biome, Card, CardRarity, PlayerProfile, SoulEssence } from '../types';

export interface CraftingRecipe {
  id: string;
  name: string;
  biome: Biome;
  requiredEssenceCount: number; // Count of essences matching biome
  minPowerLevel: number;        // Minimum power level of essence
  outputCardTemplate: Partial<Card>;
}

// Basic Recipes for the Prototype
export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'rcp_pyro_blast',
    name: 'Scroll of Fireball',
    biome: 'VOLCANIC',
    requiredEssenceCount: 2,
    minPowerLevel: 10,
    outputCardTemplate: {
      name: "Fireball",
      type: 'SPELL',
      description: "Deals 4 damage to target creature.",
      stats: { attack: 0, defense: 0, cost: 3 },
      rarity: 'COMMON',
      abilities: [{ trigger: 'ON_PLAY', effectType: 'DEAL_DAMAGE', value: 4, targetRequirement: 'ENEMY_CREATURE' }]
    }
  },
  {
    id: 'rcp_lava_golem',
    name: 'Forged Lava Golem',
    biome: 'VOLCANIC',
    requiredEssenceCount: 3,
    minPowerLevel: 30,
    outputCardTemplate: {
      name: "Lava Golem",
      type: 'CREATURE',
      description: "A heavy construct of molten rock.",
      stats: { attack: 5, defense: 5, cost: 5 },
      rarity: 'RARE'
    }
  },
  {
    id: 'rcp_healing_mist',
    name: 'Vial of Mists',
    biome: 'SWAMP',
    requiredEssenceCount: 1,
    minPowerLevel: 10,
    outputCardTemplate: {
      name: "Healing Mist",
      type: 'SPELL',
      description: "Heal self for 5.",
      stats: { attack: 0, defense: 0, cost: 2 },
      rarity: 'COMMON',
      abilities: [{ trigger: 'ON_PLAY', effectType: 'HEAL', value: 5, targetRequirement: 'SELF' }]
    }
  },
  {
    id: 'rcp_astral_ward',
    name: 'Astral Ward',
    biome: 'ASTRAL',
    requiredEssenceCount: 2,
    minPowerLevel: 50,
    outputCardTemplate: {
      name: "Astral Ward",
      type: 'ENCHANTMENT', // Treated as creature with high def for prototype
      description: "A defensive wall.",
      stats: { attack: 0, defense: 10, cost: 4 },
      rarity: 'LEGENDARY'
    }
  }
];

export const canCraft = (recipe: CraftingRecipe, player: PlayerProfile): boolean => {
  const suitableEssences = player.grimoire.essences.filter(
    e => e.biome === recipe.biome && e.powerLevel >= recipe.minPowerLevel
  );
  return suitableEssences.length >= recipe.requiredEssenceCount;
};

export const craftItem = (recipe: CraftingRecipe, player: PlayerProfile): { success: boolean, newProfile: PlayerProfile, createdCard?: Card } => {
  // 1. Find Ingredients
  const suitableEssences = player.grimoire.essences.filter(
    e => e.biome === recipe.biome && e.powerLevel >= recipe.minPowerLevel
  );

  if (suitableEssences.length < recipe.requiredEssenceCount) {
    return { success: false, newProfile: player };
  }

  // 2. Consume Ingredients (Take the lowest power ones that satisfy the requirement to save good ones? Or just first N)
  // Let's sort by power level ascending to use cheapest first
  suitableEssences.sort((a, b) => a.powerLevel - b.powerLevel);
  const consumed = suitableEssences.slice(0, recipe.requiredEssenceCount);
  const consumedIds = new Set(consumed.map(c => c.id));

  const remainingEssences = player.grimoire.essences.filter(e => !consumedIds.has(e.id));

  // 3. Generate Card
  const newCard: Card = {
    ...recipe.outputCardTemplate as Card,
    id: `crafted-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    originBiome: recipe.biome,
    soulWeight: recipe.outputCardTemplate.stats?.cost || 1,
    status: 'MINTED',
    durability: 100
  };

  // 4. Update Profile
  const newProfile = {
    ...player,
    grimoire: {
      ...player.grimoire,
      essences: remainingEssences,
      collection: [...player.grimoire.collection, newCard],
      deck: [...player.grimoire.deck, newCard] // Auto-add to deck for prototype convenience
    }
  };

  return { success: true, newProfile, createdCard: newCard };
};