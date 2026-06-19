import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Play, 
  RotateCcw, 
  Cpu, 
  Users, 
  Sparkles, 
  Zap, 
  Timer, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Activity,
  Award,
  Layers,
  Eye,
  Activity as StatsIcon
} from 'lucide-react';

interface NeonTennisGameProps {
  soundEnabled: boolean;
  onGameOver: (score: number) => void;
}

interface SavedTennisScore {
  name: string;
  score: string; // e.g. "5 - 3"
  date: string;
  result: 'WON' | 'LOST' | 'DRAW';
  duration: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

type FieldTheme = 'cyber-grid' | 'toxic-nuclear' | 'nebula-indigo';

export default function NeonTennisGame({ soundEnabled, onGameOver }: NeonTennisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Configuration and rendering states
  const [gameMode, setGameMode] = useState<'vs-ai' | 'local-2p'>('vs-ai');
  const [fieldTheme, setFieldTheme] = useState<FieldTheme>('nebula-indigo');
  const [aiDifficulty, setAiDifficulty] = useState<number>(70); // 20% to 100% smartness & response rate
  const [is3DMode, setIs3DMode] = useState<boolean>(true); // Default to gorgeous 3D rendering mode!
  const [equipmentType, setEquipmentType] = useState<'racket' | 'slingshot'>('racket'); // Default to racket (tenis raketkasi)!
  
  // Scoring & Stats states (synced from simulation ref to avoid stale closure issues)
  const [player1Score, setPlayer1Score] = useState<number>(0);
  const [player2Score, setPlayer2Score] = useState<number>(0);
  const [p1Misses, setP1Misses] = useState<number>(0);
  const [p2Misses, setP2Misses] = useState<number>(0);
  const [p1HitsCount, setP1HitsCount] = useState<number>(0);
  const [p2HitsCount, setP2HitsCount] = useState<number>(0);

  const [gameStatus, setGameStatus] = useState<'countdown' | 'playing' | 'ended'>('countdown');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [matchSeconds, setMatchSeconds] = useState<number>(0);
  const [ballSpeedMultiplier, setBallSpeedMultiplier] = useState<number>(1.0);
  
  const [winnerMessage, setWinnerMessage] = useState<string>('');
  const [statusLog, setStatusLog] = useState<string[]>(["Tizim: Kiber Tennis 3D virtual korti faol!"]);

  // Leaderboard lists
  const [highScores, setHighScores] = useState<SavedTennisScore[]>(() => {
    const saved = localStorage.getItem('cyber_tennis_highscores');
    if (saved) return JSON.parse(saved);
    return [
      { name: 'Sarkor-AI (90% AI)', score: '5 - 1', date: '01.06.2026', result: 'WON', duration: '01:12' },
      { name: 'Cosmo_Ninja', score: '5 - 3', date: '03.06.2026', result: 'WON', duration: '01:45' },
      { name: 'Kiber_Gamer', score: '5 - 4', date: '05.06.2026', result: 'WON', duration: '02:05' },
      { name: 'Byte_Demon', score: '2 - 5', date: '06.06.2026', result: 'LOST', duration: '01:30' }
    ];
  });

  // Sophisticated virtual synthesized audio feedback
  const playSoundEvent = (eventType: 'racket-hit' | 'wall-bounce' | 'score-up' | 'miss-fail' | 'countdown' | 'start') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      if (eventType === 'racket-hit') {
        // High fidelity racket Thwack sound of strings hitting tennis ball
        // Layer 1: Low frequency resonant punch
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(360, now);
        osc1.frequency.exponentialRampToValueAtTime(140, now + 0.12);
        
        gain1.gain.setValueAtTime(0.18, now);
        gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
        
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(now + 0.12);

        // Layer 2: High frequency click of nylon strings tension
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, now);
        osc2.frequency.exponentialRampToValueAtTime(550, now + 0.04);
        
        gain2.gain.setValueAtTime(0.14, now);
        gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.04);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(now + 0.04);
      } 
      else if (eventType === 'wall-bounce') {
        // Cyber metallic frame bounce
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.08);
      }
      else if (eventType === 'score-up') {
        // Ascending electronic melody chord
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          
          gain.gain.setValueAtTime(0.1, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.22);
        });
      }
      else if (eventType === 'miss-fail') {
        // Deep sweep bass frequency representation of a missed score
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.45);
        
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.5);
      }
      else if (eventType === 'countdown') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.15);
      }
      else if (eventType === 'start') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn("Audio exception:", e);
    }
  };

  // Keyboard state refs
  const keysRef = useRef<Record<string, boolean>>({});

  // Core simulation coordinate states scaled for 800x500 Widescreen Display!
  const simValue = useRef({
    leftPaddleY: 195,
    rightPaddleY: 195,
    paddleWidth: 48, // Extended contact coordinate to match racket strings center line
    paddleHeight: 110, // Racket rim frame height
    ballX: 400,
    ballY: 250,
    ballVX: 5.8,
    ballVY: 3.8,
    ballRadius: 10,
    canvasWidth: 800,
    canvasHeight: 500,
    ballTrail: [] as Array<{ x: number; y: number }>,
    particles: [] as Particle[],
    p1TouchUp: false,
    p1TouchDown: false,
    p2TouchUp: false,
    p2TouchDown: false,
    
    // Physics Score tracking - completely unaffected by stale Hook closures
    scoreP1: 0,
    scoreP2: 0,
    missP1: 0,
    missP2: 0,
    hitP1: 0,
    hitP2: 0,
    totalRallies: 0
  });

  // Reset ball to middle
  const resetBall = (directionToLeft: boolean) => {
    const s = simValue.current;
    s.ballX = s.canvasWidth / 2;
    s.ballY = s.canvasHeight / 2;
    
    // Random vertical angle
    const angle = (Math.random() * 50 - 25) * Math.PI / 180;
    const speed = 5.6 * ballSpeedMultiplier;
    s.ballVX = (directionToLeft ? -1 : 1) * speed * Math.cos(angle);
    s.ballVY = speed * Math.sin(angle);
    s.ballTrail = [];
  };

  // Spawn visual blow sparks on contact/wall bounce
  const spawnExplosion = (x: number, y: number, color: string) => {
    const s = simValue.current;
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.0;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color,
        alpha: 1.0,
        life: 0.8 + Math.random() * 0.6
      });
    }
  };

  // Handle keys set/clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Sync ref scores to UI states safely
  const syncScoresToUI = () => {
    const s = simValue.current;
    setPlayer1Score(s.scoreP1);
    setPlayer2Score(s.scoreP2);
    setP1Misses(s.missP1);
    setP2Misses(s.missP2);
    setP1HitsCount(s.hitP1);
    setP2HitsCount(s.hitP2);
  };

  // Update Game scores dynamically
  const recordPoint = (scoringPlayer: 1 | 2) => {
    const s = simValue.current;

    if (scoringPlayer === 1) {
      s.scoreP1++;
      s.missP2++; // Player 2 missed the ball
      syncScoresToUI();
      playSoundEvent('score-up');
      setStatusLog(prev => [`🟢 Raketka bilan ajoyib zarba! Siz to'p kiritdingiz! (Hisob: ${s.scoreP1} - ${s.scoreP2})`, ...prev].slice(0, 10));
    } else {
      s.scoreP2++;
      s.missP1++; // Siz (Player 1) to'pni o'tkazib yubordingiz
      syncScoresToUI();
      playSoundEvent('miss-fail');
      const enemyLabel = gameMode === 'vs-ai' ? "Kiber Robot AI" : "2-O'yinchi";
      setStatusLog(prev => [`🔴 Afsus! To'p o'tkazib yuborildi! (Hisob: ${s.scoreP1} - ${s.scoreP2})`, ...prev].slice(0, 10));
    }

    const p1 = s.scoreP1;
    const p2 = s.scoreP2;

    // First to reach 5 points wins
    if (p1 >= 5 || p2 >= 5) {
      setGameStatus('ended');
      const winMsg = p1 >= 5 
        ? "MUKAMMAL G'ALABA! Racketka bilan raqibni batamom tor-mor keltirdingiz! 🏆" 
        : (gameMode === 'vs-ai' ? "AI Robot G'alaba qozondi! Hisoblash kuchi yuqori ekan!" : "2-O'yinchi g'alaba qozondi! 🏆");
      setWinnerMessage(winMsg);
      setStatusLog(prev => ["🏁 Match yakunlandi!", ...prev].slice(0, 10));

      const minutes = Math.floor(matchSeconds / 60).toString().padStart(2, '0');
      const seconds = (matchSeconds % 60).toString().padStart(2, '0');
      const durationStr = `${minutes}:${seconds}`;

      const finalResult: SavedTennisScore = {
        name: gameMode === 'vs-ai' ? `Siz vs AI (${aiDifficulty}%)` : "2 O'yinchi Jangi",
        score: `${p1} - ${p2}`,
        date: new Date().toLocaleDateString('uz-UZ'),
        result: p1 >= 5 ? 'WON' : 'LOST',
        duration: durationStr
      };

      const updatedScores = [finalResult, ...highScores].slice(0, 10);
      setHighScores(updatedScores);
      localStorage.setItem('cyber_tennis_highscores', JSON.stringify(updatedScores));

      // Report final score for reward calculations in the parent dashboard!
      onGameOver(p1 * 125 + s.hitP1 * 12 - p1Misses * 15);
    } else {
      resetBall(scoringPlayer === 2);
    }
  };

  // Main countdown timer logic
  useEffect(() => {
    let t: any;
    if (gameStatus === 'countdown') {
      t = setInterval(() => {
        setCountdownNum(p => {
          if (p <= 1) {
            clearInterval(t);
            setGameStatus('playing');
            playSoundEvent('start');
            return 3;
          }
          playSoundEvent('countdown');
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(t);
  }, [gameStatus]);

  // Round time progression counter
  useEffect(() => {
    let interval: any;
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setMatchSeconds(sec => sec + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  // Handle manual game restarts
  const triggerRestart = () => {
    const s = simValue.current;
    s.scoreP1 = 0;
    s.scoreP2 = 0;
    s.missP1 = 0;
    s.missP2 = 0;
    s.hitP1 = 0;
    s.hitP2 = 0;
    s.totalRallies = 0;
    
    setPlayer1Score(0);
    setPlayer2Score(0);
    setP1Misses(0);
    setP1HitsCount(0);
    setP2Misses(0);
    setP2HitsCount(0);
    
    setGameStatus('countdown');
    setCountdownNum(3);
    setMatchSeconds(0);
    setWinnerMessage('');
    setStatusLog(["Haqiqiy raketkali professional kiber kort faollashtirildi!"]);
    s.leftPaddleY = 195;
    s.rightPaddleY = 195;
    resetBall(true);
  };

  // Core Canvas rendering and update tick loop
  useEffect(() => {
    let animId: number;
    
    // Perspective math for gorgeous Pseudo-3D view
    const project3D = (x: number, y: number, z: number = 0) => {
      if (!is3DMode) return { x, y, scale: 1.0 };

      const centerX = simValue.current.canvasWidth / 2;
      
      // y-coordinate normalization (0..1)
      const normY = y / simValue.current.canvasHeight;
      
      // Horizon tilt: narrower top scale, wider bottom scale
      const scale = 0.58 + normY * 0.58;
      
      // X distance off center
      const dx = x - centerX;
      
      const px = centerX + dx * scale;
      
      // Compress vertical coordinate space to provide tilt perspective on 500 max height
      const py = 100 + normY * 330 - z * scale; 
      
      return { x: px, y: py, scale };
    };

    // Persistent 3D Projection specifically for Spectators (always rendered in gorgeous perspective)
    const project3DSpectator = (x: number, y: number, z: number = 0) => {
      const centerX = simValue.current.canvasWidth / 2;
      const normY = y / simValue.current.canvasHeight;
      const scale = 0.58 + normY * 0.58;
      const dx = x - centerX;
      const px = centerX + dx * scale;
      const py = 100 + normY * 330 - z * scale; 
      return { x: px, y: py, scale };
    };

    const updateGame = () => {
      const s = simValue.current;
      const keys = keysRef.current;

      // 1. Move Paddles (Rackets)
      const paddleSpeed = 5.6 * ballSpeedMultiplier;

      // Player 1 controls (W/S) or touch controls
      if (keys['w'] || keys['W'] || s.p1TouchUp) {
        s.leftPaddleY = Math.max(0, s.leftPaddleY - paddleSpeed);
      }
      if (keys['s'] || keys['S'] || s.p1TouchDown) {
        s.leftPaddleY = Math.min(s.canvasHeight - s.paddleHeight, s.leftPaddleY + paddleSpeed);
      }

      // Player 2 / AI controls
      if (gameMode === 'vs-ai') {
        const aiSpeedLimit = 4.2 * (aiDifficulty / 100 + 0.35) * ballSpeedMultiplier;
        
        // Target ball center with a minor calculated reaction offset
        const targetPaddleCenter = s.ballY - s.paddleHeight / 2;
        const diff = targetPaddleCenter - s.rightPaddleY;
        
        if (Math.abs(diff) > 4) {
          if (diff > 0) {
            s.rightPaddleY = Math.min(s.canvasHeight - s.paddleHeight, s.rightPaddleY + Math.min(aiSpeedLimit, diff));
          } else {
            s.rightPaddleY = Math.max(0, s.rightPaddleY - Math.min(aiSpeedLimit, Math.abs(diff)));
          }
        }
      } else {
        // Player 2 Local controls (O/L or Arrow Keys)
        if (keys['arrowup'] || keys['ArrowUp'] || keys['o'] || keys['O'] || s.p2TouchUp) {
          s.rightPaddleY = Math.max(0, s.rightPaddleY - paddleSpeed);
        }
        if (keys['arrowdown'] || keys['ArrowDown'] || keys['l'] || keys['L'] || s.p2TouchDown) {
          s.rightPaddleY = Math.min(s.canvasHeight - s.paddleHeight, s.rightPaddleY + paddleSpeed);
        }
      }

      // 2. Physics Simulation Tick
      if (gameStatus === 'playing') {
        s.ballTrail.push({ x: s.ballX, y: s.ballY });
        if (s.ballTrail.length > 8) {
          s.ballTrail.shift();
        }

        s.ballX += s.ballVX;
        s.ballY += s.ballVY;

        // Top and Bottom wall collision
        if (s.ballY - s.ballRadius <= 0) {
          s.ballY = s.ballRadius;
          s.ballVY = -s.ballVY;
          playSoundEvent('wall-bounce');
          spawnExplosion(s.ballX, s.ballY, '#00daf3');
        } else if (s.ballY + s.ballRadius >= s.canvasHeight) {
          s.ballY = s.canvasHeight - s.ballRadius;
          s.ballVY = -s.ballVY;
          playSoundEvent('wall-bounce');
          spawnExplosion(s.ballX, s.ballY, '#00daf3');
        }

        // Left Player Racket contact check (calculated exactly along the racket head center)
        if (s.ballVX < 0) {
          if (s.ballX - s.ballRadius <= s.paddleWidth) {
            if (s.ballY >= s.leftPaddleY && s.ballY <= s.leftPaddleY + s.paddleHeight) {
              const relativePos = (s.ballY - (s.leftPaddleY + s.paddleHeight / 2)) / (s.paddleHeight / 2);
              const reboundAngle = relativePos * (Math.PI / 3.4);
              const speed = Math.sqrt(s.ballVX * s.ballVX + s.ballVY * s.ballVY) * 1.05;

              s.ballVX = speed * Math.cos(reboundAngle);
              s.ballVY = speed * Math.sin(reboundAngle);
              s.ballX = s.paddleWidth + s.ballRadius;
              
              s.hitP1++;
              s.totalRallies++;
              syncScoresToUI();
              playSoundEvent('racket-hit');
              spawnExplosion(s.ballX, s.ballY, '#f97316');
              setStatusLog(prev => ["⚡️ Siz raketka simlari bilan qaytardingiz!", ...prev].slice(0, 10));
            }
          }
        }

        // Right Player / AI Racket contact check
        if (s.ballVX > 0) {
          if (s.ballX + s.ballRadius >= s.canvasWidth - s.paddleWidth) {
            if (s.ballY >= s.rightPaddleY && s.ballY <= s.rightPaddleY + s.paddleHeight) {
              const relativePos = (s.ballY - (s.rightPaddleY + s.paddleHeight / 2)) / (s.paddleHeight / 2);
              const reboundAngle = relativePos * (Math.PI / 3.4);
              const speed = Math.sqrt(s.ballVX * s.ballVX + s.ballVY * s.ballVY) * 1.05;

              s.ballVX = -speed * Math.cos(reboundAngle);
              s.ballVY = speed * Math.sin(reboundAngle);
              s.ballX = s.canvasWidth - s.paddleWidth - s.ballRadius;

              s.hitP2++;
              s.totalRallies++;
              syncScoresToUI();
              playSoundEvent('racket-hit');
              spawnExplosion(s.ballX, s.ballY, '#00daf3');
              const enemyLabel = gameMode === 'vs-ai' ? "Robot raketka" : "2P raketka";
              setStatusLog(prev => [`⚡️ ${enemyLabel} bilan qaytarildi!`, ...prev].slice(0, 10));
            }
          }
        }

        // Goal Boundaries Checking
        if (s.ballX < 0) {
          recordPoint(2); // Player 2 scores
        } else if (s.ballX > s.canvasWidth) {
          recordPoint(1); // Player 1 scores
        }
      }

      // Spark Particles decay
      s.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        p.life -= 0.025;
        if (p.life <= 0 || p.alpha <= 0) {
          s.particles.splice(idx, 1);
        }
      });
    };

    const drawGame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const s = simValue.current;

      // Theme background paint with gorgeous visual backplates & realistic open cosmic sky (unveiled vast space)
      let colGrid = 'rgba(255, 255, 255, 0.04)';
      let glowMain = '#00daf3';

      if (fieldTheme === 'cyber-grid') {
        // Deep technological blue and cyan open space canvas
        ctx.fillStyle = '#02020a';
        ctx.fillRect(0, 0, s.canvasWidth, s.canvasHeight);

        // Multiple overlaying glowing cyber nebulas
        const gradNeb = ctx.createRadialGradient(s.canvasWidth / 2, 60, 5, s.canvasWidth / 2, 60, 240);
        gradNeb.addColorStop(0, 'rgba(6, 182, 212, 0.18)'); // cyan bright core
        gradNeb.addColorStop(0.5, 'rgba(30, 58, 138, 0.05)'); // dark stadium horizon blue
        gradNeb.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradNeb;
        ctx.beginPath();
        ctx.arc(s.canvasWidth / 2, 60, 240, 0, Math.PI * 2);
        ctx.fill();

        // Secondary far-off cyan galaxy glow cluster
        const gradG = ctx.createRadialGradient(150, 40, 1, 150, 40, 120);
        gradG.addColorStop(0, 'rgba(0, 218, 243, 0.08)');
        gradG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradG;
        ctx.beginPath();
        ctx.arc(150, 40, 120, 0, Math.PI * 2);
        ctx.fill();

        // Beautiful angled cyan cosmic dust trails / galactic rings (Open cosmos!)
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
        ctx.lineWidth = 1.6;
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.ellipse(s.canvasWidth / 2, 60, 220 + j * 32, 38 + j * 6, -Math.PI / 10, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        colGrid = 'rgba(0, 218, 243, 0.10)';
        glowMain = '#00daf3';
      } else if (fieldTheme === 'toxic-nuclear') {
        // Toxic emerald acid space open cosmos
        ctx.fillStyle = '#010301';
        ctx.fillRect(0, 0, s.canvasWidth, s.canvasHeight);

        // Central radioactive green cosmic gas cloud
        const gradNeb = ctx.createRadialGradient(s.canvasWidth / 2, 60, 5, s.canvasWidth / 2, 60, 230);
        gradNeb.addColorStop(0, 'rgba(139, 220, 0, 0.14)'); // neon green core
        gradNeb.addColorStop(0.6, 'rgba(15, 35, 8, 0.04)'); // deep space olive
        gradNeb.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradNeb;
        ctx.beginPath();
        ctx.arc(s.canvasWidth / 2, 60, 230, 0, Math.PI * 2);
        ctx.fill();

        // Side acid cluster glow
        const gradG = ctx.createRadialGradient(s.canvasWidth - 160, 45, 1, s.canvasWidth - 160, 45, 100);
        gradG.addColorStop(0, 'rgba(139, 220, 0, 0.06)');
        gradG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradG;
        ctx.beginPath();
        ctx.arc(s.canvasWidth - 160, 45, 100, 0, Math.PI * 2);
        ctx.fill();

        // Radioactive celestial rings
        ctx.save();
        ctx.strokeStyle = 'rgba(132, 204, 22, 0.04)';
        ctx.lineWidth = 1.3;
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.ellipse(s.canvasWidth / 2, 60, 200 + j * 40, 32 + j * 8, Math.PI / 12, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        colGrid = 'rgba(139, 220, 0, 0.11)';
        glowMain = '#8bdc00';
      } else if (fieldTheme === 'nebula-indigo') {
        // Deep space cosmic violet/indigo open cosmos canvas
        ctx.fillStyle = '#020108';
        ctx.fillRect(0, 0, s.canvasWidth, s.canvasHeight);

        // Nested high density purple/fuchsia cosmic nebula clouds
        const pNoiseY = 66;
        const gradNeb1 = ctx.createRadialGradient(s.canvasWidth / 2, pNoiseY, 5, s.canvasWidth / 2, pNoiseY, 260);
        gradNeb1.addColorStop(0, 'rgba(147, 51, 234, 0.24)'); // rich glowing fuchsia-purple center
        gradNeb1.addColorStop(0.35, 'rgba(217, 70, 239, 0.09)'); // middle dust cloud warmth
        gradNeb1.addColorStop(0.75, 'rgba(99, 102, 241, 0.03)'); // outer indigo fringe
        gradNeb1.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradNeb1;
        ctx.beginPath();
        ctx.arc(s.canvasWidth / 2, pNoiseY, 260, 0, Math.PI * 2);
        ctx.fill();

        // Left Teal cosmic cluster glow
        const gradNeb2 = ctx.createRadialGradient(220, 50, 2, 220, 50, 160);
        gradNeb2.addColorStop(0, 'rgba(6, 182, 212, 0.09)'); // teal high frequency dust
        gradNeb2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradNeb2;
        ctx.beginPath();
        ctx.arc(220, 50, 160, 0, Math.PI * 2);
        ctx.fill();

        // Right Pink and Magenta dusty nebula clouds
        const gradNeb3 = ctx.createRadialGradient(s.canvasWidth - 220, 55, 2, s.canvasWidth - 220, 55, 160);
        gradNeb3.addColorStop(0, 'rgba(236, 72, 153, 0.07)'); // hot magenta
        gradNeb3.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradNeb3;
        ctx.beginPath();
        ctx.arc(s.canvasWidth - 220, 55, 160, 0, Math.PI * 2);
        ctx.fill();

        // Grand sweeping Galactic Ring System tilted (Spectacular open space visuals!)
        ctx.save();
        ctx.strokeStyle = 'rgba(217, 70, 239, 0.065)';
        ctx.lineWidth = 1.8;
        for (let j = 0; j < 5; j++) {
          ctx.beginPath();
          ctx.ellipse(s.canvasWidth / 2, pNoiseY, 230 + j * 36, 36 + j * 8, -Math.PI / 8, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        colGrid = 'rgba(168, 85, 247, 0.16)'; // purple-indigo grid support
        glowMain = '#d946ef'; // radiant fuchsia
      }

      // BACKGROUND CELESTIAL TWINKLING STARFIELD
      const starSeedTime = Date.now() * 0.0006;
      for (let i = 0; i < 45; i++) {
        const starX = ((Math.sin(i * 354.21) * 0.5 + 0.5) * s.canvasWidth);
        const starY = ((Math.cos(i * 921.43) * 0.5 + 0.5) * 125); // upper half horizon sky
        const twinkle = Math.sin(starSeedTime + i) * 0.45 + 0.55;
        
        let starColor = `rgba(255, 255, 255, ${twinkle * 0.55})`;
        if (fieldTheme === 'nebula-indigo') {
          starColor = i % 2 === 0 ? `rgba(192, 132, 252, ${twinkle * 0.65})` : `rgba(56, 189, 248, ${twinkle * 0.65})`; // purple or cyan tint
        } else if (fieldTheme === 'toxic-nuclear') {
          starColor = i % 2 === 0 ? `rgba(163, 230, 53, ${twinkle * 0.55})` : `rgba(255, 255, 255, ${twinkle * 0.45})`; // lime
        } else {
          starColor = i % 2 === 0 ? `rgba(103, 232, 249, ${twinkle * 0.65})` : `rgba(255, 255, 255, ${twinkle * 0.45})`; // cyan
        }

        ctx.fillStyle = starColor;
        ctx.beginPath();
        const rStar = 0.5 + (i % 3) * 0.55;
        ctx.arc(starX, starY, rStar, 0, Math.PI * 2);
        ctx.fill();
      }

      // PERSPECTIVE SIDE STADIUM GALLERIES (Mimicking the glowing telemetry columns in the reference image)
      const drawStadiumGalleries = () => {
        const time = Date.now() * 0.0015;
        const colorV = fieldTheme === 'nebula-indigo' ? 'rgba(168, 85, 247, 0.22)' : (fieldTheme === 'toxic-nuclear' ? 'rgba(132, 204, 22, 0.20)' : 'rgba(6, 182, 212, 0.20)');
        const colorAcc = fieldTheme === 'nebula-indigo' ? 'rgba(6, 182, 212, 0.22)' : (fieldTheme === 'toxic-nuclear' ? 'rgba(234, 179, 8, 0.20)' : 'rgba(236, 72, 153, 0.20)');

        // Left stadium columns
        for (let row = 0; row < 3; row++) {
          const xOffset = -22 - row * 26;
          ctx.strokeStyle = row % 2 === 0 ? colorV : colorAcc;
          ctx.lineWidth = 1;
          
          ctx.beginPath();
          const pStart = project3D(xOffset, 0);
          const pEnd = project3D(xOffset, s.canvasHeight);
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();

          // Blinking spectator dashboard blocks along the perspective guide
          const segments = 10;
          for (let sIdx = 0; sIdx < segments; sIdx++) {
            const yOffset = (sIdx / segments) * s.canvasHeight;
            const projCell = project3D(xOffset, yOffset);
            
            const pulse = Math.sin(time + sIdx * 0.5 + row * 1.5) * 0.5 + 0.5;
            const activeAlpha = 0.12 + pulse * 0.45;
            ctx.fillStyle = row % 2 === 0 
              ? (fieldTheme === 'nebula-indigo' ? `rgba(168, 85, 247, ${activeAlpha})` : `rgba(56, 189, 248, ${activeAlpha})`)
              : (fieldTheme === 'nebula-indigo' ? `rgba(236, 72, 153, ${activeAlpha})` : `rgba(132, 204, 22, ${activeAlpha})`);

            const blockW = 6.2 * projCell.scale;
            const blockH = 3.6 * projCell.scale;
            ctx.fillRect(projCell.x - blockW / 2, projCell.y - blockH / 2, blockW, blockH);
          }
        }

        // Right stadium columns
        for (let row = 0; row < 3; row++) {
          const xOffset = s.canvasWidth + 22 + row * 26;
          ctx.strokeStyle = row % 2 === 0 ? colorV : colorAcc;
          ctx.lineWidth = 1;
          
          ctx.beginPath();
          const pStart = project3D(xOffset, 0);
          const pEnd = project3D(xOffset, s.canvasHeight);
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();

          // Blinking spectator dashboard blocks along the perspective guide
          const segments = 10;
          for (let sIdx = 0; sIdx < segments; sIdx++) {
            const yOffset = (sIdx / segments) * s.canvasHeight;
            const projCell = project3D(xOffset, yOffset);
            
            const pulse = Math.sin(time + sIdx * 0.5 + row * 1.5 + Math.PI) * 0.5 + 0.5;
            const activeAlpha = 0.12 + pulse * 0.45;
            ctx.fillStyle = row % 2 === 0 
              ? (fieldTheme === 'nebula-indigo' ? `rgba(168, 85, 247, ${activeAlpha})` : `rgba(50, 200, 240, ${activeAlpha})`)
              : (fieldTheme === 'nebula-indigo' ? `rgba(236, 72, 153, ${activeAlpha})` : `rgba(132, 204, 22, ${activeAlpha})`);

            const blockW = 6.2 * projCell.scale;
            const blockH = 3.6 * projCell.scale;
            ctx.fillRect(projCell.x - blockW / 2, projCell.y - blockH / 2, blockW, blockH);
          }
        }
      };

      drawStadiumGalleries();

      // Grid boundaries drawing helper
      ctx.lineWidth = 1;
      ctx.strokeStyle = colGrid;

      // 1. Draw Grid lines with 3D projection support
      const gridSpacing = 40;
      for (let x = 0; x <= s.canvasWidth; x += gridSpacing) {
        ctx.beginPath();
        const pStart = project3D(x, 0);
        const pEnd = project3D(x, s.canvasHeight);
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.stroke();
      }
      for (let y = 0; y <= s.canvasHeight; y += gridSpacing) {
        ctx.beginPath();
        const pStart = project3D(0, y);
        const pEnd = project3D(s.canvasWidth, y);
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.stroke();
      }

      // 2. Draw Net Center dotted line
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      const netTop = project3D(s.canvasWidth / 2, 0);
      const netBottom = project3D(s.canvasWidth / 2, s.canvasHeight);
      ctx.moveTo(netTop.x, netTop.y);
      ctx.lineTo(netBottom.x, netBottom.y);
      ctx.stroke();
      ctx.setLineDash([]); // Reset to solid

      // Theme outline border around court
      ctx.strokeStyle = glowMain + '44';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const tl = project3D(0, 0);
      const tr = project3D(s.canvasWidth, 0);
      const br = project3D(s.canvasWidth, s.canvasHeight);
      const bl = project3D(0, s.canvasHeight);
      ctx.moveTo(tl.x, tl.y);
      ctx.lineTo(tr.x, tr.y);
      ctx.lineTo(br.x, br.y);
      ctx.lineTo(bl.x, bl.y);
      ctx.closePath();
      ctx.stroke();

      // 3. DRAW DYNAMIC STADIUM GRANDSTANDS FILLED WITH ANIMATED CYBER SPECTATORS (tomashibinlar) IN PERMANENT 3D PERSPECTIVE!
      const drawRealisticSpectators = () => {
        const time = Date.now();
        const rowsCount = 3;

        // When a score is made or game is in countdown, they stand up taller in excitement!
        let cheerZOffset = 0;
        if (gameStatus === 'countdown') {
          cheerZOffset = 18; // Stand up taller!
        }

        for (let rowIdx = 0; rowIdx < rowsCount; rowIdx++) {
          // Elevated baseline virtual coordinates (placed higher up)
          const rowY = -16 - rowIdx * 16;
          const rowZ = 24 + rowIdx * 15 + cheerZOffset;

          // Project a point in the middle to calculate perspective scale for the bench
          const pMid = project3DSpectator(s.canvasWidth / 2, rowY, rowZ);
          
          // Draw a soft glowing neon grandstand bench path in 3D
          ctx.strokeStyle = fieldTheme === 'nebula-indigo' 
            ? 'rgba(147, 51, 234, 0.45)' 
            : fieldTheme === 'toxic-nuclear' 
              ? 'rgba(132, 204, 22, 0.45)' 
              : 'rgba(6, 182, 212, 0.45)';
          ctx.lineWidth = 3.5 * pMid.scale;
          
          // Left and right support coordinates in 3D
          const pBenchL = project3DSpectator(25, rowY, rowZ - 2);
          const pBenchR = project3DSpectator(s.canvasWidth - 25, rowY, rowZ - 2);
          
          ctx.beginPath();
          ctx.moveTo(pBenchL.x, pBenchL.y);
          ctx.lineTo(pBenchR.x, pBenchR.y);
          ctx.stroke();

          // Draw dark seats backing/shadow in perspective
          const pS_TL = project3DSpectator(30, rowY, rowZ + 3);
          const pS_TR = project3DSpectator(s.canvasWidth - 30, rowY, rowZ + 3);
          const pS_BR = project3DSpectator(s.canvasWidth - 30, rowY, rowZ - 6);
          const pS_BL = project3DSpectator(30, rowY, rowZ - 6);

          ctx.fillStyle = 'rgba(10, 10, 26, 0.8)';
          ctx.beginPath();
          ctx.moveTo(pS_TL.x, pS_TL.y);
          ctx.lineTo(pS_TR.x, pS_TR.y);
          ctx.lineTo(pS_BR.x, pS_BR.y);
          ctx.lineTo(pS_BL.x, pS_BL.y);
          ctx.closePath();
          ctx.fill();

          // Render active spectator human silhouettes
          const spectatorsInRow = rowIdx === 0 ? 18 : rowIdx === 1 ? 21 : 24;
          const rowStartX = rowIdx === 0 ? 75 : rowIdx === 1 ? 60 : 45;
          const rowWidth = s.canvasWidth - (rowStartX * 2);
          const spacingX = rowWidth / (spectatorsInRow - 1);

          for (let sitIdx = 0; sitIdx < spectatorsInRow; sitIdx++) {
            const specX = rowStartX + sitIdx * spacingX;
            const specSeed = rowIdx * 123 + sitIdx * 7;

            // Animated Bobbing: breathing weight shifts
            let swaySpeed = 0.0035;
            let swayAmp = 1.35;
            
            // Check if ball is in upper court quadrant (approaching horizon where crowds cheer)
            const isBallNearby = s.ballY < 200 && Math.abs(s.ballX - specX) < 160;
            if (isBallNearby || gameStatus === 'countdown') {
              swaySpeed = 0.0075;
              swayAmp = 2.4;
            }

            const bobY = Math.sin(time * swaySpeed + specSeed) * swayAmp;

            // Project spectator position to 3D with animation offset in Z / Y height
            const projCell = project3DSpectator(specX, rowY, rowZ);
            
            // Scale and placement coords
            const scale = projCell.scale;
            const bx = projCell.x;
            const by = projCell.y + bobY * scale;

            // Color palette selection mirroring the ambient game colors
            let bodyColor = 'rgba(71, 85, 105, 0.9)'; // Sleek graphite
            const colorMod = specSeed % 6;
            if (colorMod === 0) {
              bodyColor = fieldTheme === 'nebula-indigo' ? 'rgba(147, 51, 234, 0.85)' : 'rgba(6, 182, 212, 0.85)';
            } else if (colorMod === 1) {
              bodyColor = 'rgba(236, 72, 153, 0.85)'; // Radiant Fuchsia
            } else if (colorMod === 2) {
              bodyColor = 'rgba(249, 115, 22, 0.85)'; // Solar Orange
            } else if (colorMod === 3) {
              bodyColor = fieldTheme === 'toxic-nuclear' ? 'rgba(132, 204, 22, 0.85)' : 'rgba(56, 189, 248, 0.85)';
            } else if (colorMod === 4) {
              bodyColor = 'rgba(234, 179, 8, 0.80)'; // Cyberyellow
            } else {
              bodyColor = 'rgba(241, 245, 249, 0.72)'; // Pristine glass-white
            }

            // Draw organic shoulders in scale
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.moveTo(bx - 4.5 * scale, by + 4 * scale);
            ctx.quadraticCurveTo(bx, by - 3 * scale, bx + 4.5 * scale, by + 4 * scale);
            ctx.lineTo(bx + 5 * scale, by + 12 * scale);
            ctx.lineTo(bx - 5 * scale, by + 12 * scale);
            ctx.closePath();
            ctx.fill();

            // Draw head in scale
            ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
            ctx.beginPath();
            ctx.arc(bx, by - 2.8 * scale, 3.2 * scale, 0, Math.PI * 2);
            ctx.fill();

            // Goggles/Visor Overlay (Makes them look high fidelity cyber audiences)
            const visorColor = specSeed % 3 === 0 ? '#00daf3' : specSeed % 3 === 1 ? '#d946ef' : '#eab308';
            ctx.strokeStyle = visorColor;
            ctx.lineWidth = 1.0 * scale;
            ctx.beginPath();
            ctx.moveTo(bx - 2.0 * scale, by - 3.5 * scale);
            ctx.lineTo(bx + 2.0 * scale, by - 3.5 * scale);
            ctx.stroke();

            // Dynamic Hand Cheering (Waving frantically during exciting rallies!)
            const isHeavilyCheering = (s.totalRallies > 1 || gameStatus === 'countdown') && (Math.sin(time * 0.005 + specSeed) > 0.1);
            if (isHeavilyCheering) {
              ctx.strokeStyle = bodyColor;
              ctx.lineWidth = 1.5 * scale;
              ctx.lineCap = 'round';
              
              const waveL = Math.sin(time * 0.018 + specSeed) * 2.8;
              const waveR = Math.cos(time * 0.018 + specSeed) * 2.8;

              ctx.beginPath();
              ctx.moveTo(bx - 3.8 * scale, by + 2 * scale);
              ctx.lineTo(bx - 7 * scale, by - 5 * scale + waveL * scale);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(bx + 3.8 * scale, by + 2 * scale);
              ctx.lineTo(bx + 7 * scale, by - 5 * scale + waveR * scale);
              ctx.stroke();
              
              ctx.lineCap = 'butt';
            }

            // Waving Glow sticks held by several spectators
            if (specSeed % 4 === 1) {
              const stickColor = specSeed % 2 === 0 ? '#10b981' : '#f43f5e';
              ctx.strokeStyle = stickColor;
              ctx.shadowColor = stickColor;
              ctx.shadowBlur = 3.5 * scale;
              ctx.lineWidth = 1.2 * scale;

              const stickRot = Math.sin(time * 0.0088 + specSeed) * 0.45 - 0.72;
              const len = 7.2 * scale;
              const endX = bx + 4.5 * scale + Math.cos(stickRot) * len;
              const endY = by + 1.2 * scale + Math.sin(stickRot) * len;

              ctx.beginPath();
              ctx.moveTo(bx + 4.5 * scale, by + 1.2 * scale);
              ctx.lineTo(endX, endY);
              ctx.stroke();
              
              ctx.shadowBlur = 0; // Reset canvas shadows
            }
          }
        }
      };

      // Call spectator seating renderer before rackets/balls so court boundaries/nets overlap properly if 3D is active
      if (is3DMode) {
        drawRealisticSpectators();
      }

      // COMPREHENSIVE VECTOR GRAPHICS RENDERER (Supports Professional Tennis Racket OR Realistic Elastic Y-Slingshot/Ragatka!)
      const drawTennisRacket = (isLeftPlayer: boolean, centerY: number, mainColor: string, accentColor: string) => {
        const H_Z = is3DMode ? 14 : 0; // Float above ground in 3D Mode

        // --- REAL TENNIS RACKET (RAKETKA) ---
        // Wide beautifully proportioned oval head (height 76, width 36)
        const cx = isLeftPlayer ? 45 : s.canvasWidth - 45;
        const radiusX = 18;
        const radiusY = 38;

        // A2. Racket frame cast shadow on field
        if (is3DMode) {
            ctx.beginPath();
            const shCenter = project3D(cx, centerY, 0);
            const shRadiusX = radiusX * shCenter.scale * 1.35;
            const shRadiusY = radiusY * shCenter.scale * 1.35;
            ctx.ellipse(shCenter.x, shCenter.y, shRadiusX, shRadiusY, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fill();

            // Handle shadow
            ctx.beginPath();
            const pStemStart = project3D(isLeftPlayer ? cx - radiusX - 8 : cx + radiusX + 8, centerY, 0);
            const pHandleEnd = project3D(isLeftPlayer ? 0 : s.canvasWidth, centerY, 0);
            ctx.moveTo(pStemStart.x, pStemStart.y);
            ctx.lineTo(pHandleEnd.x, pHandleEnd.y);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 6 * shCenter.scale;
            ctx.stroke();
          }

          // B2. Premium Co-Polyester Strings Grid
          ctx.strokeStyle = '#ffffff60'; // Radiant white high tension strings
          ctx.lineWidth = 0.8;
          
          // Vertical Strings
          for (let dx = -radiusX + 5; dx < radiusX; dx += 5) {
            const limitY = radiusY * Math.sqrt(Math.max(0, 1 - (dx * dx) / (radiusX * radiusX)));
            if (isNaN(limitY) || limitY <= 1) continue;
            
            const p1 = project3D(cx + dx, centerY - limitY, H_Z);
            const p2 = project3D(cx + dx, centerY + limitY, H_Z);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
          // Horizontal Strings
          for (let dy = -radiusY + 7; dy < radiusY; dy += 7) {
            const limitX = radiusX * Math.sqrt(Math.max(0, 1 - (dy * dy) / (radiusY * radiusY)));
            if (isNaN(limitX) || limitX <= 1) continue;

            const p1 = project3D(cx - limitX, centerY + dy, H_Z);
            const p2 = project3D(cx + limitX, centerY + dy, H_Z);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }

          // C2. Stencil "⚡" Logo on Racket Strings (Professional look)
          ctx.strokeStyle = mainColor + 'a8';
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 4;
          ctx.shadowColor = mainColor;
          ctx.beginPath();
          const pS1 = project3D(cx - 5, centerY - 12, H_Z);
          const pS2 = project3D(cx + 4, centerY - 2, H_Z);
          const pS3 = project3D(cx - 4, centerY + 2, H_Z);
          const pS4 = project3D(cx + 5, centerY + 12, H_Z);
          ctx.moveTo(pS1.x, pS1.y);
          ctx.lineTo(pS2.x, pS2.y);
          ctx.lineTo(pS3.x, pS3.y);
          ctx.lineTo(pS4.x, pS4.y);
          ctx.stroke();
          ctx.shadowBlur = 0; // Reset

          // D2. High Tension Composite Racket Rim (Glow Frame)
          ctx.strokeStyle = mainColor;
          ctx.shadowColor = mainColor;
          ctx.shadowBlur = is3DMode ? 10 : 12;
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          const numSegments = 32;
          for (let i = 0; i <= numSegments; i++) {
            const theta = (i / numSegments) * Math.PI * 2;
            const rx = cx + radiusX * Math.cos(theta);
            const ry = centerY + radiusY * Math.sin(theta);
            const p = project3D(rx, ry, H_Z);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.shadowBlur = 0; // Reset

          // Upper bumper protective tape (White rim top)
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          const pBumperStart = isLeftPlayer ? Math.PI * 0.72 : -Math.PI * 0.28;
          const pBumperEnd = isLeftPlayer ? Math.PI * 1.28 : Math.PI * 0.28;
          for (let i = 0; i <= 8; i++) {
            const theta = pBumperStart + (i / 8) * (pBumperEnd - pBumperStart);
            const rx = cx + (radiusX + 1.2) * Math.cos(theta);
            const ry = centerY + (radiusY + 1.2) * Math.sin(theta);
            const p = project3D(rx, ry, H_Z);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();

          // E2. Sleek Dual-Braced Y Throat Joint
          const stemX = isLeftPlayer ? cx - radiusX - 8 : cx + radiusX + 8;
          ctx.strokeStyle = mainColor;
          ctx.lineWidth = 3.6;
          ctx.beginPath();
          const pThroatLower = project3D(isLeftPlayer ? cx - radiusX * 0.45 : cx + radiusX * 0.45, centerY + radiusY * 0.88, H_Z);
          const pThroatUpper = project3D(isLeftPlayer ? cx - radiusX * 0.45 : cx + radiusX * 0.45, centerY - radiusY * 0.88, H_Z);
          const pStem = project3D(stemX, centerY, H_Z);
          ctx.moveTo(pThroatLower.x, pThroatLower.y);
          ctx.lineTo(pStem.x, pStem.y);
          ctx.lineTo(pThroatUpper.x, pThroatUpper.y);
          ctx.stroke();

          // Neon red strings dampener at bottom of center strings
          ctx.fillStyle = '#ef4444';
          const pDamper = project3D(isLeftPlayer ? cx - radiusX * 0.22 : cx + radiusX * 0.22, centerY, H_Z);
          ctx.beginPath();
          ctx.arc(pDamper.x, pDamper.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // F2. Hexagonal Handle Shaft with Pristine White Synthetic Wrap
          const edgeX = isLeftPlayer ? 0 : s.canvasWidth;
          const pHandleEnd = project3D(edgeX, centerY, H_Z);

          // Carbon core handle
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 5.5;
          ctx.beginPath();
          ctx.moveTo(pStem.x, pStem.y);
          ctx.lineTo(pHandleEnd.x, pHandleEnd.y);
          ctx.stroke();

          // White Overgrip
          const gripStartX = isLeftPlayer ? stemX - 9 : stemX + 9;
          const pGripStart = project3D(gripStartX, centerY, H_Z);
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(pGripStart.x, pGripStart.y);
          ctx.lineTo(pHandleEnd.x, pHandleEnd.y);
          ctx.stroke();

          // Grip overlap spiral contours
          ctx.strokeStyle = '#3f3f46';
          ctx.lineWidth = 1.0;
          const wrapLines = 8;
          for (let j = 0; j <= wrapLines; j++) {
            const ratio = j / wrapLines;
            const gripSegmentX = gripStartX + (edgeX - gripStartX) * ratio;
            const pWrap1 = project3D(gripSegmentX, centerY - 2.5, H_Z);
            const pWrap2 = project3D(gripSegmentX + (isLeftPlayer ? 3.5 : -3.5), centerY + 2.5, H_Z);
            ctx.beginPath();
            ctx.moveTo(pWrap1.x, pWrap1.y);
            ctx.lineTo(pWrap2.x, pWrap2.y);
            ctx.stroke();
          }

          // Gold butt cap collar at core handle base
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 4.5;
          ctx.shadowBlur = 2;
          ctx.shadowColor = '#fbbf24';
          ctx.beginPath();
          const pButt1 = project3D(isLeftPlayer ? 1 : s.canvasWidth - 1, centerY, H_Z);
          const pButt2 = project3D(isLeftPlayer ? 3.5 : s.canvasWidth - 3.5, centerY, H_Z);
          ctx.moveTo(pButt1.x, pButt1.y);
          ctx.lineTo(pButt2.x, pButt2.y);
          ctx.stroke();
          ctx.shadowBlur = 0; // Reset
      };


      // Render Left Tennis Racket (Siz / Player 1 - Orange Core Theme)
      const orangeNeon = '#f97316';
      const orangeGripCore = '#7c2d12';
      drawTennisRacket(true, s.leftPaddleY + s.paddleHeight / 2, orangeNeon, orangeGripCore);

      // Render Right Tennis Racket (AI / Player 2 - Cyan/Theme dependant)
      const cyanGripCore = '#0e7490';
      drawTennisRacket(false, s.rightPaddleY + s.paddleHeight / 2, glowMain, cyanGripCore);


      // 3. Draw Ball Trail
      s.ballTrail.forEach((pos, index) => {
        const ratio = (index + 1) / s.ballTrail.length;
        // Float the ball trail off the ground in 3D Mode
        const proj = project3D(pos.x, pos.y, is3DMode ? 14 : 0);
        
        ctx.fillStyle = glowMain;
        ctx.globalAlpha = ratio * 0.22;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, s.ballRadius * (0.5 + ratio * 0.5) * proj.scale, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0; // Reset alpha

      // 4. Draw Ball with Cast Shadow and GLOSS reflection
      if (gameStatus === 'playing') {
        const floatZ = is3DMode ? (14 + Math.sin(Date.now() / 110) * 4) : 0;
        
        // Shadow on the Floor
        if (is3DMode) {
          const shadowPos = project3D(s.ballX, s.ballY, 0);
          const shadowRadius = s.ballRadius * shadowPos.scale * 1.1;
          
          ctx.beginPath();
          const grad = ctx.createRadialGradient(shadowPos.x, shadowPos.y, 1, shadowPos.x, shadowPos.y, shadowRadius);
          grad.addColorStop(0, 'rgba(0,0,0,0.55)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.arc(shadowPos.x, shadowPos.y, shadowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Active Sphere position
        const ballPos = project3D(s.ballX, s.ballY, floatZ);
        const radiusProjected = s.ballRadius * ballPos.scale;

        ctx.shadowBlur = 14;
        ctx.shadowColor = '#fff';
        
        // 3D glossy gradient style
        const gradBall = ctx.createRadialGradient(
          ballPos.x - radiusProjected * 0.3,
          ballPos.y - radiusProjected * 0.3,
          1,
          ballPos.x,
          ballPos.y,
          radiusProjected
        );
        gradBall.addColorStop(0, '#ffffff');
        gradBall.addColorStop(0.35, '#e0fdff');
        gradBall.addColorStop(1, glowMain);
        
        ctx.fillStyle = gradBall;
        ctx.beginPath();
        ctx.arc(ballPos.x, ballPos.y, radiusProjected, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      }

      // 5. Render Spark Particles
      s.particles.forEach((p) => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        // Project particles in 3D space
        const proj = project3D(p.x, p.y, is3DMode ? 6 : 0);
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0; // Reset
    };

    const loop = () => {
      updateGame();
      drawGame();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameMode, aiDifficulty, gameStatus, fieldTheme, ballSpeedMultiplier, is3DMode, equipmentType]);

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 h-[630px] p-1 font-sans text-white select-none">
      
      {/* LEFT SETTINGS VIEWBAR */}
      <div className="w-full md:w-[220px] bg-zinc-950/70 border border-white/5 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shrink-0 scrollbar-thin">
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-white/5">
            <Activity size={15} className="text-[#00daf3]" />
            <h4 className="font-display font-black text-[11px] tracking-wider text-gray-300 uppercase">
              TENNIS PARAMETRLARI
            </h4>
          </div>

          {/* VIEW TYPE / 3D GRAPHIC MODEL TOGGLE */}
          <div className="space-y-1.5 bg-zinc-900/40 p-2.5 rounded-xl border border-white/5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">GRAFIKA KO'RINISHI:</span>
            <button
              onClick={() => {
                setIs3DMode(!is3DMode);
                playSoundEvent('countdown');
                setStatusLog(prev => [`Tasvir: Kiber-grafika ${!is3DMode ? "3D professional" : "2D klassik"} rejimga o'tdi`, ...prev].slice(0, 10));
              }}
              className={`w-full py-2 px-3 rounded-lg text-[9px] font-mono font-black border transition-all cursor-pointer flex items-center justify-between ${
                is3DMode 
                  ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)] hover:bg-purple-500/15'
                  : 'bg-zinc-850 border-white/5 text-zinc-400 hover:text-white hover:border-zinc-500/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Layers size={11} className={is3DMode ? 'animate-pulse text-purple-400' : 'text-zinc-500'} />
                <span>{is3DMode ? "KORT: 3D PERSPEKTIV" : "KORT: FLAT 2D VIEW"}</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[7px] font-mono leading-none font-bold ${
                is3DMode ? "bg-purple-900/30 text-purple-300" : "bg-zinc-800 text-zinc-400"
              }`}>
                {is3DMode ? "3D" : "2D"}
              </span>
            </button>
            <span className="text-[7.5px] font-mono text-purple-400/80 block leading-tight pt-1">
              * Tasvir 3D rejimga o'tganda kiber tomoshabinlar ko'rinadi!
            </span>
          </div>

          {/* GAME MODE PANEL */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">O'yin Turi:</span>
            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold font-mono">
              <button 
                onClick={() => {
                  playSoundEvent('countdown');
                  setGameMode('vs-ai');
                  triggerRestart();
                }}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  gameMode === 'vs-ai' 
                    ? 'bg-[#00daf3]/10 border-[#00daf3]/50 text-[#00daf3] shadow-[0_0_10px_rgba(0,218,243,0.15)]' 
                    : 'bg-black/30 border-white/5 text-zinc-500 hover:text-white'
                }`}
              >
                <Cpu size={12} />
                <span>AI ROBOT</span>
              </button>
              <button 
                onClick={() => {
                  playSoundEvent('countdown');
                  setGameMode('local-2p');
                  triggerRestart();
                }}
                className={`py-2 rounded-lg flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  gameMode === 'local-2p' 
                    ? 'bg-[#f97316]/10 border-[#f97316]/50 text-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.15)]' 
                    : 'bg-black/30 border-white/5 text-zinc-500 hover:text-white'
                }`}
              >
                <Users size={12} />
                <span>👥 2 KISHILIK</span>
              </button>
            </div>
          </div>

          {/* AI DIFFICULTY SLIDER */}
          {gameMode === 'vs-ai' && (
            <div className="space-y-1.5 bg-zinc-900/40 p-2.5 rounded-xl border border-white/5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-zinc-500">AI MAHORATI:</span>
                <span className="text-[#00daf3] font-black">{aiDifficulty}%</span>
              </div>
              <input 
                type="range"
                min="20"
                max="100"
                step="10"
                value={aiDifficulty}
                onChange={(e) => {
                  setAiDifficulty(parseInt(e.target.value));
                  playSoundEvent('countdown');
                }}
                className="w-full accent-[#00daf3] bg-zinc-800 cursor-pointer h-1 rounded"
              />
              <span className="text-[8px] text-zinc-500 block leading-tight font-mono">
                {aiDifficulty >= 90 ? "👑 Super Kompyuter darajasi" : aiDifficulty >= 60 ? "👨‍💻 O'rtacha darajadagi strateg" : "👶 Yangi boshlovchi rejim"}
              </span>
            </div>
          )}

          {/* COURT STYLING SELECTOR */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Virtual Kort Mavzusi:</span>
            <div className="space-y-1.5">
              {(['cyber-grid', 'toxic-nuclear', 'nebula-indigo'] as FieldTheme[]).map((themeType) => (
                <button
                  key={themeType}
                  onClick={() => {
                    setFieldTheme(themeType);
                    playSoundEvent('countdown');
                  }}
                  className={`w-full py-1.5 px-2.5 text-left rounded-lg text-[9px] font-mono font-bold transition-all border flex items-center justify-between cursor-pointer ${
                    fieldTheme === themeType
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="capitalize">{themeType.replace('-', ' ')}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    themeType === 'cyber-grid' ? 'bg-[#00daf3]' : themeType === 'toxic-nuclear' ? 'bg-[#8bdc00]' : 'bg-[#d946ef]'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* SPEED VALUE SLIDER */}
          <div className="space-y-1.5 bg-zinc-900/40 p-2.5 rounded-xl border border-white/5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-zinc-500">KADR TEZLIGI:</span>
              <span className="text-green-400 font-extrabold">x{ballSpeedMultiplier.toFixed(1)}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[1.0, 1.3, 1.6].map((mult) => (
                <button
                  key={mult}
                  onClick={() => {
                    setBallSpeedMultiplier(mult);
                    playSoundEvent('countdown');
                  }}
                  className={`py-1 text-[8px] font-mono font-bold rounded border cursor-pointer transition-all ${
                    ballSpeedMultiplier === mult
                      ? 'bg-green-500/10 border-green-500/45 text-green-400'
                      : 'bg-black/30 border-white/5 text-zinc-500 hover:text-white'
                  }`}
                >
                  {mult === 1.0 ? 'Oddiy' : mult === 1.3 ? 'Tez' : 'Harbiy!'}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* BOTTOM ACTIVE CONTROLS MAP */}
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2.5">
          <div className="space-y-1 text-center bg-black/40 p-2 rounded-lg border border-white/5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">HARAKAT KALITLARI:</span>
            <div className="text-[9px] text-zinc-400 space-y-1 leading-relaxed text-left font-mono">
              <p>🟠 <b className="text-[#f97316]">Siz (Sariq):</b> Up: <b className="text-white">W</b> | Down: <b className="text-white">S</b></p>
              <p>
                🔵 <b className="text-[#00daf3]">{gameMode === 'vs-ai' ? 'Robot' : '2-P'}:</b>{' '}
                {gameMode === 'vs-ai' ? "Prediksiya" : <>Up: <b className="text-white">↑</b> | Down: <b className="text-white">↓</b></>}
              </p>
            </div>
          </div>

          <button
            onClick={triggerRestart}
            className="w-full py-2 bg-zinc-900 border border-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-zinc-800 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <RotateCcw size={12} />
            <span>Qayta Boshlash</span>
          </button>
        </div>

      </div>

      {/* MID ARENA SCREEN & CONSOLE */}
      <div className="flex-1 bg-zinc-950/70 border border-white/5 rounded-2xl p-4 flex flex-col justify-between min-w-0">
        
        {/* SCORE PANEL AND CLOCK */}
        <div className="flex justify-between items-center bg-black/30 px-4 py-2.5 rounded-xl border border-white/5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
            <div className="text-left">
              <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">1-O'yinchi</p>
              <span className="text-sm font-semibold font-mono text-orange-400">{gameMode === 'vs-ai' ? 'Siz (Sariq)' : 'O\'yinchi 1'}</span>
            </div>
          </div>

          {/* DYNAMIC DIGITAL LED SCOREBOARD AND SCOREBOARD FIX */}
          <div className="flex items-center gap-4 bg-zinc-950 px-5 py-1.5 rounded-lg border border-[#00daf3]/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#00daf3]/2 pointer-events-none" />
            
            <span className="font-mono text-2xl font-extrabold text-orange-500 tabular-nums shadow-[0_0_10px_rgba(249,115,22,0.3)]">{player1Score}</span>
            <span className="text-zinc-600 font-mono text-[13px] select-none">-</span>
            <span className={`font-mono text-2xl font-extrabold tabular-nums text-glow-cyan text-cyan-400 shadow-[0_0_10px_rgba(0,218,243,0.3)]`}>
              {player2Score}
            </span>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="text-right">
              <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                {gameMode === 'vs-ai' ? 'Raqib' : '2-O\'yinchi'}
              </p>
              <span className="text-sm font-semibold font-mono text-cyan-400">
                {gameMode === 'vs-ai' ? 'Robot AI' : 'Havorang'}
              </span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
          </div>
        </div>

        {/* ACTIVE CANVAS DISPLAY WITH GAME SCREENS (LARGE ENHANCED 800x500 DISPLAY) */}
        <div className="flex-1 my-3 relative rounded-xl border border-white/5 bg-[#050510] overflow-hidden flex items-center justify-center">
          
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-full block bg-zinc-950 aspect-[800/500]"
          />

          {/* COUNTDOWN OVERLAY */}
          {gameStatus === 'countdown' && !winnerMessage && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center animate-fade-in pb-4">
              <div className="w-16 h-16 rounded-full border border-[#00daf3]/20 flex items-center justify-center bg-zinc-900/60 mb-2 relative">
                <div className="absolute inset-0 rounded-full border border-dashed border-[#00daf3]/50 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="font-display font-black text-2xl text-[#00daf3] animate-pulse">
                  {countdownNum}
                </span>
              </div>
              <h3 className="font-display font-extrabold text-sm tracking-widest text-[#00daf3] uppercase">
                TAYYORLANING...
              </h3>
              <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
                {is3DMode 
                  ? "Haqiqiy 3D Raketkalar va professional to'p faollashmoqda"
                  : "2D raketka simlari va to'qnashuv fizikalari faollashmoqda"
                }
              </p>
 
               {/* Guide tips overlay panel */}
               <div className="mt-8 bg-zinc-900/50 max-w-xs border border-white/5 px-3 py-1.5 rounded-lg text-[9px] font-mono text-zinc-400 text-center">
                 <span className="text-yellow-400 block font-bold mb-0.5">💡 Maslahatsiz bo'ling:</span>
                 Professional tennis raketkalari o'rnatilgan. To'pni burchaklar bilan koptokni burab qaytaring!
               </div>
            </div>
          )}

          {/* GAME WON / ENDED SCREEN OVERLAY */}
          {gameStatus === 'ended' && (
            <div className="absolute inset-0 bg-black/94 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
              <div className="w-14 h-14 rounded-full border border-yellow-500/20 flex items-center justify-center bg-yellow-900/10 mb-4 animate-bounce">
                <Award className="text-yellow-500" size={24} />
              </div>
              
              <h3 className="font-display font-black text-lg italic uppercase text-glow-yellow text-[#ffc600] tracking-wide px-4">
                {player1Score >= 5 ? "SIZ JANGDA G'OLIB BO'LDINGIZ!" : "O'YIN YAKUNLANDI!"}
              </h3>
              <span className="font-sans text-xs text-zinc-300 max-w-sm mt-2 block font-semibold leading-relaxed px-5">
                {winnerMessage}
              </span>

              {/* Match stats snapshot on ending */}
              <div className="my-4 p-3 bg-zinc-900/80 border border-white/5 rounded-xl w-64 grid grid-cols-2 gap-2 text-[10px] font-mono select-text">
                <div className="text-left">
                  <p className="text-zinc-500">Kiritgan to'plaringiz:</p>
                  <p className="text-orange-400 font-extrabold">{player1Score} ta</p>
                </div>
                <div className="text-left border-l border-white/5 pl-2">
                  <p className="text-zinc-500">O'tkazib yuborilgan:</p>
                  <p className="text-red-400 font-extrabold">{p1Misses} ta</p>
                </div>
                <div className="text-left mt-1">
                  <p className="text-zinc-500">Siz urgan zarbalar:</p>
                  <p className="text-emerald-400 font-extrabold">{p1HitsCount} marta</p>
                </div>
                <div className="text-left border-l border-white/5 pl-2 mt-1">
                  <p className="text-zinc-500">Raqib zarbalari:</p>
                  <p className="text-cyan-400 font-extrabold">{p2HitsCount} marta</p>
                </div>
              </div>

              <div className="mt-2 flex gap-3 text-[10px] font-bold font-mono">
                <button
                  onClick={triggerRestart}
                  className="py-2.5 px-6 rounded-xl bg-[#00daf3] hover:bg-[#00daf3]/90 text-zinc-950 font-black tracking-wider transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <RotateCcw size={11} />
                  <span>QAYTADAN BOSHLASH</span>
                </button>
              </div>
            </div>
          )}

          {/* TOUCH OVERLAYS FOR MOBILE SESSIONS */}
          {gameStatus === 'playing' && (
            <div className="absolute inset-0 pointer-events-none flex flex-row">
              {/* Left Side Player 1 Touch Zones */}
              <div className="w-1/2 h-full flex flex-col justify-between p-2">
                <button
                  onTouchStart={() => { simValue.current.p1TouchUp = true; }}
                  onTouchEnd={() => { simValue.current.p1TouchUp = false; }}
                  className="pointer-events-auto h-16 w-16 rounded-2xl bg-orange-500/5 hover:bg-orange-500/10 active:bg-orange-500/25 border border-orange-500/15 flex items-center justify-center focus:outline-none transition-all md:hidden text-orange-400 select-none text-xl font-bold shadow-[0_0_8px_rgba(249,115,22,0.1)]"
                  title="P1 Up"
                >
                  ▲
                </button>
                <button
                  onTouchStart={() => { simValue.current.p1TouchDown = true; }}
                  onTouchEnd={() => { simValue.current.p1TouchDown = false; }}
                  className="pointer-events-auto h-16 w-16 rounded-2xl bg-orange-500/5 hover:bg-orange-500/10 active:bg-orange-500/25 border border-orange-500/15 flex items-center justify-center focus:outline-none transition-all md:hidden text-orange-400 select-none text-xl font-bold shadow-[0_0_8px_rgba(249,115,22,0.1)]"
                  title="P1 Down"
                >
                  ▼
                </button>
              </div>

              {/* Right Side Player 2/AI Touch Zones */}
              <div className="w-1/2 h-full flex flex-col justify-between items-end p-2">
                {gameMode === 'local-2p' ? (
                  <>
                    <button
                      onTouchStart={() => { simValue.current.p2TouchUp = true; }}
                      onTouchEnd={() => { simValue.current.p2TouchUp = false; }}
                      className="pointer-events-auto h-16 w-16 rounded-2xl bg-[#00daf3]/5 hover:bg-[#00daf3]/10 active:bg-[#00daf3]/25 border border-[#00daf3]/15 flex items-center justify-center focus:outline-none transition-all md:hidden text-[#00daf3] select-none text-xl font-bold shadow-[0_0_8px_rgba(0,218,243,0.1)]"
                      title="P2 Up"
                    >
                      ▲
                    </button>
                    <button
                      onTouchStart={() => { simValue.current.p2TouchDown = true; }}
                      onTouchEnd={() => { simValue.current.p2TouchDown = false; }}
                      className="pointer-events-auto h-16 w-16 rounded-2xl bg-[#00daf3]/5 hover:bg-[#00daf3]/10 active:bg-[#00daf3]/25 border border-[#00daf3]/15 flex items-center justify-center focus:outline-none transition-all md:hidden text-[#00daf3] select-none text-xl font-bold shadow-[0_0_8px_rgba(0,218,243,0.1)]"
                      title="P2 Down"
                    >
                      ▼
                    </button>
                  </>
                ) : (
                  <div /> // empty spacer
                )}
              </div>
            </div>
          )}

        </div>

        {/* DETAILED STATS COUNTER GRID - EXPLICIT REQUESTS SATISFIED */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 bg-black/45 p-3 rounded-xl border border-white/5 text-[10px] uppercase font-mono text-zinc-400 leading-none">
          <div className="flex flex-col gap-1 justify-center bg-zinc-950/40 p-2 border border-white/5 rounded-lg text-left">
            <span className="text-zinc-500 font-bold tracking-tight text-[8px]">BALL PASS HITS (ZARBALAR):</span>
            <div className="flex justify-between items-center">
              <span className="text-orange-400 font-extrabold">SIZ: {p1HitsCount}</span>
              <span className="text-cyan-400 font-extrabold">{gameMode === 'vs-ai' ? 'AI' : '2P'}: {p2HitsCount}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 justify-center bg-zinc-950/40 p-2 border border-white/5 rounded-lg text-left">
            <span className="text-zinc-500 font-bold tracking-tight text-[8px]">KIRGITILGAN BALL/TO'PLAR:</span>
            <div className="flex justify-between items-center text-white font-extrabold">
              <span className="text-orange-400">{player1Score}</span>
              <span>vs</span>
              <span className="text-cyan-400">{player2Score}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 justify-center bg-zinc-950/40 p-2 border border-white/5 rounded-lg text-left col-span-2 sm:col-span-1">
            <span className="text-zinc-500 font-bold tracking-tight text-[8px]">O'TKAZIB YUBORILGANI (MISSES):</span>
            <div className="flex justify-between items-center">
              <span className="text-red-400 font-extrabold">Siz: {p1Misses}</span>
              <span className="text-zinc-400 font-extrabold">Raqib: {p2Misses}</span>
            </div>
          </div>
        </div>

        {/* BOTTOM REALTIME SYSTEM CONSOLE LOGS */}
        <div className="bg-black/35 border border-white/5 p-3 rounded-xl min-h-0 overflow-y-auto max-h-[85px] scrollbar-none flex flex-col text-left">
          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block pb-1 select-none">
            MATCH EVENT RECORD SENSOR (TIZIM LOGLARI):
          </span>
          <div className="space-y-1 overflow-y-auto">
            {statusLog.map((log, idx) => (
              <span key={idx} className="font-mono text-[9px] text-[#0dffc3] leading-relaxed block tracking-tight">
                [{new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] » {log}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT SIDE TENNIS HALL OF FAME LEADERBOARD */}
      <div className="w-full md:w-[220px] bg-zinc-950/70 border border-white/5 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shrink-0 scrollbar-thin">
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-white/5">
            <Trophy size={14} className="text-amber-400" />
            <h4 className="font-display font-black text-[11px] tracking-wider text-gray-300 uppercase">
              TENNIS REKORDLARI
            </h4>
          </div>

          <div className="space-y-2">
            {highScores.map((scoreObj, index) => (
              <div 
                key={index}
                className="bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1 transition-all hover:bg-zinc-900/60"
              >
                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1 truncate max-w-[120px]">
                    <span className="font-mono font-bold text-zinc-500">#{index+1}</span>
                    <span className="font-sans font-bold text-gray-300 truncate" title={scoreObj.name}>
                      {scoreObj.name}
                    </span>
                  </div>
                  <span className={`font-mono font-black text-[11px] px-1.5 py-0.5 rounded ${
                    scoreObj.result === 'WON' ? 'text-green-400 bg-green-950/25' : 'text-zinc-400 bg-zinc-950/35'
                  }`}>
                    {scoreObj.score}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[8px] text-zinc-500 font-mono">
                  <span>⏱ {scoreObj.duration}</span>
                  <span>📅 {scoreObj.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MINI SUMMARY BAR */}
        <div className="mt-4 pt-4 border-t border-white/5 text-center text-[9px] font-mono text-zinc-500">
          Ushbu tennis o'yinida ball va hisoblar real-vaqtda mutlaqo xatosiz hisoblanadi.
        </div>

      </div>

    </div>
  );
}
