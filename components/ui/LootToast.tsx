import React, { useEffect, useState } from 'react';
import { LootResult } from '../../types';

interface LootToastProps {
  loot: LootResult;
  onClose: () => void;
}

export const LootToast: React.FC<LootToastProps> = ({ loot, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Wait for exit anim
    }, 4000);
    return () => clearTimeout(timer);
  }, [loot, onClose]);

  const rootColors: Record<string, string> = {
      red: 'text-red-400 border-red-500 bg-red-950',
      blue: 'text-blue-400 border-blue-500 bg-blue-950',
      green: 'text-green-400 border-green-500 bg-green-950',
      white: 'text-yellow-100 border-yellow-200 bg-slate-800',
      black: 'text-purple-400 border-purple-500 bg-slate-950'
  };

  const theme = rootColors[loot.xpRoot] || rootColors['white'];

  return (
    <div 
        className={`fixed top-24 right-8 z-[60] w-80 font-mono transition-all duration-500 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
        <div className={`border-l-4 p-4 shadow-2xl relative overflow-hidden ${theme} bg-opacity-90 backdrop-blur-md`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl animate-bounce">✨</div>
                <h3 className="text-lg font-bold text-white uppercase tracking-widest">Victory Loot</h3>
            </div>

            {/* Essence Section */}
            <div className="mb-3 border-b border-white/20 pb-2">
                <div className="text-xs text-white/60 mb-1">SOUL HARVESTED</div>
                <div className="font-bold text-white text-sm flex justify-between">
                    <span>{loot.essence.sourceName}</span>
                    <span className="text-yellow-400">PWR {loot.essence.powerLevel}</span>
                </div>
                <div className="text-[10px] text-white/40 italic">{loot.essence.biome} Essence</div>
            </div>

            {/* XP Section */}
            <div>
                <div className="text-xs text-white/60 mb-1">MAGIC AFFINITY</div>
                <div className="flex justify-between items-center">
                    <span className="capitalize">{loot.xpRoot} Magic</span>
                    <span className="font-bold">+ {loot.xpAmount} XP</span>
                </div>
                
                {/* Level Up Badge */}
                {loot.leveledUp && (
                    <div className="mt-2 bg-white/20 text-center py-1 text-xs font-bold text-yellow-300 border border-yellow-500 animate-pulse">
                        LEVEL UP!
                    </div>
                )}
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
        </div>
    </div>
  );
};