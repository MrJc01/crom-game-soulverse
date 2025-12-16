import React from 'react';
import { CardInstance } from '../../game/DuelEngine';

interface GameCardProps {
  card?: CardInstance; // Optional for OPPONENT back-of-card view
  variant: 'HAND' | 'FIELD' | 'OPPONENT_HAND';
  isPlayable?: boolean;
  canAttack?: boolean;
  onClick?: () => void;
}

// Biome-based styling for flavor
const BIOME_STYLES: Record<string, string> = {
  VOLCANIC: 'bg-red-200 border-red-900',
  SWAMP: 'bg-slate-400 border-slate-900',
  FOREST: 'bg-emerald-200 border-emerald-900',
  TUNDRA: 'bg-cyan-200 border-cyan-900',
  ASTRAL: 'bg-indigo-200 border-indigo-900',
  NEUTRAL: 'bg-amber-100 border-amber-900',
};

export const GameCard: React.FC<GameCardProps> = ({ 
  card, 
  variant, 
  isPlayable = false, 
  canAttack = false, 
  onClick 
}) => {
  
  // --- VARIANT: OPPONENT HAND (Card Back) ---
  if (variant === 'OPPONENT_HAND') {
    return (
      <div className="w-16 h-24 bg-red-900 border-2 border-white/50 rounded-sm shadow-md transform hover:-translate-y-2 transition-transform relative overflow-hidden">
         <div className="absolute inset-2 border border-red-950/50 opacity-50" />
         <div className="absolute inset-0 flex items-center justify-center text-red-950/20 font-bold text-2xl">?</div>
      </div>
    );
  }

  if (!card) return null;

  const baseTheme = BIOME_STYLES[card.originalId] || BIOME_STYLES['NEUTRAL']; // Mock mapping or default
  
  // Use card properties to determine border/bg if available in card data, else default
  // For this prototype, we'll map rudimentary "types" or "origins" if present, else default.
  // We'll trust the 'baseTheme' derived above for now.
  
  // --- VARIANT: FIELD (Token) ---
  if (variant === 'FIELD') {
    const statusClasses = card.isExhausted 
      ? 'grayscale opacity-70 cursor-default' 
      : canAttack ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_0_10px_gold] ring-2 ring-yellow-400' : 'cursor-default';

    return (
      <div 
        onClick={canAttack && !card.isExhausted ? onClick : undefined}
        className={`
          ${statusClasses} ${baseTheme}
          relative w-24 h-24 border-2 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]
          flex flex-col items-center p-1 transition-all duration-100 select-none
        `}
      >
        {/* Name Header */}
        <div className="w-full bg-black/10 text-[9px] font-mono font-bold text-center truncate px-1">
          {card.name}
        </div>

        {/* Placeholder Art */}
        <div className="flex-1 w-full my-1 bg-black/20 flex items-center justify-center text-2xl">
           👾
        </div>

        {/* Stats */}
        <div className="w-full flex justify-between items-center font-mono font-bold text-sm bg-white/40 px-1 rounded-sm">
           <span className="text-red-800 flex items-center gap-0.5">
             ⚔️{card.attack}
           </span>
           <span className="text-blue-800 flex items-center gap-0.5">
             🛡️{card.health}
           </span>
        </div>

        {/* Status Overlay */}
        {card.isExhausted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <span className="bg-black text-white text-[10px] px-1 font-bold">ZZZ</span>
          </div>
        )}
      </div>
    );
  }

  // --- VARIANT: HAND (Full Card) ---
  const playableClasses = isPlayable 
    ? 'cursor-pointer hover:-translate-y-6 hover:rotate-1 hover:z-20 shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
    : 'opacity-80 cursor-not-allowed brightness-75 grayscale-[0.5]';

  return (
    <div 
      onClick={isPlayable ? onClick : undefined}
      className={`
        ${playableClasses} ${baseTheme}
        relative w-40 h-60 border-4 rounded-sm shadow-[6px_6px_0_0_rgba(0,0,0,0.6)]
        flex flex-col p-2 transition-all duration-200 select-none font-mono text-slate-900
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-1 border-b-2 border-black/10 pb-1">
        <span className="font-bold text-xs leading-none w-24 truncate">{card.name}</span>
        
        {/* Mana Cost Gem */}
        <div className="w-6 h-6 -mt-1 -mr-1 bg-cyan-600 text-white flex items-center justify-center font-bold text-xs rounded-full border-2 border-black shadow-sm z-10">
          {card.cost}
        </div>
      </div>

      {/* Art Box */}
      <div className="w-full h-24 bg-slate-800 border-2 border-black/30 mb-2 relative overflow-hidden group">
        <div className="absolute inset-0 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
          (ART)
        </div>
      </div>

      {/* Description */}
      <div className="flex-1 bg-white/30 border border-black/10 p-1 mb-2">
        <p className="text-[9px] leading-tight opacity-90">
           Standard Unit. Deals damage to enemy creatures or player.
        </p>
      </div>

      {/* Footer Stats */}
      <div className="h-8 bg-slate-900 text-white flex justify-between items-center px-2 border-2 border-slate-600 rounded-sm">
         <div className="flex items-center gap-1 font-bold text-lg text-red-400">
           <span>⚔</span>{card.attack}
         </div>
         <div className="flex items-center gap-1 font-bold text-lg text-blue-400">
           <span>🛡</span>{card.health}
         </div>
      </div>
    </div>
  );
};