import { Vector3 } from 'three';

// --- Engine Types ---
export interface PlayerState {
  position: Vector3;
  velocity: Vector3;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
}

// Global constants
export const UNIT_SIZE = 1; 
export const PIXELS_PER_UNIT = 16; 
export const MOVEMENT_SPEED = 5; 
export const CHUNK_SIZE = 16; 

// --- WORLD ENTITIES ---
export interface WorldEntity {
  id: string | number;
  x: number;
  z: number;
  scale: number;
  radius: number; 
}

export interface MonsterEntity extends WorldEntity {
  defId: string; // Reference to MonsterDefinition
  currentHp: number;
  maxHp: number;
  level: number; // Determines Aura
}

// --- DATA ARCHITECTURE ---

export type CardType = 'CREATURE' | 'SPELL' | 'ENCHANTMENT' | 'LAND';
export type CardRarity = 'COMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC';
export type CardStatus = 'MINTED' | 'ACTIVE' | 'BROKEN' | 'EXILED';
export type Biome = 'VOLCANIC' | 'SWAMP' | 'FOREST' | 'TUNDRA' | 'ASTRAL' | 'NEUTRAL';

export interface MagicRoots {
  red: number;   
  blue: number;  
  green: number; 
  white: number; 
  black: number; 
}

// --- NEW MONSTER DEFINITION (Dual-State) ---
export interface MonsterDefinition {
  id: string;
  name: string;
  biome: Biome;
  
  // State A: Physical World
  physical: {
    spriteColor: string;
    baseHp: number;
    speed: number;
    aggroRadius: number;
    aiType: 'AGGRESSIVE' | 'PASSIVE' | 'FLEE';
    dropTable: string[]; // IDs of physical items
  };

  // State B: Card Form
  card: {
    cost: number;
    stats: {
      attack: number;
      defense: number;
    };
    abilities: Ability[];
  };
}

// Soul Harvesting & Crafting
export interface SoulEssence {
  id: string;
  sourceName: string;
  biome: Biome;
  powerLevel: number; 
  purity: number; 
  collectedAt: number; 
}

// Ability System
export type AbilityTrigger = 'ON_PLAY' | 'ON_DEATH' | 'ON_ATTACK' | 'PASSIVE';
export type EffectType = 'DEAL_DAMAGE' | 'HEAL' | 'BUFF_STATS' | 'DRAW_CARD';
export type TargetRequirement = 'NONE' | 'SELF' | 'ENEMY_CREATURE' | 'ENEMY_PLAYER' | 'ALLY_CREATURE';

export interface Ability {
  trigger: AbilityTrigger;
  effectType: EffectType;
  value: number;
  targetRequirement: TargetRequirement;
}

export interface Card {
  id: string; 
  name: string;
  type: CardType;
  description: string;
  stats: {
    attack: number;
    defense: number;
    cost: number; 
  };
  rarity: CardRarity;
  originBiome: Biome; 
  soulWeight: number; 
  status: CardStatus;
  durability: number; 
  requirements?: Partial<MagicRoots>; 
  abilities?: Ability[];
}

// --- UPDATED PLAYER PROFILE (Dual-Inventory) ---
export interface PlayerProfile {
  id: string;
  name: string;
  level: number; 
  
  // Vitals (For UI Feedback)
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  
  soulCap: number; 
  magicRoots: MagicRoots;

  // Inventory 1: Physical Backpack (Lootable on Death)
  backpack: {
    slots: number;
    items: string[]; // Resource IDs
  };

  // Inventory 2: The Grimoire (Soulbound)
  grimoire: {
    essences: SoulEssence[]; 
    deck: Card[];        
    graveyard: Card[];   
    collection: Card[];
  };
  
  equippedCreatures: Card[]; 
}

export interface EquipResult {
  success: boolean;
  reason?: string;
}

// --- Battle Types (Unchanged) ---
export enum BattlePhase {
  SETUP = 'SETUP',
  DRAW_PHASE = 'DRAW_PHASE',
  MAIN_PHASE = 'MAIN_PHASE',
  COMBAT_PHASE = 'COMBAT_PHASE',
  END_PHASE = 'END_PHASE',
  RESOLUTION = 'RESOLUTION'
}

export interface StackItem {
  id: string;
  sourceCardId: string;
  effect: (gameState: BattleState) => void;
}

export interface BattleState {
  turnCount: number;
  activePlayerId: string;
  phase: BattlePhase;
  theStack: StackItem[];
  playerA: PlayerProfile;
  playerB: PlayerProfile;
}

export interface CombatResult {
  attackerId: string;
  defenderId: string;
  damageDealt: number;
  isLethal: boolean;
  defenderStatusAfter: CardStatus;
}

export type UniverseID = 'MATERIAL_PLANE' | 'SHADOW_REALM' | 'ASTRAL_SEA';

export interface WorldCoordinate {
  universeId: UniverseID;
  x: number;
  y: number;
}

export interface Structure {
  id: string;
  type: 'ANCHOR' | 'TOWER' | 'WALL';
  localX: number;
  localY: number;
  metadata?: any;
}

export interface AnchorStatus {
  active: boolean;
  currentMana: number;
  decayRatePerHour: number;
  lastRefueled: number;
}

export interface WorldChunk {
  chunkID: string;
  coordinates: WorldCoordinate;
  biomeType: Biome;
  ownerID: string | null;
  anchorStatus: AnchorStatus | null;
  lastVisited: number;
  isModified: boolean;
  structures: Structure[];
}