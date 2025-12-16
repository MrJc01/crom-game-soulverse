import { WorldChunk, PlayerProfile, Structure, WorldCoordinate, UniverseID, Biome } from '../types';

/**
 * ============================================================================
 *                         WORLD PERSISTENCE & SHARDING
 * ============================================================================
 * 
 * STRATEGY: SPATIAL INDEXING & COMPOUND KEYS
 * 
 * To handle an "Infinite" map in a NoSQL DB (e.g., MongoDB/DynamoDB), we use
 * a Composite Primary Key: `{universeID}#{x}#{y}`.
 * 
 * 1. Queries for "Visible Chunks" can be done via Range Queries on the Grid.
 * 2. "Sharding" is handled natively by the `universeID`.
 * 3. We only store MUTATED chunks. If a chunk is not in the DB, the client
 *    generates it procedurally (Deterministic Seed).
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_DECAY_RATE = 10; // Mana per hour

// Helper: Generate DB Key
export const generateChunkKey = (coord: WorldCoordinate): string => {
  return `${coord.universeId}#${coord.x}#${coord.y}`;
};

// ==========================================
// 1. MANA ANCHOR LOGIC (Claiming)
// ==========================================

export interface ClaimResult {
  success: boolean;
  chunk?: WorldChunk;
  message: string;
}

/**
 * claimChunk
 * Allows a player to establish ownership of a chunk by placing a Mana Anchor.
 */
export const claimChunk = (
  player: PlayerProfile, 
  chunk: WorldChunk, 
  initialMana: number
): ClaimResult => {
  
  // Rule 1: Cannot claim if already owned by someone else (and active)
  if (chunk.ownerID && chunk.ownerID !== player.id) {
    // If the previous anchor is decayed, we can overwrite it (Hostile Takeover logic could go here)
    if (chunk.anchorStatus && chunk.anchorStatus.active) {
      return { success: false, message: "Chunk is owned by another mage." };
    }
  }

  // Rule 2: Validation (e.g., Does player have the item? - Mocked here)
  if (initialMana < 100) {
    return { success: false, message: "Insufficient Mana to ignite the Anchor (Min: 100)." };
  }

  // Rule 3: Update Chunk State
  const now = Date.now();
  
  // Create the Anchor Structure
  const anchorStruct: Structure = {
    id: `anchor-${now}`,
    type: 'ANCHOR',
    localX: 8, // Center of chunk
    localY: 8,
    metadata: { createdBy: player.name }
  };

  const updatedChunk: WorldChunk = {
    ...chunk,
    ownerID: player.id,
    lastVisited: now,
    isModified: true,
    anchorStatus: {
      active: true,
      currentMana: initialMana,
      decayRatePerHour: DEFAULT_DECAY_RATE,
      lastRefueled: now
    },
    // Add anchor to structures if not present
    structures: [...chunk.structures.filter(s => s.type !== 'ANCHOR'), anchorStruct]
  };

  return { 
    success: true, 
    chunk: updatedChunk, 
    message: `Land claimed for ${player.name}. Anchor consuming ${DEFAULT_DECAY_RATE} Mana/Hr.` 
  };
};

// ==========================================
// 2. EROSION ALGORITHM (Garbage Collection)
// ==========================================

/**
 * processWorldErosion
 * This function simulates a background Cron Job that runs periodically (e.g., every hour).
 * It manages the lifecycle of the persistent world.
 * 
 * @param chunk - The chunk retrieved from the DB
 * @param currentTime - Current timestamp (passed for deterministic testing)
 * @returns The updated chunk, or NULL if the chunk should be deleted (Reset to procedural).
 */
export const processWorldErosion = (chunk: WorldChunk, currentTime: number = Date.now()): WorldChunk | null => {
  
  // CASE A: Chunk is UNCLAIMED
  if (!chunk.ownerID || !chunk.anchorStatus?.active) {
    const timeSinceVisit = currentTime - chunk.lastVisited;
    
    // Garbage Collection Rule:
    // If an unclaimed chunk hasn't been visited in 7 days, wipe it from DB.
    if (timeSinceVisit > SEVEN_DAYS_MS) {
      console.log(`[EROSION] Chunk ${chunk.chunkID} has eroded back to the void.`);
      return null; // Signals the DB to DELETE this record
    }
    
    return chunk; // Keep in DB, but it's aging
  }

  // CASE B: Chunk is CLAIMED (Active Anchor)
  if (chunk.anchorStatus && chunk.anchorStatus.active) {
    const anchor = chunk.anchorStatus;
    
    // Calculate Mana Drain
    // (Current Time - Last Calc) in Hours
    const hoursElapsed = (currentTime - anchor.lastRefueled) / (1000 * 60 * 60);
    
    // Determine consumption
    const consumed = hoursElapsed * anchor.decayRatePerHour;
    
    let newMana = anchor.currentMana - consumed;
    
    // Sub-Case: Anchor runs out of fuel
    if (newMana <= 0) {
      newMana = 0;
      
      // ANCHOR FAILURE
      console.log(`[EROSION] Anchor at ${chunk.chunkID} has failed. Ownership lost.`);
      
      return {
        ...chunk,
        ownerID: null, // Ownership revoked
        anchorStatus: {
          ...anchor,
          active: false,
          currentMana: 0,
          lastRefueled: currentTime
        },
        lastVisited: currentTime // Reset timer for the "7 Day Cleanup" to start counting
      };
    }

    // Sub-Case: Anchor healthy
    return {
      ...chunk,
      anchorStatus: {
        ...anchor,
        currentMana: newMana,
        lastRefueled: currentTime // Update timestamp so we don't double-charge
      }
    };
  }

  return chunk;
};

// ==========================================
// 3. MOCK DATABASE (In-Memory)
// ==========================================

// This map represents the Persistent NoSQL Database
export const MOCK_DB_CHUNKS = new Map<string, WorldChunk>();

/**
 * Simulates fetching a chunk.
 * If it doesn't exist in DB, generates a "Fresh" procedural chunk.
 */
export const fetchChunk = (x: number, y: number, universe: UniverseID = 'MATERIAL_PLANE'): WorldChunk => {
  const key = generateChunkKey({ x, y, universeId: universe });
  
  if (MOCK_DB_CHUNKS.has(key)) {
    return MOCK_DB_CHUNKS.get(key)!;
  }

  // PROCEDURAL GENERATION FALLBACK
  // In a real app, this would use Perlin Noise based on (x, y)
  return {
    chunkID: key,
    coordinates: { x, y, universeId: universe },
    biomeType: (x + y) % 2 === 0 ? 'FOREST' : 'SWAMP', // Simple mock procedural rule
    ownerID: null,
    anchorStatus: null,
    lastVisited: Date.now(),
    isModified: false,
    structures: []
  };
};

/**
 * Simulates saving a chunk (Persistence).
 * Only called when a player performs an action.
 */
export const saveChunk = (chunk: WorldChunk): void => {
  MOCK_DB_CHUNKS.set(chunk.chunkID, chunk);
  console.log(`[DB] Saved Chunk ${chunk.chunkID}`);
};
