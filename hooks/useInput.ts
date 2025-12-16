import { useState, useEffect } from 'react';
import { InputState } from '../types';

export const useInput = (): InputState => {
  const [input, setInput] = useState<InputState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    action1: false,
    action2: false,
    action3: false,
    action4: false,
    action5: false,
    attack: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setInput((prev) => ({ ...prev, forward: true })); break;
        case 'KeyA': setInput((prev) => ({ ...prev, left: true })); break;
        case 'KeyS': setInput((prev) => ({ ...prev, backward: true })); break;
        case 'KeyD': setInput((prev) => ({ ...prev, right: true })); break;
        case 'ShiftLeft':
        case 'ShiftRight': setInput((prev) => ({ ...prev, run: true })); break;
        
        // Actions
        case 'Space': setInput((prev) => ({ ...prev, attack: true })); break;
        case 'Digit1': setInput((prev) => ({ ...prev, action1: true })); break;
        case 'Digit2': setInput((prev) => ({ ...prev, action2: true })); break;
        case 'Digit3': setInput((prev) => ({ ...prev, action3: true })); break;
        case 'Digit4': setInput((prev) => ({ ...prev, action4: true })); break;
        case 'Digit5': setInput((prev) => ({ ...prev, action5: true })); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setInput((prev) => ({ ...prev, forward: false })); break;
        case 'KeyA': setInput((prev) => ({ ...prev, left: false })); break;
        case 'KeyS': setInput((prev) => ({ ...prev, backward: false })); break;
        case 'KeyD': setInput((prev) => ({ ...prev, right: false })); break;
        case 'ShiftLeft':
        case 'ShiftRight': setInput((prev) => ({ ...prev, run: false })); break;
        
        // Actions
        case 'Space': setInput((prev) => ({ ...prev, attack: false })); break;
        case 'Digit1': setInput((prev) => ({ ...prev, action1: false })); break;
        case 'Digit2': setInput((prev) => ({ ...prev, action2: false })); break;
        case 'Digit3': setInput((prev) => ({ ...prev, action3: false })); break;
        case 'Digit4': setInput((prev) => ({ ...prev, action4: false })); break;
        case 'Digit5': setInput((prev) => ({ ...prev, action5: false })); break;
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