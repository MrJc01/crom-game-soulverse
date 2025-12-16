import React, { useState } from 'react';
import { MOCK_PLAYER } from '../../data/gameData';
import { SoulEssence, Card } from '../../types';
import { forgeCardFromEssence, harvestMob } from '../../logic/SoulHarvestManager';
import { GameCard } from './GameCard';
import { CardInstance } from '../../game/DuelEngine';

interface CardForgeProps {
  onClose: () => void;
}

// Mock some initial essences since we don't have a full inventory system hooked up yet
const MOCK_ESSENCES: SoulEssence[] = [
  harvestMob('Magma Golem', 50),
  harvestMob('Swamp Witch', 30),
  harvestMob('Ancient Treant', 80)
];

export const CardForge: React.FC<CardForgeProps> = ({ onClose }) => {
  const [selectedEssence, setSelectedEssence] = useState<SoulEssence | null>(null);
  const [forgedCard, setForgedCard] = useState<Card | null>(null);
  const [isForging, setIsForging] = useState(false);

  const handleForge = () => {
    if (!selectedEssence) return;
    setIsForging(true);
    
    // Simulate animation delay
    setTimeout(() => {
      const newCard = forgeCardFromEssence(selectedEssence, MOCK_PLAYER);
      setForgedCard(newCard);
      setIsForging(false);
    }, 1500);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 font-mono">
      <div className="bg-slate-900 border-2 border-slate-600 w-full max-w-4xl h-[600px] flex rounded shadow-2xl overflow-hidden relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✖ CLOSE
        </button>

        {/* LEFT PANEL: ESSENCE LIST */}
        <div className="w-1/3 border-r border-slate-700 p-4 bg-slate-950/50 overflow-y-auto">
          <h2 className="text-xl text-yellow-500 font-bold mb-4 flex items-center gap-2">
            <span>✨</span> SOUL ESSENCES
          </h2>
          <div className="space-y-2">
            {MOCK_ESSENCES.map((ess) => (
              <div 
                key={ess.id}
                onClick={() => { setSelectedEssence(ess); setForgedCard(null); }}
                className={`p-3 border rounded cursor-pointer transition-all ${
                  selectedEssence?.id === ess.id 
                    ? 'bg-blue-900/40 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-white">{ess.sourceName}</div>
                <div className="text-xs text-slate-400 flex justify-between mt-1">
                  <span>{ess.biome}</span>
                  <span className="text-yellow-200">PWR {ess.powerLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PANEL: FORGE ACTION */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
          
          {selectedEssence && !forgedCard && (
            <div className="text-center animate-in fade-in zoom-in duration-300">
              <div className="w-32 h-32 mx-auto bg-slate-800 rounded-full border-4 border-dashed border-slate-600 flex items-center justify-center mb-6 relative">
                 <div className="animate-pulse text-4xl">👻</div>
                 {isForging && (
                   <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-spin border-t-transparent" />
                 )}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Ready to Forge</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8">
                Combining {selectedEssence.sourceName} with your magical affinity will create a unique card.
              </p>

              <button 
                onClick={handleForge}
                disabled={isForging}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded border-2 border-yellow-800 shadow-[4px_4px_0_0_black] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isForging ? "CHANNELING..." : "FORGE CARD"}
              </button>
            </div>
          )}

          {!selectedEssence && (
            <div className="text-slate-500 text-center">
              Select an Essence to begin the ritual.
            </div>
          )}

          {/* RESULT */}
          {forgedCard && (
            <div className="flex flex-col items-center animate-in zoom-in duration-500">
              <h3 className="text-3xl font-bold text-yellow-400 mb-6 drop-shadow-md">SUCCESS!</h3>
              
              {/* Reuse GameCard for preview, but we need to convert to CardInstance briefly or mock it */}
              <div className="transform scale-125 mb-8">
                <GameCard 
                  variant="HAND" 
                  card={{ ...forgedCard, runtimeId: 'preview', isExhausted: false, attack: forgedCard.stats.attack, health: forgedCard.stats.defense, maxHealth: forgedCard.stats.defense, abilities: [], location: 'HAND' } as CardInstance} 
                />
              </div>

              <div className="flex gap-4">
                <button 
                    onClick={() => setForgedCard(null)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded"
                >
                    Forge Another
                </button>
                <button 
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded"
                >
                    Add to Deck
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};