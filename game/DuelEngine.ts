import { Card, CardType, Ability, AbilityTrigger, EffectType, TargetRequirement } from '../types';

// Helper for generating runtime IDs
const generateUUID = () => Math.random().toString(36).substring(2, 9);

// ==========================================
// 1. CARD INSTANCE
// Represents a specific card object in the game loop.
// Wrapper around the static "Card" data with mutable runtime stats.
// ==========================================
export class CardInstance {
  runtimeId: string;
  originalId: string;
  name: string;
  cost: number;
  
  // Mutable Combat Stats
  attack: number;
  health: number;
  maxHealth: number;
  
  // Abilities
  abilities: Ability[];

  // State Flags
  isExhausted: boolean; // Summoning sickness or already attacked
  location: 'DECK' | 'HAND' | 'BATTLEFIELD' | 'GRAVEYARD' | 'EXILED';

  constructor(cardData: Card) {
    this.runtimeId = `inst_${generateUUID()}`;
    this.originalId = cardData.id;
    this.name = cardData.name;
    this.cost = cardData.stats.cost;
    
    this.attack = cardData.stats.attack;
    this.health = cardData.stats.defense;
    this.maxHealth = cardData.stats.defense;
    
    this.abilities = cardData.abilities || [];

    this.isExhausted = true; // Creatures enter with "Summoning Sickness" usually
    this.location = 'DECK';
  }

  takeDamage(amount: number): boolean {
    this.health -= amount;
    return this.health <= 0;
  }

  heal(amount: number): void {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }

  refresh(): void {
    this.isExhausted = false;
  }
}

// ==========================================
// 2. ZONE CLASS
// Manages a collection of cards (Deck, Hand, etc.)
// ==========================================
export class Zone {
  cards: CardInstance[];
  type: 'DECK' | 'HAND' | 'BATTLEFIELD' | 'GRAVEYARD';

  constructor(type: 'DECK' | 'HAND' | 'BATTLEFIELD' | 'GRAVEYARD') {
    this.cards = [];
    this.type = type;
  }

  add(card: CardInstance) {
    card.location = this.type;
    this.cards.push(card);
  }

  remove(cardId: string): CardInstance | null {
    const index = this.cards.findIndex(c => c.runtimeId === cardId);
    if (index === -1) return null;
    return this.cards.splice(index, 1)[0];
  }

  removeAt(index: number): CardInstance | null {
    if (index < 0 || index >= this.cards.length) return null;
    const card = this.cards.splice(index, 1)[0];
    return card;
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  getById(runtimeId: string): CardInstance | undefined {
    return this.cards.find(c => c.runtimeId === runtimeId);
  }

  get count() {
    return this.cards.length;
  }
}

// ==========================================
// 3. PLAYER DUEL STATE
// Tracks Mana, Life, and Zones for a single player.
// ==========================================
export class PlayerDuelState {
  playerId: string;
  health: number;
  maxHealth: number;
  
  currentMana: number;
  maxMana: number;
  manaCap: number; // usually 10

  deck: Zone;
  hand: Zone;
  battlefield: Zone;
  graveyard: Zone;

  constructor(playerId: string, deckList: Card[]) {
    this.playerId = playerId;
    this.health = 20;
    this.maxHealth = 20;
    
    this.currentMana = 0;
    this.maxMana = 0;
    this.manaCap = 10;

    // Initialize Zones
    this.deck = new Zone('DECK');
    this.hand = new Zone('HAND');
    this.battlefield = new Zone('BATTLEFIELD');
    this.graveyard = new Zone('GRAVEYARD');

    // Populate Deck
    deckList.forEach(cardData => {
      this.deck.add(new CardInstance(cardData));
    });
  }

