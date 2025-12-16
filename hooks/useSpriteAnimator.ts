import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * useSpriteAnimator
 * A hook that updates texture UV offsets to simulate animation.
 * 
 * @param texture - The THREE.Texture to animate
 * @param tilesHoriz - Number of frames horizontally in the sprite sheet
 * @param frameDuration - Duration of each frame in seconds
 * @param isPlaying - Whether the animation should run
 */
export const useSpriteAnimator = (
  texture: THREE.Texture,
  tilesHoriz: number,
  frameDuration: number,
  isPlaying: boolean
) => {
  const timer = useRef(0);
  const currentFrame = useRef(0);

  useFrame((state, delta) => {
    if (!texture) return;

    if (!isPlaying) {
      // Reset to idle frame (0) when stopped
      if (currentFrame.current !== 0) {
        currentFrame.current = 0;
        texture.offset.x = 0;
      }
      return;
    }

    timer.current += delta;

    if (timer.current >= frameDuration) {
      // Advance frame
      timer.current = 0; // Reset timer (or subtract duration for precision)
      
      currentFrame.current = (currentFrame.current + 1) % tilesHoriz;
      
      // Update UV X-offset
      // offset = frameIndex * (1 / totalFrames)
      texture.offset.x = currentFrame.current / tilesHoriz;
    }
  });
};