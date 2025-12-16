import { WorldEntity } from '../types';

// Deterministic seed simulation (simple Linear Congruential Generator)
let seed = 123456;
const random = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

// --- STATIC WORLD DATA ---
// We define these here so both the Renderer (Environment.tsx) and the 
// Physics Engine (Player.tsx) share the exact same positions.

export const TREES: WorldEntity[] = [];
export const ROCKS: WorldEntity[] = [];
export const BOTS: WorldEntity[] = [];

// Generate Trees
seed = 100; // Reset seed for consistency
for (let i = 0; i < 50; i++) {
  TREES.push({
    id: `tree-${i}`,
    x: (random() - 0.5) * 80,
    z: (random() - 0.5) * 80,
    scale: 1 + random() * 0.5,
    radius: 0.4 // Collision Radius
  });
}

// Generate Rocks
seed = 200;
for (let i = 0; i < 20; i++) {
  ROCKS.push({
    id: `rock-${i}`,
    x: (random() - 0.5) * 80,
    z: (random() - 0.5) * 80,
    scale: 0.8 + random() * 0.4,
    radius: 0.4
  });
}

// Generate Bots (Starting positions)
seed = 300;
for (let i = 0; i < 5; i++) {
  const angle = (i / 4) * Math.PI; // Semicircle
  const radius = 6;
  BOTS.push({
    id: `bot-${i}`,
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius - 2,
    scale: 1,
    radius: 0.4
  });
}
