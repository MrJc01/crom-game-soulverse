import React, { useEffect } from 'react';
import { useDuel } from '../../hooks/useDuel';
import { DuelEngine, generateMockDeck } from '../../game/DuelEngine';
import { Card } from './Card';

// Initialize a static engine instance for the prototype so it doesn't reset on re-renders of parent
const p1Deck = generateMockDeck(20);
const p2Deck = generateMockDeck(20);
const gameEngine = new DuelEngine("Player", p1Deck, "Bot", p2Deck);

export const BattleInterface: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { engine, actions } = useDuel(gameEngine);
  const player = engine.player1;
  const opponent = engine.player2;
  const isPlayerTurn = engine.activePlayerId === player.playerId;

  // Start game on mount if not active
  useEffect(() => {
    if (engine.gameStatus === 'PRE_GAME') {
      actions.startGame();
    }
  }, []);

  // Simple "Bot" Logic
  useEffect(() => {
    if (engine.activePlayerId === opponent.playerId && engine.gameStatus === 'ACTIVE') {
      const timer = setTimeout(() => {
        // Bot Strategy:
        // 1. Play first affordable card
        const cardToPlayIndex = opponent.hand.cards.findIndex(c => c.cost <= opponent.currentMana);
        if (cardToPlayIndex > -1) {
            console.log("Bot playing card index:", cardToPlayIndex);
            actions.playCard(opponent.playerId, cardToPlayIndex);
            // Small delay between actions would be better, but we just force update here
        }

        // 2. Attack with everything
        opponent.battlefield.cards.forEach(c => {
            if (!c.isExhausted) {
                actions.attack(c.runtimeId); // Attack wrapper handles targeting
            }
        });

        // 3. End Turn
        actions.endTurn();

      }, 1500); // 1.5s thinking time
      return () => clearTimeout(timer);
    }
  }, [engine.activePlayerId, engine.gameStatus, engine.turnCount]); // Re-run when turn changes

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 pointer-events-none font-mono">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm -z-10" />

      {/* --- TOP: OPPONENT --- */}
      <div className="w-full flex justify-center items-start h-1/4 pointer-events-auto">
        <div className="flex flex-col items-center gap-2">
          {/* Avatar & Stats */}
          <div className="flex items-center gap-4 bg-red-900/50 p-2 rounded border border-red-500 text-white">
            <div className="w-12 h-12 bg-red-500 rounded-full border-2 border-white flex items-center justify-center font-bold text-2xl">
              👿
            </div>
            <div>
              <div className="text-xl font-bold">{opponent.playerId}</div>
              <div className="text-sm">HP: {opponent.health} | Mana: {opponent.currentMana}/{opponent.maxMana}</div>
            </div>
          </div>

          {/* Opponent Hand (Backs) */}
          <div className="flex gap-1 -mt-2">
            {opponent.hand.cards.map((c, i) => (
              <div key={c.runtimeId} className="w-16 h-24 bg-red-800 border-2 border-white rounded shadow-md transform hover:-translate-y-2 transition-transform" />
            ))}
          </div>

           {/* Opponent Field */}
           <div className="flex gap-2 mt-4">
            {opponent.battlefield.cards.map((card) => (
              <Card 
                key={card.runtimeId} 
                card={card} 
                location="FIELD"
              />
            ))}
            {opponent.battlefield.count === 0 && <div className="text-white/20 text-sm py-4">[Empty Battlefield]</div>}
          </div>
        </div>
      </div>

      {/* --- CENTER: GAME STATE --- */}
      <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto">
        {/* Turn Indicator */}
        <div className={`px-8 py-2 text-2xl font-bold border-2 shadow-lg mb-4 ${isPlayerTurn ? 'bg-amber-400 text-amber-900 border-white' : 'bg-slate-700 text-white border-slate-500'}`}>
          {isPlayerTurn ? "YOUR TURN" : "ENEMY TURN"}
        </div>
        
        {engine.gameStatus === 'FINISHED' && (
           <div className="bg-black/90 p-8 border-4 border-amber-500 text-center animate-bounce">
             <h1 className="text-4xl text-amber-500 mb-4">{engine.winnerId === player.playerId ? "VICTORY" : "DEFEAT"}</h1>
             <button onClick={onClose} className="px-6 py-2 bg-white text-black font-bold hover:bg-gray-200">
               RETURN TO WORLD
             </button>
           </div>
        )}
      </div>

      {/* --- BOTTOM: PLAYER --- */}
      <div className="w-full flex flex-col items-center h-1/3 pointer-events-auto justify-end">
        
        {/* Player Field */}
        <div className="flex gap-2 mb-4 min-h-[100px] items-center">
            {player.battlefield.cards.map((card) => (
              <Card 
                key={card.runtimeId} 
                card={card} 
                location="FIELD"
                canAttack={isPlayerTurn}
                onClick={() => actions.attack(card.runtimeId)}
              />
            ))}
             {player.battlefield.count === 0 && <div className="text-white/20 text-sm">[Empty Battlefield]</div>}
        </div>

        <div className="w-full max-w-4xl bg-slate-800/90 border-t-4 border-amber-600 p-4 rounded-t-xl flex justify-between items-end gap-8 shadow-2xl">
          
          {/* Player Stats */}
          <div className="flex flex-col gap-2 text-white min-w-[150px]">
            <div className="text-2xl font-bold flex items-center gap-2">
                <span className="text-red-500">♥</span> {player.health}
            </div>
            {/* Mana Bar */}
            <div>
                <div className="flex justify-between text-xs mb-1 text-cyan-300 font-bold">
                    <span>MANA</span>
                    <span>{player.currentMana}/{player.maxMana}</span>
                </div>
                <div className="flex gap-1">
                    {Array.from({length: player.maxMana}).map((_, i) => (
                        <div key={i} className={`w-4 h-6 rounded-sm border border-black ${i < player.currentMana ? 'bg-cyan-400 shadow-[0_0_5px_cyan]' : 'bg-slate-700'}`} />
                    ))}
                </div>
            </div>
          </div>

          {/* Player Hand */}
          <div className="flex gap-2 -mb-8 pb-4 overflow-visible px-4">
             {player.hand.cards.map((card, index) => (
               <Card 
                 key={card.runtimeId}
                 card={card}
                 location="HAND"
                 isPlayable={isPlayerTurn && player.currentMana >= card.cost}
                 onClick={() => actions.playCard(player.playerId, index)}
               />
             ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2 min-w-[150px] items-end">
             <button 
                disabled={!isPlayerTurn}
                onClick={actions.endTurn}
                className={`px-6 py-4 font-bold border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all ${isPlayerTurn ? 'bg-amber-500 hover:bg-amber-400 text-amber-900' : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`}
             >
                END TURN
             </button>
             <button onClick={onClose} className="text-xs text-red-400 hover:text-red-300 underline">
                Surrender
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};