import { useState, useMemo, useCallback } from 'react';
import { DuelEngine } from '../game/DuelEngine';

export const useDuel = (engine: DuelEngine) => {
  // Tick is used to force React to re-render when the mutable Engine state changes
  const [tick, setTick] = useState(0);

  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  const actions = useMemo(() => ({
    startGame: () => {
      if (engine.gameStatus === 'PRE_GAME') {
        engine.startGame();
        forceUpdate();
      }
    },
    
    playCard: (playerId: string, handIndex: number) => {
      const success = engine.playCard(playerId, handIndex);
      if (success) forceUpdate();
      return success;
    },

    endTurn: () => {
      engine.endTurn();
      forceUpdate();
    },

    // Simplified targeting logic for the prototype UI
    // If opponents exist, attack the first one. Otherwise, attack the player.
    attack: (attackerRuntimeId: string) => {
      const opponent = engine.getOpponent();
      
      // 1. Try to find a valid target creature (Taunt logic could go here)
      const targetCreature = opponent.battlefield.cards[0];
      
      if (targetCreature) {
        engine.attackCreature(attackerRuntimeId, targetCreature.runtimeId);
      } else {
        engine.attackPlayer(attackerRuntimeId);
      }
      forceUpdate();
    }
  }), [engine, forceUpdate]);

  return {
    engine,
    state: tick, // Add to dependency arrays to trigger effects on engine update
    actions
  };
};