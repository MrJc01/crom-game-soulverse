import { MonsterDefinition, Biome } from '../types';

// --- JSON DATA STRUCTURE FOR MONSTERS ---
// Defines both Physical behavior and Card attributes

export const MONSTER_DATABASE: Record<string, MonsterDefinition> = {
  'pyro_walker': {
    id: 'pyro_walker',
    name: 'Cinder Walker',
    biome: 'VOLCANIC',
    physical: {
      spriteColor: '#ef4444', // Red-500
      baseHp: 80,
      speed: 4.5,
      aggroRadius: 8,
      aiType: 'AGGRESSIVE',
      dropTable: ['ash_pile', 'magma_stone']
    },
    card: {
      cost: 4,
      stats: { attack: 4, defense: 2 },
      abilities: [{
        trigger: 'ON_PLAY',
        effectType: 'DEAL_DAMAGE',
        value: 2,
        targetRequirement: 'ENEMY_CREATURE'
      }]
    }
  },
  'mist_shade': {
    id: 'mist_shade',
    name: 'Mist Shade',
    biome: 'SWAMP',
    physical: {
      spriteColor: '#64748b', // Slate-500
      baseHp: 40,
      speed: 6.0,
      aggroRadius: 5,
      aiType: 'FLEE', // Hard to catch
      dropTable: ['ectoplasm']
    },
    card: {
      cost: 2,
      stats: { attack: 3, defense: 1 },
      abilities: [{
        trigger: 'ON_DEATH',
        effectType: 'DRAW_CARD',
        value: 1,
        targetRequirement: 'SELF'
      }]
    }
  },
  'crystal_golem': {
    id: 'crystal_golem',
    name: 'Prism Guardian',
    biome: 'ASTRAL',
    physical: {
      spriteColor: '#06b6d4', // Cyan-500
      baseHp: 150,
      speed: 2.0,
      aggroRadius: 3,
      aiType: 'PASSIVE',
      dropTable: ['crystal_shard', 'stardust']
    },
    card: {
      cost: 6,
      stats: { attack: 2, defense: 8 },
      abilities: [{
        trigger: 'PASSIVE',
        effectType: 'BUFF_STATS',
        value: 1,
        targetRequirement: 'ALLY_CREATURE'
      }]
    }
  },
  'forest_lurker': {
    id: 'forest_lurker',
    name: 'Moss Lurker',
    biome: 'FOREST',
    physical: {
      spriteColor: '#15803d', // Green-700
      baseHp: 60,
      speed: 3.5,
      aggroRadius: 6,
      aiType: 'AGGRESSIVE',
      dropTable: ['herbs', 'wood']
    },
    card: {
      cost: 3,
      stats: { attack: 3, defense: 3 },
      abilities: [{
        trigger: 'ON_ATTACK',
        effectType: 'HEAL',
        value: 2,
        targetRequirement: 'SELF'
      }]
    }
  }
};

// --- BIOME CONFIGURATION ---
export const BIOME_DATA: Record<Biome, { groundColor: string, monsterPool: string[] }> = {
  VOLCANIC: { 
    groundColor: '#7f1d1d', // Red-900
    monsterPool: ['pyro_walker'] 
  },
  SWAMP: { 
    groundColor: '#1e1b4b', // Indigo-950 (Dark/Wet)
    monsterPool: ['mist_shade'] 
  },
  FOREST: { 
    groundColor: '#14532d', // Green-900
    monsterPool: ['forest_lurker'] 
  },
  TUNDRA: { 
    groundColor: '#f1f5f9', // Slate-100
    monsterPool: ['crystal_golem'] 
  },
  ASTRAL: { 
    groundColor: '#0f172a', // Slate-900 (Space)
    monsterPool: ['crystal_golem'] 
  },
  NEUTRAL: { 
    groundColor: '#78716c', // Stone
    monsterPool: ['forest_lurker'] 
  }
};