  drawCard(amount: number = 1): void {
    for (let i = 0; i < amount; i++) {
      if (this.deck.count > 0) {
        // Draw from top
        const card = this.deck.removeAt(0);
        if (card) {
            this.hand.add(card);
            console.log(`[${this.playerId}] Drew ${card.name}`);
        }
      } else {
        console.log(`[${this.playerId}] Fatigue! Out of cards.`);
      }
    }
  }
}

// ==========================================
// 4. DUEL ENGINE (THE BRAIN)
// Manages the flow, turns, and interactions.
// ==========================================

interface PendingEffect {
    sourceId: string;
    ability: Ability;
    targetId?: string; // Runtime ID
}

export class DuelEngine {
  player1: PlayerDuelState;
  player2: PlayerDuelState;
  turnCount: number;
  activePlayerId: string;
  gameStatus: 'PRE_GAME' | 'ACTIVE' | 'FINISHED';
  winnerId: string | null;
  
  // The Effect Stack
  effectStack: PendingEffect[];

  constructor(p1Id: string, p1Deck: Card[], p2Id: string, p2Deck: Card[]) {
    this.player1 = new PlayerDuelState(p1Id, p1Deck);
    this.player2 = new PlayerDuelState(p2Id, p2Deck);
    this.turnCount = 0;
    this.activePlayerId = '';
    this.gameStatus = 'PRE_GAME';
    this.winnerId = null;
    this.effectStack = [];
  }

  getActivePlayer(): PlayerDuelState {
    return this.activePlayerId === this.player1.playerId ? this.player1 : this.player2;
  }

  getOpponent(): PlayerDuelState {
    return this.activePlayerId === this.player1.playerId ? this.player2 : this.player1;
  }

  getPlayerById(id: string): PlayerDuelState | undefined {
    if (this.player1.playerId === id) return this.player1;
    if (this.player2.playerId === id) return this.player2;
    return undefined;
  }

  // --- GAME FLOW ---

  startGame() {
    this.player1.deck.shuffle();
    this.player2.deck.shuffle();

    this.player1.drawCard(5);
    this.player2.drawCard(5);

    this.activePlayerId = Math.random() > 0.5 ? this.player1.playerId : this.player2.playerId;
    this.gameStatus = 'ACTIVE';

    console.log(`Duel Started! ${this.activePlayerId} goes first.`);
    this.startTurn(this.activePlayerId);
  }

  startTurn(playerId: string) {
    this.activePlayerId = playerId;
    this.turnCount++;

    const player = this.getActivePlayer();

    if (player.maxMana < player.manaCap) {
      player.maxMana++;
    }
    player.currentMana = player.maxMana;
    player.drawCard(1);
    player.battlefield.cards.forEach(c => c.refresh());

    console.log(`\n--- Turn ${this.turnCount}: ${player.playerId} ---`);
    console.log(`Mana: ${player.currentMana}/${player.maxMana} | Hand: ${player.hand.count} | Field: ${player.battlefield.count}`);
  }

  endTurn() {
    const nextPlayerId = this.getOpponent().playerId;
    this.startTurn(nextPlayerId);
  }

  // --- ACTIONS ---

  /**
   * Casts a card from hand to battlefield.
   * Includes checking for ON_PLAY abilities.
   */
  playCard(playerId: string, handIndex: number, targetId?: string): boolean {
    if (this.gameStatus !== 'ACTIVE') return false;
    if (playerId !== this.activePlayerId) {
        console.warn("Not your turn!");
        return false;
    }

    const player = this.getActivePlayer();
    const card = player.hand.cards[handIndex]; 

    if (!card) return false;

    // Check Mana
    if (player.currentMana < card.cost) {
      console.warn(`Not enough mana to play ${card.name} (Cost: ${card.cost}, Current: ${player.currentMana})`);
      return false;
    }

    // Pay Cost
    player.currentMana -= card.cost;

    // Move Zone
    const movedCard = player.hand.removeAt(handIndex);
    if (movedCard) {
      player.battlefield.add(movedCard);
      movedCard.isExhausted = true; 
      console.log(`${playerId} played ${movedCard.name}`);

      // Check ON_PLAY Abilities
      this.checkTrigger(movedCard, 'ON_PLAY', targetId);
      
      return true;
    }
    return false;
  }

