import { useState, useEffect } from 'react';
import { InputState } from '../types';

export const useInput = (): InputState => {
  const [input, setInput] = useState<InputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only using WASD for movement now.
      // Arrow keys are reserved for Camera Rotation.
      switch (e.code) {
        case 'KeyW':
          setInput((prev) => ({ ...prev, forward: true }));
          break;
        case 'KeyA':
          setInput((prev) => ({ ...prev, left: true }));
          break;
        case 'KeyS':
          setInput((prev) => ({ ...prev, backward: true }));
          break;
        case 'KeyD':
          setInput((prev) => ({ ...prev, right: true }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setInput((prev) => ({ ...prev, run: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          setInput((prev) => ({ ...prev, forward: false }));
          break;
        case 'KeyA':
          setInput((prev) => ({ ...prev, left: false }));
          break;
        case 'KeyS':
          setInput((prev) => ({ ...prev, backward: false }));
          break;
        case 'KeyD':
          setInput((prev) => ({ ...prev, right: false }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setInput((prev) => ({ ...prev, run: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return input;
};