import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Search, 
  Home, 
  Grid2X2, 
  Compass, 
  BookOpen, 
  User, 
  Star, 
  Play, 
  Flame, 
  Crown, 
  Sparkles,
  Trophy,
  Zap,
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Game, Quest, UserStats } from './types';
import { HERO_GAME, INITIAL_GAMES, INITIAL_QUESTS } from './data/games';
import GameDetailsModal from './components/GameDetailsModal';
import ArcadeGameRunner from './components/ArcadeGameRunner';
import CategoryView from './components/CategoryView';
import QuestsView from './components/QuestsView';
import LibraryView from './components/LibraryView';
import ProfileView from './components/ProfileView';
import SearchOverlay from './components/SearchOverlay';

export default function App() {
  // Current active navigation bottom tab
  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'quests' | 'library' | 'profile'>('home');
  
  // Current home selected category chip filter
  const [homeCategory, setHomeCategory] = useState<string>('barchasi');

  // Interactive configurations & tracking states
  const [games, setGames] = useState<Game[]>(() => INITIAL_GAMES);
  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('glitch_quests');
    return saved ? JSON.parse(saved) : INITIAL_QUESTS;
  });

  // User stats states
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('user_stats');
    if (saved) return JSON.parse(saved);
    return {
      level: 3,
      xp: 450,
      xpToNextLevel: 1000,
      coins: 450,
      tag: 'MASTER_CHALLENGER',
      gamesPlayed: 14,
      hoursPlayed: 32
    };
  });

  // Gamer name input update callback
  const [gamerName, setGamerName] = useState(() => {
    return localStorage.getItem('gamerName') || 'NeonRider';
  });

  // Favorites tracking list
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('glitch_favorites');
    return saved ? JSON.parse(saved) : ['neon-strike', 'pixel-quest'];
  });

  // Play history tracking log list
  const [recentGames, setRecentGames] = useState<Array<{ gameId: string; playedAt: string; highScore: number }>>(() => {
    const saved = localStorage.getItem('glitch_recent');
    return saved ? JSON.parse(saved) : [
      { gameId: 'neon-strike', playedAt: '2026-06-03 15:40', highScore: 240 },
      { gameId: 'pixel-quest', playedAt: '2026-06-04 19:12', highScore: 180 }
    ];
  });

  // Overlay states
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeRunningGame, setActiveRunningGame] = useState<Game | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Sync state changes to storage
  useEffect(() => {
    localStorage.setItem('glitch_quests', JSON.stringify(quests));
  }, [quests]);

  useEffect(() => {
    localStorage.setItem('user_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('glitch_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('glitch_recent', JSON.stringify(recentGames));
  }, [recentGames]);

  // Favorite toggle helper
  const handleToggleFavorite = (gameId: string) => {
    setFavorites(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId) 
        : [...prev, gameId]
    );
  };

  // Claim quest score bonuses
  const handleClaimReward = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    // Grant rewards and mark claimed/completed
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));
    
    setStats(prev => {
      let newXp = prev.xp + quest.rewardXP;
      let newLevel = prev.level;
      let nextLevelXp = prev.xpToNextLevel;

      // Handle level up calculations
      if (newXp >= nextLevelXp) {
        newXp -= nextLevelXp;
        newLevel += 1;
        nextLevelXp = Math.floor(nextLevelXp * 1.25);
      }

      return {
        ...prev,
        level: newLevel,
        xp: newXp,
        xpToNextLevel: nextLevelXp,
        coins: prev.coins + quest.rewardCoins
      };
    });
  };

  // Active game run callback: record stats on win / end
  const handleGameCompleted = (score: number, coins: number, xp: number) => {
    if (!activeRunningGame) return;

    const gameId = activeRunningGame.id;
    const now = new Date();
    const playedAt = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0].substring(0, 5)}`;

    // Add / Update play history
    setRecentGames(prev => {
      const existing = prev.find(h => h.gameId === gameId);
      if (existing) {
        return [
          { gameId, playedAt, highScore: Math.max(existing.highScore, score) },
          ...prev.filter(h => h.gameId !== gameId)
        ];
      } else {
        return [{ gameId, playedAt, highScore: score }, ...prev];
      }
    });

    // Update global user stats
    setStats(prev => {
      let newXp = prev.xp + xp;
      let newLevel = prev.level;
      let nextLevelXp = prev.xpToNextLevel;

      if (newXp >= nextLevelXp) {
        newXp -= nextLevelXp;
        newLevel += 1;
        nextLevelXp = Math.floor(nextLevelXp * 1.25);
      }

      return {
        ...prev,
        level: newLevel,
        xp: newXp,
        xpToNextLevel: nextLevelXp,
        coins: prev.coins + coins,
        gamesPlayed: prev.gamesPlayed + 1,
        hoursPlayed: prev.hoursPlayed + Math.ceil(score / 200) // approximate time increments
      };
    });

    // Handle quest progression hooks
    setQuests(prev => prev.map(q => {
      if (q.id === 'q1') {
        const nextProgress = Math.min(100, q.progress + 34);
        return { ...q, progress: nextProgress };
      }
      if (q.id === 'q2' && gameId === 'neon-strike' && score >= 300) {
        return { ...q, progress: 100 };
      }
      if (q.id === 'q3' && activeRunningGame.category === 'mantiq') {
        const nextProgress = Math.min(100, q.progress + 50);
        return { ...q, progress: nextProgress };
      }
      return q;
    }));
  };

  // Home Screen rendering helper
  const renderHomeView = () => {
    const filteredGames = homeCategory === 'barchasi' 
      ? games 
      : games.filter(g => g.category === homeCategory);

    return (
      <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
        
        {/* Category horizontal scroll bar */}
        <nav className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar py-6 -mx-6 px-6 scrolling-touch scroll-smooth">
          {['barchasi', 'dolzarb', 'action', 'poyga', 'mantiq', 'sport'].map((cat) => (
            <button
              key={cat}
              onClick={() => setHomeCategory(cat)}
              className={`whitespace-nowrap px-[18px] py-[9px] rounded-full font-mono text-[10px] tracking-widest font-extrabold uppercase transition-all duration-300 outline-none cursor-pointer border ${
                homeCategory === cat
                  ? 'bg-primary-container/10 border-primary-container text-primary-container shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Featured Hero Card - Cyber Rift: Origins */}
        <section 
          onClick={() => setSelectedGame(HERO_GAME as any)}
          className="relative w-full aspect-[16/9] sm:aspect-[2.1/1] rounded-2xl overflow-hidden border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.6)] cursor-pointer group"
        >
          <img 
            alt="Cyber Rift: Origins Hero" 
            src={HERO_GAME.image}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
          
          <div className="absolute top-4 left-4 bg-[#ffc3ad] text-[#370e00] font-mono text-[9px] font-bold px-2.5 py-1.5 rounded-md shadow-[0_0_12px_rgba(255,195,173,0.35)] uppercase tracking-wider">
            KUN O'YINI
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="font-display font-black text-white text-xl sm:text-2xl leading-tight uppercase italic glow-text-cyan">
                {HERO_GAME.title}
              </h2>
              <p className="font-sans text-xs text-gray-400 mt-1 line-clamp-2 max-w-xl">{HERO_GAME.description}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedGame(HERO_GAME as any);
                setActiveRunningGame(HERO_GAME as any);
              }}
              className="bg-primary-container text-[#001f24] font-mono hover:bg-[#8bdc00] hover:text-black font-extrabold text-[10px] tracking-widest px-[18px] py-3 rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.35)] active:scale-95 transition-all w-full sm:w-auto text-center border-0 cursor-pointer"
            >
              O'YNAH
            </button>
          </div>
        </section>

        {/* Games Grid Header section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-white text-sm font-black flex items-center gap-2 uppercase tracking-wide">
            <span className="w-1 h-5 bg-[#9ffb00] rounded-full inline-block shadow-[0_0_8px_#9ffb00]" />
            O'YINLAR TARMOQ'I
          </h3>
          <span className="font-mono text-[9px] text-[#bac9cc] tracking-widest font-bold uppercase">{filteredGames.length} TA O'YIN</span>
        </div>

        {/* Dense 30 Games grid loader */}
        {filteredGames.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs border border-dashed border-white/5 rounded-2xl bg-zinc-950/20">
            Katalogda o'yinlar mavjud emas
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
            {filteredGames.map((game) => (
              <div 
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-950 border border-white/5 hover:border-[#00daf3]/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,218,243,0.3)] flex flex-col justify-end cursor-pointer"
              >
                {/* Poster Artwork representation */}
                <img 
                  src={game.image} 
                  alt={game.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                {/* Embedded quick hover interaction trigger */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2.5px] z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGame(game);
                      setActiveRunningGame(game);
                    }}
                    className="w-12 h-12 rounded-full bg-[#9ffb00] hover:bg-white text-black hover:text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer border-0 outline-none"
                  >
                    <Play className="translate-x-0.5 fill-current" size={20} />
                  </button>
                </div>

                <div className="relative p-3.5 z-10">
                  <h4 className="font-semibold text-xs text-white truncate mb-0.5 group-hover:text-[#00daf3] transition-colors">{game.title}</h4>
                  <div className="flex items-center gap-1">
                    <Star className="text-secondary-fixed fill-current" size={9} />
                    <span className="font-mono text-[9px] text-[#bac9cc]">{game.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Global Footer Details */}
        <footer className="w-full relative pb-10 pt-12 flex flex-col items-center gap-5 px-6 text-center border-t border-white/5">
          <h5 className="text-[#00daf3] font-display font-black tracking-widest text-xs italic">GLITCH ARCADE</h5>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs font-semibold">Xizmat Shartlari</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs font-semibold">Maxfiylik</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs font-semibold">Dasturchilar</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-xs font-semibold">Yordam</a>
          </div>
          <p className="font-mono text-[9px] text-gray-600 uppercase tracking-widest">© 2024 GLITCH ARCADE. TIZIMGA KIRISH.</p>
        </footer>
      </div>
    );
  };

  return (
    <div className="bg-black min-h-screen text-[#e2e2e2] selection:bg-primary-container selection:text-black flex flex-col">
      
      {/* Top Fixed Header Node */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/85 backdrop-blur-md border-b border-white/5 px-6 flex justify-between items-center z-30">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <Gamepad2 className="text-[#00daf3]" size={22} />
          <h1 className="font-display font-black tracking-tighter text-sm italic text-[#00daf3] uppercase">
            GLITCH ARCADE
          </h1>
        </div>

        <button 
          onClick={() => setSearchOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-950/50 hover:bg-zinc-900 border border-white/5 text-gray-400 hover:text-white transition-all cursor-pointer outline-none"
          title="O'yinlarni Qidirish"
        >
          <Search size={16} />
        </button>
      </header>

      {/* Main Container screen loading */}
      <main className="flex-1 mt-16 px-6 max-w-7xl mx-auto w-full">
        {activeTab === 'home' && renderHomeView()}
        {activeTab === 'categories' && (
          <CategoryView 
            games={games}
            onGameSelect={setSelectedGame}
            selectedCategory={homeCategory}
            onCategorySelect={(cat) => {
              setHomeCategory(cat);
              setActiveTab('home');
            }}
          />
        )}
        {activeTab === 'quests' && (
          <QuestsView 
            quests={quests}
            stats={stats}
            onClaimReward={handleClaimReward}
          />
        )}
        {activeTab === 'library' && (
          <LibraryView 
            games={games}
            onGameSelect={setSelectedGame}
            favorites={favorites}
            recentGames={recentGames}
            onClearRecent={() => setRecentGames([])}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileView 
            stats={stats}
            onUpdateName={setGamerName}
            userEmail="ybegimqulov01@gmail.com"
          />
        )}
      </main>

      {/* Persistent Bottom Gaming Tabs dock matches mockup */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center px-4 pb-4 pt-2 bg-black/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,195,173,0.1)] rounded-t-2xl">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer outline-none ${
            activeTab === 'home' 
              ? 'text-[#9ffb00] drop-shadow-[0_0_6px_rgba(159,251,0,0.4)]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Home size={18} />
          <span className="font-mono text-[9px] mt-1 uppercase font-bold tracking-wider">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer outline-none ${
            activeTab === 'categories' 
              ? 'text-[#9ffb00] drop-shadow-[0_0_6px_rgba(159,251,0,0.4)]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Grid2X2 size={18} />
          <span className="font-mono text-[9px] mt-1 uppercase font-bold tracking-wider">Categories</span>
        </button>

        <button 
          onClick={() => setActiveTab('quests')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer outline-none ${
            activeTab === 'quests' 
              ? 'text-[#9ffb00] drop-shadow-[0_0_6px_rgba(159,251,0,0.4)]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Compass size={18} />
          <span className="font-mono text-[9px] mt-1 uppercase font-bold tracking-wider">Quests</span>
        </button>

        <button 
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer outline-none ${
            activeTab === 'library' 
              ? 'text-[#9ffb00] drop-shadow-[0_0_6px_rgba(159,251,0,0.4)]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen size={18} />
          <span className="font-mono text-[9px] mt-1 uppercase font-bold tracking-wider">Library</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer outline-none ${
            activeTab === 'profile' 
              ? 'text-[#9ffb00] drop-shadow-[0_0_6px_rgba(159,251,0,0.4)]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <User size={18} />
          <span className="font-mono text-[9px] mt-1 uppercase font-bold tracking-wider">Profile</span>
        </button>
      </nav>

      {/* Floating game statistics or runners overlay */}
      {selectedGame && (
        <GameDetailsModal 
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onPlayGame={() => {
            const game = selectedGame;
            setSelectedGame(null);
            setActiveRunningGame(game);
          }}
          isFavorite={favorites.includes(selectedGame.id)}
          onToggleFavorite={() => handleToggleFavorite(selectedGame.id)}
        />
      )}

      {activeRunningGame && (
        <ArcadeGameRunner 
          game={activeRunningGame}
          onClose={() => setActiveRunningGame(null)}
          onGameCompleted={(score, coins, xp) => handleGameCompleted(score, coins, xp)}
        />
      )}

      {searchOpen && (
        <SearchOverlay 
          games={games}
          onGameSelect={(game) => {
            setSearchOpen(false);
            setSelectedGame(game);
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
