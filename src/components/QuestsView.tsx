import React from 'react';
import { Quest, UserStats } from '../types';
import { Trophy, Compass, Star, Zap, Clock, Coins, CheckCircle, ShieldAlert } from 'lucide-react';

interface QuestsViewProps {
  quests: Quest[];
  stats: UserStats;
  onClaimReward: (questId: string) => void;
}

export default function QuestsView({ quests, stats, onClaimReward }: QuestsViewProps) {
  // Web Audio feedback
  const playClaimSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  };

  const handleClaim = (questId: string) => {
    playClaimSound();
    onClaimReward(questId);
  };

  return (
    <div className="space-y-8 font-sans pb-20">
      
      {/* Player stats header section */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-white/5 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-primary-container/5 to-transparent pointer-events-none" />
        
        {/* Level ring details */}
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-zinc-900 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.4)]">
            <span className="font-display font-black text-white text-xl">{stats.level}</span>
            <div className="absolute inset-0 rounded-full border-1.5 border-[#00e5ff] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-white uppercase italic tracking-wider">LEVEL TIER</h3>
              <span className="font-mono text-[9px] font-bold text-[#9ffb00] bg-[#102000] border border-[#2f4f00] px-1.5 py-0.2 rounded uppercase">
                {stats.tag}
              </span>
            </div>
            
            {/* XP progress bars */}
            <div className="mt-2 text-xs flex items-center gap-3 w-48 sm:w-64">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[#00daf3] to-[#8bdc00] rounded-full transition-all duration-500"
                  style={{ width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-gray-400 font-semibold">{stats.xp}/{stats.xpToNextLevel} XP</span>
            </div>
          </div>
        </div>

        {/* Currency balances indicators */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="flex items-center gap-1.5 text-amber-400 justify-center">
              <Coins size={14} className="animate-spin-slow" />
              <span className="font-mono text-base font-black text-white">{stats.coins}</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">GLITCH TANGALARI</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="flex items-center gap-1.5 text-primary justify-center">
              <Trophy size={14} />
              <span className="font-mono text-base font-black text-white">{stats.gamesPlayed}</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">O'YNAR SONI</p>
          </div>
        </div>
      </div>

      {/* Quests Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Compass size={18} className="text-[#9ffb00]" />
            <span>KUNLIK MISSiyalar</span>
          </h2>
          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5 uppercase">
            <Clock size={11} className="text-[#ffc3ad]" />
            Yangilanish: 16 soat qoldi
          </span>
        </div>

        {/* Quest listing */}
        <div className="space-y-3.5">
          {quests.map((quest) => {
            const isCompleted = quest.progress >= 100 || quest.completed;
            return (
              <div 
                key={quest.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all ${
                  quest.completed 
                    ? 'bg-zinc-950/40 border-white/5 opacity-65'
                    : 'bg-zinc-950 border-white/5 hover:border-white/10'
                }`}
              >
                {/* Details info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      quest.type === 'daily' 
                        ? 'bg-[#00daf3]/10 text-[#00daf3]' 
                        : quest.type === 'weekly' 
                        ? 'bg-[#9ffb00]/10 text-[#9ffb00]' 
                        : 'bg-amber-400/10 text-amber-400'
                    }`}>
                      {quest.type}
                    </span>
                    <h3 className={`font-semibold text-xs py-0.5 ${quest.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                      {quest.title}
                    </h3>
                  </div>
                  
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {quest.description}
                  </p>

                  {/* Progressive Bar */}
                  {!quest.completed && (
                    <div className="flex items-center gap-2.5 max-w-sm pt-1">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full"
                          style={{ width: `${quest.progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-gray-500 font-bold">{quest.progress}%</span>
                    </div>
                  )}
                </div>

                {/* Quests Rewards action */}
                <div className="flex sm:flex-col items-end gap-3.5 sm:gap-2 justify-between border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 leading-none">
                      <Coins size={11} className="text-amber-400" />
                      <span>+{quest.rewardCoins} T</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 leading-none">
                      <Zap size={11} className="text-primary" />
                      <span>+{quest.rewardXP} XP</span>
                    </div>
                  </div>

                  {/* Actions status */}
                  {quest.completed ? (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg leading-none">
                      <CheckCircle size={12} />
                      <span>Bajarildi</span>
                    </span>
                  ) : isCompleted ? (
                    <button 
                      onClick={() => handleClaim(quest.id)}
                      className="bg-[#9ffb00] hover:bg-[#8bdc00] text-black font-semibold text-[10px] px-3.5 py-2 rounded-lg transition-all active:scale-95 cursor-pointer leading-none border-0"
                    >
                      Mukofotni Olish
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-wider bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-lg leading-none">
                      Bajarilmoqda
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
