export interface Game {
  id: string;
  title: string;
  rating: number;
  image: string;
  category: 'barchasi' | 'dolzarb' | 'action' | 'poyga' | 'mantiq' | 'sport';
  description: string;
  playedCount: string;
  releaseDate: string;
  fileSize: string;
  developer: string;
  tags: string[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardXP: number;
  rewardCoins: number;
  progress: number; // 0 to 100
  completed: boolean;
  type: 'daily' | 'weekly' | 'achievement';
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  tag: string;
  gamesPlayed: number;
  hoursPlayed: number;
}
