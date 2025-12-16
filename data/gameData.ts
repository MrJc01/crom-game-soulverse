import { Card, PlayerProfile, EquipResult } from '../types';

// ==========================================
// LOGIC ENGINE
// ==========================================

export const calculateCurrentSoulUsage = (player: PlayerProfile): number => {
  return player.equippedCreatures.reduce((total, card) => total + card.soulWeight, 0);
};

export const canEquipCard = (player: PlayerProfile, card: Card): EquipResult => {
  if (card.status === 'BROKEN') {
    return { success: false, reason: "Card is BROKEN. Repair at Origin Biome." };
  }
  if (card.status === 'EXILED') {
    return { success: false, reason: "Card is EXILED and cannot be used." };
  }

  if (card.requirements) {
    const roots = ['red', 'blue', 'green', 'white', 'black'] as const;
    for (const root of roots) {
      const requiredLevel = card.requirements[root] || 0;
      const playerLevel = player.magicRoots[root];
      
      if (playerLevel < requiredLevel) {
        return { 
          success: false, 
          reason: `Insufficient ${root.toUpperCase()} Magic. Need Lvl ${requiredLevel}, Have Lvl ${playerLevel}.` 
        };
      }
    }
  }

  const currentUsage = calculateCurrentSoulUsage(player);
  const potentialUsage = currentUsage + card.soulWeight;

  if (potentialUsage > player.soulCap) {
    return { 
      success: false, 
      reason: `Soul Overload. Capacity: ${currentUsage}/${player.soulCap}. Card Weight: ${card.soulWeight}.` 
    };
  }

  return { success: true };
};

// ==========================================
// MOCK DATA GENERATOR
// ==========================================

export const MOCK_CARDS: Record<string, Card> = {
  'goblin-001': {
    id: 'uuid-goblin-001',
    name: 'Goblin Scavenger',
    type: 'CREATURE',
    description: 'A meager creature that thrives in the muck.',
    stats: { attack: 1, defense: 1, cost: 1 },
    rarity: 'COMMON',
    originBiome: 'SWAMP',
    soulWeight: 2,
    status: 'ACTIVE',
    durability: 100,
    requirements: { black: 1 }
  },
  'titan-999': {
    id: 'uuid-titan-999',
    name: 'Astral Titan',
    type: 'CREATURE',
    description: 'A construct of starlight and ancient geometry.',
    stats: { attack: 8, defense: 8, cost: 8 },
    rarity: 'LEGENDARY',
    originBiome: 'ASTRAL',
    soulWeight: 50,
    status: 'MINTED',
    durability: 100,
    requirements: { blue: 5, white: 3 }
  }
};

// Updated Player Structure
export const MOCK_PLAYER: PlayerProfile = {
  id: 'player-alpha',
  name: 'Traveler',
  level: 10,
  
  // Vitals
  currentHp: 80,
  maxHp: 100,
  currentMana: 6,
  maxMana: 10,

  soulCap: 100,
  magicRoots: {
    red: 2,
    blue: 4,
    green: 5,
    white: 1,
    black: 2
  },
  
  // Inventory 1: Backpack
  backpack: {
    slots: 20,
    items: ['potion-healing-s', 'map-volcano']
  },

  // Inventory 2: Grimoire
  grimoire: {
    essences: [],
    deck: [MOCK_CARDS['goblin-001']],
    graveyard: [],
    collection: []
  },

  equippedCreatures: []
};