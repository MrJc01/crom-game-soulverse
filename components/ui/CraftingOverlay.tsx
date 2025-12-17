import React, { useState } from 'react';
import { useBattle } from '../../context/BattleContext';
import { CRAFTING_RECIPES, canCraft, craftItem, CraftingRecipe } from '../../logic/CraftingSystem';
import { GameCard } from './GameCard';
import { CardInstance } from '../../game/DuelEngine';

interface CraftingOverlayProps {
  onClose: () => void;
}

export const CraftingOverlay: React.FC<CraftingOverlayProps> = ({ onClose }) => {
  const { playerProfile, updatePlayerProfile } = useBattle();
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCraft = () => {
    if (!selectedRecipe) return;

    const result = craftItem(selectedRecipe, playerProfile);
    if (result.success) {
      updatePlayerProfile(result.newProfile);
      setFeedback(`Successfully forged ${result.createdCard?.name}!`);
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback("Failed to craft. Missing resources?");
    }
  };

  const getBiomeColor = (biome: string) => {
    switch(biome) {
      case 'VOLCANIC': return 'text-red-500';
      case 'SWAMP': return 'text-purple-500';
      case 'ASTRAL': return 'text-cyan-300';
      default: return 'text-white';
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-4 border-slate-700 w-full max-w-5xl h-[700px] flex rounded-lg shadow-2xl overflow-hidden font-mono text-white relative">
        
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded border border-slate-600">
          ESC / CLOSE
        </button>

        {/* --- LEFT: RECIPE LIST --- */}
        <div className="w-1/3 border-r-4 border-slate-700 bg-slate-950 flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-900">
            <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
              <span>🔥</span> SOUL FORGE
            </h2>
            <div className="text-xs text-slate-500">Select a recipe to craft</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {CRAFTING_RECIPES.map(recipe => {
              const craftable = canCraft(recipe, playerProfile);
              return (
                <div 
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`p-3 border-2 cursor-pointer transition-all rounded ${
                    selectedRecipe?.id === recipe.id 
                      ? 'bg-amber-900/30 border-amber-500' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className={`font-bold ${getBiomeColor(recipe.biome)}`}>{recipe.name}</div>
                  <div className="flex justify-between text-xs mt-1 text-slate-400">
                    <span>{recipe.biome}</span>
                    <span className={craftable ? 'text-green-400' : 'text-red-500'}>
                      {craftable ? 'CRAFTABLE' : 'MISSING SOULS'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- RIGHT: DETAILS --- */}
        <div className="flex-1 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')]">
          
          {selectedRecipe ? (
             <div className="flex-1 flex flex-col p-8 items-center">
                <h3 className="text-3xl font-bold mb-8 text-amber-100 border-b-2 border-amber-500/50 pb-2 px-8">
                  {selectedRecipe.name}
                </h3>
                
                <div className="flex gap-12 items-center mb-8">
                  {/* Cost View */}
                  <div className="flex flex-col gap-4 bg-black/40 p-6 rounded border border-slate-600 min-w-[200px]">
                     <div className="text-sm text-slate-400 uppercase tracking-widest border-b border-slate-700 pb-2 mb-2">Required Essence</div>
                     
                     <div className="flex justify-between items-center">
                        <span className={`${getBiomeColor(selectedRecipe.biome)} font-bold`}>{selectedRecipe.biome}</span>
                        <span className="text-2xl">x{selectedRecipe.requiredEssenceCount}</span>
                     </div>
                     <div className="text-xs text-slate-500">Min Power: {selectedRecipe.minPowerLevel}</div>
                     
                     {/* Inventory Check */}
                     <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-xs text-slate-400">YOUR INVENTORY</div>
                        <div className="text-xl font-bold text-white">
                           {playerProfile.grimoire.essences.filter(e => e.biome === selectedRecipe.biome && e.powerLevel >= selectedRecipe.minPowerLevel).length} 
                           <span className="text-slate-500 text-sm font-normal ml-2">Available</span>
                        </div>
                     </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-4xl text-slate-600">➔</div>

                  {/* Output Preview */}
                  <div className="transform scale-110">
                     <GameCard 
                        variant="HAND" 
                        card={{ ...selectedRecipe.outputCardTemplate, runtimeId: 'preview', location: 'HAND', isExhausted: false, attack: selectedRecipe.outputCardTemplate.stats?.attack || 0, health: selectedRecipe.outputCardTemplate.stats?.defense || 0, maxHealth: selectedRecipe.outputCardTemplate.stats?.defense || 0, abilities: [] } as CardInstance} 
                     />
                  </div>
                </div>

                <button 
                  onClick={handleCraft}
                  disabled={!canCraft(selectedRecipe, playerProfile)}
                  className={`
                    px-12 py-4 text-xl font-bold rounded border-4 shadow-xl transition-all
                    ${canCraft(selectedRecipe, playerProfile) 
                      ? 'bg-amber-600 border-amber-800 hover:bg-amber-500 hover:scale-105 active:scale-95 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'}
                  `}
                >
                  {canCraft(selectedRecipe, playerProfile) ? 'FORGE ITEM' : 'INSUFFICIENT ESSENCE'}
                </button>

                {feedback && (
                  <div className="mt-6 text-green-400 font-bold bg-green-900/50 px-4 py-2 rounded border border-green-500 animate-pulse">
                    {feedback}
                  </div>
                )}

             </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600">
               Select a recipe from the left to begin...
            </div>
          )}

        </div>
      </div>
    </div>
  );
};