import { useState, useEffect } from 'react';
import { InputState, MouseInput } from '../types';

export const useInput = (): InputState => {
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [mouse, setMouse] = useState<MouseInput>({
    left: false,
    right: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.code]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => ({ ...prev, [e.code]: false }));
    };

    const handleMouseDown = (e: MouseEvent) => {
      setMouse((prev) => ({
        ...prev,
        left: e.button === 0 ? true : prev.left,
        right: e.button === 2 ? true : prev.right
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      setMouse((prev) => ({
        ...prev,
        left: e.button === 0 ? false : prev.left,
        right: e.button === 2 ? false : prev.right
      }));
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMouse((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
    };

    // Disable Context Menu for Right Click attacks
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return { keys, mouse };
};