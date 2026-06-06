import React, { useEffect, useRef, useState } from 'react';
import { Game } from '../types';
import { Play, RotateCcw, X, Volume2, VolumeX, Shield, Award, Zap, Trophy, HelpCircle } from 'lucide-react';
import CheckersGame from './CheckersGame';

interface ArcadeGameRunnerProps {
  game: Game;
  onClose: () => void;
  onGameCompleted: (score: number, coinsEarned: number, xpEarned: number) => void;
}

export default function ArcadeGameRunner({ game, onClose, onGameCompleted }: ArcadeGameRunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover'>('intro');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(`highScore_${game.id}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Gameplay state refs to avoid closure values in requestAnimationFrame
  const stateRef = useRef({
    playing: false,
    score: 0,
    playerX: 150,
    playerY: 250,
    playerWidth: 20,
    playerHeight: 20,
    obstacles: [] as Array<{ 
      x: number; 
      y: number; 
      width: number; 
      height: number; 
      speed: number; 
      color: string; 
      hp?: number;
      lane?: number;
      depth?: number;
      subwayType?: 'barrier' | 'arch' | 'train' | 'ramp';
    }>,
    collectibles: [] as Array<{ 
      x: number; 
      y: number; 
      radius: number; 
      speed: number; 
      collected: boolean;
      lane?: number;
      depth?: number;
      collectedHeight?: number;
      powerType?: 'magnet' | 'boots' | 'jetpack';
    }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string; alpha: number; life: number }>,
    stars: [] as Array<{ x: number; y: number; speed: number; size: number }>,
    keys: {} as Record<string, boolean>,
    frameId: 0,
    lastTime: 0,
    spawnTimer: 0,
    width: game.id === 'cyber-racer' ? 840 : 520,
    height: game.id === 'cyber-racer' ? 520 : 680,
    bullets: [] as Array<{ x: number; y: number; speed: number; color: string }>
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    stateRef.current.keys[e.key] = true;
    
    // For cyber-racer (Subway Surfers): handle discrete actions on key down immediately!
    if (game.id === 'cyber-racer' && stateRef.current.playing) {
      const s = stateRef.current as any;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (s.targetLane === undefined) s.targetLane = 0;
        if (s.targetLane > -1) {
          s.targetLane--;
          playBeep(400, 0.05, 'triangle');
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (s.targetLane === undefined) s.targetLane = 0;
        if (s.targetLane < 1) {
          s.targetLane++;
          playBeep(400, 0.05, 'triangle');
        }
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        if (!s.jumpTicks) s.jumpTicks = 0;
        if (s.jumpTicks === 0) {
          s.jumpTicks = 25; // 25 frames jump
          playBeep(520, 0.1, 'sine');
        }
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (!s.duckTicks) s.duckTicks = 0;
        if (s.duckTicks === 0) {
          s.duckTicks = 22; // 22 frames slide
          s.jumpTicks = 0; // Cancel any active jump
          playBeep(300, 0.1, 'sine');
        }
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    stateRef.current.keys[e.key] = false;
  };

  // Touch triggers
  const handleLeftTouch = () => {
    if (game.id === 'cyber-racer') {
      const s = stateRef.current as any;
      if (s.targetLane === undefined) s.targetLane = 0;
      if (s.targetLane > -1) {
        s.targetLane--;
        playBeep(400, 0.05, 'triangle');
      }
    } else {
      stateRef.current.playerX = Math.max(20, stateRef.current.playerX - 25);
    }
  };

  const handleRightTouch = () => {
    if (game.id === 'cyber-racer') {
      const s = stateRef.current as any;
      if (s.targetLane === undefined) s.targetLane = 0;
      if (s.targetLane < 1) {
        s.targetLane++;
        playBeep(400, 0.05, 'triangle');
      }
    } else {
      stateRef.current.playerX = Math.min(stateRef.current.width - 40, stateRef.current.playerX + 25);
    }
  };

  const handleJumpTouch = () => {
    if (game.id === 'cyber-racer') {
      const s = stateRef.current as any;
      if (!s.jumpTicks) s.jumpTicks = 0;
      if (s.jumpTicks === 0) {
        s.jumpTicks = 25;
        playBeep(520, 0.1, 'sine');
      }
    }
  };

  const handleDuckTouch = () => {
    if (game.id === 'cyber-racer') {
      const s = stateRef.current as any;
      if (!s.duckTicks) s.duckTicks = 0;
      if (s.duckTicks === 0) {
        s.duckTicks = 22;
        s.jumpTicks = 0;
        playBeep(300, 0.1, 'sine');
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(stateRef.current.frameId);
    };
  }, []);

  // Web Audio Synth for retro sounds
  const playBeep = (freq: number, dur: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      // Audio contexts are sometimes blocked before interaction
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    
    const s = stateRef.current as any;
    s.playing = true;
    s.score = 0;
    s.playerX = s.width / 2 - 10;
    s.playerY = game.id === 'neon-strike' ? 410 : 250;
    s.obstacles = [];
    s.collectibles = [];
    s.particles = [];
    s.bullets = [];
    s.spawnTimer = 0;

    // Subway Surfer states
    if (game.id === 'cyber-racer') {
      s.lane = 0;
      s.targetLane = 0;
      s.jumpTicks = 0;
      s.duckTicks = 0;
      s.playerY = 440; // slightly lower on taller screen
      s.magnetTicks = 0;
      s.bootsTicks = 0;
      s.jetpackTicks = 0;
      s.inspectorLane = 0;
    }
    
    // Create random sky details
    s.stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * s.width,
      y: Math.random() * s.height,
      speed: Math.random() * 2 + 1,
      size: Math.random() * 1.5 + 0.5
    }));

    playBeep(220, 0.15, 'sawtooth');
    setTimeout(() => playBeep(440, 0.25, 'sawtooth'), 150);

    // Canvas size sync
    if (canvasRef.current) {
      canvasRef.current.width = s.width;
      canvasRef.current.height = s.height;
    }

    loop(0);
  };

  const triggerExplosion = (x: number, y: number, color: string) => {
    const s = stateRef.current;
    for (let i = 0; i < 15; i++) {
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: Math.random() * 3 + 1,
        color,
        alpha: 1,
        life: 30 + Math.random() * 20
      });
    }
  };

  const endGame = () => {
    setGameState('gameover');
    stateRef.current.playing = false;
    cancelAnimationFrame(stateRef.current.frameId);

    playBeep(150, 0.4, 'sawtooth');
    playBeep(90, 0.6, 'sawtooth');

    // Calculate rewards
    const finalScore = stateRef.current.score;
    const coinsEarned = Math.floor(finalScore / 10) + 5;
    const xpEarned = Math.floor(finalScore / 2) + 15;

    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem(`highScore_${game.id}`, finalScore.toString());
    }

    onGameCompleted(finalScore, coinsEarned, xpEarned);
  };

  const loop = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current.playing) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current as any;
    
    // Smooth helper to project 3D coordinate (lane, depth, height) to 2D screen coordinate (x, y, scale)
    const project = (lane: number, depth: number, offsetHeight: number = 0) => {
      if (game.id === 'cyber-racer') {
        const horizonY = 175;
        const bottomY = 515;
        const dExp = Math.pow(depth, 1.85);
        const y = horizonY + dExp * (bottomY - horizonY);
        const x = s.width / 2 + lane * (dExp * 255);
        const scale = 0.05 + 0.95 * dExp;
        return { x, y: y - offsetHeight * scale, scale };
      }
      const horizonY = 145;
      const bottomY = 485;
      const dExp = Math.pow(depth, 1.8);
      const y = horizonY + dExp * (bottomY - horizonY);
      const x = s.width / 2 + lane * (dExp * 120);
      const scale = 0.05 + 0.95 * dExp;
      return { x, y: y - offsetHeight * scale, scale };
    };

    // Clear background
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, s.width, s.height);

    // Draw perspective neon grid if Neon Strike
    if (game.id === 'neon-strike') {
      // 1. Draw a stunning dusk-sunset gradient sky (Warm gold, magenta, and red orange!)
      const sunsetGrad = ctx.createLinearGradient(0, 0, 0, s.height * 0.45);
      sunsetGrad.addColorStop(0, '#1e1b4b'); // deep twilight blue
      sunsetGrad.addColorStop(0.35, '#701a75'); // pink magenta
      sunsetGrad.addColorStop(0.75, '#ea580c'); // warm orange
      sunsetGrad.addColorStop(1, '#facc15'); // sunset yellow horizon
      ctx.fillStyle = sunsetGrad;
      ctx.fillRect(0, 0, s.width, s.height * 0.45);

      // Huge orange sun sinking behind mountains
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(s.width / 2 + 40, s.height * 0.45 - 2, 45, 0, Math.PI * 2);
      ctx.fill();

      // Outer golden sun halo
      ctx.fillStyle = 'rgba(253, 224, 71, 0.15)';
      ctx.beginPath();
      ctx.arc(s.width / 2 + 40, s.height * 0.45 - 2, 60, 0, Math.PI * 2);
      ctx.fill();

      const horizonY = s.height * 0.45;
      const playerShift = s.playerX - s.width / 2;

      // 2. Parallax Mountain Ridges (3 Layers of canyon ridges!)
      // Layer A (Far, dark purple-crimson silhouettes)
      ctx.fillStyle = '#4c0519';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      const shiftA = playerShift * -0.06;
      for (let x = 0; x <= s.width + 30; x += 30) {
        const heightMultiplier = Math.sin((x + shiftA) * 0.01) * 20 + Math.cos((x + shiftA) * 0.035) * 8;
        ctx.lineTo(x, horizonY - 35 + heightMultiplier);
      }
      ctx.lineTo(s.width, horizonY);
      ctx.closePath();
      ctx.fill();

      // Layer B (Mid, deep rust-red ridges)
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      const shiftB = playerShift * -0.15;
      for (let x = 0; x <= s.width + 25; x += 25) {
        const heightMultiplier = Math.sin((x + shiftB) * 0.015) * 25 + Math.cos((x + shiftB) * 0.05) * 12;
        ctx.lineTo(x, horizonY - 18 + heightMultiplier);
      }
      ctx.lineTo(s.width, horizonY);
      ctx.closePath();
      ctx.fill();

      // Layer C (Fore, sandy desert floor canyons)
      ctx.fillStyle = '#451a03'; // deep sand dark-brown base
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      const shiftC = playerShift * -0.28;
      for (let x = 0; x <= s.width + 15; x += 15) {
        const heightMultiplier = Math.sin((x + shiftC) * 0.02) * 12 + Math.cos((x + shiftC) * 0.07) * 4;
        ctx.lineTo(x, horizonY - 5 + heightMultiplier);
      }
      ctx.lineTo(s.width, horizonY);
      ctx.closePath();
      ctx.fill();

      // 3. Draw high-tech defensive outpost watchtowers in the distance!
      ctx.fillStyle = '#1e1b4b'; // dark structural silhouette
      ctx.fillRect(s.width * 0.25 + shiftB, horizonY - 30, 8, 30);
      ctx.fillRect(s.width * 0.25 - 6 + shiftB, horizonY - 36, 20, 7);
      
      // Spotlights scanning the sky from watchtower
      const scanAngle = Math.sin(s.frameId * 0.022) * 0.55;
      ctx.save();
      ctx.translate(s.width * 0.25 + 4 + shiftB, horizonY - 33);
      ctx.rotate(scanAngle - Math.PI / 2);
      const spotGrad = ctx.createLinearGradient(0, 0, 160, 0);
      spotGrad.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
      spotGrad.addColorStop(1, 'rgba(253, 224, 71, 0.0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(160, -35);
      ctx.lineTo(160, 35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 4. Ground/Outpost Landing Strip (perspective grid for tactical cockpit feel!)
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, s.height);
      groundGrad.addColorStop(0, '#1c1917'); // dark stone floor
      groundGrad.addColorStop(1, '#0c0a09');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, s.width, s.height - horizonY);

      // Sci-fi perspective tactical gridlines over high-tech military base floor
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.15)'; // Orange glow grids
      ctx.lineWidth = 1;
      const numLines = 12;
      for (let i = 0; i <= numLines; i++) {
        const xStart = (i / numLines) * s.width;
        const xEnd = ((i / numLines) - 0.5) * s.width * 1.8 + s.width / 2;
        ctx.beginPath();
        ctx.moveTo(xStart, horizonY);
        ctx.lineTo(xEnd, s.height);
        ctx.stroke();
      }

      const gridScroll = (s.frameId * 4) % 35;
      for (let y = horizonY; y < s.height; y += 35) {
        const currentY = y + gridScroll;
        if (currentY < s.height) {
          ctx.beginPath();
          ctx.moveTo(0, currentY);
          ctx.lineTo(s.width, currentY);
          ctx.stroke();
        }
      }
    } else if (game.id === 'cyber-racer') {
      // 1. Draw beautiful sunny afternoon daylight sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 175);
      skyGrad.addColorStop(0, '#7dd3fc'); // bright azure blue
      skyGrad.addColorStop(0.65, '#bae6fd'); // warm light blue
      skyGrad.addColorStop(1, '#ffffff'); // bright solar white horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, s.width, s.height);

      // 2. Far-away hazy blue city skyline silhouette details as seen in picture 2
      ctx.fillStyle = '#bae6fd22';
      ctx.fillRect(0, 120, s.width, 55);

      ctx.fillStyle = '#a5f3fc88'; // soft teal city blocks
      for (let i = 0; i < s.width; i += 90) {
        const colH = 45 + Math.sin(i * 0.1) * 22;
        ctx.fillRect(i + 15, 175 - colH, 50, colH);
      }

      ctx.fillStyle = '#cbd5e1cc'; // concrete pastel horizon skyscrapers
      for (let i = 0; i < s.width; i += 130) {
        const bH = 65 + Math.cos(i * 0.05) * 35;
        ctx.fillRect(i + 35, 175 - bH, 45, bH);
        // Little antenna tower rods on rooftops
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(i + 57, 175 - bH);
        ctx.lineTo(i + 57, 175 - bH - 12);
        ctx.stroke();
      }

      // 3. Gentle fluffy clouds floating slowly across the blue sky
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      for (let i = 0; i < s.width; i += 240) {
        const cx = (i + s.frameId * 0.18) % (s.width + 120) - 60;
        const cy = 45 + Math.sin(i * 0.8) * 12;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.arc(cx + 15, cy - 6, 22, 0, Math.PI * 2);
        ctx.arc(cx + 32, cy, 15, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      // 4. Render side-scenery: Left and Right green grassy meadows
      const pLeftMeadowFar = project(-1.45, 0);
      const pLeftMeadowNear = project(-1.45, 1.0);
      ctx.fillStyle = '#86efac'; // Minty grass green exactly like picture 2
      ctx.beginPath();
      ctx.moveTo(0, 175);
      ctx.lineTo(pLeftMeadowFar.x, pLeftMeadowFar.y);
      ctx.lineTo(pLeftMeadowNear.x, pLeftMeadowNear.y);
      ctx.lineTo(0, s.height);
      ctx.closePath();
      ctx.fill();

      const pRightMeadowFar = project(1.45, 0);
      const pRightMeadowNear = project(1.45, 1.0);
      ctx.fillStyle = '#86efac'; // Minty grass green
      ctx.beginPath();
      ctx.moveTo(s.width, 175);
      ctx.lineTo(pRightMeadowFar.x, pRightMeadowFar.y);
      ctx.lineTo(pRightMeadowNear.x, pRightMeadowNear.y);
      ctx.lineTo(s.width, s.height);
      ctx.closePath();
      ctx.fill();

      // 5. Light gray/beige concrete sidewalks separating grass fields from asphalt road
      const lCurbFarOuter = project(-1.45, 0);
      const lCurbFarInner = project(-1.35, 0);
      const lCurbNearOuter = project(-1.45, 1.0);
      const lCurbNearInner = project(-1.35, 1.0);
      ctx.fillStyle = '#e4e4e7'; // Light grey sidewalk
      ctx.beginPath();
      ctx.moveTo(lCurbFarInner.x, lCurbFarInner.y);
      ctx.lineTo(lCurbFarOuter.x, lCurbFarOuter.y);
      ctx.lineTo(lCurbNearOuter.x, lCurbNearOuter.y);
      ctx.lineTo(lCurbNearInner.x, lCurbNearInner.y);
      ctx.closePath();
      ctx.fill();

      const rCurbFarOuter = project(1.45, 0);
      const rCurbFarInner = project(1.35, 0);
      const rCurbNearOuter = project(1.45, 1.0);
      const rCurbNearInner = project(1.35, 1.0);
      ctx.fillStyle = '#e4e4e7'; // Light grey sidewalk
      ctx.beginPath();
      ctx.moveTo(rCurbFarInner.x, rCurbFarInner.y);
      ctx.lineTo(rCurbFarOuter.x, rCurbFarOuter.y);
      ctx.lineTo(rCurbNearOuter.x, rCurbNearOuter.y);
      ctx.lineTo(rCurbNearInner.x, rCurbNearInner.y);
      ctx.closePath();
      ctx.fill();

      // Side red/white curb lines (diagonal warning pattern on sidewalks)
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ffffff';
      for (let d = 0; d < 1.0; d += 0.08) {
        const ptLCurb = project(-1.4, d);
        const ptRCurb = project(1.4, d);
        if (ptLCurb.scale > 0) {
          ctx.fillStyle = Math.floor(d * 10) % 2 === 0 ? '#ef4444' : '#ffffff';
          ctx.beginPath();
          ctx.arc(ptLCurb.x, ptLCurb.y, 4 * ptLCurb.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ptRCurb.x, ptRCurb.y, 4 * ptRCurb.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 6. Draw the wide smooth black/dark-grey asphalt highway roadbed
      const roadLfar = project(-1.35, 0);
      const roadRfar = project(1.35, 0);
      const roadLnear = project(-1.35, 1.0);
      const roadRnear = project(1.35, 1.0);
      ctx.fillStyle = '#1e293b'; // Slate dark asphalt highway
      ctx.beginPath();
      ctx.moveTo(roadLfar.x, roadLfar.y);
      ctx.lineTo(roadRfar.x, roadRfar.y);
      ctx.lineTo(roadRnear.x, roadRnear.y);
      ctx.lineTo(roadLnear.x, roadLnear.y);
      ctx.closePath();
      ctx.fill();

      // Bold white zebra crossing crosswalk lines scrolling down (looks amazing like picture 2!)
      const scrollSpeed = 0.038 + (s.score * 0.00003);
      const zebraScroll = (s.frameId * scrollSpeed * 2.2) % 0.45;
      for (let d = 0.4; d <= 1.4; d += 0.45) {
        const currZebraD = d - zebraScroll;
        if (currZebraD >= 0.45 && currZebraD <= 1.1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          const pL = project(-1.35, currZebraD);
          const pR = project(1.35, currZebraD);
          const zebraH = 18 * pL.scale;
          
          ctx.beginPath();
          ctx.moveTo(pL.x, pL.y);
          ctx.lineTo(pR.x, pR.y);
          ctx.lineTo(pR.x, pR.y + zebraH);
          ctx.lineTo(pL.x, pL.y + zebraH);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 7. Render three lanes divided by scrolling/dashed lanes dividers like Picture 2!
      const separators = [-0.48, 0.48];
      const speedOffset = (s.frameId * scrollSpeed) % 0.15; // smooth divider travel

      separators.forEach((sep) => {
        ctx.strokeStyle = '#ffffff';
        for (let d = 0.0; d <= 1.0; d += 0.15) {
          const currD = (d + speedOffset) % 1.0;
          const ptFar = project(sep, currD);
          const ptNear = project(sep, Math.min(1.0, currD + 0.07));
          ctx.lineWidth = 5 * ptFar.scale;
          ctx.beginPath();
          ctx.moveTo(ptFar.x, ptFar.y);
          ctx.lineTo(ptNear.x, ptNear.y);
          ctx.stroke();
        }
      });

      // 8. Render low-poly 3D conical pine trees and plants along the left/right grassy meadows!
      for (let side = -1; side <= 1; side += 2) {
        if (side === 0) continue;
        for (let d = 0.1; d <= 1.0; d += 0.22) {
          const treeD = (d - s.frameId * scrollSpeed * 0.4) % 1.0;
          const finalD = treeD < 0 ? treeD + 1.0 : treeD;
          
          const laneOffset = side === -1 ? -2.2 : 2.2;
          const ptTree = project(laneOffset, finalD);
          if (ptTree.scale > 0 && ptTree.y > 175) {
            ctx.save();
            ctx.translate(ptTree.x, ptTree.y);
            
            // Trunk
            ctx.fillStyle = '#78350f'; // Dark wood
            ctx.fillRect(-2.5 * ptTree.scale, -6 * ptTree.scale, 5 * ptTree.scale, 6 * ptTree.scale);
            
            // Pine Foliage
            ctx.fillStyle = '#16a34a'; // Bright pine green
            ctx.beginPath();
            ctx.moveTo(0, -28 * ptTree.scale);
            ctx.lineTo(-12 * ptTree.scale, -10 * ptTree.scale);
            ctx.lineTo(12 * ptTree.scale, -10 * ptTree.scale);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#15803d'; // shadow tier
            ctx.beginPath();
            ctx.moveTo(0, -38 * ptTree.scale);
            ctx.lineTo(-9 * ptTree.scale, -22 * ptTree.scale);
            ctx.lineTo(9 * ptTree.scale, -22 * ptTree.scale);
            ctx.closePath();
            ctx.fill();

            // Colorful Bench / Bush decor under the tree occasionally
            if (d > 0.4 && d < 0.8) {
              ctx.fillStyle = '#f97316'; // orange park bench
              ctx.fillRect(-15 * ptTree.scale, -3 * ptTree.scale, 8 * ptTree.scale, 3 * ptTree.scale);
            } else {
              ctx.fillStyle = '#ea580c'; // autumn bush
              ctx.beginPath();
              ctx.arc(-8 * ptTree.scale, -3 * ptTree.scale, 5 * ptTree.scale, 0, Math.PI*2);
              ctx.arc(8 * ptTree.scale, -3 * ptTree.scale, 4 * ptTree.scale, 0, Math.PI*2);
              ctx.fill();
            }

            // Render extraordinary street level details (Parked police van, Donuts shop!)
            if (side === -1 && Math.floor(finalD * 10) % 4 === 1) {
              // Draw iconic blue & white parked police car/van sideways on the curb!
              ctx.save();
              ctx.translate(-24 * ptTree.scale, -4 * ptTree.scale);
              const crScale = ptTree.scale * 1.1;
              
              // Car body
              ctx.beginPath();
              ctx.fillStyle = '#1d4ed8'; // Royal Blue
              ctx.roundRect(-16 * crScale, -14 * crScale, 32 * crScale, 14 * crScale, 2 * crScale);
              ctx.fill();
              
              // White roof & doors
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(-10 * crScale, -14 * crScale, 20 * crScale, 6 * crScale);
              ctx.fillRect(-8 * crScale, -8 * crScale, 16 * crScale, 8 * crScale);
              
              // Windshield glass window
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(8 * crScale, -13 * crScale, 6 * crScale, 5 * crScale);
              
              // Wheels
              ctx.fillStyle = '#0f172a';
              ctx.beginPath();
              ctx.arc(-10 * crScale, 0, 4.5 * crScale, 0, Math.PI * 2);
              ctx.arc(10 * crScale, 0, 4.5 * crScale, 0, Math.PI * 2);
              ctx.fill();
              
              // LED blinking beacon of police cruiser
              const frameBlink = Math.sin(s.frameId * 0.4) > 0;
              ctx.fillStyle = frameBlink ? '#ef4444' : '#3b82f6';
              ctx.shadowBlur = 10 * crScale;
              ctx.shadowColor = ctx.fillStyle;
              ctx.fillRect(-2 * crScale, -17 * crScale, 4 * crScale, 3 * crScale);
              
              ctx.restore();
            } else if (side === 1 && Math.floor(finalD * 10) % 4 === 1) {
              // Draw "DONUTS" high quality fast-food style shop matching picture 1 background!
              ctx.save();
              ctx.translate(26 * ptTree.scale, -4 * ptTree.scale);
              const shScale = ptTree.scale * 1.25;
              
              // Store wall brick base
              ctx.beginPath();
              ctx.fillStyle = '#fce7f3'; // pinkish pastry wall house
              ctx.strokeStyle = '#db2777';
              ctx.lineWidth = 1 * shScale;
              ctx.roundRect(-14 * shScale, -26 * shScale, 28 * shScale, 26 * shScale, 1.5 * shScale);
              ctx.fill();
              ctx.stroke();
              
              // Cozy windows
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(-10 * shScale, -14 * shScale, 8 * shScale, 10 * shScale);
              ctx.fillRect(2 * shScale, -14 * shScale, 8 * shScale, 10 * shScale);
              
              // Pink store awning canopy
              ctx.fillStyle = '#db2777';
              ctx.beginPath();
              ctx.moveTo(-16 * shScale, -20 * shScale);
              ctx.lineTo(16 * shScale, -20 * shScale);
              ctx.lineTo(12 * shScale, -15 * shScale);
              ctx.lineTo(-12 * shScale, -15 * shScale);
              ctx.closePath();
              ctx.fill();
              
              // Warm glowing "DONUTS" signs logo
              ctx.shadowBlur = 8 * shScale;
              ctx.shadowColor = '#db2777';
              ctx.fillStyle = '#db2777';
              ctx.font = `bold ${Math.max(4, 5 * shScale)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText("DONUTS", 0, -21 * shScale);
              
              ctx.restore();
            }
            
            ctx.restore();
          }
        }
      }
    } else {
      // Draw Cyber stars streaming down
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      s.stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
        star.y += star.speed;
        if (star.y > s.height) {
          star.y = 0;
          star.x = Math.random() * s.width;
        }
      });
    }

    // Handle Player Control
    if (game.id === 'cyber-racer') {
      if (s.lane === undefined) s.lane = 0;
      if (s.targetLane === undefined) s.targetLane = 0;
      s.lane += (s.targetLane - s.lane) * 0.22;

      // Decay powerups ticking
      if (s.magnetTicks && s.magnetTicks > 0) s.magnetTicks--;
      if (s.bootsTicks && s.bootsTicks > 0) s.bootsTicks--;
      
      if (s.jetpackTicks && s.jetpackTicks > 0) {
        s.jetpackTicks--;
        
        // Spawn sky-coins stream directly in front of the flying skater
        if (s.jetpackTicks % 7 === 0) {
          s.collectibles.push({
            x: 0,
            y: 0,
            radius: 6,
            speed: 0.012, // zoom past slightly faster for thrill of flight!
            collected: false,
            lane: s.targetLane, // spawn in target lane
            depth: 0.0,
            collectedHeight: 95 // sky height level
          });
        }
      }

      // Update inspector lane chase
      if (s.inspectorLane === undefined) s.inspectorLane = 0;
      s.inspectorLane += (s.lane - s.inspectorLane) * 0.08; // slightly lagged chase!

      // Update timer states for animation ticks
      if (s.jumpTicks > 0) s.jumpTicks--;
      if (s.duckTicks > 0) s.duckTicks--;
      if (s.onRampTicks && s.onRampTicks > 0) s.onRampTicks--;

      // Sync player 2D positions for general math logic checks
      let activeHeight = 0;
      if (s.jetpackTicks > 0) {
        activeHeight = 95;
      } else if (s.onRampTicks > 0) {
        // running elevated on top of buses! Add extra jump capability on top of the bus
        activeHeight = 85 + (s.jumpTicks > 0 ? Math.sin((s.jumpTicks / 25) * Math.PI) * 55 : 0);
      } else {
        activeHeight = s.jumpTicks > 0 ? Math.sin((s.jumpTicks / 25) * Math.PI) * (s.bootsTicks > 0 ? 110 : 65) : 0;
      }
      const projPlayer = project(s.lane, 0.85, activeHeight);
      s.playerX = projPlayer.x - s.playerWidth / 2;
      s.playerY = projPlayer.y - s.playerHeight / 2;
    } else {
      if (s.keys['ArrowLeft'] || s.keys['a']) {
        s.playerX = Math.max(10, s.playerX - 6);
      }
      if (s.keys['ArrowRight'] || s.keys['d']) {
        s.playerX = Math.min(s.width - s.playerWidth - 10, s.playerX + 6);
      }
    }

    // Custom Bullet Fire for Neon Strike
    if (game.id === 'neon-strike' && s.frameId % 10 === 0) {
      s.bullets.push({
        x: s.playerX + s.playerWidth / 2 + 10, // alignment near rifle tip
        y: s.playerY,
        speed: -10,
        color: '#00daf3'
      });
      playBeep(700, 0.05, 'triangle');
    }

    // Move & Update Bullets
    if (game.id === 'neon-strike') {
      s.bullets.forEach((b) => {
        b.y += b.speed;
        
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = b.color;
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y - 12);
        ctx.stroke();
        ctx.restore();
      });
      s.bullets = s.bullets.filter(b => b.y > -20);
    }

    // Spawn anomalies / nodes
    s.spawnTimer += 1;
    if (game.id === 'cyber-racer') {
      if (s.spawnTimer % 55 === 0) {
        // Decide which lanes to block so there is always at least one free lane
        const validLanes = [-1, 0, 1];
        const numObs = Math.random() < 0.35 ? 2 : 1; // 1 or 2 obstacles
        const shuffledLanes = [...validLanes].sort(() => Math.random() - 0.5);
        const obstacleLanes = shuffledLanes.slice(0, numObs);

        obstacleLanes.forEach((laneVal) => {
          const rand = Math.random();
          let subType: 'barrier' | 'arch' | 'train' | 'ramp' = 'barrier';
          let color = '#ff9500'; // Orange
          let busVariety: 'blue' | 'yellow' | undefined = undefined;

          if (rand < 0.3) {
            subType = 'barrier';
            color = '#ef4444'; // Red barrier
          } else if (rand < 0.55) {
            subType = 'arch';
            color = '#eab308'; // Yellow arch
          } else if (rand < 0.85) {
            subType = 'train';
            color = '#60a5fa'; // Bus
            busVariety = Math.random() < 0.5 ? 'blue' : 'yellow';
          } else {
            subType = 'ramp';
            color = '#3b82f6'; // Blue ramp
          }

          s.obstacles.push({
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            speed: 0.009 + (s.score * 0.000015), // depth velocity slightly slower for reaction time
            color: color,
            lane: laneVal,
            depth: 0.0,
            subwayType: subType,
            busType: busVariety // attaching dynamic property
          });
        });

        // Spawn beautiful floating strings of credits/coins or a rare power-up in other open lanes
        const freeLanes = validLanes.filter(l => !obstacleLanes.includes(l));
        if (freeLanes.length > 0 && Math.random() < 0.8) {
          const coinLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
          const heightLevel = Math.random() < 0.35 ? 40 : 0;
          
          if (Math.random() < 0.18) {
            // Spawn a rich Subway Surfers power-up instead of a coin stream!
            const powers: Array<'magnet' | 'boots' | 'jetpack'> = ['magnet', 'boots', 'jetpack'];
            const chosenPower = powers[Math.floor(Math.random() * powers.length)];
            
            s.collectibles.push({
              x: 0,
              y: 0,
              radius: 9, // slightly larger
              speed: 0.009 + (s.score * 0.000015),
              collected: false,
              lane: coinLane,
              depth: 0.0,
              collectedHeight: 28, // floating beautifully at eye level
              powerType: chosenPower
            });
          } else {
            // Spawn standard gold coin group
            for (let i = 0; i < 3; i++) {
              s.collectibles.push({
                x: 0,
                y: 0,
                radius: 6,
                speed: 0.009 + (s.score * 0.000015),
                collected: false,
                lane: coinLane,
                depth: -i * 0.06, // layered backwards
                collectedHeight: heightLevel
              });
            }
          }
        }
      }
    } else {
      if (s.spawnTimer % 45 === 0) {
        // Spawn obstacle (drones for Neon Strike, standard blocks for other games)
        const colors = game.id === 'neon-strike' 
          ? ['#ff3b30', '#f13cf5', '#ffaa44'] 
          : ['#ff5a5a', '#ffaa44', '#f13cf5'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const obsWidth = game.id === 'neon-strike' ? 36 : Math.random() * 60 + 30;
        const obsHeight = game.id === 'neon-strike' ? 24 : 15;
        
        s.obstacles.push({
          x: Math.random() * (s.width - obsWidth - 20) + 10,
          y: -40,
          width: obsWidth,
          height: obsHeight,
          speed: Math.random() * 2.0 + 3.0 + (s.score * 0.03),
          color: randomColor,
          hp: game.id === 'neon-strike' ? 1 : undefined
        });

        // Spawn collectible
        if (Math.random() < 0.7) {
          s.collectibles.push({
            x: Math.random() * (s.width - 40) + 20,
            y: -20,
            radius: 8,
            speed: Math.random() * 1.5 + 3,
            collected: false
          });
        }
      }
    }

    // Move & Draw Collectibles
    s.collectibles.forEach((col) => {
      if (game.id === 'cyber-racer') {
        // Smooth magnetic pull: draw coin towards the player if Coin Magnet is active!
        if (s.magnetTicks > 0 && !col.powerType) {
          const playerPt = 0.85;
          if (col.depth < playerPt) {
            const pullSpeed = 0.16 * (1.0 - (playerPt - col.depth));
            col.lane = (col.lane || 0) + ((s.lane || 0) - (col.lane || 0)) * pullSpeed;
            
            // Draw height levels together
            const targetHt = (s.jumpTicks > 0) ? (s.bootsTicks > 0 ? 110 : 65) : (s.jetpackTicks > 0 ? 95 : 0);
            col.collectedHeight = (col.collectedHeight || 0) + (targetHt - (col.collectedHeight || 0)) * pullSpeed;
          }
        }

        col.depth = (col.depth || 0) + (col.speed || 0.009);
        if (!col.collected) {
          const pt = project(col.lane || 0, col.depth, col.collectedHeight || 0);
          col.x = pt.x;
          col.y = pt.y;
          col.radius = 6 * pt.scale;

          if (col.depth > 0 && col.depth < 1.0) {
            if (col.powerType) {
              // --- RENDER SUBWAY SURFERS HIGH-FIDELITY POWERUP ---
              ctx.save();
              ctx.shadowBlur = 18 * pt.scale;
              ctx.shadowColor = col.powerType === 'magnet' ? '#ef4444' : col.powerType === 'boots' ? '#22c55e' : '#f13cf5';
              ctx.translate(pt.x, pt.y);
              
              // Pulsating floating bounce & spin rotation helper
              const powerSpin = s.frameId * 0.1;
              const powerBounce = Math.sin(s.frameId * 0.15 + (col.depth * 10)) * 6 * pt.scale;
              ctx.translate(0, powerBounce);
              
              if (col.powerType === 'magnet') {
                // Draw 3D-styled red and silver Horseshoe Magnet
                ctx.rotate(powerSpin);
                ctx.shadowColor = '#f43f5e';
                
                // Draw magnetic field waves pulsating
                const isPulse = (s.frameId % 30) / 30;
                ctx.strokeStyle = 'rgba(56, 189, 248, ' + (1.0 - isPulse) + ')';
                ctx.lineWidth = 1 * pt.scale;
                ctx.beginPath();
                ctx.arc(0, 0, (14 + isPulse * 16) * pt.scale, 0, Math.PI * 2);
                ctx.stroke();

                // Draw Magnet Horseshoe arcs
                ctx.strokeStyle = '#ef4444'; // Red body
                ctx.lineWidth = 5 * pt.scale;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(0, -2 * pt.scale, 8 * pt.scale, Math.PI * 0.15, Math.PI * 0.85, true);
                ctx.stroke();

                // Silver tips
                ctx.strokeStyle = '#e2e8f0'; // Silver
                ctx.beginPath();
                ctx.arc(0, -2 * pt.scale, 8 * pt.scale, Math.PI * 0.15, Math.PI * 0.22, false);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, -2 * pt.scale, 8 * pt.scale, Math.PI * 0.78, Math.PI * 0.85, false);
                ctx.stroke();

                // Bold magnetic "M" logo in the middle
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${Math.max(6, 7 * pt.scale)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText("M", 0, 3 * pt.scale);

              } else if (col.powerType === 'boots') {
                // Draw glowing Neon-Green sneakers with little cute wings
                ctx.shadowColor = '#4ade80';
                
                // Render left wing (white arc flaps)
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 0.5 * pt.scale;
                ctx.beginPath();
                ctx.moveTo(-4 * pt.scale, -2 * pt.scale);
                ctx.quadraticCurveTo(-14 * pt.scale, -8 * pt.scale, -12 * pt.scale, 2 * pt.scale);
                ctx.quadraticCurveTo(-7 * pt.scale, 1 * pt.scale, -4 * pt.scale, -2 * pt.scale);
                ctx.fill();
                ctx.stroke();

                // Shoe shape (Neon-Green body)
                ctx.fillStyle = '#22c55e'; // Green
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1 * pt.scale;
                ctx.beginPath();
                ctx.roundRect(-4 * pt.scale, -5 * pt.scale, 9 * pt.scale, 10 * pt.scale, 2);
                ctx.fill();
                ctx.stroke();

                // Yellow sole of the shoe
                ctx.fillStyle = '#eab308';
                ctx.fillRect(-4 * pt.scale, 3 * pt.scale, 9 * pt.scale, 2.5 * pt.scale);

                // Shoe stripes
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-2 * pt.scale, -2 * pt.scale, 1.5 * pt.scale, 4 * pt.scale);
                ctx.fillRect(1 * pt.scale, -2 * pt.scale, 1.5 * pt.scale, 4 * pt.scale);

                // Letter "S" logo
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${Math.max(5, 6 * pt.scale)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText("S", 0.5 * pt.scale, 2 * pt.scale);

              } else if (col.powerType === 'jetpack') {
                // Draw Cyber Punk fuchsia/cyan jet thruster backpack
                ctx.rotate(Math.sin(s.frameId * 0.1) * 0.15); // gentle rock
                ctx.shadowColor = '#d946ef';

                // Left thruster tank (fuchsia cylinder)
                ctx.fillStyle = '#d946ef';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.8 * pt.scale;
                ctx.beginPath();
                ctx.roundRect(-7 * pt.scale, -9 * pt.scale, 4.5 * pt.scale, 15 * pt.scale, 1.5);
                ctx.fill();
                ctx.stroke();

                // Right thruster tank (cyan cylinder)
                ctx.fillStyle = '#06b6d4';
                ctx.beginPath();
                ctx.roundRect(2.5 * pt.scale, -9 * pt.scale, 4.5 * pt.scale, 15 * pt.scale, 1.5);
                ctx.fill();
                ctx.stroke();

                // Connected bridging bar
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(-3 * pt.scale, -4 * pt.scale, 6 * pt.scale, 4 * pt.scale);

                // Sparkling rocket flame nozzles
                ctx.fillStyle = '#f97316';
                ctx.fillRect(-6.5 * pt.scale, 6 * pt.scale, 3.5 * pt.scale, 3 * pt.scale);
                ctx.fillRect(3 * pt.scale, 6 * pt.scale, 3.5 * pt.scale, 3 * pt.scale);

                // Glowing central nozzle orb
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.arc(0, -2 * pt.scale, 2.5 * pt.scale, 0, Math.PI * 2);
                ctx.fill();
              }
              
              ctx.restore();
            } else {
              // Draw Subway Surfers iconic gold spinning coin
              ctx.save();
              ctx.shadowBlur = 12 * pt.scale;
              ctx.shadowColor = '#eab308'; // Amber-gold glow
              ctx.fillStyle = '#facc15'; // Bright Gold
              ctx.strokeStyle = '#ca8a04'; // Dark Gold border
              ctx.lineWidth = 1.2 * pt.scale;
              
              // Spinning angle rotation animation
              const rotAngle = s.frameId * 0.12 + (col.depth * 5);
              const sizeX = 7 * pt.scale * Math.abs(Math.sin(rotAngle));
              const sizeY = 7 * pt.scale;
              
              ctx.beginPath();
              ctx.ellipse(pt.x, pt.y, sizeX, sizeY, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              // Inner shiny coin rim
              ctx.strokeStyle = '#fef08a'; // Pale yellow yellow highlights
              ctx.lineWidth = 0.6 * pt.scale;
              ctx.beginPath();
              ctx.ellipse(pt.x, pt.y, sizeX * 0.65, sizeY * 0.65, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Inside star or credit symbol
              ctx.fillStyle = '#eab308';
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, sizeX * 0.25, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }

            // Precise Subway Surfers collision check based on depth proximity & lane index alignment
            const playerDepth = 0.85;
            if (Math.abs(col.depth - playerDepth) < 0.08) {
              const isSameLane = Math.abs((s.lane || 0) - (col.lane || 0)) < 0.45;
              if (isSameLane) {
                // Check if coin height matches player jumping state
                const isCoinHigh = (col.collectedHeight || 0) > 0;
                const isPlayerJumping = s.jumpTicks > 0 || s.jetpackTicks > 0;
                
                if (!isCoinHigh || isPlayerJumping || s.jetpackTicks > 0) {
                  col.collected = true;
                  
                  if (col.powerType) {
                    // Activate power-up modes!
                    if (col.powerType === 'magnet') {
                      s.magnetTicks = 350; // ~6 seconds magnet
                      triggerExplosion(pt.x, pt.y, '#ef4444');
                      playBeep(450, 0.2, 'triangle');
                      playBeep(900, 0.25, 'sine');
                    } else if (col.powerType === 'boots') {
                      s.bootsTicks = 350; // ~6 seconds high jump boots
                      triggerExplosion(pt.x, pt.y, '#22c55e');
                      playBeep(550, 0.2, 'triangle');
                      playBeep(1100, 0.25, 'sine');
                    } else if (col.powerType === 'jetpack') {
                      s.jetpackTicks = 250; // ~4.5 seconds rocket flight
                      triggerExplosion(pt.x, pt.y, '#f13cf5');
                      playBeep(350, 0.25, 'sawtooth');
                      playBeep(700, 0.3, 'sine');
                    }
                  } else {
                    s.score += 15;
                    setScore(s.score);
                    triggerExplosion(pt.x, pt.y, '#facc15'); // Gold spark explosion!
                    playBeep(650 + (s.score * 1.5), 0.08, 'sine');
                  }
                }
              }
            }
          }
        }
      } else {
        col.y += col.speed;
        if (!col.collected) {
          // Draw green glowing node
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00daf3';
          ctx.fillStyle = '#00daf3';
          ctx.beginPath();
          ctx.arc(col.x, col.y, col.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Check collision
          const dist = Math.hypot(col.x - (s.playerX + s.playerWidth / 2), col.y - (s.playerY + s.playerHeight / 2));
          if (dist < col.radius + s.playerWidth / 1.5) {
            col.collected = true;
            s.score += 15;
            setScore(s.score);
            triggerExplosion(col.x, col.y, '#00daf3');
            playBeep(600 + (s.score * 2), 0.1, 'sine');
          }
        }
      }
    });

    // Move & Draw Obstacles
    s.obstacles.forEach((obs) => {
      if (game.id === 'cyber-racer') {
        obs.depth = (obs.depth || 0) + (obs.speed || 0.009);
        const pt = project(obs.lane || 0, obs.depth, 0);
        // Map elements to standard 2D coords handles for general filtering / fallback bounds checking
        obs.x = pt.x - (30 * pt.scale) / 2;
        obs.y = pt.y - (20 * pt.scale);

        if (obs.depth > 0 && obs.depth < 1.05) {
          // Render beautiful, distinct obstacles as if complex 3D models from Subway Surfers
          ctx.save();
          ctx.shadowBlur = 10 * pt.scale;
          ctx.shadowColor = obs.color;

          if (obs.subwayType === 'barrier') {
            // Day-themed caution stripe fence barricade matching picture 2
            const w = 68 * pt.scale;
            const h = 26 * pt.scale;

            // 1. Dual grey concrete base feet
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.roundRect(pt.x - w * 0.45, pt.y - 4 * pt.scale, 8 * pt.scale, 4 * pt.scale, 1);
            ctx.roundRect(pt.x + w * 0.35, pt.y - 4 * pt.scale, 8 * pt.scale, 4 * pt.scale, 1);
            ctx.fill();

            // 2. Thick metal support legs
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 3.5 * pt.scale;
            ctx.beginPath();
            ctx.moveTo(pt.x - w * 0.4, pt.y - 3 * pt.scale);
            ctx.lineTo(pt.x - w * 0.3, pt.y - h);
            ctx.moveTo(pt.x + w * 0.4, pt.y - 3 * pt.scale);
            ctx.lineTo(pt.x + w * 0.3, pt.y - h);
            ctx.stroke();

            // 3. Main white caution board card
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1 * pt.scale;
            ctx.beginPath();
            ctx.roundRect(pt.x - w / 2, pt.y - h, w, 12 * pt.scale, 2 * pt.scale);
            ctx.fill();
            ctx.stroke();

            // 4. Vibrant forward diagonal Red warning caution stripes
            ctx.fillStyle = '#ef4444'; // Red stripes
            for (let ix = -w / 2 + 3 * pt.scale; ix < w / 2 - 3 * pt.scale; ix += 11 * pt.scale) {
              ctx.beginPath();
              ctx.moveTo(pt.x + ix, pt.y - h);
              ctx.lineTo(pt.x + ix + 5 * pt.scale, pt.y - h);
              ctx.lineTo(pt.x + ix + 2 * pt.scale, pt.y - h + 12 * pt.scale);
              ctx.lineTo(pt.x + ix - 3 * pt.scale, pt.y - h + 12 * pt.scale);
              ctx.closePath();
              ctx.fill();
            }

            // 5. Double flashing orange warning LED lights on top
            const isFlashOn = Math.floor(s.frameId / 12) % 2 === 0;
            ctx.fillStyle = isFlashOn ? '#f97316' : '#7c2d12';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.5 * pt.scale;
            
            ctx.beginPath();
            ctx.arc(pt.x - w * 0.38, pt.y - h, 3.5 * pt.scale, 0, Math.PI * 2);
            ctx.arc(pt.x + w * 0.38, pt.y - h, 3.5 * pt.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

          } else if (obs.subwayType === 'arch') {
            // Bright Yellow/Orange high clearance warning archway (slide under)
            const aw = 78 * pt.scale;
            const ah = 68 * pt.scale;

            // 1. Robust yellow/black construction supports
            ctx.strokeStyle = '#eab308'; // Safety yellow
            ctx.lineWidth = 5 * pt.scale;
            ctx.beginPath();
            ctx.moveTo(pt.x - aw / 2, pt.y);
            ctx.lineTo(pt.x - aw * 0.4, pt.y - ah);
            ctx.lineTo(pt.x + aw * 0.4, pt.y - ah);
            ctx.lineTo(pt.x + aw / 2, pt.y);
            ctx.stroke();

            // Alternating warning stripes on the columns
            ctx.strokeStyle = '#1e293b'; // dark stripes
            ctx.lineWidth = 4 * pt.scale;
            ctx.beginPath();
            ctx.moveTo(pt.x - aw * 0.47, pt.y - 12 * pt.scale);
            ctx.lineTo(pt.x - aw * 0.45, pt.y - 15 * pt.scale);
            ctx.moveTo(pt.x + aw * 0.47, pt.y - 12 * pt.scale);
            ctx.lineTo(pt.x + aw * 0.45, pt.y - 15 * pt.scale);
            ctx.stroke();

            // 2. Clear caution sign banner in middle of the arch
            ctx.fillStyle = '#ef4444'; // Red alarm card
            ctx.beginPath();
            ctx.roundRect(pt.x - aw * 0.34, pt.y - ah, aw * 0.68, 14 * pt.scale, 2 * pt.scale);
            ctx.fill();

            // Sign text labels
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(5, 7 * pt.scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText("▼ SLIDE ▼", pt.x, pt.y - ah + 9 * pt.scale);

          } else if (obs.subwayType === 'train') {
            // Bus - supports both sky-blue and golden-yellow school bus style!
            const tw = 72 * pt.scale;
            const th = 85 * pt.scale;
            const isYellow = obs.busType === 'yellow';

            // 1. Glossy bus body casing (yellow school bus vs sky-blue commuter!)
            ctx.fillStyle = isYellow ? '#fbbf24' : '#60a5fa'; // golden yellow vs light sky-blue
            ctx.strokeStyle = isYellow ? '#b45309' : '#1d4ed8'; // deep brown vs royal blue borders
            ctx.lineWidth = 1.8 * pt.scale;
            ctx.beginPath();
            ctx.roundRect(pt.x - tw / 2, pt.y - th, tw, th, 4 * pt.scale);
            ctx.fill();
            ctx.stroke();

            // 2. Wide front glass windshield window (glossy dark slate)
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = isYellow ? '#fef08a' : '#93c5fd';
            ctx.lineWidth = 1 * pt.scale;
            ctx.beginPath();
            ctx.roundRect(pt.x - tw * 0.42, pt.y - th + 9 * pt.scale, tw * 0.84, th * 0.32, 2 * pt.scale);
            ctx.fill();
            ctx.stroke();

            // Internal bus seat outlines silhouette
            ctx.fillStyle = '#334155';
            ctx.fillRect(pt.x - tw * 0.3, pt.y - th + 18 * pt.scale, 6 * pt.scale, 10 * pt.scale);
            ctx.fillRect(pt.x + tw * 0.2, pt.y - th + 18 * pt.scale, 6 * pt.scale, 10 * pt.scale);

            // 3. Thick horizontal black front grill panel
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(pt.x - tw * 0.38, pt.y - th * 0.48, tw * 0.76, 20 * pt.scale, 2 * pt.scale);
            ctx.fill();

            // Elegant white grill stripes
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.8 * pt.scale;
            for (let gx = -tw * 0.3; gx <= tw * 0.3; gx += 8 * pt.scale) {
              ctx.beginPath();
              ctx.moveTo(pt.x + gx, pt.y - th * 0.44);
              ctx.lineTo(pt.x + gx, pt.y - th * 0.34);
              ctx.stroke();
            }

            // 4. Large glowing yellow headlight beams (Picture 2 style)
            ctx.fillStyle = '#fef08a'; // Glowing yellow
            ctx.shadowBlur = 15 * pt.scale;
            ctx.shadowColor = '#eab308';
            ctx.beginPath();
            ctx.arc(pt.x - tw * 0.28, pt.y - 18 * pt.scale, 5.5 * pt.scale, 0, Math.PI * 2);
            ctx.arc(pt.x + tw * 0.28, pt.y - 18 * pt.scale, 5.5 * pt.scale, 0, Math.PI * 2);
            ctx.fill();

            // Headlight lens outlines
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1 * pt.scale;
            ctx.beginPath();
            ctx.arc(pt.x - tw * 0.28, pt.y - 18 * pt.scale, 5.5 * pt.scale, 0, Math.PI * 2);
            ctx.arc(pt.x + tw * 0.28, pt.y - 18 * pt.scale, 5.5 * pt.scale, 0, Math.PI * 2);
            ctx.stroke();

            // 5. Heavy duty dark wheels at the bottom on asphalt
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x - tw * 0.46, pt.y - 5 * pt.scale, 10 * pt.scale, 5 * pt.scale);
            ctx.fillRect(pt.x + tw * 0.32, pt.y - 5 * pt.scale, 10 * pt.scale, 5 * pt.scale);

            // Red bumper safety dots
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(pt.x - tw * 0.44, pt.y - 25 * pt.scale, 3.5 * pt.scale, 3.5 * pt.scale);
            ctx.fillRect(pt.x + tw * 0.36, pt.y - 25 * pt.scale, 3.5 * pt.scale, 3.5 * pt.scale);

          } else if (obs.subwayType === 'ramp') {
            // Draw Blue shipping container metal cargo box with sloped climbable wooden/stone ramp ramp!
            const rw = 68 * pt.scale;
            const rh = 80 * pt.scale; // back-wall height matches bus deck height

            ctx.save();
            ctx.shadowBlur = 10 * pt.scale;
            ctx.shadowColor = 'rgba(37, 99, 235, 0.4)';

            // Draw container side panels
            ctx.fillStyle = '#2563eb'; // Royal blue
            ctx.strokeStyle = '#1d4ed8';
            ctx.lineWidth = 1.5 * pt.scale;
            ctx.beginPath();
            ctx.roundRect(pt.x - rw / 2, pt.y - rh, rw, rh, 3 * pt.scale);
            ctx.fill();
            ctx.stroke();

            // Draw sloped ramp treadlines / wooden side wings extending to road bed!
            ctx.fillStyle = '#f59e0b'; // Stone yellow wooden boards
            ctx.beginPath();
            ctx.moveTo(pt.x - rw / 2 + 2, pt.y);
            ctx.lineTo(pt.x + rw / 2 - 2, pt.y);
            // slanted line meeting the top back of the container block
            ctx.lineTo(pt.x + rw * 0.4, pt.y - rh);
            ctx.lineTo(pt.x - rw * 0.4, pt.y - rh);
            ctx.closePath();
            ctx.fill();

            // Step lines drawn along the ramp slope
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2 * pt.scale;
            for (let ry = pt.y; ry > pt.y - rh; ry -= 14 * pt.scale) {
              const rFactor = (pt.y - ry) / rh; // slope scaling
              const rxOffset = rw * 0.45 * (1.0 - rFactor);
              ctx.beginPath();
              ctx.moveTo(pt.x - rxOffset, ry);
              ctx.lineTo(pt.x + rxOffset, ry);
              ctx.stroke();
            }

            ctx.restore();
          }
          ctx.restore();

          // Precise Subway Surfers collision check based on depth proximity & lane index alignment
          const playerDepth = 0.85;
          if (Math.abs(obs.depth - playerDepth) < 0.05) {
            const isSameLane = Math.abs((s.lane || 0) - (obs.lane || 0)) < 0.45;
            if (isSameLane) {
              if (obs.subwayType === 'barrier') {
                // Low barrier: player crashes if NOT jumping!
                if (!(s.jumpTicks > 0 || (s.onRampTicks && s.onRampTicks > 0))) {
                  triggerExplosion(pt.x, pt.y - 10, '#ff3b30');
                  endGame();
                }
              } else if (obs.subwayType === 'arch') {
                // High arch: player crashes if NOT sliding!
                if (!(s.duckTicks > 0 || (s.onRampTicks && s.onRampTicks > 0))) {
                  triggerExplosion(pt.x, pt.y - 30, '#f13cf5');
                  endGame();
                }
              } else if (obs.subwayType === 'train') {
                // Tall train/bus: crash unless soaring high, jumping with super boots, OR running on a ramp container!
                const isFlyingOver = (s.jetpackTicks && s.jetpackTicks > 0) || 
                                     (s.jumpTicks > 0 && s.bootsTicks && s.bootsTicks > 0) ||
                                     (s.onRampTicks && s.onRampTicks > 0);
                if (!isFlyingOver) {
                  triggerExplosion(pt.x, pt.y - 40, '#00daf3');
                  endGame();
                }
              } else if (obs.subwayType === 'ramp') {
                // If they run into the ramp on the correct lane, CLIMB!
                // Give them lots of ramp-run time and safe elevations!
                if (!(s.onRampTicks && s.onRampTicks > 0)) {
                  s.onRampTicks = 160; // elevated run duration
                  playBeep(440, 0.1, 'sine');
                  playBeep(880, 0.2, 'sine');
                  triggerExplosion(pt.x, pt.y - 12, '#fbbf24'); // golden particles!
                }
              }
            }
          }
        }
      } else {
        obs.y += obs.speed;

        // Ballistic damage detection for Neon Strike
        if (game.id === 'neon-strike') {
          s.bullets.forEach((b) => {
            if (
              b.x > obs.x &&
              b.x < obs.x + obs.width &&
              b.y > obs.y &&
              b.y < obs.y + obs.height
            ) {
              // Hit! Remove bullet and damage drone
              b.y = -100;
              obs.hp = (obs.hp || 1) - 1;
              
              // Explosion and sound feedback
              triggerExplosion(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.color);
              playBeep(320, 0.08, 'sawtooth');
              s.score += 30; // Earn points for destroying hackers!
              setScore(s.score);
            }
          });
        }

        // Draw obstacle
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = obs.color;
        
        if (game.id === 'neon-strike') {
          // Futuristic floating AI drone / cyber ship
          ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
          ctx.strokeStyle = obs.color;
          ctx.lineWidth = 2;
          
          // Drone center body
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.height / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Armored wings
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + obs.height / 2);
          ctx.lineTo(obs.x - 5, obs.y + 4);
          ctx.lineTo(obs.x + obs.width / 4, obs.y + obs.height / 2);
          ctx.moveTo(obs.x + obs.width, obs.y + obs.height / 2);
          ctx.lineTo(obs.x + obs.width + 5, obs.y + 4);
          ctx.lineTo(obs.x + obs.width - obs.width / 4, obs.y + obs.height / 2);
          ctx.stroke();
          
          // Glowing reactor core
          ctx.fillStyle = obs.color;
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Red obstacle block with neon border
          ctx.fillStyle = 'rgba(255, 90, 90, 0.15)';
          ctx.strokeStyle = obs.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 4);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();

        // Check collision with player
        if (
          s.playerX < obs.x + obs.width &&
          s.playerX + s.playerWidth > obs.x &&
          s.playerY < obs.y + obs.height &&
          s.playerY + s.playerHeight > obs.y
        ) {
          triggerExplosion(s.playerX + s.playerWidth / 2, s.playerY + s.playerHeight / 2, '#ff3b30');
          endGame();
        }
      }
    });

    // Cleanup offscreen & destroyed objects
    s.obstacles = s.obstacles.filter(o => {
      if (game.id === 'cyber-racer') {
        return o.depth < 1.05;
      }
      return o.y < s.height + 20 && (o.hp === undefined || o.hp > 0);
    });
    s.collectibles = s.collectibles.filter(c => {
      if (game.id === 'cyber-racer') {
        return c.depth < 1.05 && !c.collected;
      }
      return c.y < s.height + 20 && !c.collected;
    });

    // Draw Particles
    s.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 1 / p.life;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Player representation
    if (game.id === 'cyber-racer') {
      // Draw Inspector (Subway Officer) and his Bulldog chasing behind at depth 1.1!
      // They are placed slightly below/behind the player and follow the s.inspectorLane
      const ptInsp = project(s.inspectorLane || 0, 1.15, 0); // slightly further in 3D back-plane
      if (ptInsp.scale > 0) {
        ctx.save();
        ctx.translate(ptInsp.x, ptInsp.y);
        ctx.shadowBlur = 8 * ptInsp.scale;
        ctx.shadowColor = '#dc2626';

        // --- DRAW SECURITY GUARD (INSPECTOR) ---
        ctx.save();
        ctx.translate(-16 * ptInsp.scale, -4 * ptInsp.scale);
        const guardScale = ptInsp.scale * 1.35; // Bulky inspector guard!
        
        // Guard wobble run animation
        const runWobble = Math.sin(s.frameId * 0.28) * 2 * guardScale;
        ctx.translate(0, runWobble);

        // Security Guard boots
        ctx.fillStyle = '#1e1b4b'; // Shiny navy black boots
        ctx.fillRect(-5.5 * guardScale, 1.5 * guardScale, 4 * guardScale, 2 * guardScale);
        ctx.fillRect(1.5 * guardScale, 1.5 * guardScale, 4 * guardScale, 2 * guardScale);

        // Dark Blue trousers legs
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-5 * guardScale, -2 * guardScale, 3.2 * guardScale, 4.5 * guardScale);
        ctx.fillRect(1.8 * guardScale, -2 * guardScale, 3.2 * guardScale, 4.5 * guardScale);

        // Bulky Inspector coat (green police/security jacket)
        ctx.fillStyle = '#065f46'; // Forest green jacket
        ctx.strokeStyle = '#facc15'; // Gold badge/buttons
        ctx.lineWidth = 1 * guardScale;
        ctx.beginPath();
        ctx.moveTo(-6 * guardScale, -2 * guardScale);
        ctx.lineTo(6 * guardScale, -2 * guardScale);
        ctx.lineTo(8 * guardScale, -18 * guardScale);
        ctx.lineTo(-8 * guardScale, -18 * guardScale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shiny Gold authority badge
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(3 * guardScale, -13 * guardScale, 2 * guardScale, 0, Math.PI * 2);
        ctx.fill();

        // Angry growling facial head
        ctx.fillStyle = '#fbcfe8'; // Pinkish skin angry face
        ctx.beginPath();
        ctx.arc(0, -23 * guardScale, 5 * guardScale, 0, Math.PI * 2);
        ctx.fill();

        // Thick grumpy dark mustache
        ctx.fillStyle = '#1e293b'; // Slate black
        ctx.fillRect(-3 * guardScale, -22 * guardScale, 6 * guardScale, 2 * guardScale);

        // Officer hat (security police peak cap)
        ctx.fillStyle = '#0f172a'; // Slate cap
        ctx.beginPath();
        ctx.arc(0, -25.5 * guardScale, 5.2 * guardScale, Math.PI, 0, false);
        ctx.fill();
        // Shiny gold security band on cap
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-5 * guardScale, -26 * guardScale, 10 * guardScale, 1.5 * guardScale);

        ctx.restore();


        // --- DRAW GRUMPY BULLDOG DOG ---
        ctx.save();
        ctx.translate(14 * ptInsp.scale, 0);
        const dogScale = ptInsp.scale * 1.15;
        
        // Dog run bounce wobble
        const dogBounce = Math.cos(s.frameId * 0.32) * 1.5 * dogScale;
        ctx.translate(0, dogBounce);

        // Bulldog feet
        ctx.fillStyle = '#451a03'; // Brown paws
        ctx.fillRect(-4 * dogScale, 1 * dogScale, 2 * dogScale, 2.5 * dogScale);
        ctx.fillRect(2 * dogScale, 1 * dogScale, 2 * dogScale, 2.5 * dogScale);

        // Bulky dog body
        ctx.fillStyle = '#78350f'; // Darker brown
        ctx.beginPath();
        ctx.ellipse(0, -3 * dogScale, 7.5 * dogScale, 5 * dogScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dog head snout
        ctx.fillStyle = '#a16207'; // Golden brown head neck
        ctx.beginPath();
        ctx.arc(4 * dogScale, -7 * dogScale, 4.5 * dogScale, 0, Math.PI * 2);
        ctx.fill();

        // Angry bulldog snout
        ctx.fillStyle = '#451a03'; // Dark brown snout nose
        ctx.fillRect(5.5 * dogScale, -7.5 * dogScale, 3 * dogScale, 2.5 * dogScale);

        // White spiked collar around neck
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 * dogScale;
        ctx.beginPath();
        ctx.moveTo(1 * dogScale, -4 * dogScale);
        ctx.lineTo(2 * dogScale, -9 * dogScale);
        ctx.stroke();

        ctx.restore();

        ctx.restore();
      }

      ctx.save();
      
      // Calculate jump elevation height in pixels based on sine loop
      const maxJumpHeight = s.bootsTicks > 0 ? 110 : 65;
      let jumpVal = s.jumpTicks > 0 ? Math.sin((s.jumpTicks / 25) * Math.PI) * maxJumpHeight : 0;
      if (s.jetpackTicks > 0) {
        jumpVal = 95; // soar smoothly in sky level flight!
      }
      
      // Calculate slide compression scale
      const isSliding = s.duckTicks > 0;
      
      const pt = project(s.lane || 0, 0.85, jumpVal);
      const scale = pt.scale;
      
      ctx.translate(pt.x, pt.y);
      ctx.shadowBlur = 10 * scale;
      ctx.shadowColor = s.jetpackTicks > 0 ? '#d946ef' : (s.bootsTicks > 0 ? '#22c55e' : '#facc15');

      // 1. Subway Surfers Graffiti Spray Paint clouds rising from hoverboard exhausts
      if (s.frameId % 2 === 0) {
        for (let th = -1; th <= 1; th += 2) {
          s.particles.push({
            x: pt.x + (th * 6 * scale),
            y: pt.y + (isSliding ? 2 : 10) * scale,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1.5,
            radius: Math.random() * 3.5 * scale + 1.0,
            color: th === -1 ? '#f13cf5' : '#facc15', // pink & yellow spray paints
            alpha: 0.9,
            life: 18
          });
        }
      }

      // 2. Draw the Hoverboard (with Subway Surfers style wooden deck and neon neon outline)
      const boardW = 21 * scale;
      const boardH = 5 * scale;
      const boardOffset = (isSliding ? 3 : 9) * scale;
      
      // Board Shadow on tracks
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.ellipse(0, boardOffset + 4 * scale, boardW * 1.0, boardH * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main Skate Deck (graffiti green and pink wood texture)
      ctx.fillStyle = '#10b981'; // Green deck
      ctx.strokeStyle = '#f13cf5'; // Magenta highlight trim
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.ellipse(0, boardOffset, boardW, boardH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden center stripe
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.ellipse(0, boardOffset, boardW * 0.7, boardH * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Draw the Skater character body (squeezed downwards if sliding under arches!)
      ctx.scale(1.0, isSliding ? 0.42 : 1.0);

      // --- LEGS & SNEAKERS ---
      // Bulk yellow & cyan sneakers
      const isSuperBoots = s.bootsTicks > 0;
      ctx.fillStyle = isSuperBoots ? (s.frameId % 14 < 7 ? '#22c55e' : '#facc15') : '#facc15'; 
      ctx.strokeStyle = isSuperBoots ? '#ffffff' : '#00daf3'; 
      ctx.lineWidth = 1.3 * scale;
      
      // Left foot
      ctx.beginPath();
      ctx.roundRect(-10 * scale, (isSliding ? 1 : 6) * scale, 5.5 * scale, 4 * scale, 1.5);
      ctx.fill();
      ctx.stroke();
      // Right foot
      ctx.beginPath();
      ctx.roundRect(4.5 * scale, (isSliding ? 1 : 6) * scale, 5.5 * scale, 4 * scale, 1.5);
      ctx.fill();
      ctx.stroke();

      // If Super Sneakers are active, draw beautiful winged sneakers fluttering on her ankles!
      if (isSuperBoots) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 0.8 * scale;
        
        const wingFlap = Math.sin(s.frameId * 0.45) * 4 * scale;
        
        // Left sneaker wing
        ctx.beginPath();
        ctx.moveTo(-10.5 * scale, (isSliding ? 2 : 7) * scale);
        ctx.quadraticCurveTo(-18 * scale, (isSliding ? -3 : 2) * scale + wingFlap, -14 * scale, (isSliding ? 4 : 9) * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right sneaker wing
        ctx.beginPath();
        ctx.moveTo(10.5 * scale, (isSliding ? 2 : 7) * scale);
        ctx.quadraticCurveTo(18 * scale, (isSliding ? -3 : 2) * scale + wingFlap, 14 * scale, (isSliding ? 4 : 9) * scale);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Blue denim trousers leg tubes
      ctx.fillStyle = '#2563eb'; // Deep Blue Denim
      ctx.fillRect(-9.5 * scale, (isSliding ? -3 : 2) * scale, 4.5 * scale, 4 * scale);
      ctx.fillRect(5 * scale, (isSliding ? -3 : 2) * scale, 4.5 * scale, 4 * scale);


      // --- STREETWEAR HOODIE / JACKET (Blue with orange sleeves!) ---
      ctx.fillStyle = '#1e3a8a'; // Royal blue hoodie vest
      ctx.strokeStyle = '#f97316'; // Orange outline trims
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      // Torso quadrilateral chest area
      ctx.moveTo(-7.5 * scale, (isSliding ? -2 : 3) * scale);
      ctx.lineTo(7.5 * scale, (isSliding ? -2 : 3) * scale);
      ctx.lineTo(8.5 * scale, -13 * scale);
      ctx.lineTo(-8.5 * scale, -13 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // White t-shirt collar under inner vest
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-3 * scale, -11 * scale);
      ctx.lineTo(3 * scale, -11 * scale);
      ctx.lineTo(0, -6 * scale);
      ctx.closePath();
      ctx.fill();

      // Extended arms for skate balance (orange sleeves)
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.5 * scale;
      // Left swinging arm balance
      ctx.beginPath();
      ctx.moveTo(-8 * scale, -9 * scale);
      ctx.lineTo(-14 * scale, -4 * scale);
      ctx.stroke();
      // Right swinging arm holding imaginary graffiti can
      ctx.beginPath();
      ctx.moveTo(8 * scale, -9 * scale);
      ctx.lineTo(13 * scale, -5 * scale);
      ctx.stroke();

      // Imaginary spray paint can in right hand
      ctx.fillStyle = '#ef4444'; // Red can
      ctx.fillRect(11.5 * scale, -8.5 * scale, 3 * scale, 4 * scale);
      ctx.fillStyle = '#ffffff'; // White spray cap
      ctx.fillRect(12.5 * scale, -10 * scale, 1 * scale, 1.5 * scale);


      // --- ROCKET BOOSTER JETPACK OVERLAY ---
      if (s.jetpackTicks && s.jetpackTicks > 0) {
        ctx.save();
        // Left tank (Magenta cylinder)
        ctx.fillStyle = '#d946ef'; 
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8 * scale;
        ctx.beginPath();
        ctx.roundRect(-8 * scale, -13 * scale, 3.5 * scale, 9 * scale, 1);
        ctx.fill();
        ctx.stroke();

        // Right tank (Cyan cylinder)
        ctx.fillStyle = '#06b6d4'; 
        ctx.beginPath();
        ctx.roundRect(4.5 * scale, -13 * scale, 3.5 * scale, 9 * scale, 1);
        ctx.fill();
        ctx.stroke();

        // Cross bridging connector bar
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-4.5 * scale, -10 * scale, 9 * scale, 2.5 * scale);

        // Rocket booster exhausts (bursting vibrant fire sprites)
        const frameFlame = (s.frameId % 4) * 1.5;
        const fireHeight = (12 + frameFlame) * scale;
        
        ctx.fillStyle = '#f97316'; // Orange outer flame flare
        ctx.beginPath();
        ctx.ellipse(-6.25 * scale, -4 * scale, 1.8 * scale, fireHeight, 0, 0, Math.PI * 2);
        ctx.ellipse(6.25 * scale, -4 * scale, 1.8 * scale, fireHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15'; // Yellow inner heat flame core
        ctx.beginPath();
        ctx.ellipse(-6.25 * scale, -4 * scale, 0.9 * scale, fireHeight * 0.55, 0, 0, Math.PI * 2);
        ctx.ellipse(6.25 * scale, -4 * scale, 0.9 * scale, fireHeight * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();

        // Continuously squirt bright glowing kinetic exhaust thrust particles!
        if (s.frameId % 2 === 0) {
          s.particles.push({
            x: pt.x - 6.25 * scale,
            y: pt.y - 4 * scale,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 3 + 3,
            radius: Math.random() * 3.5 * scale + 1.1,
            color: Math.random() < 0.6 ? '#f97316' : '#facc15',
            alpha: 1.0,
            life: 14
          });
          s.particles.push({
            x: pt.x + 6.25 * scale,
            y: pt.y - 4 * scale,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 3 + 3,
            radius: Math.random() * 3.5 * scale + 1.1,
            color: Math.random() < 0.6 ? '#06b6d4' : '#d946ef',
            alpha: 1.0,
            life: 14
          });
        }
      }


      // --- HUMAN HEAD & BACKWARDS SNAPBACK CAP (Subway Surfers Core Item!) ---
      // Skin tone head
      ctx.fillStyle = '#ffedd5'; // Peach light skin
      ctx.beginPath();
      ctx.arc(0, -18 * scale, 6 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Cool dark-grey headphones on ears
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-7 * scale, -21 * scale, 2.2 * scale, 5 * scale, 1);
      ctx.roundRect(4.8 * scale, -21 * scale, 2.2 * scale, 5 * scale, 1);
      ctx.fill();

      // Draw the iconic RED backwards baseball cap
      ctx.fillStyle = '#ef4444'; // Red cap cap
      ctx.beginPath();
      // Half arc for baseball head cover
      ctx.arc(0, -19.5 * scale, 5.8 * scale, Math.PI, 0, false);
      ctx.lineTo(0, -19.5 * scale);
      ctx.closePath();
      ctx.fill();

      // Cap visor shield pointing backward-left (Subway Surfers signature!)
      ctx.fillStyle = '#eab308'; // Golden yellow cap visor
      ctx.beginPath();
      ctx.moveTo(-4 * scale, -20.5 * scale);
      ctx.lineTo(-11.5 * scale, -24.5 * scale);
      ctx.lineTo(-10.5 * scale, -26.5 * scale);
      ctx.lineTo(-1.5 * scale, -22 * scale);
      ctx.closePath();
      ctx.fill();

      // Cap front round circular badge logo on back of head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -21 * scale, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.font = `bold ${Math.max(4, 5 * scale)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText("S", 0, -19.5 * scale); // Subway "S" logo!

      ctx.restore();
    } else if (game.id === 'neon-strike') {
      // Sleek tactical back-view military desert exo-suit combat mech! (Very detailed!)
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#eab308'; // Golden orange core glow
      
      // Heavy thruster plasma fire sparks trailing down
      if (s.frameId % 2 === 0) {
        // Double thrusters left and right
        s.particles.push({
          x: s.playerX + 2,
          y: s.playerY + 28,
          vx: (Math.random() - 0.5) * 1.8,
          vy: Math.random() * 3 + 2,
          radius: Math.random() * 2.5 + 1.0,
          color: '#fb923c', // orange plasma
          alpha: 0.9,
          life: 14
        });
        s.particles.push({
          x: s.playerX + s.playerWidth - 2,
          y: s.playerY + 28,
          vx: (Math.random() - 0.5) * 1.8,
          vy: Math.random() * 3 + 2,
          radius: Math.random() * 2.5 + 1.0,
          color: '#facc15', // yellow fire
          alpha: 0.9,
          life: 14
        });
      }

      // 1. Draw Military Metal Shoulder Guards / Pauldrons (Desert camouflage style)
      ctx.fillStyle = '#3f6212'; // camo green
      ctx.strokeStyle = '#fbbf24'; // amber/gold safety trims
      ctx.lineWidth = 1.8;
      
      // Left Shoulder
      ctx.beginPath();
      ctx.roundRect(s.playerX - 10, s.playerY + 8, 12, 10, 2);
      ctx.fill();
      ctx.stroke();

      // Right Shoulder
      ctx.beginPath();
      ctx.roundRect(s.playerX + s.playerWidth - 2, s.playerY + 8, 12, 10, 2);
      ctx.fill();
      ctx.stroke();

      // 2. Heavy armored main steel torso body
      ctx.fillStyle = '#166534'; // darker forest green armor
      ctx.beginPath();
      ctx.moveTo(s.playerX - 3, s.playerY + 28);
      ctx.lineTo(s.playerX + s.playerWidth + 3, s.playerY + 28);
      ctx.lineTo(s.playerX + s.playerWidth + 8, s.playerY + 14);
      ctx.lineTo(s.playerX - 8, s.playerY + 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center glowing amber reactor core power cell
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(s.playerX + s.playerWidth / 2, s.playerY + 20, 5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Cyber Helmet with golden optics visor
      ctx.fillStyle = '#14532d'; // deep army green helmet
      ctx.beginPath();
      ctx.arc(s.playerX + s.playerWidth / 2, s.playerY + 2, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing gold tactical optical visor bar
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#fbbf24';
      ctx.fillRect(s.playerX + s.playerWidth / 2 - 5.5, s.playerY - 1, 11, 3);
      ctx.shadowBlur = 0; // reset

      // 4. Double barrel plasma assault rifle held over right arm pointing up
      ctx.strokeStyle = '#475569'; // steel gray barrel
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(s.playerX + s.playerWidth + 4, s.playerY + 14);
      ctx.lineTo(s.playerX + s.playerWidth + 18, s.playerY - 6);
      ctx.stroke();

      // Laser sighting pointer beam
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Red laser aiming
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.playerX + s.playerWidth + 18, s.playerY - 6);
      ctx.lineTo(s.playerX + s.playerWidth + 60, s.playerY - 24);
      ctx.stroke();

      // Plasma muzzle flash flare
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.playerX + s.playerWidth + 18, s.playerY - 6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else {
      // Base space ship representation
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#8bdc00';
      ctx.fillStyle = '#8bdc00';
      
      ctx.beginPath();
      ctx.moveTo(s.playerX + s.playerWidth / 2, s.playerY);
      ctx.lineTo(s.playerX, s.playerY + s.playerHeight);
      ctx.lineTo(s.playerX + s.playerWidth, s.playerY + s.playerHeight);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.playerX + s.playerWidth / 2, s.playerY + s.playerHeight - 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw active Subway Surfers Power-up indicators of magnetTicks, bootsTicks, jetpackTicks!
    if (game.id === 'cyber-racer') {
      let hudY = 16;
      const drawPowerBar = (label: string, icon: string, ticks: number, maxTicks: number, barColor: string) => {
        if (ticks > 0) {
          ctx.save();
          // Dark glass badge background
          ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(16, hudY, 136, 28, 5);
          ctx.fill();
          ctx.stroke();

          // Label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(icon + " " + label, 24, hudY + 12);

          // Value timer text
          ctx.fillStyle = barColor;
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'right';
          const secs = (ticks / 60).toFixed(1);
          ctx.fillText(secs + "s", 144, hudY + 12);

          // Gauge bar backgrounds
          ctx.fillStyle = '#18181b';
          ctx.fillRect(24, hudY + 18, 120, 4);

          // Filling power bar
          ctx.fillStyle = barColor;
          const fillWidth = 120 * (ticks / maxTicks);
          ctx.fillRect(24, hudY + 18, fillWidth, 4);

          ctx.restore();
          hudY += 34;
        }
      };

      drawPowerBar("COIN MAGNET", "⚡", s.magnetTicks || 0, 350, '#ef4444');
      drawPowerBar("SUPER BOOTS", "👟", s.bootsTicks || 0, 350, '#22c55e');
      drawPowerBar("JETPACK", "🚀", s.jetpackTicks || 0, 250, '#f13cf5');
    }

    // Side screen lanes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(10, s.height);
    ctx.moveTo(s.width - 10, 0); ctx.lineTo(s.width - 10, s.height);
    ctx.stroke();

    // Constant score survival increment (reduced slightly during jetpack to avoid score explosion)
    if (s.frameId % 10 === 0) {
      s.score += (s.jetpackTicks && s.jetpackTicks > 0) ? 2 : 1;
      setScore(s.score);
    }

    s.frameId = requestAnimationFrame(loop);
  };

  const isCyberRacer = game.id === 'cyber-racer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/94 backdrop-blur-2xl font-sans select-none">
      <div 
        ref={containerRef}
        className={`w-full ${isCyberRacer ? 'sm:max-w-[920px] max-w-full' : 'max-w-md'} bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,180,255,0.3)] flex flex-col relative transition-all duration-300`}
        style={isCyberRacer ? { height: '670px' } : { height: '620px' }}
      >
        {/* Arcade Header Bar */}
        <div className="px-5 py-4 border-b border-white/5 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed animate-pulse" />
            <h3 className="font-display font-bold text-sm tracking-widest text-[#00daf3] uppercase italic">
              {game.title} MINI-GAME
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-gray-400 hover:text-white transition-colors"
              title={soundEnabled ? "Tovushni o'chirish" : "Tovushni yoqish"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Console view screen */}
        <div className="flex-1 relative bg-[#060608] flex items-center justify-center select-none overflow-hidden">
          {gameState === 'intro' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-zinc-950/90 [background:radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
              {/* Retro Graphic Logo */}
              <div className="relative mb-6">
                <div className="absolute -inset-1 rounded-full bg-[#00daf3]/30 blur-md animate-pulse" />
                <div className="w-16 h-16 rounded-full border border-[#00daf3]/50 flex items-center justify-center bg-zinc-900/80">
                  <Play className="text-[#00daf3] translate-x-0.5 fill-current" size={28} />
                </div>
              </div>
              
              <h2 className="font-display text-2xl font-black italic text-glow-blue uppercase text-white mb-2 tracking-wider">
                {game.title}
              </h2>
              <span className="font-mono text-xs text-[#0dffc3] bg-[#0dffc3]/10 px-3 py-1 rounded-full border border-[#0dffc3]/20 mb-6 font-semibold">
                ARCADE METAVERSE CORE
              </span>

              <p className="font-sans text-xs text-on-surface-variant max-w-sm mb-8 leading-relaxed">
                {game.id === 'neon-strike' ? (
                  <>
                    Kibernetik jangchini boshqarish uchun <b className="text-white">Chap &amp; O'ng (A &amp; D)</b> tugmalaridan foydalaning. Avtomatlashtirilgan plazma qurolidan otilgan lazerlar bilan tushayotgan <b className="text-[#ff3b30]">virusli dronlarni</b> yo'q qiling va ball to'plang!
                  </>
                ) : game.id === 'cyber-racer' ? (
                  <>
                    Yuguruvchini boshqarish uchun <b className="text-white">Chap &amp; O'ng (A &amp; D)</b> tugmalarini bosing. To'siqlar ustidan sakrash uchun <b className="text-[#00daf3]">Tepaga (W)</b>, pastdan sirg'alib o'tish uchun <b className="text-[#f13cf5]">Pastga (S)</b> tugmasidan foydalaning. To'siqlardan qoching va kreditlarni yig'ing!
                  </>
                ) : (
                  <>
                    Kemani boshqarish uchun <b className="text-white">Chap &amp; O'ng tugmalardan</b> yoki <b className="text-white">A &amp; D keys</b> keyslaridan foydalaning. To'siqlardan qoching va neon quvvat nuqtalarini yig'ing!
                  </>
                )}
              </p>

              {/* Highscore label */}
              {highScore > 0 && (
                <div className="flex items-center gap-2 mb-8 bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
                  <Trophy className="text-amber-400" size={16} />
                  <span className="font-sans text-xs text-gray-400">ENG YUQORI NATIJA:</span>
                  <span className="font-mono text-[#8bdc00] font-bold">{highScore} OChKO</span>
                </div>
              )}

              <button 
                onClick={startGame}
                className="w-full max-w-xs group relative overflow-hidden bg-[#00daf3] hover:bg-[#00daf3]/90 text-on-primary py-3 rounded-xl font-display font-black tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <span>O'YINNI BOSHLASH</span>
                <Play size={16} className="fill-current" />
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="absolute top-4 left-4 z-10 flex items-center justify-between right-4 pointer-events-none">
              <div className="bg-black/60 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Zap className="text-[#00daf3] animate-pulse" size={14} />
                <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">SCORE:</span>
                <span className="font-mono text-white text-sm font-bold">{score}</span>
              </div>

              <div className="bg-black/60 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Trophy className="text-amber-400" size={14} />
                <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">BEST:</span>
                <span className="font-mono text-white text-sm font-bold">{Math.max(highScore, score)}</span>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-zinc-950/95">
              <div className="w-16 h-16 rounded-full border border-red-500/30 flex items-center justify-center bg-red-950/20 mb-4 animate-bounce">
                <Shield className="text-red-500" size={28} />
              </div>

              <h2 className="font-display text-4xl font-extrabold italic text-red-500 mb-1 tracking-wider uppercase">
                O'YIN TUGADI!
              </h2>
              <span className="font-mono text-xs text-gray-500 mb-6 uppercase">SYS_CORE_HALT_RECOVERY_MODE</span>

              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl w-full max-w-xs mb-8 space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">ERISHILGAN OChKO</span>
                  <span className="font-mono text-white font-extrabold text-base">{score}</span>
                </div>
                {score >= highScore && score > 0 && (
                  <div className="bg-amber-400/10 border border-amber-400/25 py-1 px-2 rounded-lg text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    🎉 YANGI REKORD REZULTAT!
                  </div>
                )}
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">TANGALAR (+COINS)</span>
                  <span className="font-mono text-[#9ffb00] font-bold">+{Math.floor(score / 10) + 5} GT</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">XP QUVVATI (+XP)</span>
                  <span className="font-mono text-[#00daf3] font-bold">+{Math.floor(score / 2) + 15} XP</span>
                </div>
              </div>

              <div className="flex gap-4 w-full max-w-xs">
                <button 
                  onClick={startGame}
                  className="flex-1 bg-white hover:bg-zinc-200 text-black py-3 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} />
                  <span>QAYTA O'YNASH</span>
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 py-3 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer"
                >
                  YOpish
                </button>
              </div>
            </div>
          )}

          {/* Active play canvas or Checkers Board */}
          {isCyberRacer && gameState === 'playing' ? (
            <CheckersGame 
              soundEnabled={soundEnabled} 
              onGameOver={(finalScore) => {
                stateRef.current.score = finalScore;
                setScore(finalScore);
                endGame();
              }} 
            />
          ) : (
            <canvas 
              ref={canvasRef} 
              className="w-full h-full block bg-zinc-950 max-w-full"
              style={{ imageRendering: 'pixelated' }}
            />
          )}

          {/* Touch buttons overlay for mobile players */}
          {gameState === 'playing' && !isCyberRacer && (
            <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-between px-8 pointer-events-auto sm:hidden">
              <button 
                onTouchStart={handleLeftTouch}
                onClick={handleLeftTouch}
                className="w-16 h-16 rounded-full bg-zinc-900/70 border border-white/10 active:bg-zinc-800 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all outline-none"
              >
                <span className="text-2xl font-bold">←</span>
              </button>
              <button 
                onTouchStart={handleRightTouch}
                onClick={handleRightTouch}
                className="w-16 h-16 rounded-full bg-zinc-900/70 border border-white/10 active:bg-zinc-800 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all outline-none"
              >
                <span className="text-2xl font-bold">→</span>
              </button>
            </div>
          )}
        </div>

        {/* Console footer detail rails */}
        <div className="px-5 py-3.5 bg-zinc-950 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Shield size={10} className="text-emerald-500" />
            <span>SYS_ONLINE: 100% SECURE</span>
          </div>
          <div>GLITCH ARCADE EMULATOR v2.4.0</div>
        </div>
      </div>
    </div>
  );
}
