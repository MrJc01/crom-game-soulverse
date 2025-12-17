import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DuelEngine, generateMockDeck } from '../game/DuelEngine';
import { MOCK_PLAYER } from '../data/gameData';
import { MONSTER_DATABASE } from '../data/monsters';
import { PlayerProfile, LootResult, Biome } from '../types';
import { generateDeckForMob } from '../utils/deckGenerator';
import { processBattleVictory } from '../logic/RewardSystem';

interface BattleContextType {
  isBattling: boolean;
  isTransitioning: boolean;
  engine: DuelEngine | null;
  startBattle: (opponentId: string) => void;
  endBattle: () => void;
  latestLoot: LootResult | null;
  clearLoot: () => void;
  
  // Player State Exposure
  playerProfile: PlayerProfile;
  updatePlayerProfile: (profile: PlayerProfile) => void;
  gainTerritory: (biome: Biome) => void;
  gainFragments: (amount: number) => void;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export const BattleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBattling, setIsBattling] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [engine, setEngine] = useState<DuelEngine | null>(null);
  const [latestLoot, setLatestLoot] = useState<LootResult | null>(null);
  
  // Track current opponent for reward logic
  const [currentOpponentId, setCurrentOpponentId] = useState<string | null>(null);

  // Persistent Player State
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(MOCK_PLAYER);

  // --- ACTIONS ---

  const gainTerritory = useCallback((biome: Biome) => {
    setPlayerProfile(prev => {
        if (prev.unlockedBiomes.includes(biome)) return prev;
        return {
            ...prev,
            unlockedBiomes: [...prev.unlockedBiomes, biome]
        };
    });
  }, []);

  const gainFragments = useCallback((amount: number) => {
    setPlayerProfile(prev => ({
        ...prev,
        fragments: prev.fragments + amount
    }));
  }, []);

  const startBattle = useCallback((opponentId: string) => {
    setIsTransitioning(true);
    setCurrentOpponentId(opponentId);

    // 1. Prepare Player Deck
    const playerDeck = [...playerProfile.grimoire.deck];
    
    // 2. Prepare Enemy Data
    const mobDef = MONSTER_DATABASE[opponentId];
    
    // Fallback if mob definition not found
    const enemyDeck = mobDef ? generateDeckForMob(mobDef) : generateMockDeck(20);
    const enemyName = mobDef ? mobDef.name : `Entity-${opponentId}`;
    
    // Initialize Engine
    setTimeout(() => {
      const newEngine = new DuelEngine(
        playerProfile.name, // Player ID
        playerDeck, 
        enemyName, // Opponent Name
        enemyDeck
      );
      
      // Override Default 20 HP with Mob-Specific Scaled HP
      if (mobDef) {
         const scaledHp = Math.ceil(mobDef.physical.baseHp / 4);
         newEngine.player2.maxHealth = scaledHp;
         newEngine.player2.health = scaledHp;
      }
      
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

    // 1. Permadeath Logic (Graveyard check)
    const deadCards = engine.player1.graveyard.cards;
    if (deadCards.length > 0) {
      setPlayerProfile(prev => {
        const updatedGrimoire = { ...prev.grimoire };
        const updatedDeck = [...updatedGrimoire.deck];
        const updatedGraveyard = [...updatedGrimoire.graveyard];

        deadCards.forEach(deadInst => {
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
        return { ...prev, grimoire: updatedGrimoire };
      });
    }

    // 2. VICTORY REWARDS
    if (engine.winnerId === engine.player1.playerId && currentOpponentId) {
        console.log("[BattleContext] Victory!");
        const mobDef = MONSTER_DATABASE[currentOpponentId];
        
        if (mobDef) {
          const { loot, updatedProfile } = processBattleVictory(mobDef, playerProfile);
          
          setPlayerProfile(updatedProfile);
          setLatestLoot(loot);
        }
    }

    // 3. Cleanup
    setIsBattling(false);
    setEngine(null);
    setCurrentOpponentId(null);

  }, [engine, currentOpponentId, playerProfile]);

  const clearLoot = () => setLatestLoot(null);

  return (
    <BattleContext.Provider value={{ 
      isBattling, 
      isTransitioning, 
      engine, 
      startBattle, 
      endBattle,
      latestLoot,
      clearLoot,
      playerProfile,
      updatePlayerProfile: setPlayerProfile,
      gainTerritory,
      gainFragments
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