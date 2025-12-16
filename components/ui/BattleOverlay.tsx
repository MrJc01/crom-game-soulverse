import React, { useEffect, useState } from 'react';
import { useBattle } from '../../context/BattleContext';
import { useDuel } from '../../hooks/useDuel';
import { GameCard } from './GameCard';

export const BattleOverlay: React.FC = () => {
  const { engine: contextEngine, endBattle } = useBattle();
  
  // Guard clause: Should never happen if rendered conditionally, but good for TS
  if (!contextEngine) return null;

  const { engine, actions, state } = useDuel(contextEngine);
  const player = engine.player1;
  const opponent = engine.player2;
  const isPlayerTurn = engine.activePlayerId === player.playerId;

  // --- BOT LOGIC (Simple) ---
  useEffect(() => {
    if (engine.activePlayerId === opponent.playerId && engine.gameStatus === 'ACTIVE') {
      const turnTimer = setTimeout(() => {
        // 1. Play Card
        const affordableCardIdx = opponent.hand.cards.findIndex(c => c.cost <= opponent.currentMana);
        if (affordableCardIdx !== -1) {
          actions.playCard(opponent.playerId, affordableCardIdx);
        }
        
        // 2. Attack with everything
        opponent.battlefield.cards.forEach(c => {
          if (!c.isExhausted) actions.attack(c.runtimeId);
        });

        // 3. End Turn
        actions.endTurn();
      }, 2000);

      return () => clearTimeout(turnTimer);
    }
  }, [engine.activePlayerId, state, engine.gameStatus, opponent, actions]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col font-mono select-none overflow-hidden animate-in fade-in duration-700">
      {/* Background Dimmer */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md -z-10" />

      {/* ================= TOP ZONE (OPPONENT) ================= */}
      <div className="h-1/3 w-full flex flex-col pointer-events-auto relative">
        {/* Top Bar: Stats */}
        <div className="flex items-center justify-between px-6 py-2 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-red-900 bg-red-700 flex items-center justify-center text-2xl shadow-lg z-10">
              👿
            </div>
            <div className="text-white drop-shadow-md">
              <h2 className="text-xl font-bold text-red-400">{opponent.playerId}</h2>
              <div className="flex gap-4 text-sm">
                <span className="text-red-300">HP: {opponent.health}</span>
                <span className="text-blue-300">MP: {opponent.currentMana}/{opponent.maxMana}</span>
              </div>
            </div>
          </div>
          
          {/* Opponent Hand (Backs) */}
          <div className="flex gap-[-2rem]">
             {opponent.hand.cards.map((c) => (
               <div key={c.runtimeId} className="-ml-8 first:ml-0 hover:-translate-y-4 transition-transform duration-300">
                  <GameCard variant="OPPONENT_HAND" />
               </div>
             ))}
          </div>
        </div>

        {/* Opponent Field */}
        <div className="flex-1 flex justify-center items-end pb-4 gap-4">
           {opponent.battlefield.cards.map(card => (
             <GameCard key={card.runtimeId} card={card} variant="FIELD" />
           ))}
           {opponent.battlefield.count === 0 && (
             <div className="text-white/10 text-xs tracking-widest border border-white/10 px-4 py-2 rounded">
               EMPTY FIELD
             </div>
           )}
        </div>
      </div>

      {/* ================= CENTER ZONE (NOTIFICATIONS) ================= */}
      <div className="h-24 flex items-center justify-center relative pointer-events-none">
         <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
         
         {engine.gameStatus === 'FINISHED' ? (
             <div className="z-50 flex flex-col items-center bg-black/90 p-8 border-4 border-amber-500 rounded-lg animate-bounce pointer-events-auto">
                 <h1 className="text-4xl text-amber-500 mb-4">{engine.winnerId === player.playerId ? "VICTORY" : "DEFEAT"}</h1>
                 <button onClick={endBattle} className="px-6 py-2 bg-white text-black font-bold hover:bg-gray-200 uppercase">
                 Return to World
                 </button>
             </div>
         ) : (
            <div className={`px-12 py-2 border-2 text-2xl font-bold backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-500
                ${isPlayerTurn 
                ? 'bg-amber-500/90 border-amber-300 text-amber-950 scale-110' 
                : 'bg-slate-800/90 border-slate-600 text-slate-400 scale-90'}
            `}>
                {isPlayerTurn ? "YOUR TURN" : "ENEMY TURN"}
            </div>
         )}
      </div>

      {/* ================= BOTTOM ZONE (PLAYER) ================= */}
      <div className="flex-1 flex flex-col justify-end pointer-events-auto relative">
        
        {/* Player Field */}
        <div className="flex-1 flex justify-center items-start pt-4 gap-4">
           {player.battlefield.cards.map(card => (
             <GameCard 
               key={card.runtimeId} 
               card={card} 
               variant="FIELD" 
               canAttack={isPlayerTurn}
               onClick={() => actions.attack(card.runtimeId)}
             />
           ))}
        </div>

        {/* Player Control Bar */}
        <div className="min-h-[220px] bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-8 px-8 flex justify-between items-end pb-6">
           
           {/* Player Stats */}
           <div className="flex flex-col gap-2 w-64">
              <div className="flex items-center gap-4 mb-2">
                 <div className="w-20 h-20 rounded-full border-4 border-amber-500 bg-amber-600 flex items-center justify-center text-3xl shadow-lg z-10">
                   🧙‍♂️
                 </div>
                 <div className="text-white">
                    <div className="text-3xl font-bold text-amber-400">{player.health} <span className="text-xs text-amber-200">HP</span></div>
                 </div>
              </div>
              
              {/* Mana Bar */}
              <div className="w-full bg-slate-800 h-6 rounded-sm border border-slate-600 relative overflow-hidden group">
                 <div 
                    className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]" 
                    style={{ width: `${(player.currentMana / 10) * 100}%` }} 
                 />
                 <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md z-10">
                    MANA {player.currentMana} / {player.maxMana}
                 </div>
                 {/* Mana Pips Overlay */}
                 <div className="absolute inset-0 flex">
                    {Array.from({length: 10}).map((_, i) => (
                       <div key={i} className="flex-1 border-r border-slate-900/50" />
                    ))}
                 </div>
              </div>
           </div>

           {/* Player Hand */}
           <div className="flex items-end justify-center -mb-4 px-4 gap-[-2rem] overflow-visible z-20">
              {player.hand.cards.map((card, idx) => (
                <div key={card.runtimeId} className="-ml-6 first:ml-0 hover:z-30 transition-all duration-200">
                  <GameCard 
                    card={card} 
                    variant="HAND" 
                    isPlayable={isPlayerTurn && player.currentMana >= card.cost}
                    onClick={() => actions.playCard(player.playerId, idx)}
                  />
                </div>
              ))}
           </div>

           {/* Action Buttons */}
           <div className="flex flex-col gap-3 w-48 items-end">
              <button 
                onClick={actions.endTurn}
                disabled={!isPlayerTurn || engine.gameStatus === 'FINISHED'}
                className={`
                  w-full py-4 text-xl font-bold border-2 shadow-[4px_4px_0_0_black] transition-all
                  ${isPlayerTurn && engine.gameStatus !== 'FINISHED'
                    ? 'bg-amber-500 text-amber-950 border-white hover:bg-amber-400 active:translate-y-1 active:shadow-none' 
                    : 'bg-slate-700 text-slate-500 border-slate-600 cursor-not-allowed'}
                `}
              >
                END TURN
              </button>
              
              <button onClick={endBattle} className="text-xs text-red-500 hover:text-red-400">
                  Surrender (Flee)
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};