  // --- ABILITY SYSTEM ---

  /**
   * Checks if a card has abilities with the given trigger and adds them to stack.
   */
  checkTrigger(sourceCard: CardInstance, trigger: AbilityTrigger, manualTargetId?: string) {
    const abilities = sourceCard.abilities.filter(a => a.trigger === trigger);
    
    abilities.forEach(ability => {
        let finalTargetId = manualTargetId;

        // "Mock" request target if required and not provided
        if (ability.targetRequirement !== 'NONE' && ability.targetRequirement !== 'SELF' && !finalTargetId) {
            console.log(`[System] Ability of ${sourceCard.name} requires target (${ability.targetRequirement})...`);
            finalTargetId = this.mockRequestTarget(ability.targetRequirement);
        }

        // Push to stack
        this.effectStack.push({
            sourceId: sourceCard.runtimeId,
            ability: ability,
            targetId: finalTargetId
        });
        
        console.log(`[Stack] Added ability: ${ability.effectType} -> ${finalTargetId || 'No Target'}`);
    });

    // Process immediately for this prototype
    if (this.effectStack.length > 0) {
        this.processStack();
    }
  }

  /**
   * Simulates a UI request for a target.
   * Returns the ID of the first valid target found (simple AI).
   */
  mockRequestTarget(req: TargetRequirement): string | undefined {
      const opponent = this.getOpponent();
      const active = this.getActivePlayer();

      if (req === 'ENEMY_CREATURE') {
          // Just pick the first enemy
          const target = opponent.battlefield.cards[0];
          if (target) return target.runtimeId;
      }
      if (req === 'ENEMY_PLAYER') {
          return opponent.playerId; // Treat player ID as a valid target ID for damage logic usually
      }
      return undefined;
  }

  /**
   * Executes effects in LIFO order.
   */
  processStack() {
      while (this.effectStack.length > 0) {
          const effect = this.effectStack.pop(); // LIFO
          if (effect) {
              this.resolveAbility(effect);
          }
      }
  }

  /**
   * Resolves a single ability effect.
   */
  resolveAbility(effect: PendingEffect) {
      const sourceCard = this.findCard(effect.sourceId);
      // Note: Source card might be dead/gone, but usually effect persists. 
      // We need source primarily for context logs or specific "deal damage equal to attack" logic.

      const { effectType, value } = effect.ability;
      
      // Resolve Targets
      let targetObj: any = null;
      let targetName = "Unknown";

      // Check if target is a Player
      if (effect.targetId === this.player1.playerId) targetObj = this.player1;
      else if (effect.targetId === this.player2.playerId) targetObj = this.player2;
      else if (effect.targetId) {
          // Check if target is a Card
          targetObj = this.findCard(effect.targetId);
      }

      // Handle Self Targeting
      if (effect.ability.targetRequirement === 'SELF' && sourceCard) {
          targetObj = sourceCard;
      }

      if (targetObj) {
        if (targetObj instanceof CardInstance) targetName = targetObj.name;
        if (targetObj instanceof PlayerDuelState) targetName = "Player " + targetObj.playerId;
      }

      console.log(`[Resolving] ${effectType} (${value}) on ${targetName}`);

      switch (effectType) {
          case 'DEAL_DAMAGE':
              if (targetObj instanceof CardInstance) {
                  const dead = targetObj.takeDamage(value);
                  console.log(`   > ${targetName} takes ${value} dmg. HP: ${targetObj.health}`);
                  if (dead) this.handleCardDeath(targetObj);
              } else if (targetObj instanceof PlayerDuelState) {
                  targetObj.health -= value;
                  console.log(`   > ${targetName} takes ${value} dmg. HP: ${targetObj.health}`);
                  this.checkWinCondition();
              }
              break;

          case 'HEAL':
              if (targetObj instanceof CardInstance) {
                  targetObj.heal(value);
                  console.log(`   > ${targetName} healed. HP: ${targetObj.health}`);
              } else if (targetObj instanceof PlayerDuelState) {
                  targetObj.health = Math.min(targetObj.health + value, targetObj.maxHealth);
                  console.log(`   > ${targetName} healed. HP: ${targetObj.health}`);
              }
              break;
          
          case 'BUFF_STATS':
              if (targetObj instanceof CardInstance) {
                  targetObj.attack += value;
                  targetObj.health += value;
                  targetObj.maxHealth += value;
                  console.log(`   > ${targetName} buffed +${value}/+${value}. Now: ${targetObj.attack}/${targetObj.health}`);
              }
              break;
            
          case 'DRAW_CARD':
             // Usually targets 'SELF' (Controller)
             // Need to find who controls the source card
             // Simplified: Assume active player for now
             this.getActivePlayer().drawCard(value);
             break;
      }
  }

