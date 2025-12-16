import * as THREE from 'three';
import { PIXELS_PER_UNIT } from '../types';

/**
 * Creates a procedural checkerboard texture without external assets.
 * Ensures the filters are set to NearestFilter to avoid blurring.
 */
export const createCheckerboardTexture = (): THREE.DataTexture => {
  const width = 2;
  const height = 2;
  
  const size = width * height;
  const data = new Uint8Array(4 * size);

  // Create a 2x2 grid: White, Grey, Grey, White
  const colors = [
    [255, 255, 255, 255], // White
    [180, 180, 180, 255], // Grey
    [180, 180, 180, 255], // Grey
    [255, 255, 255, 255], // White
  ];

  for (let i = 0; i < size; i++) {
    const stride = i * 4;
    data[stride] = colors[i][0];
    data[stride + 1] = colors[i][1];
    data[stride + 2] = colors[i][2];
    data[stride + 3] = colors[i][3];
  }

  const texture = new THREE.DataTexture(data, width, height);
  texture.needsUpdate = true;
  
  // CRITICAL: Set filters to Nearest to preserve sharp pixel edges
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  
  // Repeat the texture to cover the ground plane
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  // We want the checkerboard to align with our units.
  // If the plane is 100 units wide, we repeat 100/2 times (since texture is 2x2 pixels acting as units)
  texture.repeat.set(50, 50); 

  return texture;
};

/**
 * Creates a generated Grass texture for the environment.
 */
export const createGrassTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error("Could not create 2D context");

  // Base Grass Color (Tailwind Green-500 approx)
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, 0, 64, 64);

  // Add noise/blades
  for (let i = 0; i < 600; i++) {
    const x = Math.floor(Math.random() * 64);
    const y = Math.floor(Math.random() * 64);
    
    // Varying shades of green
    const shade = Math.random() > 0.5 ? '#15803d' : '#166534'; // Green-700 or 800
    ctx.fillStyle = shade;
    
    // Draw pixel blade
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return texture;
};

/**
 * Generates a procedural Pine Tree texture.
 */
export const createTreeTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context failed");

  // Clear
  ctx.clearRect(0,0,32,48);

  // Trunk
  ctx.fillStyle = '#451a03'; // Brown
  ctx.fillRect(14, 38, 4, 10);

  // Leaves (Layered Triangles)
  const drawLayer = (y: number, width: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(16 - width, y + 16);
    ctx.lineTo(16 + width, y + 16);
    ctx.fill();
  };

  drawLayer(24, 12, '#14532d'); // Bottom Dark
  drawLayer(14, 10, '#15803d'); // Mid
  drawLayer(4, 8, '#16a34a');   // Top Light

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
};

/**
 * Generates a procedural Rock texture.
 */
export const createRockTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context failed");

  // Clear
  ctx.clearRect(0,0,32,32);

  // Main Rock Body
  ctx.fillStyle = '#57534e'; // Stone Grey
  ctx.beginPath();
  ctx.arc(16, 24, 10, Math.PI, 0); // Dome
  ctx.lineTo(16, 24);
  ctx.fill();
  ctx.fillRect(6, 20, 20, 8); // Base

  // Highlights
  ctx.fillStyle = '#a8a29e';
  ctx.fillRect(10, 18, 4, 4);
  ctx.fillRect(18, 22, 6, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
};

/**
 * Configure a texture to be pixel-perfect.
 * Use this helper when loading external assets (PNGs).
 */
export const configurePixelTexture = (texture: THREE.Texture) => {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false; 
};

/**
 * Generates a 4-frame sprite sheet (64x16) for testing animation.
 * Frame Layout: [Idle, Walk1, Idle, Walk2]
 */
export const createCharacterSpriteSheet = (primaryColor: string = '#3b82f6'): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  // 4 frames, each 16x16
  canvas.width = 64; 
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error("Could not create 2D context");

  // Clear background (Transparent)
  ctx.clearRect(0, 0, 64, 16);

  // Draw 4 frames
  for (let i = 0; i < 4; i++) {
    const xOffset = i * 16;
    
    // -- Draw a simple Pixel Hero --
    
    // Body (Primary Color)
    ctx.fillStyle = primaryColor; 
    ctx.fillRect(xOffset + 4, 6, 8, 6);

    // Head (Pink/Skin)
    ctx.fillStyle = '#fca5a5'; 
    ctx.fillRect(xOffset + 4, 1, 8, 5);
    
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(xOffset + 5, 3, 2, 2);
    ctx.fillRect(xOffset + 9, 3, 2, 2);

    // Legs (Darker shade of primary) 
    // Simple logic to darken the hex slightly or just use hardcoded dark blue for simplicity
    ctx.fillStyle = '#1e3a8a';
    
    if (i % 2 === 0) {
      // Idle / Neutral Frame
      ctx.fillRect(xOffset + 5, 12, 2, 4); // Left leg
      ctx.fillRect(xOffset + 9, 12, 2, 4); // Right leg
    } else if (i === 1) {
      // Walk Step 1 (Left forward)
      ctx.fillRect(xOffset + 4, 12, 2, 3); 
      ctx.fillRect(xOffset + 9, 12, 2, 4); 
    } else {
      // Walk Step 2 (Right forward)
      ctx.fillRect(xOffset + 5, 12, 2, 4); 
      ctx.fillRect(xOffset + 10, 12, 2, 3); 
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  
  // Pixel Art Settings
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  
  // Setup tiling for the animator
  // We show 1/4th of the texture at a time
  texture.repeat.set(1 / 4, 1);
  texture.offset.x = 0;

  return texture;
};