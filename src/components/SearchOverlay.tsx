import React, { useState, useEffect, useRef } from 'react';
import { Game } from '../types';
import { Search, X, Star, Flame, Trophy, Play } from 'lucide-react';

interface SearchOverlayProps {
  games: Game[];
  onGameSelect: (game: Game) => void;
  onClose: () => void;
}

export default function SearchOverlay({ games, onGameSelect, onClose }: SearchOverlayProps) {
  const [searchInput, setSearchInput] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredGames = games.filter(g => {
    const matchTitle = g.title.toLowerCase().includes(searchInput.toLowerCase());
    const matchDeveloper = g.developer.toLowerCase().includes(searchInput.toLowerCase());
    const matchTags = g.tags.some(t => t.toLowerCase().includes(searchInput.toLowerCase()));
    return matchTitle || matchDeveloper || matchTags;
  });

  return (
    <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-lg flex flex-col font-sans">
      {/* Search Header Area */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between gap-4 h-16 bg-zinc-900/40">
        <div className="flex-1 flex items-center gap-3">
          <Search className="text-[#00daf3]" size={18} />
          <input 
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="O'yin nomini, kalit so'zni yoki dasturchini kiriting..."
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none border-none py-1"
          />
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Results details panel */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span className="uppercase tracking-wider">NATIJALAR ROYXATI</span>
            <span>TOPILDI_MASALLLAR: {filteredGames.length} ta o'yin</span>
          </div>

          {filteredGames.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs border border-dashed border-white/5 rounded-2xl bg-zinc-950/20">
              Hech qanday o'yin topilmadi. Qayta urinib ko'ring yoki boshqa so'z yozing.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGames.map((game) => (
                <div 
                  key={game.id}
                  onClick={() => onGameSelect(game)}
                  className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/5 flex justify-between items-center hover:border-white/15 hover:bg-zinc-900 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={game.image} 
                      alt={game.title} 
                      className="w-10 h-10 object-cover rounded-lg border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs text-white truncate mb-0.5 group-hover:text-[#00daf3] transition-colors">{game.title}</h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[8px] font-bold text-gray-400 bg-white/5 px-1.5 py-0.2 rounded uppercase">
                          {game.category}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          <Star size={9} className="fill-current" />
                          <span className="font-mono text-[9px] text-gray-400 font-semibold">{game.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:bg-[#00daf3]/10 group-hover:text-[#00daf3] group-hover:border-[#00daf3] transition-all">
                    <Play size={11} className="fill-current translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick recommendations categories */}
          {searchInput.length === 0 && (
            <div className="pt-4 border-t border-white/5 space-y-3">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block font-bold">O'XShASh KEYWORDS</span>
              <div className="flex flex-wrap gap-2">
                {['Cyberpunk', 'Poyga', 'Action', 'Hacking', 'Retro', 'Mantiq', 'Puzzle', 'Shooter'].map((tag, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSearchInput(tag)}
                    className="font-mono text-[10px] text-gray-400 hover:text-white bg-zinc-950/80 border border-white/5 rounded-lg px-3 py-1.5 transition-all hover:border-[#00daf3]/30 cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