  // --- UTILS ---

  findCard(runtimeId: string): CardInstance | undefined {
      // Search all zones of both players (inefficient but covers all bases)
      const allZones = [
          this.player1.hand, this.player1.battlefield, this.player1.graveyard,
          this.player2.hand, this.player2.battlefield, this.player2.graveyard
      ];
      
      for (const zone of allZones) {
          const found = zone.getById(runtimeId);
          if (found) return found;
      }
      return undefined;
  }

  handleCardDeath(card: CardInstance) {
      console.log(`   > ${card.name} dies.`);
      // Find where it is and move to graveyard
      // We need to know who owns it.
      const p1Has = this.player1.battlefield.getById(card.runtimeId);
      if (p1Has) {
          this.player1.battlefield.remove(card.runtimeId);
          this.player1.graveyard.add(card);
          this.checkTrigger(card, 'ON_DEATH');
      } else {
          const p2Has = this.player2.battlefield.getById(card.runtimeId);
          if (p2Has) {
              this.player2.battlefield.remove(card.runtimeId);
              this.player2.graveyard.add(card);
              this.checkTrigger(card, 'ON_DEATH');
          }
      }
  }

  attackCreature(attackerRuntimeId: string, targetRuntimeId: string): boolean {
    const activePlayer = this.getActivePlayer();
    const opponent = this.getOpponent();

    const attacker = activePlayer.battlefield.getById(attackerRuntimeId);
    const defender = opponent.battlefield.getById(targetRuntimeId);

    if (!attacker || !defender) return false;
    if (attacker.isExhausted) {
        console.warn(`${attacker.name} is exhausted.`);
        return false;
    }

    console.log(`${attacker.name} attacks ${defender.name}`);
    attacker.isExhausted = true;

    // Simultaneous Damage
    const defenderDead = defender.takeDamage(attacker.attack);
    const attackerDead = attacker.takeDamage(defender.attack); 

    if (defenderDead) this.handleCardDeath(defender);
    if (attackerDead) this.handleCardDeath(attacker);

    return true;
  }

  attackPlayer(attackerRuntimeId: string): boolean {
    const activePlayer = this.getActivePlayer();
    const opponent = this.getOpponent();

    const attacker = activePlayer.battlefield.getById(attackerRuntimeId);
    
    if (!attacker) return false;
    if (attacker.isExhausted) return false;

    attacker.isExhausted = true;

    opponent.health -= attacker.attack;
    console.log(`${attacker.name} hits Face for ${attacker.attack}. Opponent HP: ${opponent.health}`);

    this.checkWinCondition();
    return true;
  }

