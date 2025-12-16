import React from 'react';
import { CardInstance } from '../../game/DuelEngine';

interface CardProps {
  card: CardInstance;
  location: 'HAND' | 'FIELD';
  isPlayable?: boolean; // Can be played from hand?
  canAttack?: boolean;  // Can attack on field?
  onClick?: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: 'bg-slate-200 text-slate-900',
  RARE: 'bg-blue-200 text-blue-900',
  LEGENDARY: 'bg-amber-200 text-amber-900',
};

export const Card: React.FC<CardProps> = ({ card, location, isPlayable, canAttack, onClick }) => {
  
  // -- PIXEL ART STYLES --
  // Hard shadows, no blur, thick borders
  const baseStyle = "transition-all duration-75 select-none relative box-border font-mono border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]";
  
  // Determine Card Background based on Rarity (we don't have rarity on Instance, strictly speaking, but we can infer or default)
  const bgClass = RARITY_COLORS['COMMON']; // Default to common for prototype

  // --- FIELD VIEW (TOKEN) ---
  if (location === 'FIELD') {
    const statusClass = card.isExhausted 
      ? "grayscale opacity-80 translate-y-1" 
      : "cursor-pointer hover:-translate-y-1";
    
    const glowClass = canAttack && !card.isExhausted ? "ring-2 ring-red-500 ring-offset-2" : "";

    return (
      <div 
        onClick={canAttack ? onClick : undefined}
        className={`${baseStyle} ${bgClass} ${statusClass} ${glowClass} w-24 h-24 flex flex-col items-center justify-between p-1`}
      >
        <div className="text-[10px] font-bold truncate w-full text-center bg-black/10">{card.name}</div>
        
        {/* Art Placeholder */}
        <div className="w-12 h-8 bg-slate-700/20 border border-black/20 flex items-center justify-center">
           ⚔️
        </div>

        {/* Stats Row */}
        <div className="flex w-full justify-between px-1 font-bold text-sm">
          <div className="text-red-700 bg-white/50 px-1 rounded-sm border border-black/10">{card.attack}</div>
          <div className="text-green-700 bg-white/50 px-1 rounded-sm border border-black/10">{card.health}</div>
        </div>

        {card.isExhausted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <span className="text-[10px] text-white bg-black px-1">ZZZ</span>
          </div>
        )}
      </div>
    );
  }

  // --- HAND VIEW (FULL CARD) ---
  const interactClass = isPlayable 
    ? "cursor-pointer hover:-translate-y-4 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.5)] hover:z-10" 
    : "opacity-60 cursor-not-allowed grayscale";

  return (
    <div 
      onClick={isPlayable ? onClick : undefined}
      className={`${baseStyle} ${bgClass} ${interactClass} w-32 h-48 flex flex-col p-2 text-xs`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2 border-b border-black/20 pb-1">
        <span className="font-bold leading-tight w-20 truncate">{card.name}</span>
        <span className="bg-cyan-600 text-white w-5 h-5 flex items-center justify-center rounded-full font-bold border border-black">
          {card.cost}
        </span>
      </div>

      {/* Art */}
      <div className="w-full h-16 bg-slate-800 border-2 border-slate-700 mb-2 flex items-center justify-center text-slate-500">
        IMG
      </div>

      {/* Description */}
      <div className="flex-grow text-[9px] leading-3 opacity-80 overflow-hidden">
        Standard Creature. Does battle things.
      </div>

      {/* Footer Stats */}
      <div className="mt-auto flex justify-between items-center pt-2 border-t border-black/20 text-lg font-bold">
        <div className="flex items-center gap-1 text-red-800">
          <span>⚔️</span>{card.attack}
        </div>
        <div className="flex items-center gap-1 text-green-800">
          <span>🛡️</span>{card.health}
        </div>
      </div>
    </div>
  );
};