import React, { useEffect, useState, useRef } from 'react';
import { HOTBAR_EVENT, ABILITY_USE_EVENT } from '../../utils/gameEvents';

export const HotbarHUD: React.FC = () => {
  const [activeSlot, setActiveSlot] = useState(1);
  const [cooldowns, setCooldowns] = useState<Record<number, number>>({}); // Slot -> End Timestamp
  const slots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; 

  // Force re-render to update timers
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
        setTick(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleSlotChange = (e: Event) => {
        const ce = e as CustomEvent;
        setActiveSlot(ce.detail);
    };

    const handleAbilityUse = (e: Event) => {
        const ce = e as CustomEvent;
        const { slot, cooldown } = ce.detail;
        setCooldowns(prev => ({
            ...prev,
            [slot]: Date.now() + cooldown
        }));
    };
    
    window.addEventListener(HOTBAR_EVENT, handleSlotChange);
    window.addEventListener(ABILITY_USE_EVENT, handleAbilityUse);
    return () => {
        window.removeEventListener(HOTBAR_EVENT, handleSlotChange);
        window.removeEventListener(ABILITY_USE_EVENT, handleAbilityUse);
    };
  }, []);

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 pointer-events-auto bg-slate-900/80 p-2 rounded-lg border border-slate-700 backdrop-blur-md">
      {slots.map((slot) => {
        const displayKey = slot === 10 ? '0' : slot;
        const isActive = activeSlot === slot;
        
        const colors = [
             'border-red-500 text-red-400', // Fire
             'border-green-500 text-green-400', // Nature
             'border-yellow-700 text-yellow-600', // Earth
             'border-blue-500 text-blue-400', 
             'border-purple-500 text-purple-400', 
             'border-pink-500 text-pink-400', 
             'border-cyan-500 text-cyan-400', 
             'border-orange-500 text-orange-400', 
             'border-slate-400 text-slate-400', 
             'border-white text-white'
        ];
        const theme = colors[(slot - 1) % colors.length];

        // Cooldown Calculation
        const now = Date.now();
        const endTime = cooldowns[slot] || 0;
        const isOnCooldown = endTime > now;
        const remainingSec = Math.ceil((endTime - now) / 1000);

        return (
          <div 
            key={slot}
            className={`
              relative w-12 h-12 flex items-center justify-center 
              border-2 rounded transition-all duration-100 overflow-hidden
              ${isActive ? `${theme} bg-white/10 scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)] z-10` : 'border-slate-600 bg-slate-800 text-slate-500'}
            `}
          >
            {/* Cooldown Overlay */}
            {isOnCooldown && (
                <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{remainingSec}</span>
                </div>
            )}

            {/* Key Number */}
            <div className="absolute top-0.5 left-1 text-[10px] font-bold opacity-70">
                {displayKey}
            </div>
            
            {/* Mock Icon */}
            <div className={`text-xl font-bold ${isActive ? 'animate-pulse' : 'opacity-50'}`}>
                {isActive ? '✦' : '•'}
            </div>
          </div>
        );
      })}
    </div>
  );
};