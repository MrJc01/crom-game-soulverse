import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OrthographicCamera } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PIXELS_PER_UNIT } from '../types';

interface PixelCameraProps {
  targetRef: React.RefObject<THREE.Group>; // The player to follow
}

export const PixelCamera: React.FC<PixelCameraProps> = ({ targetRef }) => {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const set = useThree((state) => state.set);
  const size = useThree((state) => state.size);
  const gl = useThree((state) => state.gl);

  // Camera State
  // Azimuth: Angle around the Y axis (Horizontal rotation)
  // Elevation: Angle from the Y axis (Vertical tilt). Fixed at ~45deg for Isometric.
  const [azimuth, setAzimuth] = useState(Math.PI / 4); 
  const [zoomScale, setZoomScale] = useState(1); // 1.0 = Default 16px/unit
  const fixedElevation = Math.atan(Math.SQRT1_2); // True Isometric angle (~35.264 deg from ground, or ~54.7 from vertical)
  const radius = 20; // Distance from target

  // Refs for smooth interaction
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const targetAzimuth = useRef(Math.PI / 4);
  const currentAzimuth = useRef(Math.PI / 4);

  // Initialize
  useEffect(() => {
    if (cameraRef.current) {
      set({ camera: cameraRef.current });
      // Set initial pos
      currentAzimuth.current = azimuth;
      targetAzimuth.current = azimuth;
    }
  }, [set]);

  // Handle Resize (Keep 1unit = 16px logic)
  useEffect(() => {
    if (!cameraRef.current) return;
    cameraRef.current.left = -size.width / 2;
    cameraRef.current.right = size.width / 2;
    cameraRef.current.top = size.height / 2;
    cameraRef.current.bottom = -size.height / 2;
    cameraRef.current.updateProjectionMatrix();
  }, [size]);

  // --- Input Handlers ---

  // Mouse Wheel (Zoom)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Zoom In (Delta negative) -> Increase Scale
      // Zoom Out (Delta positive) -> Decrease Scale
      setZoomScale((prev) => THREE.MathUtils.clamp(prev - e.deltaY * 0.001, 0.5, 3.0));
    };
    
    // Attach to canvas element
    const canvas = gl.domElement;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [gl]);

  // Mouse Drag (Orbit)
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
        
        // Rotate azimuth based on horizontal drag
        targetAzimuth.current -= deltaX * 0.01;
      }
    };

    const handleUp = () => {
      isDragging.current = false;
    };

    const canvas = gl.domElement;
    canvas.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [gl]);

  // Arrow Keys (Orbit & Zoom)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Rotation
      if (e.code === 'ArrowLeft') {
        targetAzimuth.current += 0.1; 
      }
      if (e.code === 'ArrowRight') {
        targetAzimuth.current -= 0.1; 
      }
      // Zoom
      if (e.code === 'ArrowUp') {
        setZoomScale((prev) => THREE.MathUtils.clamp(prev + 0.1, 0.5, 3.0));
      }
      if (e.code === 'ArrowDown') {
        setZoomScale((prev) => THREE.MathUtils.clamp(prev - 0.1, 0.5, 3.0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // --- Game Loop ---
  useFrame(() => {
    if (!cameraRef.current || !targetRef.current) return;

    // 1. Smooth Rotation
    // Simple Lerp for rotation
    const rotSpeed = 0.1;
    currentAzimuth.current += (targetAzimuth.current - currentAzimuth.current) * rotSpeed;

    // 2. Calculate Camera Position (Spherical Coordinates)
    // x = r * sin(theta) * cos(phi) (using Y-up convention slightly adjusted)
    // Actually, simple trig:
    // Y is height (Elevation).
    // X/Z are on the plane (Azimuth).
    
    // Height determined by 'True Isometric' angle or fixed 45deg
    const y = radius * Math.cos(fixedElevation); 
    const groundRadius = radius * Math.sin(fixedElevation);
    
    const x = groundRadius * Math.sin(currentAzimuth.current);
    const z = groundRadius * Math.cos(currentAzimuth.current);

    // 3. Apply to Camera (Relative to Target)
    const targetPos = targetRef.current.position;
    
    cameraRef.current.position.x = targetPos.x + x;
    cameraRef.current.position.y = targetPos.y + y;
    cameraRef.current.position.z = targetPos.z + z;
    
    cameraRef.current.lookAt(targetPos);

    // 4. Apply Zoom
    // Base zoom is PIXELS_PER_UNIT (16). 
    // Multiply by user zoom level.
    cameraRef.current.zoom = PIXELS_PER_UNIT * zoomScale;
    cameraRef.current.updateProjectionMatrix();
  });

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      near={-100}
      far={100}
    />
  );
};