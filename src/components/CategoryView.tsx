import React from 'react';
import { Game } from '../types';
import { Gamepad2, Stars, Flame, Zap, Trophy, HelpCircle, Star, Search, Filter } from 'lucide-react';

interface CategoryViewProps {
  games: Game[];
  onGameSelect: (game: Game) => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export default function CategoryView({ games, onGameSelect, selectedCategory, onCategorySelect }: CategoryViewProps) {
  
  const categoriesList = [
    { key: 'barchasi', label: 'Barchasi', desc: "Platformadagi barcha ultra modern o'yinlar ro'yxati", icon: Gamepad2, gradient: 'from-cyan-900/30 to-slate-900/40 border-cyan-500/30' },
    { key: 'dolzarb', label: 'Dolzarb', desc: "Eng ko'p o'ynalgan, reyxing baland bo'lgan hit o'yinlar", icon: Flame, gradient: 'from-amber-900/30 to-slate-900/40 border-amber-500/30' },
    { key: 'action', label: 'Action', desc: "Harakatli jangovar va dinamik reaksiyali o'yinlar sarguzashti", icon: Zap, gradient: 'from-red-900/30 to-slate-900/40 border-red-500/30' },
    { key: 'poyga', label: 'Poyga', desc: "Futuristik kema va mashinalarda yuqori tezlikda drayf poygalari", icon: Trophy, gradient: 'from-lime-900/30 to-slate-900/40 border-lime-500/30' },
    { key: 'mantiq', label: 'Mantiq', desc: "Zihn va mantiqiy fikrlashni rivojlantiruvchi muammoli jumboqlar", icon: HelpCircle, gradient: 'from-indigo-900/30 to-slate-900/40 border-indigo-500/30' },
    { key: 'sport', label: 'Sport', desc: "Gravitatsiyasiz makondagi ekstremal orbital musobaqalar", icon: Stars, gradient: 'from-pink-900/30 to-slate-900/40 border-pink-500/30' },
  ];

  const filteredGames = selectedCategory === 'barchasi' 
    ? games 
    : games.filter(g => g.category === selectedCategory);

  return (
    <div className="space-y-8 font-sans pb-20">
      
      {/* Category banner introduction */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-black italic text-white uppercase flex items-center gap-2">
          <Filter size={20} className="text-[#00daf3]" />
          <span>KATEGORIYALAR</span>
        </h2>
        <p className="text-xs text-on-surface-variant">
          O'yin janrlari va sarguzasht yo'nalishlariga qarab saralang elementlar.
        </p>
      </div>

      {/* Grid of category tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categoriesList.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.key;
          const gameCount = cat.key === 'barchasi' 
            ? games.length 
            : games.filter(g => g.category === cat.key).length;

          return (
            <button
              key={cat.key}
              onClick={() => onCategorySelect(cat.key)}
              className={`p-5 rounded-2xl flex items-start gap-4 text-left transition-all border outline-none cursor-pointer group ${
                isSelected 
                  ? `bg-zinc-900 border-[#00daf3] shadow-[0_0_15px_rgba(0,229,255,0.15)]` 
                  : `bg-zinc-950/80 border-white/5 hover:border-white/10`
              }`}
            >
              <div className={`p-3 rounded-xl border ${isSelected ? 'bg-[#00daf3]/10 border-[#00daf3]' : 'bg-white/5 border-white/10 group-hover:border-white/20'} transition-all`}>
                <Icon size={20} className={isSelected ? 'text-[#00daf3]' : 'text-gray-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>{cat.label}</h3>
                  <span className="font-mono text-[10px] text-gray-500 font-bold">{gameCount} ta o'yin</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed truncate">{cat.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Result Section Header */}
      <div className="h-px bg-white/5 pt-4" />
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold tracking-wider text-slate-400 uppercase">
          {selectedCategory.toUpperCase()} GENERATSIYASI
        </h3>
        <span className="font-mono text-[10px] text-on-surface-variant font-medium">Natijalar: {filteredGames.length} ta o'yin</span>
      </div>

      {/* Filtered Grid cards */}
      {filteredGames.length === 0 ? (
        <div className="p-12 text-center text-gray-500 text-xs border border-dashed border-white/5 rounded-2xl bg-zinc-950/30">
          Ushbu kategoriyada hozircha o'yinlar mavjud emas.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredGames.map((game) => (
            <div 
              key={game.id}
              onClick={() => onGameSelect(game)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-950/80 border border-white/5 hover:border-[#00daf3]/50 transition-all duration-350 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,218,243,0.25)] flex flex-col justify-end cursor-pointer"
            >
              <img 
                src={game.image} 
                alt={game.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              
              <div className="relative p-3.5 z-10">
                <h4 className="font-semibold text-xs text-white truncate mb-0.5">{game.title}</h4>
                <div className="flex items-center gap-1">
                  <Star className="text-secondary-fixed fill-current" size={9} />
                  <span className="font-mono text-[9px] text-[#bac9cc]">{game.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
