import { BattlePhase, BattleState, Card, CardStatus, CombatResult, PlayerProfile, StackItem } from '../types';

/**
 * ============================================================================
 *                               BATTLE DIAGRAM
 * ============================================================================
 * 
 * [ SETUP ] 
 *     |-> Shuffle Decks -> Draw Initial Hands -> Coin Toss
 *     v
 * [ DRAW PHASE ]
 *     |-> Active Player +1 Card
 *     |-> Refresh Mana / Resources
 *     v
 * [ MAIN PHASE ]
 *     |-> Play Lands / Cast Sorceries / Summon Creatures
 *     |-> (Stack Interaction Possible)
 *     v
 * [ COMBAT PHASE ]
 *     |-> Declare Attackers -> Declare Blockers
 *     |-> [COMBAT RESOLUTION SUB-STEP]
 *     |-> (Instant Speed Interaction)
 *     v
 * [ END PHASE ]
 *     |-> "End of Turn" Effects Trigger
 *     |-> Heal Temporary Damage (if applicable)
 *     v
 * [ RESOLUTION ]
 *     |-> Check Win Condition (HP <= 0 or Deck Empty)
 *     |-> Determine Winner -> Distribute Rewards/Penalties
 * 
 * ============================================================================
 */

// ==========================================
// 1. FINITE STATE MACHINE (FSM)
// ==========================================

export const initializeBattle = (p1: PlayerProfile, p2: PlayerProfile): BattleState => {
  return {
    turnCount: 1,
    activePlayerId: p1.id, // Simplified coin toss
    phase: BattlePhase.SETUP,
    theStack: [],
    playerA: p1,
    playerB: p2,
  };
};

export const advancePhase = (state: BattleState): BattleState => {
  const flow = [
    BattlePhase.SETUP,
    BattlePhase.DRAW_PHASE,
    BattlePhase.MAIN_PHASE,
    BattlePhase.COMBAT_PHASE,
    BattlePhase.END_PHASE,
    BattlePhase.RESOLUTION // Only entered if game over
  ];

  const currentIndex = flow.indexOf(state.phase);
  
  // If at End Phase, switch turns and go to Draw Phase
  if (state.phase === BattlePhase.END_PHASE) {
    return {
      ...state,
      turnCount: state.turnCount + 1,
      activePlayerId: state.activePlayerId === state.playerA.id ? state.playerB.id : state.playerA.id,
      phase: BattlePhase.DRAW_PHASE
    };
  }

  // Otherwise, next phase
  const nextPhase = flow[currentIndex + 1] || BattlePhase.END_PHASE;
  
  return {
    ...state,
    phase: nextPhase
  };
};

// ==========================================
// 2. THE STACK (LIFO LOGIC)
// ==========================================

export const addToStack = (state: BattleState, item: StackItem): BattleState => {
  return {
    ...state,
    theStack: [...state.theStack, item]
  };
};

/**
 * Resolves the Stack in Last-In-First-Out (LIFO) order.
 * This simulates the complexity of Magic: The Gathering interactions.
 */
export const resolveStack = (state: BattleState): BattleState => {
  if (state.theStack.length === 0) return state;

  // Create a copy to mutate
  const stackCopy = [...state.theStack];
  
  // Process LIFO
  while(stackCopy.length > 0) {
    const item = stackCopy.pop(); // Take the last added
    if (item) {
      console.log(`Resolving Effect: ${item.id} from Source: ${item.sourceCardId}`);
      // In a real implementation, item.effect(state) would return a mutated state.
      // Here we just execute the side effect.
      item.effect(state); 
    }
  }

  return {
    ...state,
    theStack: [] // Stack is now empty
  };
};

// ==========================================
// 3. SOUL WAGER (RISK / REWARD)
// ==========================================

/**
 * Calculates XP gained based on level differential.
 * Formula: XP = Base * (EnemyLvl / PlayerLvl)
 * A Level 10 beating a Level 50 gets 5x rewards.
 * A Level 50 beating a Level 10 gets 0.2x rewards.
 */
export const calculateXPReward = (winnerLvl: number, loserLvl: number): number => {
  const BASE_XP = 100;
  // Prevent division by zero
  const safeWinnerLvl = Math.max(1, winnerLvl);
  const multiplier = loserLvl / safeWinnerLvl;
  
  return Math.floor(BASE_XP * multiplier);
};

/**
 * Applies the 'BROKEN' status to a card that "died" in combat.
 * This is the permadeath-lite mechanic of SoulVerse.
 */
export const breakCard = (card: Card, owner: PlayerProfile): void => {
  card.status = 'BROKEN';
  card.durability = 0;
  
  // Move from Deck/Field to Graveyard
  // Note: In a functional immutable state, we would return a new PlayerProfile.
  // For this boilerplate logic, we are mutating the object reference.
  const deckIndex = owner.grimoire.deck.findIndex(c => c.id === card.id);
  if (deckIndex > -1) {
    owner.grimoire.deck.splice(deckIndex, 1);
    owner.grimoire.graveyard.push(card);
  }
};

/**
 * Penalty for Disconnect / Surrender.
 * Penalizes the player by breaking N random equipped cards.
 */
export const processSurrenderPenalty = (player: PlayerProfile): void => {
  const PENALTY_COUNT = 2; // Lose 2 cards
  
  // Shuffle/Random pick from equipped creatures
  const targets = [...player.equippedCreatures].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < Math.min(targets.length, PENALTY_COUNT); i++) {
    const card = targets[i];
    breakCard(card, player);
    console.log(`PENALTY: ${card.name} has been BROKEN due to surrender.`);
  }
};

// ==========================================
// 4. COMBAT RESOLUTION
// ==========================================

/**
 * Resolves a clash between an Attacker and a Defender.
 * 
 * Rules:
 * 1. Calculate Net Damage.
 * 2. If Damage >= Defense, Defender breaks.
 * 3. Return result for UI.
 */
export const resolveCombat = (attacker: Card, defender: Card, defenderOwner: PlayerProfile): CombatResult => {
  
  // 1. Calculate Damage (Simple for now, could include buffs later)
  const incomingDamage = attacker.stats.attack;
  const defenseValue = defender.stats.defense;

  // 2. Check Lethality
  const isLethal = incomingDamage >= defenseValue;

  let finalStatus: CardStatus = defender.status;

  // 3. Apply Consequences
  if (isLethal) {
    finalStatus = 'BROKEN';
    // The specific mechanics of moving it to graveyard happen here
    breakCard(defender, defenderOwner);
  }

  return {
    attackerId: attacker.id,
    defenderId: defender.id,
    damageDealt: incomingDamage,
    isLethal: isLethal,
    defenderStatusAfter: finalStatus
  };
};