import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SoulMinionEffectProps {
  count: number;
}

const Wisp = ({ offset, speed, radius, color }: { offset: number, speed: number, radius: number, color: string }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * speed + offset;
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.z = Math.sin(t) * radius;
      // Bob up and down
      ref.current.position.y = Math.sin(t * 3) * 0.2 + 0.5;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
};

export const SoulMinionEffect: React.FC<SoulMinionEffectProps> = ({ count }) => {
  // Create an array of wisps based on count
  const wisps = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      key: i,
      offset: (Math.PI * 2 / count) * i,
      speed: 1 + Math.random() * 0.5,
      radius: 0.8 + Math.random() * 0.2,
      color: i % 2 === 0 ? '#3b82f6' : '#a855f7' // Blue and Purple souls
    }));
  }, [count]);

  if (count === 0) return null;

  return (
    <group>
      {wisps.map(w => (
        <Wisp key={w.key} {...w} />
      ))}
    </group>
  );
};