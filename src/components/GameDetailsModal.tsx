import React, { useState } from 'react';
import { Game } from '../types';
import { X, Star, Heart, Share2, Play, Download, Calendar, Layers, ShieldCheck, Gamepad2 } from 'lucide-react';

interface GameDetailsModalProps {
  game: Game;
  onClose: () => void;
  onPlayGame: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function GameDetailsModal({ 
  game, 
  onClose, 
  onPlayGame, 
  isFavorite, 
  onToggleFavorite 
}: GameDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Container Card */}
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Absolute buttons */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-zinc-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Media / Poster Panel */}
        <div className="relative w-full md:w-5/12 h-56 md:h-auto min-h-[220px] bg-zinc-900">
          <img 
            src={game.image} 
            alt={game.title} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          
          {/* Floating metadata */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/30 backdrop-blur-md p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5">
              <Star className="text-amber-400 fill-amber-400" size={14} />
              <span className="font-mono text-xs font-extrabold text-white">{game.rating}</span>
            </div>
            <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">{game.playedCount} O'YNALGAN</span>
          </div>
        </div>

        {/* Detailed Info Panel */}
        <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
          {/* Tags list */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="font-mono text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 rounded px-2 py-0.5 uppercase tracking-wide">
              {game.category}
            </span>
            {game.tags.map((tag, idx) => (
              <span key={idx} className="font-mono text-[9px] font-medium text-gray-400 bg-white/5 rounded px-2 py-0.5 hover:text-white transition-colors">
                #{tag}
              </span>
            ))}
          </div>

          <h2 className="font-display text-2xl font-black italic text-glow-blue uppercase text-white mb-2 leading-tight">
            {game.title}
          </h2>

          {/* Quick specs horizontal row */}
          <div className="grid grid-cols-2 gap-3.5 mb-6 py-3.5 border-y border-white/5 text-gray-400 font-sans text-xs">
            <div className="flex items-center gap-2">
              <Layers size={13} className="text-[#00daf3]" />
              <span>Ishlab chiquvchi: <b className="text-white font-medium">{game.developer}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <Download size={13} className="text-[#8bdc00]" />
              <span>O'lchami: <b className="text-white font-medium">{game.fileSize}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-[#ffc3ad]" />
              <span>Chiqarilgan: <b className="text-white font-medium">{game.releaseDate}</b></span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Tekshirilgan: <b className="text-white font-medium">Xavfsiz</b></span>
            </div>
          </div>

          {/* Game long decription */}
          <p className="font-sans text-xs text-on-surface-variant leading-relaxed mb-8 flex-1">
            {game.description}
          </p>

          {/* Action Row */}
          <div className="flex items-center gap-3 mt-auto">
            <button 
              onClick={onPlayGame}
              className="flex-1 group overflow-hidden relative bg-white hover:bg-[#8bdc00] hover:text-black text-black font-display font-black tracking-widest text-xs py-3.5 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Play size={14} className="fill-current" />
              <span>HOZIR O'YNASh</span>
            </button>

            {/* Favorite button */}
            <button 
              onClick={onToggleFavorite}
              className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                isFavorite 
                  ? 'border-red-500/50 bg-red-500/10 text-red-500' 
                  : 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
              }`}
              title={isFavorite ? "Sevimli mualiflikdan chiqarish" : "Sevimlilarga qo'shish"}
            >
              <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
            </button>

            {/* Share button */}
            <button 
              onClick={handleShare}
              className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all cursor-pointer relative"
              title="Havolani nusharash"
            >
              {copied ? (
                <span className="absolute -top-10 bg-black border border-white/10 text-[9px] text-[#8bdc00] px-2 py-1 rounded font-bold uppercase whitespace-nowrap">
                  Nusxalandi!
                </span>
              ) : null}
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
