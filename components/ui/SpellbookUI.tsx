import React, { useState, useEffect } from 'react';
import { useBattle } from '../../context/BattleContext';
import { Biome } from '../../types';

// Mock Spell Data
interface SpellDef {
    id: string;
    name: string;
    biome: Biome;
    description: string;
    cost: number;
    icon: string;
}

const SPELL_DB: SpellDef[] = [
    { id: 's1', name: 'Ember Bolt', biome: 'VOLCANIC', cost: 2, description: 'Deals 3 DMG', icon: '🔥' },
    { id: 's2', name: 'Magma Shell', biome: 'VOLCANIC', cost: 4, description: '+4 Defense', icon: '🛡️' },
    { id: 's3', name: 'Vine Whip', biome: 'FOREST', cost: 2, description: 'Stun Target', icon: '🌿' },
    { id: 's4', name: 'Regrowth', biome: 'FOREST', cost: 3, description: 'Heal 5 HP', icon: '💚' },
    { id: 's5', name: 'Frost Nova', biome: 'TUNDRA', cost: 5, description: 'Freeze Area', icon: '❄️' },
    { id: 's6', name: 'Ice Lance', biome: 'TUNDRA', cost: 2, description: 'Pierce DMG', icon: '🧊' },
    { id: 's7', name: 'Toxic Cloud', biome: 'SWAMP', cost: 3, description: 'Poison DoT', icon: '☠️' },
    { id: 's8', name: 'Starfall', biome: 'ASTRAL', cost: 8, description: 'Massive DMG', icon: '🌠' },
    { id: 's9', name: 'Magic Missile', biome: 'NEUTRAL', cost: 1, description: '1 DMG', icon: '✨' },
];

export const SpellbookUI: React.FC = () => {
    const { playerProfile } = useBattle();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyM') {
                setIsOpen(prev => !prev);
            }
            if (e.code === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen) return null;

    const categories: Biome[] = ['NEUTRAL', 'VOLCANIC', 'FOREST', 'TUNDRA', 'SWAMP', 'ASTRAL'];

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border-2 border-slate-600 w-full max-w-4xl h-[600px] rounded-lg shadow-2xl overflow-hidden flex flex-col font-mono text-white relative">
                
                {/* Header */}
                <div className="bg-slate-950 p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
                        <span>📖</span> GRIMOIRE
                    </h2>
                    <div className="flex gap-4 text-sm text-slate-400">
                        <span>UNLOCKED TERRITORIES: <span className="text-white">{playerProfile.unlockedBiomes.length}</span></span>
                        <button onClick={() => setIsOpen(false)} className="hover:text-white">[X] CLOSE</button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
                    
                    {categories.map(biome => {
                        const isUnlocked = playerProfile.unlockedBiomes.includes(biome);
                        const spells = SPELL_DB.filter(s => s.biome === biome);
                        if (spells.length === 0) return null;

                        return (
                            <div key={biome} className="mb-8">
                                <h3 className={`text-lg font-bold mb-3 border-b pb-1 ${isUnlocked ? 'text-white border-white/30' : 'text-slate-600 border-slate-800'}`}>
                                    {biome} MAGIC {isUnlocked ? '' : '(LOCKED - CAPTURE LAND)'}
                                </h3>
                                
                                <div className="grid grid-cols-4 gap-4">
                                    {spells.map(spell => (
                                        <div 
                                            key={spell.id}
                                            className={`p-3 border rounded transition-all relative ${
                                                isUnlocked 
                                                ? 'bg-slate-800 border-slate-600 hover:border-amber-400 hover:bg-slate-700 cursor-pointer' 
                                                : 'bg-slate-900 border-slate-800 opacity-50 grayscale'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-2xl">{spell.icon}</span>
                                                <span className="text-xs bg-cyan-900 text-cyan-200 px-1 rounded">{spell.cost} MP</span>
                                            </div>
                                            <div className="font-bold text-sm mb-1">{spell.name}</div>
                                            <div className="text-xs text-slate-400">{spell.description}</div>

                                            {!isUnlocked && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    🔒
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                </div>

                {/* Footer Hint */}
                <div className="bg-slate-950 p-2 text-center text-xs text-slate-500">
                    Capture Territories (Hold 'L') to unlock new schools of magic.
                </div>
            </div>
        </div>
    );
};