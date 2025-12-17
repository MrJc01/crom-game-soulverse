import { Biome } from '../types';

// Simple deterministic hash for procedural gen (pseudo-noise)
export const pseudoRandom = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

export const getBiomeAt = (cx: number, cy: number): Biome => {
  // Use Perlin-like noise logic (simplified to hash here)
  const val = pseudoRandom(cx * 0.1, cy * 0.1);
  if (val < 0.2) return 'VOLCANIC';
  if (val < 0.4) return 'SWAMP';
  if (val < 0.6) return 'FOREST';
  if (val < 0.8) return 'TUNDRA';
  return 'NEUTRAL';
};