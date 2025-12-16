import React, { useEffect, useState } from 'react';

interface TransitionEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export const TransitionEffect: React.FC<TransitionEffectProps> = ({ isActive, onComplete }) => {
  const [stage, setStage] = useState<'HIDDEN' | 'FLASH' | 'SHATTER' | 'FADE'>('HIDDEN');

  useEffect(() => {
    if (isActive && stage === 'HIDDEN') {
      // Sequence: Flash -> Shatter -> Hold -> Fade
      setStage('FLASH');
      
      setTimeout(() => setStage('SHATTER'), 100);
      setTimeout(() => setStage('FADE'), 1500); // Duration of the "Shatter"
      setTimeout(() => {
         setStage('HIDDEN');
         if (onComplete) onComplete();
      }, 2000);
    }
  }, [isActive, onComplete]);

  if (stage === 'HIDDEN') return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes glitch-anim {
          0% { transform: translate(0) }
          20% { transform: translate(-5px, 5px) skewX(10deg); filter: hue-rotate(90deg); }
          40% { transform: translate(-5px, -5px) skewY(5deg); filter: invert(1); }
          60% { transform: translate(5px, 5px) skewX(-10deg); filter: hue-rotate(-90deg); }
          80% { transform: translate(5px, -5px) skewY(-5deg); filter: invert(0); }
          100% { transform: translate(0) }
        }
        .glitch-layer {
          animation: glitch-anim 0.2s infinite;
        }
      `}</style>

      {/* Flash Layer */}
      <div className={`absolute inset-0 bg-white transition-opacity duration-100 ease-out ${stage === 'FLASH' ? 'opacity-100' : 'opacity-0'}`} />

      {/* Shatter/Glitch Layer */}
      {stage === 'SHATTER' && (
        <div className="absolute inset-0 bg-black glitch-layer flex items-center justify-center">
             <div className="text-9xl font-black text-red-600 tracking-tighter scale-150 animate-pulse">
                ENCOUNTER
             </div>
             {/* Scanlines */}
             <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />
        </div>
      )}

      {/* Fade to Battle UI */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-500 ${stage === 'FADE' ? 'opacity-0' : 'opacity-0'}`} />
    </div>
  );
};