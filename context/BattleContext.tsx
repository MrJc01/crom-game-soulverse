import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DuelEngine, generateMockDeck, CardInstance } from '../game/DuelEngine';
import { MOCK_PLAYER, MOCK_CARDS } from '../data/gameData';
import { PlayerProfile, Card } from '../types';

interface BattleContextType {
  isBattling: boolean;
  isTransitioning: boolean;
  engine: DuelEngine | null;
  startBattle: (opponentId: string) => void;
  endBattle: () => void;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export const BattleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBattling, setIsBattling] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [engine, setEngine] = useState<DuelEngine | null>(null);

  // Persistent Player State (In a real app, this would be its own Context or Redux slice)
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(MOCK_PLAYER);

  const startBattle = useCallback((opponentId: string) => {
    setIsTransitioning(true);

    // 1. Prepare Decks
    // We use the player's actual deck from profile
    const playerDeck = [...playerProfile.grimoire.deck];
    // We generate a mock deck for the NPC
    const enemyDeck = generateMockDeck(20);

    // 2. Initialize Engine
    // Delay slightly to allow transition animation to cover the setup
    setTimeout(() => {
      const newEngine = new DuelEngine(
        playerProfile.name, // Player ID/Name
        playerDeck, 
        `Entity-${opponentId}`, // Opponent Name
        enemyDeck
      );
      
      setEngine(newEngine);
      setIsBattling(true);
      
      // Auto-start the engine logic
      newEngine.startGame();
      
      // End transition effect
      setTimeout(() => setIsTransitioning(false), 1000);
    }, 500);

  }, [playerProfile]);

  const endBattle = useCallback(() => {
    if (!engine) return;

    console.log("Processing Post-Battle Logic...");

    // 1. Permadeath Logic: Check Graveyard
    // Any card in the Player's Graveyard is effectively "Dead"/Broken in the physical world
    const deadCards = engine.player1.graveyard.cards;
    
    if (deadCards.length > 0) {
      setPlayerProfile(prev => {
        const updatedGrimoire = { ...prev.grimoire };
        const updatedDeck = [...updatedGrimoire.deck];
        const updatedGraveyard = [...updatedGrimoire.graveyard];

        deadCards.forEach(deadInst => {
            // Find the original card in the deck and move to graveyard/broken status
            const index = updatedDeck.findIndex(c => c.id === deadInst.originalId);
            if (index > -1) {
                const card = updatedDeck[index];
                card.status = 'BROKEN';
                card.durability = 0;
                
                updatedDeck.splice(index, 1);
                updatedGraveyard.push(card);
                console.log(`[BattleContext] ${card.name} was BROKEN in battle.`);
            }
        });

        updatedGrimoire.deck = updatedDeck;
        updatedGrimoire.graveyard = updatedGraveyard;

        return {
            ...prev,
            grimoire: updatedGrimoire
        };
      });
    }

    // 2. Rewards (Simple XP bump for winning)
    if (engine.winnerId === engine.player1.playerId) {
        console.log("[BattleContext] Victory! Gaining Soul Power.");
        setPlayerProfile(prev => ({
            ...prev,
            soulCap: prev.soulCap + 10 // Mock XP gain
        }));
    }

    // 3. Cleanup
    setIsBattling(false);
    setEngine(null);

  }, [engine]);

  return (
    <BattleContext.Provider value={{ 
      isBattling, 
      isTransitioning, 
      engine, 
      startBattle, 
      endBattle 
    }}>
      {children}
    </BattleContext.Provider>
  );
};

export const useBattle = () => {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattle must be used within a BattleProvider');
  }
  return context;
};