import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { createRockTexture, createTreeTexture } from '../utils/graphicsUtils';
import { UNIT_SIZE } from '../types';
import { TREES, ROCKS, BOTS } from '../data/worldObjects';
import { Bot } from './Bot';

// Reusable Shadow Component
const BlobShadow = ({ scale = 1 }: { scale?: number }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
    <circleGeometry args={[0.3 * scale, 16]} />
    <meshBasicMaterial color="black" opacity={0.3} transparent />
  </mesh>
);

// --- SWAYING TREE COMPONENT ---
interface TreeProps {
  x: number;
  z: number;
  scale: number;
  texture: THREE.Texture;
  id: string | number;
  onSelect: (id: string, pos: THREE.Vector3) => void;
}

const Tree: React.FC<TreeProps> = ({ x, z, scale, texture, id, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Add life: Swaying animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      // Simple skew effect or rotation. 
      // Rotating Z on a billboard looks like tilting head.
      // Since it's a billboard, rotation is relative to camera. 
      // We'll translate vertices or just simple Z-rot for now.
      meshRef.current.rotation.z = Math.sin(time * 2 + x) * 0.05;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(String(id), new THREE.Vector3(x, 0, z));
  };

  return (
    <group position={[x, 0, z]}>
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh 
          ref={meshRef} 
          position={[0, 0.75 * UNIT_SIZE * scale, 0]}
          onClick={handleClick}
          onPointerOver={() => { document.body.style.cursor = 'pointer'; setIsHovered(true); }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; setIsHovered(false); }}
        >
          <planeGeometry args={[UNIT_SIZE * scale, UNIT_SIZE * 1.5 * scale]} />
          <meshStandardMaterial 
            map={texture} 
            transparent 
            alphaTest={0.5} 
            side={THREE.DoubleSide} 
            emissive={isHovered ? 0x222222 : 0x000000} // Highlight
          />
        </mesh>
      </Billboard>
      <BlobShadow scale={scale} />
    </group>
  );
};

// --- ENVIRONMENT MAIN ---
interface EnvironmentProps {
  playerRef: React.RefObject<THREE.Group>;
  onSelectTarget: (id: string, pos: THREE.Vector3) => void;
}

export const Environment: React.FC<EnvironmentProps> = ({ playerRef, onSelectTarget }) => {
  // Generate Textures Once
  const treeTexture = useMemo(() => createTreeTexture(), []);
  const rockTexture = useMemo(() => createRockTexture(), []);

  return (
    <group>
      {/* --- TREES (Now Animated) --- */}
      {TREES.map((tree) => (
        <Tree 
          key={tree.id} 
          {...tree} 
          texture={treeTexture} 
          onSelect={onSelectTarget}
        />
      ))}

      {/* --- ROCKS (Static) --- */}
      {ROCKS.map((rock) => (
        <group 
          key={rock.id} 
          position={[rock.x, 0, rock.z]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTarget(String(rock.id), new THREE.Vector3(rock.x, 0, rock.z));
          }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
            <mesh position={[0, 0.5 * UNIT_SIZE * rock.scale, 0]}>
              <planeGeometry args={[UNIT_SIZE * rock.scale, UNIT_SIZE * rock.scale]} />
              <meshStandardMaterial 
                map={rockTexture} 
                transparent 
                alphaTest={0.5} 
                side={THREE.DoubleSide}
              />
            </mesh>
          </Billboard>
          <BlobShadow scale={rock.scale} />
        </group>
      ))}

      {/* --- BOTS (Now AI Controlled) --- */}
      {BOTS.map((bot) => (
        <Bot 
          key={bot.id} 
          id={bot.id} 
          initialX={bot.x} 
          initialZ={bot.z} 
          playerRef={playerRef}
          onSelect={onSelectTarget}
        />
      ))}
    </group>
  );
};
