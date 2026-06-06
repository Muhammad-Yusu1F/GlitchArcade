import React, { useState } from 'react';
import { UserStats } from '../types';
import { User, LogOut, Settings, Award, Shield, Key, Sparkles, Volume2, Globe, Heart } from 'lucide-react';

interface ProfileViewProps {
  stats: UserStats;
  onUpdateName: (name: string) => void;
  userEmail: string;
}

export default function ProfileView({ stats, onUpdateName, userEmail }: ProfileViewProps) {
  const [nameInput, setNameInput] = useState(() => {
    return localStorage.getItem('gamerName') || 'NeonRider';
  });
  const [isEditing, setIsEditing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [glowEffects, setGlowEffects] = useState(true);

  const saveName = () => {
    localStorage.setItem('gamerName', nameInput);
    onUpdateName(nameInput);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 font-sans pb-20">
      
      {/* Profile Overview Card */}
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-black italic text-white uppercase flex items-center gap-2">
          <User size={20} className="text-[#00daf3]" />
          <span>PROFIL MA'LUMOTLARI</span>
        </h2>
        <p className="text-xs text-on-surface-variant">
          Geymer taxallusi, xona sozlamalari va shaxsiy hisob-kitoblar.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-950 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
          {/* Neon avatar frame */}
          <div className="relative">
            <div className={`absolute -inset-1.5 rounded-full blur-sm leading-none ${glowEffects ? 'bg-gradient-to-r from-cyan-500 via-[#9ffb00] to-cyan-500 animate-pulse' : 'bg-transparent'}`} />
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-4xl text-white font-mono relative overflow-hidden">
              👽
            </div>
            {/* Level bubble badge */}
            <span className="absolute bottom-0 right-0 bg-[#9ffb00] text-black font-display font-black text-[10px] w-6 h-6 rounded-full border-2 border-zinc-950 flex items-center justify-center">
              {stats.level}
            </span>
          </div>

          <div className="text-center sm:text-left min-w-0">
            {isEditing ? (
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-black text-xs font-semibold text-white px-3 py-1.5 rounded-lg border border-white/10 outline-none focus:border-[#00daf3] w-36 uppercase tracking-wider"
                  maxLength={15}
                />
                <button 
                  onClick={saveName}
                  className="bg-[#00daf3] hover:bg-[#00daf3]/90 text-on-primary font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="font-display text-lg font-black italic tracking-widest text-white uppercase truncate">{nameInput}</h3>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors uppercase cursor-pointer"
                >
                  [Taxallusi o'zgartirish]
                </button>
              </div>
            )}
            
            <p className="font-mono text-[10px] text-gray-400 mt-1 uppercase tracking-wider truncate">{userEmail || 'demo@glitcharcade.io'}</p>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 mt-1 uppercase tracking-wider justify-center sm:justify-start">
              <span>UNVON:</span>
              <span className="text-[#8bdc00] font-bold">{stats.tag}</span>
            </div>
          </div>
        </div>

        {/* Level metrics details */}
        <div className="grid grid-cols-2 gap-4 w-full sm:w-auto p-4 bg-white/5 border border-white/5 rounded-xl text-center">
          <div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-none">O'YNAR SONI</p>
            <p className="font-mono text-base font-extrabold text-white mt-1.5">{stats.gamesPlayed}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-none">SOATLAR</p>
            <p className="font-mono text-base font-extrabold text-white mt-1.5">{stats.hoursPlayed} soat</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        <h2 className="font-display text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 pl-1">
          <Settings size={16} className="text-[#00daf3]" />
          <span>SOZLAMALAR</span>
        </h2>

        <div className="p-1 px-4 bg-zinc-950 border border-white/5 rounded-xl divide-y divide-white/5">
          {/* Sounds Setup */}
          <div className="py-4 flex justify-between items-center text-xs">
            <div className="space-y-0.5">
              <h4 className="text-white font-medium">Barcha tovushlar</h4>
              <p className="text-[11px] text-gray-400">O'yin o'ynashda retro-arcade tovush effektlarini yoqish</p>
            </div>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-10 h-6 rounded-full transition-all flex items-center px-1 border cursor-pointer ${
                soundEnabled 
                  ? 'bg-[#00daf3]/10 border-[#00daf3] justify-end' 
                  : 'bg-zinc-900 border-white/10 justify-start'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full ${soundEnabled ? 'bg-[#00daf3]' : 'bg-gray-500'}`} />
            </button>
          </div>

          {/* Aesthetic filters glow Setup */}
          <div className="py-4 flex justify-between items-center text-xs">
            <div className="space-y-0.5">
              <h4 className="text-white font-medium">Neon nur effektlari</h4>
              <p className="text-[11px] text-gray-400">O'yin kartlari hamda matn neon tuslarini aks ettirish</p>
            </div>
            <button 
              onClick={() => setGlowEffects(!glowEffects)}
              className={`w-10 h-6 rounded-full transition-all flex items-center px-1 border cursor-pointer ${
                glowEffects 
                  ? 'bg-[#00daf3]/10 border-[#00daf3] justify-end' 
                  : 'bg-zinc-900 border-white/10 justify-start'
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full ${glowEffects ? 'bg-[#00daf3]' : 'bg-gray-500'}`} />
            </button>
          </div>

          {/* Device status detail */}
          <div className="py-4 flex justify-between items-center text-xs">
            <div className="space-y-0.5">
              <h4 className="text-white font-medium">Tizim holati</h4>
              <p className="text-[11px] text-gray-400">Ishlayotgan server ma'lumotlari haqida bayonot</p>
            </div>
            <span className="font-mono text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2.5 py-1 uppercase leading-none">
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Safety info footer */}
      <div className="p-4 bg-zinc-950/40 border border-dashed border-white/5 rounded-xl flex items-center gap-3 text-xs text-gray-400">
        <Shield size={16} className="text-[#ffc3ad] flex-shrink-0" />
        <p className="text-[11px] leading-relaxed">
          Siz kiritgan barcha o'yin natijalari va rekordlar brauzer keshidagi <b className="text-white">localStorage</b> keshida xavfsiz saqlanmoqda. Profilga boshqa qurilmalarda kirib bo'lmaydi.
        </p>
      </div>
    </div>
  );
}