  checkWinCondition() {
    if (this.player1.health <= 0) {
      this.gameStatus = 'FINISHED';
      this.winnerId = this.player2.playerId;
      console.log(`\n*** GAME OVER. Winner: ${this.winnerId} ***`);
    } else if (this.player2.health <= 0) {
      this.gameStatus = 'FINISHED';
      this.winnerId = this.player1.playerId;
      console.log(`\n*** GAME OVER. Winner: ${this.winnerId} ***`);
    }
  }
}

// ==========================================
// 5. MOCK DATA HELPER
// ==========================================
export const generateMockDeck = (size: number): Card[] => {
  const templates: Card[] = [
    {
      id: 'tmpl_1', name: 'Goblin Grunt', type: 'CREATURE', rarity: 'COMMON',
      description: '', originBiome: 'SWAMP', soulWeight: 1, status: 'MINTED', durability: 100,
      stats: { attack: 2, defense: 2, cost: 2 }
    },
    {
      id: 'tmpl_pyro', name: 'Pyromancer', type: 'CREATURE', rarity: 'RARE',
      description: 'Burn them all.', originBiome: 'VOLCANIC', soulWeight: 3, status: 'MINTED', durability: 100,
      stats: { attack: 2, defense: 2, cost: 3 },
      abilities: [
          { 
              trigger: 'ON_PLAY', 
              effectType: 'DEAL_DAMAGE', 
              value: 2, 
              targetRequirement: 'ENEMY_CREATURE' 
          }
      ]
    },
    {
      id: 'tmpl_cleric', name: 'Sanctuary Cleric', type: 'CREATURE', rarity: 'COMMON',
      description: 'Healing light.', originBiome: 'FOREST', soulWeight: 2, status: 'MINTED', durability: 100,
      stats: { attack: 1, defense: 4, cost: 3 },
      abilities: [
          {
              trigger: 'ON_PLAY',
              effectType: 'HEAL',
              value: 3,
              targetRequirement: 'SELF'
          }
      ]
    }
  ];

  const deck: Card[] = [];
  for (let i = 0; i < size; i++) {
    const tmpl = templates[Math.floor(Math.random() * templates.length)];
    // Deep clone to ensure abilities array is unique per card instance if mutated later
    deck.push(JSON.parse(JSON.stringify(tmpl))); 
  }
  return deck;
};

// ==========================================
// USAGE EXAMPLE (Simulation)
// ==========================================
/*
console.log("\n>>> SIMULATION START >>>");

// 1. Setup
const p1Deck = generateMockDeck(10);
const p2Deck = generateMockDeck(10);

// Force P2 to have a target on board for the test
const targetDummy: Card = {
    id: 'dummy', name: 'Target Dummy', type: 'CREATURE', rarity: 'COMMON', description: '', originBiome: 'NEUTRAL', soulWeight: 0, status: 'MINTED', durability: 100,
    stats: { attack: 0, defense: 2, cost: 0}
};
p2Deck.unshift(targetDummy); // Put on top of deck

const engine = new DuelEngine("Hero", p1Deck, "Villain", p2Deck);

// 2. Start
engine.startGame(); // Hero Turn 1

// 3. Villain Setup (Skip to Turn 2)
engine.endTurn(); // Villain Turn 2
// Villain plays the Dummy
if (engine.player2.hand.cards.length > 0) engine.playCard("Villain", 0);

// 4. Hero Turn (Turn 3)
engine.endTurn(); // Hero Turn 3 (3 Mana)

// Give Hero a Pyromancer explicitly in hand for the test
const pyroCard: Card = {
    id: 'pyro_test', name: 'Pyromancer', type: 'CREATURE', rarity: 'RARE', description: '', originBiome: 'VOLCANIC', soulWeight: 0, status: 'MINTED', durability: 100,
    stats: { attack: 2, defense: 2, cost: 3},
    abilities: [{ trigger: 'ON_PLAY', effectType: 'DEAL_DAMAGE', value: 2, targetRequirement: 'ENEMY_CREATURE' }]
};
engine.player1.hand.add(new CardInstance(pyroCard));

// Hero Plays Pyromancer
console.log("\n>>> TESTING ABILITY >>>");
// Index of Pyromancer is likely last since we just added it
const handIndex = engine.player1.hand.count - 1;

// This should trigger the ability, find the Dummy, and kill it (2 HP - 2 Dmg)
engine.playCard("Hero", handIndex);

console.log(">>> SIMULATION END >>>\n");
*/