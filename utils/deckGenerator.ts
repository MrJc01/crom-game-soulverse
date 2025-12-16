import { MonsterDefinition, Card, Biome, CardRarity } from '../types';

/**
 * Creates a playable Card object from the Monster's definition.
 * This represents the "Boss" unit in the card game.
 */
const createSignatureCard = (def: MonsterDefinition): Card => {
  return {
    id: `${def.id}-signature-${Math.random().toString(36).substr(2, 5)}`,
    name: def.name,
    type: 'CREATURE',
    description: `The manifest soul of a ${def.name}.`,
    stats: {
      attack: def.card.stats.attack,
      defense: def.card.stats.defense,
      cost: def.card.cost
    },
    rarity: 'RARE',
    originBiome: def.biome,
    soulWeight: def.card.cost,
    status: 'MINTED',
    durability: 100,
    abilities: def.card.abilities || []
  };
};

/**
 * Generates procedural filler cards based on Biome flavor.
 */
const generateMinionForBiome = (biome: Biome, idSuffix: number): Card => {
  let name = "Minion";
  let attack = 1;
  let defense = 1;
  let cost = 1;
  
  switch (biome) {
    case 'VOLCANIC':
      name = "Ember Sprite";
      attack = 3; defense = 1; cost = 2;
      break;
    case 'SWAMP':
      name = "Muck Leech";
      attack = 1; defense = 3; cost = 2;
      break;
    case 'FOREST':
      name = "Thorn Spitter";
      attack = 2; defense = 2; cost = 2;
      break;
    case 'TUNDRA':
      name = "Ice Shard";
      attack = 4; defense = 1; cost = 3;
      break;
    case 'ASTRAL':
      name = "Void Wisp";
      attack = 2; defense = 4; cost = 3;
      break;
    default:
      name = "Wild Critter";
      attack = 2; defense = 2; cost = 2;
      break;
  }

  // Add random variance
  if (Math.random() > 0.7) {
    attack += 1;
    cost += 1;
    name = "Greater " + name;
  }

  return {
    id: `minion-${biome}-${idSuffix}`,
    name: name,
    type: 'CREATURE',
    description: 'A minor spirit bound to this biome.',
    stats: { attack, defense, cost },
    rarity: 'COMMON',
    originBiome: biome,
    soulWeight: 1,
    status: 'MINTED',
    durability: 100
  };
};

/**
 * Main Deck Generator
 * Constructs a 20-card deck:
 * - 3x Signature Cards (The Mob itself)
 * - 17x Biome-themed Minions
 */
export const generateDeckForMob = (mobDef: MonsterDefinition): Card[] => {
  const deck: Card[] = [];

  // 1. Add Signature Cards (3 Copies)
  for (let i = 0; i < 3; i++) {
    deck.push(createSignatureCard(mobDef));
  }

  // 2. Fill with Biome Minions
  for (let i = 0; i < 17; i++) {
    deck.push(generateMinionForBiome(mobDef.biome, i));
  }

  // Shuffle (Simple sort randomization)
  return deck.sort(() => Math.random() - 0.5);
};