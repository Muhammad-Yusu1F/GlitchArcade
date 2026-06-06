import React, { useState } from 'react';
import { Game } from '../types';
import { Heart, Clock, Award, Star, BookOpen, Trash2, ShieldCheck, Play } from 'lucide-react';

interface LibraryViewProps {
  games: Game[];
  onGameSelect: (game: Game) => void;
  favorites: string[];
  recentGames: Array<{ gameId: string; playedAt: string; highScore: number }>;
  onClearRecent: () => void;
}

export default function LibraryView({ 
  games, 
  onGameSelect, 
  favorites, 
  recentGames, 
  onClearRecent 
}: LibraryViewProps) {
  const [subTab, setSubTab] = useState<'favorites' | 'history' | 'achievements'>('favorites');

  const favoritedList = games.filter(g => favorites.includes(g.id));
  
  const historyList = recentGames.map(history => {
    const game = games.find(g => g.id === history.gameId);
    return { ...history, game };
  }).filter(h => h.game !== undefined) as Array<{ gameId: string; playedAt: string; highScore: number; game: Game }>;

  // Curated achievement milestones
  const achievements = [
    { title: "Geymerning Tug'ilishi", desc: "Glitch Arcade platformasiga a'zo bo'ling", badge: "BRONZA", icon: ShieldCheck, unlocked: true },
    { title: "Birinchi Qadam", desc: "Hohlagan biror o'yinda o'yinni yakunlang", badge: "BRONZA", icon: TrophyIcon, unlocked: historyList.length > 0 },
    { title: "Tugallanmas Qiziqish", desc: "Kamida 3 ta har xil o'yinni o'ynab ko'ring", badge: "KUMUSH", icon: Play, unlocked: historyList.length >= 3 },
    { title: "Professional To'plovchi", desc: "O'yinlarda 300 balldan yuqori natijaga erishing", badge: "TILLA", icon: Award, unlocked: historyList.some(h => h.highScore >= 300) },
  ];

  return (
    <div className="space-y-8 font-sans pb-20">
      {/* View Title */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-black italic text-white uppercase flex items-center gap-2">
          <BookOpen size={20} className="text-[#00daf3]" />
          <span>KUTUBXONA</span>
        </h2>
        <p className="text-xs text-on-surface-variant">
          Saqlangan o'yinlar, o'yin tarixlari va rekord yutuqlar to'plami.
        </p>
      </div>

      {/* Internal Subtabs Row */}
      <div className="flex bg-zinc-950 border border-white/5 rounded-xl p-1 gap-1">
        <button 
          onClick={() => setSubTab('favorites')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'favorites' 
              ? 'bg-white/10 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          SEVIMLILAR ({favoritedList.length})
        </button>
        <button 
          onClick={() => setSubTab('history')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'history' 
              ? 'bg-white/10 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          O'YIN TARIXI ({historyList.length})
        </button>
        <button 
          onClick={() => setSubTab('achievements')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'achievements' 
              ? 'bg-white/10 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          YUTUQLAR
        </button>
      </div>

      {/* Content panel matching selection */}
      {subTab === 'favorites' && (
        <div className="space-y-4">
          {favoritedList.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs border border-dashed border-white/5 rounded-2xl bg-zinc-950/20 max-w-md mx-auto">
              <Heart size={32} className="mx-auto mb-3 text-white/10" />
              Sizda hozircha sevimlilarga qo'shilgan o'yinlar yo'q. Istalgan o'yinning batafsil sahifasida yurakchani bosing!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {favoritedList.map((game) => (
                <div 
                  key={game.id}
                  onClick={() => onGameSelect(game)}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-950/80 border border-white/5 hover:border-[#00daf3]/50 transition-all duration-300 hover:scale-[1.03] flex flex-col justify-end cursor-pointer"
                >
                  <img 
                    src={game.image} 
                    alt={game.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  <div className="relative p-3 z-10">
                    <h4 className="font-semibold text-xs text-white truncate mb-0.5">{game.title}</h4>
                    <div className="flex items-center gap-1">
                      <Star className="text-[#9ffb00] fill-current" size={9} />
                      <span className="font-mono text-[9px] text-[#bac9cc]">{game.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-zinc-950 px-4 py-2.5 rounded-xl border border-white/5 text-[10px] text-gray-400">
            <span className="uppercase tracking-wider font-mono">SO'NGHI FAOLIYAT</span>
            {historyList.length > 0 && (
              <button 
                onClick={onClearRecent}
                className="hover:text-red-400 font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 size={11} />
                <span>TOZALASH</span>
              </button>
            )}
          </div>

          {historyList.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs border border-dashed border-white/5 rounded-2xl bg-zinc-950/20 max-w-md mx-auto">
              <Clock size={32} className="mx-auto mb-3 text-white/10" />
              Hali hech qanday o'yin o'ynamadingiz. O'yin sahifasida 'Hozir O'ynash' tugmasini bosing!
            </div>
          ) : (
            <div className="space-y-3">
              {historyList.map((hist, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-950 border border-white/5 flex justify-between items-center hover:border-white/10 transition-all cursor-pointer group"
                  onClick={() => onGameSelect(hist.game)}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={hist.game.image} 
                      alt={hist.game.title} 
                      className="w-11 h-11 object-cover rounded-lg border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-white truncate mb-0.5 group-hover:text-[#00daf3] transition-colors">{hist.game.title}</h4>
                      <p className="text-[10px] text-gray-500">{hist.playedAt}</p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">REKORD</p>
                      <p className="font-mono text-xs font-bold text-[#9ffb00]">{hist.highScore} ball</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors group-hover:bg-[#00daf3]/10 group-hover:border-[#00daf3]">
                      <span className="text-xs font-bold">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((ach, idx) => {
            const Icon = ach.icon;
            return (
              <div 
                key={idx}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                  ach.unlocked 
                    ? 'bg-zinc-950 border-white/10 hover:border-white/15' 
                    : 'bg-zinc-950/40 border-white/5 opacity-55'
                }`}
              >
                <div className={`p-3 rounded-lg border flex items-center justify-center ${
                  ach.unlocked 
                    ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' 
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className={`font-semibold text-xs truncate ${ach.unlocked ? 'text-white' : 'text-gray-400'}`}>{ach.title}</h4>
                    <span className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      ach.badge === 'TILLA' 
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                        : ach.badge === 'KUMUSH' 
                        ? 'bg-slate-300/10 text-slate-300 border border-slate-300/10' 
                        : 'bg-amber-700/10 text-amber-600 border border-amber-700/10'
                    }`}>
                      {ach.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{ach.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Inline fallback trophy helper component for simpler imports
function TrophyIcon(props: any) {
  return <Award {...props} />;
}
