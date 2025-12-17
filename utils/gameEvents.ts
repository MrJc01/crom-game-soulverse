export const HOTBAR_EVENT = 'hotbar-slot-change';
export const ABILITY_USE_EVENT = 'ability-use';

export const dispatchHotbarSlot = (slot: number) => {
  window.dispatchEvent(new CustomEvent(HOTBAR_EVENT, { detail: slot }));
};

export const dispatchAbilityUse = (slot: number, cooldownMs: number) => {
  window.dispatchEvent(new CustomEvent(ABILITY_USE_EVENT, { 
    detail: { slot, cooldown: cooldownMs } 
  }));
};