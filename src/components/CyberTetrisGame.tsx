import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Award, Zap, Trophy, Flame, HelpCircle, AlertCircle, ArrowLeftRight, Minimize2, Cpu, Sparkles, LayoutGrid, Layers, Eye } from 'lucide-react';

interface CyberTetrisGameProps {
  soundEnabled: boolean;
  onGameOver: (score: number) => void;
}

// Color theme definitions for dynamic custom experience
const COLOR_THEMES = {
  cyberpunk: {
    name: 'Cyberpunk Glow',
    I: '#00faf3', // Neon Cyan
    O: '#facc15', // Neon Yellow
    T: '#a855f7', // Neon Purple
    S: '#10b981', // Neon Green
    Z: '#ef4444', // Neon Red
    J: '#3b82f6', // Neon Blue
    L: '#f97316', // Neon Orange
    BOMB: '#ff0055',
    bg: '#0a0a0d',
    gridLines: '#12121e'
  },
  tokyo: {
    name: 'Tokyo Sunset',
    I: '#ff007f', // Deep Hot Pink
    O: '#ffaa00', // Vibrant Gold
    T: '#8a2be2', // Royal BlueViolet
    S: '#00ff66', // Spring Green
    Z: '#ff3300', // Neon Orange-red
    J: '#00ffff', // Electric Cyan
    L: '#ff00ff', // Cyber Magenta
    BOMB: '#ff0537',
    bg: '#0c0512',
    gridLines: '#240a2b'
  },
  matrix: {
    name: 'Emerald Matrix',
    I: '#39ff14', // Neon Green
    O: '#00ff41', // Matrix Dark Green
    T: '#00fedc', // Bright Teal
    S: '#1e824c', // Forest Green
    Z: '#a2ded0', // Pale Emerald
    J: '#2ecc71', // Emerald Green
    L: '#27ae60', // Jade Green
    BOMB: '#ff0044',
    bg: '#030d04',
    gridLines: '#0a220c'
  },
  retroArcade: {
    name: 'Retro Arcade',
    I: '#e21b3c', // Cherry Red
    O: '#13d5f4', // Turquoise
    T: '#e69a23', // Amber Yellow
    S: '#1aab4a', // Retro Green
    Z: '#ff5722', // Intense Orange
    J: '#2196f3', // Classic Blue
    L: '#9c27b0', // Classic Purple
    BOMB: '#d30022',
    bg: '#0d0d0d',
    gridLines: '#202020'
  },
  liquidGold: {
    name: 'Liquid Gold',
    I: '#fff5cc', // Bright gold-white
    O: '#ffd700', // Pure gold
    T: '#e6c300', // Yellow metallic
    S: '#b39800', // Bronze gold
    Z: '#ffa500', // Deep Gold
    J: '#daa520', // Goldenrod
    L: '#cc9900', // Dark brass
    BOMB: '#ff0055',
    bg: '#141108',
    gridLines: '#2d2611'
  }
};

// Tetromino definitions
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1]
  ]
};

// Color shader helper for professional 3D block face shadows
function lightenColor(col: string, amt: number) {
  let usePound = false;
  if (col[0] === "#") {
    col = col.slice(1);
    usePound = true;
  }
  let num = parseInt(col, 16);
  if (isNaN(num)) return usePound ? "#" + col : col;
  
  let r = (num >> 16) + amt;
  if (r > 255) r = 255; else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) b = 255; else if (b < 0) b = 0;
  let g = (num & 0x0000FF) + amt;
  if (g > 255) g = 255; else if (g < 0) g = 0;
  
  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

function darkenColor(col: string, amt: number) {
  return lightenColor(col, -amt);
}

export default function CyberTetrisGame({ soundEnabled, onGameOver }: CyberTetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [score, setScore] = useState(0);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [level, setLevel] = useState(1);
  const [powerPoints, setPowerPoints] = useState(3);
  const [isGameActive, setIsGameActive] = useState(true);
  
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [timeLeftFreeze, setTimeLeftFreeze] = useState(0);
  const [bombQueued, setBombQueued] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Dynamic Theme & 3D/2D View selection
  const [themeName, setThemeName] = useState<keyof typeof COLOR_THEMES>('cyberpunk');
  const [viewMode, setViewMode] = useState<'2d' | 'middle' | '3d'>('middle');
  const [showVisualSettings, setShowVisualSettings] = useState(false);
  const [gameSpeedMode, setGameSpeedMode] = useState<'normal' | 'fast' | 'max'>('normal');

  // Double Click / Double Tap controller
  const lastKeyPressTime = useRef(0);
  const [lastDoubleTapMessage, setLastDoubleTapMessage] = useState(false);

  // Active color map helper matching theme state
  const getThemeColors = () => {
    return COLOR_THEMES[themeName];
  };

  // Abilities definition
  const abilities = [
    {
      id: 'laser',
      name: 'Lazer Tozalash',
      description: 'Eng qiyin pastki 2 qatorni butunlay kuydirib tashlaydi.',
      cost: 2,
      icon: '⚡',
      color: '#00faf3',
      hotkey: '1'
    },
    {
      id: 'bomb',
      name: 'Kiber Bomba',
      description: 'Tushgan joyida 3x3 radiandagi barcha bloklarni portlatib yuboruvchi bombaga aylantiradi.',
      cost: 3,
      icon: '💥',
      color: '#ff0055',
      hotkey: '2'
    },
    {
      id: 'freeze',
      name: 'Vaqtni Muzlatish',
      description: 'Zarbali vaqt muzlatadi (15s sekin harakat!)',
      cost: 1,
      icon: '❄️',
      color: '#3b82f6',
      hotkey: '3'
    },
    {
      id: 'nanite',
      name: 'Matrix Reorganizer',
      description: 'Bo\'sh qolgan o\'rinlarni tozalab unumdor mustahkam qorishma hosil qiladi.',
      cost: 4,
      icon: '🔄',
      color: '#10b981',
      hotkey: '4'
    }
  ];

  // Logic values stored inside refs so they are always current in animation frames
  const logicRef = useRef({
    grid: Array.from({ length: 20 }, () => Array(10).fill('')),
    currentPiece: null as { shape: number[][]; type: string; x: number; y: number; isBomb?: boolean } | null,
    nextPiece: null as { shape: number[][]; type: string } | null,
    score: 0,
    lines: 0,
    level: 1,
    powerPoints: 3,
    ticks: 0,
    gameOver: false,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string; alpha: number; life: number }>,
    flashRows: [] as number[],
    flashTimer: 0,
    lastAutoDrop: 0,
    timeFrozen: false,
    freezeEndTime: 0,
    nextIsBomb: false,
    theme: 'cyberpunk' as keyof typeof COLOR_THEMES,
    viewMode: 'middle' as '2d' | 'middle' | '3d',
    speedMode: 'normal' as 'normal' | 'fast' | 'max'
  });

  // Sync state parameters with logic loop instantly
  useEffect(() => {
    logicRef.current.theme = themeName;
  }, [themeName]);

  useEffect(() => {
    logicRef.current.viewMode = viewMode;
  }, [viewMode]);

  useEffect(() => {
    logicRef.current.speedMode = gameSpeedMode;
  }, [gameSpeedMode]);

  const playSynthBeep = (freq: number, dur: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };

  const playAbilitySound = (type: string) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'laser') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'bomb') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'freeze') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'nanite') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc1.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
        osc2.frequency.setValueAtTime(220, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.3);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.3);
        osc2.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  const getRandomPiece = () => {
    const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const type = types[Math.floor(Math.random() * types.length)];
    const shape = SHAPES[type as keyof typeof SHAPES];
    const isBomb = logicRef.current.nextIsBomb;
    
    if (isBomb) {
      logicRef.current.nextIsBomb = false;
      setBombQueued(false);
    }

    return {
      shape,
      type,
      x: Math.floor((10 - shape[0].length) / 2),
      y: 0,
      isBomb
    };
  };

  const createExplosion = (gridX: number, gridY: number, color: string, qty = 6) => {
    const lValue = logicRef.current;
    
    const pxX = gridX * 32 + 16;
    const pxY = gridY * 32 + 16;

    for (let i = 0; i < qty; i++) {
      lValue.particles.push({
        x: pxX,
        y: pxY,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        radius: Math.random() * 4 + 1.5,
        color: color,
        alpha: 1.0,
        life: 25 + Math.random() * 15
      });
    }
  };

  const handleUseAbility = (abilityType: string) => {
    if (!isGameActive || logicRef.current.gameOver) return;
    
    const lValue = logicRef.current;
    const currentCost = abilities.find(a => a.id === abilityType)?.cost || 0;

    if (lValue.powerPoints < currentCost) {
      playSynthBeep(180, 0.25, 'sawtooth');
      return;
    }

    lValue.powerPoints -= currentCost;
    setPowerPoints(lValue.powerPoints);
    playAbilitySound(abilityType);

    const activeColors = COLOR_THEMES[lValue.theme];

    if (abilityType === 'laser') {
      for (let r = 18; r < 20; r++) {
        for (let c = 0; c < 10; c++) {
          if (lValue.grid[r][c]) {
            createExplosion(c, r, (activeColors as any)[lValue.grid[r][c]] || '#00faf3', 12);
          }
        }
      }

      const newGrid = [...lValue.grid];
      newGrid.splice(18, 2);
      newGrid.unshift(Array(10).fill(''), Array(10).fill(''));
      lValue.grid = newGrid;

      lValue.score += 250;
      setScore(lValue.score);
    } 
    else if (abilityType === 'bomb') {
      if (lValue.currentPiece) {
        lValue.currentPiece.isBomb = true;
        playSynthBeep(480, 0.15, 'triangle');
      } else {
        lValue.nextIsBomb = true;
        setBombQueued(true);
      }
    } 
    else if (abilityType === 'freeze') {
      lValue.timeFrozen = true;
      lValue.freezeEndTime = Date.now() + 15000;
      setIsTimeFrozen(true);
      setTimeLeftFreeze(15);
    } 
    else if (abilityType === 'nanite') {
      let totalBlocksInField = 0;
      const blockColorTracker: string[] = [];
      
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 10; c++) {
          if (lValue.grid[r][c]) {
            totalBlocksInField++;
            blockColorTracker.push(lValue.grid[r][c]);
          }
        }
      }

      const emptyGrid = Array.from({ length: 20 }, () => Array(10).fill(''));
      
      let rowPointer = 19;
      let colPointer = 0;
      let placed = 0;

      while (placed < totalBlocksInField && rowPointer >= 0) {
        const shapeType = blockColorTracker[placed % blockColorTracker.length] || 'O';
        emptyGrid[rowPointer][colPointer] = shapeType;
        
        if (Math.random() < 0.25) {
          createExplosion(colPointer, rowPointer, '#10b981', 3);
        }

        colPointer++;
        if (colPointer >= 10) {
          colPointer = 0;
          rowPointer--;
        }
        placed++;
      }

      lValue.grid = emptyGrid;
      playSynthBeep(600, 0.45, 'sine');
    }
  };

  const checkCollision = (piece: { shape: number[][]; x: number; y: number }, ox = 0, oy = 0, customShape?: number[][]) => {
    const lValue = logicRef.current;
    const shapeToUse = customShape || piece.shape;
    
    for (let r = 0; r < shapeToUse.length; r++) {
      for (let c = 0; c < shapeToUse[r].length; c++) {
        if (shapeToUse[r][c]) {
          const nextGridX = piece.x + c + ox;
          const nextGridY = piece.y + r + oy;

          if (nextGridX < 0 || nextGridX >= 10 || nextGridY >= 20) {
            return true;
          }

          if (nextGridY >= 0 && lValue.grid[nextGridY][nextGridX]) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const lockPiece = () => {
    const lValue = logicRef.current;
    if (!lValue.currentPiece) return;

    const { shape, type, x, y, isBomb } = lValue.currentPiece;
    const activeColors = COLOR_THEMES[lValue.theme];

    if (isBomb) {
      const blastCX = x + Math.floor(shape[0].length / 2);
      const blastCY = y + Math.floor(shape.length / 2);

      playAbilitySound('bomb');

      for (let r = blastCY - 2; r <= blastCY + 2; r++) {
        for (let c = blastCX - 2; c <= blastCX + 2; c++) {
          if (r >= 0 && r < 20 && c >= 0 && c < 10) {
            if (lValue.grid[r][c]) {
              createExplosion(c, r, '#fb7185', 12);
              lValue.grid[r][c] = '';
            }
          }
        }
      }
      
      createExplosion(blastCX, blastCY, activeColors.BOMB, 30);
      lValue.score += 150;
      setScore(lValue.score);
    } 
    else {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const gridY = y + r;
            const gridX = x + c;
            
            if (gridY >= 0) {
              lValue.grid[gridY][gridX] = type;
              createExplosion(gridX, gridY, (activeColors as any)[type], 3);
            }
          }
        }
      }
      playSynthBeep(220, 0.05, 'triangle');
    }

    checkAndClearRows();

    lValue.currentPiece = {
      shape: lValue.nextPiece!.shape,
      type: lValue.nextPiece!.type,
      x: Math.floor((10 - lValue.nextPiece!.shape[0].length) / 2),
      y: 0,
      isBomb: lValue.nextIsBomb
    };

    if (lValue.nextIsBomb) {
      lValue.nextIsBomb = false;
      setBombQueued(false);
    }

    lValue.nextPiece = getRandomPiece();

    if (checkCollision(lValue.currentPiece)) {
      lValue.gameOver = true;
      setIsGameActive(false);
      onGameOver(lValue.score);
      playSynthBeep(120, 0.8, 'sawtooth');
    }
  };

  const checkAndClearRows = () => {
    const lValue = logicRef.current;
    let rowsToClear: number[] = [];

    for (let r = 19; r >= 0; r--) {
      if (lValue.grid[r].every(cell => cell !== '')) {
        rowsToClear.push(r);
      }
    }

    if (rowsToClear.length > 0) {
      lValue.flashRows = rowsToClear;
      lValue.flashTimer = 10;
      
      const baseScores = [0, 100, 300, 600, 1000];
      const earned = baseScores[Math.min(rowsToClear.length, 4)] * lValue.level;
      
      lValue.score += earned;
      lValue.lines += rowsToClear.length;
      
      const earnedPP = rowsToClear.length === 4 ? 5 : rowsToClear.length;
      lValue.powerPoints = Math.min(10, lValue.powerPoints + earnedPP);

      setScore(lValue.score);
      setPowerPoints(lValue.powerPoints);
      setLinesClearedTotal(lValue.lines);

      const nextLevel = Math.floor(lValue.lines / 10) + 1;
      if (nextLevel > lValue.level) {
        lValue.level = nextLevel;
        setLevel(nextLevel);
        playSynthBeep(880, 0.35, 'square');
      } else {
        playSynthBeep(520, 0.2, 'triangle');
      }

      rowsToClear.forEach(r => {
        for (let c = 0; c < 10; c++) {
          createExplosion(c, r, '#ffffff', 5);
        }
      });
    }
  };

  const rotatePiece = () => {
    const lValue = logicRef.current;
    if (!lValue.currentPiece || lValue.gameOver) return;

    const { shape, x, y } = lValue.currentPiece;
    const rCount = shape.length;
    const cCount = shape[0].length;

    const newShape = Array.from({ length: cCount }, () => Array(rCount).fill(0));
    for (let r = 0; r < rCount; r++) {
      for (let c = 0; c < cCount; c++) {
        newShape[c][rCount - 1 - r] = shape[r][c];
      }
    }

    const nextPieceState = { ...lValue.currentPiece, shape: newShape };

    const kicks = [0, -1, 1, -2, 2];
    for (let i = 0; i < kicks.length; i++) {
      const shiftX = kicks[i];
      nextPieceState.x = x + shiftX;
      
      if (!checkCollision(nextPieceState)) {
        lValue.currentPiece = nextPieceState;
        playSynthBeep(330, 0.04, 'triangle');
        return;
      }
    }
  };

  const moveHorizontally = (dir: number) => {
    const lValue = logicRef.current;
    if (!lValue.currentPiece || lValue.gameOver) return;

    if (!checkCollision(lValue.currentPiece, dir, 0)) {
      lValue.currentPiece.x += dir;
      playSynthBeep(260, 0.03, 'sine');
    }
  };

  const softDrop = () => {
    const lValue = logicRef.current;
    if (!lValue.currentPiece || lValue.gameOver) return;

    if (!checkCollision(lValue.currentPiece, 0, 1)) {
      lValue.currentPiece.y += 1;
      lValue.score += 1;
      setScore(lValue.score);
    } else {
      lockPiece();
    }
  };

  const hardDrop = () => {
    const lValue = logicRef.current;
    if (!lValue.currentPiece || lValue.gameOver) return;

    let dropDist = 0;
    while (!checkCollision(lValue.currentPiece, 0, dropDist + 1)) {
      dropDist++;
    }

    lValue.currentPiece.y += dropDist;
    lValue.score += dropDist * 2;
    setScore(lValue.score);
    
    for (let c = 0; c < lValue.currentPiece.shape[0].length; c++) {
      createExplosion(lValue.currentPiece.x + c, lValue.currentPiece.y + lValue.currentPiece.shape.length - 1, '#ffffff', 4);
    }

    playSynthBeep(180, 0.1, 'sawtooth');
    lockPiece();
  };

  // Helper object to draw beautiful 3D / Isometric perspective style block
  const drawSingleBlock = (
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    size: number,
    color: string,
    mode: '2d' | 'middle' | '3d',
    isBomb = false
  ) => {
    if (mode === '2d') {
      ctx.fillStyle = color;
      ctx.fillRect(bx + 1, by + 1, size - 2, size - 2);

      // Glass style shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(bx + 2, by + 2, size - 4, 3.5);
      ctx.fillRect(bx + 2, by + 2, 3.5, size - 4);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(bx + 1, by + 1, size - 2, size - 2);
    } 
    else {
      // Shaded isometric side extrusion depth
      const depth = mode === 'middle' ? 6 : 11;
      
      // Calculate shaded color values
      const colorTop = lightenColor(color, 45);
      const colorRight = darkenColor(color, 40);

      // Render bottom base block shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(bx + 2, by + depth + 2, size - depth, size - depth);

      // 1. Right extruded wall face
      ctx.fillStyle = colorRight;
      ctx.beginPath();
      ctx.moveTo(bx + size - depth, by + depth);
      ctx.lineTo(bx + size, by);
      ctx.lineTo(bx + size, by + size - depth);
      ctx.lineTo(bx + size - depth, by + size);
      ctx.closePath();
      ctx.fill();

      // 2. Top extruded cap face
      ctx.fillStyle = colorTop;
      ctx.beginPath();
      ctx.moveTo(bx, by + depth);
      ctx.lineTo(bx + depth, by);
      ctx.lineTo(bx + size, by);
      ctx.lineTo(bx + size - depth, by + depth);
      ctx.closePath();
      ctx.fill();

      // 3. True Front Flat Face
      ctx.fillStyle = color;
      ctx.fillRect(bx, by + depth, size - depth, size - depth);

      // Light glossy edge lines
      ctx.strokeStyle = 'rgba(255,255,255,0.42)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx, by + depth);
      ctx.lineTo(bx + depth, by);
      ctx.lineTo(bx + size, by);
      ctx.stroke();

      // Shadow border
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.moveTo(bx + size - depth, by + depth);
      ctx.lineTo(bx + size - depth, by + size);
      ctx.stroke();

      if (isBomb) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("☠", bx + (size - depth)/2 + 1, by + depth + (size - depth)/2 + 4);
      }
    }
  };

  useEffect(() => {
    const lValue = logicRef.current;
    
    lValue.grid = Array.from({ length: 20 }, () => Array(10).fill(''));
    lValue.gameOver = false;
    lValue.score = 0;
    lValue.lines = 0;
    lValue.level = 1;
    lValue.powerPoints = 3;
    lValue.particles = [];
    lValue.currentPiece = null;
    lValue.nextIsBomb = false;
    lValue.timeFrozen = false;
    
    setScore(0);
    setLevel(1);
    setLinesClearedTotal(0);
    setPowerPoints(3);
    setIsGameActive(true);
    setIsTimeFrozen(false);
    setBombQueued(false);

    lValue.currentPiece = getRandomPiece();
    lValue.nextPiece = getRandomPiece();

    // Universal Double-tap drop mechanism on any keyboard key sequence
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lValue.gameOver) return;

      const keyLower = e.key.toLowerCase();
      
      // Measure double-tap interval
      const now = Date.now();
      const delay = now - lastKeyPressTime.current;
      
      // Universal Double-tap drop mechanism ONLY on 'S' or 'ArrowDown' key sequence
      const isDownKey = ['arrowdown', 's'].includes(keyLower);
      if (delay < 280 && isDownKey) {
        lastKeyPressTime.current = 0;
        hardDrop();
        setLastDoubleTapMessage(true);
        setTimeout(() => setLastDoubleTapMessage(false), 1400);
        return;
      }
      lastKeyPressTime.current = now;

      // Single presses
      if (keyLower === 'arrowleft' || keyLower === 'a') {
        moveHorizontally(-1);
      } else if (keyLower === 'arrowright' || keyLower === 'd') {
        moveHorizontally(1);
      } else if (keyLower === 'arrowup' || keyLower === 'w') {
        rotatePiece();
      } else if (keyLower === 'arrowdown' || keyLower === 's') {
        softDrop();
      } else if (e.key === ' ') {
        hardDrop();
      } 
      else if (e.key === '1') {
        handleUseAbility('laser');
      } else if (e.key === '2') {
        handleUseAbility('bomb');
      } else if (e.key === '3') {
        handleUseAbility('freeze');
      } else if (e.key === '4') {
        handleUseAbility('nanite');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    let frameId = 0;
    const gameTick = (timestamp: number) => {
      const canvas = canvasRef.current;
      const nextCanvas = nextCanvasRef.current;
      if (!canvas || lValue.gameOver) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentTheme = COLOR_THEMES[lValue.theme];

      if (lValue.timeFrozen) {
        const freezeLeft = Math.max(0, Math.ceil((lValue.freezeEndTime - Date.now()) / 1000));
        setTimeLeftFreeze(freezeLeft);
        if (freezeLeft === 0) {
          lValue.timeFrozen = false;
          setIsTimeFrozen(false);
        }
      }

      let speedMultiplier = 1.0;
      if (lValue.speedMode === 'fast') {
        speedMultiplier = 0.55;
      } else if (lValue.speedMode === 'max') {
        speedMultiplier = 0.28;
      }
      const baseDropInterval = Math.max(60, Math.floor((850 - (lValue.level - 1) * 90) * speedMultiplier));
      const activeDropInterval = lValue.timeFrozen ? 5000 : baseDropInterval;

      const now = Date.now();
      if (now - lValue.lastAutoDrop > activeDropInterval) {
        if (!lValue.flashRows.length) {
          softDrop();
        }
        lValue.lastAutoDrop = now;
      }

      // Draw dynamic backdrop base matching theme
      ctx.fillStyle = currentTheme.bg;
      ctx.fillRect(0, 0, 320, 640);

      // Aesthetic neon grid scanlines
      ctx.strokeStyle = currentTheme.gridLines;
      ctx.lineWidth = 1;
      
      // Let's create subtle perspective grid lines if grid view mode is fully oblique
      for (let r = 0; r < 20; r++) {
        ctx.beginPath();
        if (lValue.viewMode === '3d') {
          // Curved 3D perspective lines
          ctx.moveTo(0, r * 32);
          ctx.bezierCurveTo(80, r * 32 + 5, 240, r * 32 + 5, 320, r * 32);
        } else {
          ctx.moveTo(0, r * 32);
          ctx.lineTo(320, r * 32);
        }
        ctx.stroke();
      }
      for (let c = 0; c < 10; c++) {
        ctx.beginPath();
        if (lValue.viewMode === '3d') {
          ctx.moveTo(c * 32, 0);
          ctx.lineTo(c * 32 + (c - 5) * 2.5, 640);
        } else {
          ctx.moveTo(c * 32, 0);
          ctx.lineTo(c * 32, 640);
        }
        ctx.stroke();
      }

      // Handle Line cleared flashing animation
      if (lValue.flashTimer > 0) {
        lValue.flashTimer--;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        lValue.flashRows.forEach((r) => {
          ctx.fillRect(2, r * 32 + 2, 316, 28);
        });

        if (lValue.flashTimer === 0) {
          const activeRows = lValue.flashRows.sort((a,b) => a-b);
          activeRows.forEach((r) => {
            lValue.grid.splice(r, 1);
            lValue.grid.unshift(Array(10).fill(''));
          });
          lValue.flashRows = [];
        }
      }

      // PREVIEW PROJECTION: Ghost Shadow
      if (lValue.currentPiece && !lValue.flashRows.length) {
        const ghostPiece = { ...lValue.currentPiece };
        let ghostYOffset = 0;

        while (!checkCollision(ghostPiece, 0, ghostYOffset + 1)) {
          ghostYOffset++;
        }

        ctx.save();
        ctx.strokeStyle = ghostPiece.isBomb ? 'rgba(255, 0, 85, 0.42)' : 'rgba(255,255,255,0.22)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;

        for (let r = 0; r < ghostPiece.shape.length; r++) {
          for (let c = 0; c < ghostPiece.shape[r].length; c++) {
            if (ghostPiece.shape[r][c]) {
              const drawG_X = (ghostPiece.x + c) * 32;
              const drawG_Y = (ghostPiece.y + r + ghostYOffset) * 32;
              if (drawG_Y >= 0) {
                ctx.strokeRect(drawG_X + 2, drawG_Y + 2, 28, 28);
              }
            }
          }
        }
        ctx.restore();
      }

      // Drawing LOCKED blocks
      for (let r = 0; r < 20; r++) {
        for (let c = 0; c < 10; c++) {
          const blockType = lValue.grid[r][c];
          if (blockType) {
            const hexColor = (currentTheme as any)[blockType] || '#fff';
            drawSingleBlock(ctx, c * 32, r * 32, 32, hexColor, lValue.viewMode);
          }
        }
      }

      // Drawing ACTIVE falling block
      if (lValue.currentPiece && !lValue.flashRows.length) {
        const { shape, type, x, y, isBomb } = lValue.currentPiece;
        const mainColor = isBomb ? currentTheme.BOMB : (currentTheme as any)[type];

        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              const drawX = (x + c) * 32;
              const drawY = (y + r) * 32;

              if (drawY >= 0) {
                ctx.save();
                if (isBomb) {
                  const isFlash = Math.sin(Date.now() / 65) > 0;
                  const bombCol = isFlash ? currentTheme.BOMB : '#270814';
                  drawSingleBlock(ctx, drawX, drawY, 32, bombCol, lValue.viewMode, true);
                } else {
                  drawSingleBlock(ctx, drawX, drawY, 32, mainColor, lValue.viewMode);
                }
                ctx.restore();
              }
            }
          }
        }
      }

      // Spark particles logic
      lValue.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life--;
        p.alpha = Math.max(0, p.life / 40);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      lValue.particles = lValue.particles.filter(p => p.life > 0);

      // Ice Glow frost border during Time Freeze
      if (lValue.timeFrozen) {
        ctx.strokeStyle = 'rgba(59, 130, 246, ' + (0.4 + Math.sin(Date.now() / 150) * 0.25) + ')';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 316, 636);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
        ctx.fillRect(2, 2, 316, 636);
      }

      // Next piece canvas updates
      if (nextCanvas && lValue.nextPiece) {
        const nextCtx = nextCanvas.getContext('2d');
        if (nextCtx) {
          nextCtx.fillStyle = '#060608';
          nextCtx.fillRect(0, 0, 96, 96);

          nextCtx.strokeStyle = currentTheme.gridLines;
          nextCtx.strokeRect(1, 1, 94, 94);

          const { shape: nShape, type: nType } = lValue.nextPiece;
          const pieceColor = lValue.nextIsBomb ? currentTheme.BOMB : (currentTheme as any)[nType];

          const cellSize = 18;
          const startX = (96 - nShape[0].length * cellSize) / 2;
          const startY = (96 - nShape.length * cellSize) / 2;

          for (let r = 0; r < nShape.length; r++) {
            for (let c = 0; c < nShape[r].length; c++) {
              if (nShape[r][c]) {
                nextCtx.fillStyle = pieceColor;
                nextCtx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize - 1, cellSize - 1);
                
                nextCtx.fillStyle = 'rgba(255,255,255,0.45)';
                nextCtx.fillRect(startX + c * cellSize + 1, startY + r * cellSize + 1, cellSize - 2, 1.5);
                nextCtx.fillRect(startX + c * cellSize + 1, startY + r * cellSize + 1, 1.5, cellSize - 2);

                if (lValue.nextIsBomb) {
                  nextCtx.fillStyle = '#ffffff';
                  nextCtx.font = 'bold 8px sans-serif';
                  nextCtx.textAlign = 'center';
                  nextCtx.fillText("☠", startX + c * cellSize + 9, startY + r * cellSize + 11);
                }
              }
            }
          }
        }
      }

      frameId = requestAnimationFrame(gameTick);
    };

    frameId = requestAnimationFrame(gameTick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Helper trigger for mobile click double tap to perform rapid drop ONLY on 'Down' controls
  const handleTouchAction = (action: () => void, isDown = false) => {
    const now = Date.now();
    const delay = now - lastKeyPressTime.current;
    
    if (isDown && delay < 280) {
      lastKeyPressTime.current = 0;
      hardDrop();
      setLastDoubleTapMessage(true);
      setTimeout(() => setLastDoubleTapMessage(false), 1400);
      return;
    }
    lastKeyPressTime.current = now;
    action();
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-5 p-2 select-none" style={{ minHeight: '560px' }}>
      
      {/* COLUMN 1: INTERACTIVE THEME & CAMERA PERSPECTIVES DASHBOARD (Desktop only) */}
      <div className="hidden xl:flex w-full xl:w-[220px] bg-zinc-950/80 border border-white/5 rounded-xl p-3.5 space-y-4 flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-3 border-b border-white/5 pb-2">
            <Layers className="text-[#0dffc3]" size={15} />
            <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase">VIZUAL PARAMETRLAR</h3>
          </div>

          {/* Perspective 3D Modes */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono text-gray-400 block tracking-widest uppercase">SAHNA KO'RINISHI:</span>
            <div className="flex flex-col gap-1.5">
              <button 
                onClick={() => setViewMode('2d')}
                className={`py-2 px-3 rounded-lg text-left text-xs font-mono transition-all flex items-center justify-between ${
                  viewMode === '2d' 
                    ? 'bg-[#0dffc3]/20 border border-[#0dffc3] text-[#0dffc3]' 
                    : 'bg-zinc-900 border border-transparent text-gray-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                <span>2D Classic Flat</span>
                {viewMode === '2d' && <Sparkles size={11} className="animate-spin" />}
              </button>

              <button 
                onClick={() => setViewMode('middle')}
                className={`py-2 px-3 rounded-lg text-left text-xs font-mono transition-all flex items-center justify-between ${
                  viewMode === 'middle' 
                    ? 'bg-[#a855f7]/20 border border-[#a855f7] text-[#a855f7]' 
                    : 'bg-zinc-900 border border-transparent text-gray-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                <span>Silliq 3D Perspektiva</span>
                {viewMode === 'middle' && <Sparkles size={11} className="animate-pulse" />}
              </button>

              <button 
                onClick={() => setViewMode('3d')}
                className={`py-2 px-3 rounded-lg text-left text-xs font-mono transition-all flex items-center justify-between ${
                  viewMode === '3d' 
                    ? 'bg-amber-500/20 border border-amber-500 text-amber-500' 
                    : 'bg-zinc-900 border border-transparent text-gray-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                <span>Egri 3D Isometriya</span>
                {viewMode === '3d' && <Sparkles size={11} className="animate-bounce" />}
              </button>
            </div>
          </div>

          {/* O'yin Tezligi / Game Speed selection */}
          <div className="space-y-2.5 mt-5">
            <span className="text-[10px] font-mono text-gray-400 block tracking-widest uppercase">O'YIN TEZLIGI:</span>
            <div className="grid grid-cols-3 gap-1 bg-zinc-900 border border-white/5 p-1 rounded-lg">
              <button
                onClick={() => setGameSpeedMode('normal')}
                className={`py-1 text-[10px] font-mono font-bold rounded transition-all ${
                  gameSpeedMode === 'normal'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setGameSpeedMode('fast')}
                className={`py-1 text-[10px] font-mono font-bold rounded transition-all ${
                  gameSpeedMode === 'fast'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Tez
              </button>
              <button
                onClick={() => setGameSpeedMode('max')}
                className={`py-1 text-[10px] font-mono font-bold rounded transition-all ${
                  gameSpeedMode === 'max'
                    ? 'bg-red-500/25 text-red-500 border border-red-500/30 font-black animate-pulse'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                MAX⚡
              </button>
            </div>
          </div>

          {/* Ranglar / Colors Theme Preset map */}
          <div className="space-y-2.5 mt-5">
            <span className="text-[10px] font-mono text-gray-400 block tracking-widest uppercase">BLOK RANGLARI MAVZUSI:</span>
            <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {Object.keys(COLOR_THEMES).map((kVal) => {
                const configItem = COLOR_THEMES[kVal as keyof typeof COLOR_THEMES];
                const active = themeName === kVal;
                return (
                  <button
                    key={kVal}
                    onClick={() => setThemeName(kVal as any)}
                    className={`py-2 px-2.5 rounded-lg text-left text-[11px] font-mono transition-all flex items-center justify-between ${
                      active 
                        ? 'bg-zinc-800 text-white border border-teal-500' 
                        : 'bg-zinc-900/55 text-gray-400 border border-transparent hover:text-white hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: configItem.I }} />
                      <span className="truncate">{configItem.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Double click notifier rule block */}
        <div className="bg-zinc-900/40 p-2.5 rounded-lg border border-purple-500/10 space-y-1">
          <div className="flex items-center gap-1">
            <Sparkles size={12} className="text-purple-400 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-gray-300">AQLLI TEZ DROPLASH</span>
          </div>
          <p className="text-[9px] text-gray-400 font-sans leading-tight">
            Pastga tushirish (<b className="text-white">S</b> yoki <b className="text-white">▼ DOWN</b>) tugmasini ketma-ket <b className="text-[#0dffc3]">2 marta</b> bossangiz, blok tezda butunlay pastga tushadi! Boshqa tugmalar odatdagidek ishlaydi.
          </p>
        </div>
      </div>

      {/* COLUMN 2: PRIMARY ARCADE BOARD DISPLAY */}
      <div className="flex-grow flex flex-col items-center justify-center bg-black/60 rounded-xl p-2 md:p-3 relative border border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        
        {/* Dynamic header stats row */}
        <div className="w-full max-w-[325px] flex justify-between items-center mb-1.5 px-0.5 gap-1.5">
          <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg">
            <Flame className="text-secondary-fixed animate-pulse" size={12} />
            <span className="text-[10px] font-mono text-gray-400">LVL:</span>
            <span className="text-xs font-mono font-bold text-white">{level}</span>
          </div>

          <button 
            onClick={() => setShowVisualSettings(true)}
            className="xl:hidden flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-white/10 px-2 py-1 rounded-lg text-[9px] font-mono text-[#0dffc3] font-bold active:scale-95 transition-all"
            title="Sozlamalar"
          >
            <Cpu className="text-purple-400 animate-spin" size={10} style={{ animationDuration: '6s' }} />
            <span>SOZLAMALAR ⚙️</span>
          </button>

          <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg">
            <Cpu className="text-purple-400" size={11} />
            <span className="text-[10px] font-mono text-gray-400">QATOR:</span>
            <span className="text-xs font-mono font-bold text-white">{linesClearedTotal}</span>
          </div>
        </div>

        {/* Primary Screen Canvas Frame styling safely optimized to a crisp 1:2 aspect ratio */}
        <div className="relative border-4 border-zinc-800 rounded-xl overflow-hidden shadow-[0_0_24px_rgba(168,85,247,0.25)] bg-black w-[190px] h-[380px] xs:w-[220px] xs:h-[440px] sm:w-[245px] sm:h-[490px] md:w-[260px] md:h-[520px] flex items-center justify-center transition-all duration-300">
          <canvas 
            id="tetrisCanvas"
            ref={canvasRef} 
            width={320}
            height={640}
            className="w-full h-full block bg-zinc-950"
          />

          {/* Rapid drop notification highlight bubble */}
          {lastDoubleTapMessage && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-white font-mono text-[10px] sm:text-xs font-bold py-1 px-3 rounded-full shadow-2xl animate-bounce flex items-center gap-1 z-25 border border-purple-400">
              <Zap size={11} className="animate-spin" />
              <span>SUPER TEZ DROP!</span>
            </div>
          )}

          {/* Time Freeze Active Indicator banner overlay */}
          {isTimeFrozen && (
            <div className="absolute top-2.5 left-2.5 right-2.5 bg-blue-500/90 text-white font-mono text-[9px] font-bold py-1 px-2.5 rounded flex items-center justify-between border border-blue-400/50 shadow-lg animate-pulse z-20">
              <span>❄️ VQ_MUZLAGAN</span>
              <span className="text-xs bg-black/35 px-1.5 rounded leading-none py-0.5">{timeLeftFreeze}s</span>
            </div>
          )}

          {/* Bomb Piece Queued Notification Overlay */}
          {bombQueued && (
            <div className="absolute top-10 left-2.5 right-2.5 bg-red-500/90 text-white font-mono text-[9px] font-bold py-1 px-2.5 rounded flex items-center justify-between border border-red-400/50 shadow-lg animate-bounce z-20">
              <span>💥 KIBER BOMB NAVBATI...</span>
              <span className="text-[10px] animate-pulse">☠</span>
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 3: ABILITIES & TOUCHPAD STAT PANEL */}
      <div className="w-full xl:w-[350px] flex flex-col justify-between bg-zinc-950/80 rounded-xl p-3 md:p-4 border border-white/5 xl:min-h-[530px]">
        
        {/* UPPER BOX: CORES RESERVE & PREVIEW */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-white/5">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block leading-tight uppercase">Yadro quvvati:</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-mono font-black text-[#0dffc3] tracking-widest text-glow-teal">{powerPoints}</span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">/10 YADRO</span>
              </div>
            </div>
            
            {/* NEXT PIECE BOX */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">KEYINGI:</span>
              <div className="w-14 h-14 bg-zinc-950 border border-white/5 rounded-lg overflow-hidden flex items-center justify-center p-0.5 shadow-inner">
                <canvas 
                  ref={nextCanvasRef}
                  width={96}
                  height={96}
                  className="w-11 h-11 block rounded" 
                />
              </div>
            </div>
          </div>

          {/* POWERS AND IMPULSES MAP - DESKTOP ONLY */}
          <div className="space-y-2 hidden xl:block">
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block font-bold">
              MAXSUS IMKONIYATLAR / ABILITIES:
            </span>

            <div className="grid grid-cols-1 gap-1.5 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
              {abilities.map((ab) => {
                const canAfford = powerPoints >= ab.cost;
                return (
                  <button
                    key={ab.id}
                    onClick={() => handleUseAbility(ab.id)}
                    disabled={!canAfford}
                    className={`text-left p-2.5 rounded-xl border transition-all text-xs relative flex items-center gap-3 cursor-pointer ${
                      canAfford 
                        ? 'bg-zinc-900 border-purple-500/20 hover:border-purple-500/50 hover:bg-zinc-850 shadow-md active:scale-98' 
                        : 'bg-zinc-950/50 border-white/5 opacity-55 saturate-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-lg bg-zinc-950 shadow-md flex-shrink-0" style={canAfford ? { borderColor: ab.color, color: ab.color, textShadow: `0 0 8px ${ab.color}40` } : {}}>
                      {ab.icon}
                    </div>

                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans font-bold text-white text-[11px] leading-none mb-0.5 block truncate">{ab.name}</span>
                        {canAfford && <span className="text-[7.5px] font-mono px-1 py-0.5 bg-purple-500/20 text-purple-300 rounded leading-none font-black uppercase">READY</span>}
                      </div>
                      <span className="text-[9.5px] text-zinc-400 font-sans block leading-snug">
                        {ab.description}
                      </span>
                    </div>

                    {/* Cost Badge */}
                    <div className="absolute right-2 top-2.5 flex flex-col items-end gap-1 font-mono">
                      <span className="text-[8px] bg-zinc-950 border border-[#0dffc3]/20 text-[#0dffc3] px-1 py-0.5 rounded leading-none font-black">
                        -{ab.cost} Core
                      </span>
                      <span className="text-[7.5px] text-zinc-500 uppercase">KEY: [{ab.hotkey}]</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <span className="text-[7.5px] font-mono text-zinc-500 block leading-tight">
              * Line tozalaganda yoki Tetris (4-talik qator) urganda yadro quvvati sezilarli yuklanadi!
            </span>
          </div>

          {/* COMPACT SKILL BUTTONS FOR MOBILE/TABLET SCREENS */}
          <div className="space-y-1.5 xl:hidden">
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block font-bold text-center">
              MAXSUS IMKONIYATLAR / SPELLS:
            </span>
            <div className="grid grid-cols-4 gap-2 bg-zinc-900/45 p-1.5 rounded-xl border border-white/5">
              {abilities.map((ab) => {
                const canAfford = powerPoints >= ab.cost;
                return (
                  <button
                    key={ab.id}
                    onClick={() => handleUseAbility(ab.id)}
                    disabled={!canAfford}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all relative ${
                      canAfford 
                        ? 'bg-zinc-900 border-purple-500/20 hover:border-purple-500/50 hover:bg-zinc-850 active:scale-95' 
                        : 'bg-zinc-950 border-transparent opacity-40'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-lg bg-zinc-950 shadow-md relative" 
                      style={canAfford ? { borderColor: ab.color, color: ab.color, textShadow: `0 0 6px ${ab.color}40` } : {}}
                    >
                      {ab.icon}
                      <span className="absolute -bottom-1 -right-1 bg-black text-[#0dffc3] border border-[#0dffc3]/20 text-[7px] font-mono px-1 rounded-full leading-none py-0.5 font-black">
                        {ab.cost}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-gray-300 font-bold truncate max-w-[64px] mt-1">
                      {ab.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM BOX: MOBILE KEYBOARD TOUCH CONTROLS */}
        <div className="border-t border-white/5 pt-3">
          <div className="flex flex-col gap-1.5">
            <div className="text-[8.5px] font-mono text-zinc-600 uppercase flex justify-between px-1">
              <span>Boshqarish datchiklari:</span>
              <span className="hidden sm:inline">A/D/S/W / Arrow Keys / Space</span>
            </div>

            {/* Compact visual touch pad row with double click binding */}
            <div className="grid grid-cols-5 gap-1.5 select-none touch-auto">
              <button 
                onClick={() => handleTouchAction(() => moveHorizontally(-1), false)}
                className="py-3 bg-zinc-900 hover:bg-zinc-850 border border-white/5 rounded-lg text-white font-black text-xs active:scale-90 font-mono"
                title="L-Direction"
              >
                ◀ LEFT
              </button>
              <button 
                onClick={() => handleTouchAction(rotatePiece, false)}
                className="py-3 bg-zinc-900 hover:bg-zinc-850 border border-white/5 rounded-lg text-white font-black text-xs active:scale-90 font-mono"
                title="Rotate Shape"
              >
                🔄 ROT
              </button>
              <button 
                onClick={() => handleTouchAction(softDrop, true)}
                className="py-3 bg-zinc-900 hover:bg-zinc-850 border border-white/5 rounded-lg text-white font-black text-xs active:scale-90 font-mono"
                title="Speed Down"
              >
                ▼ DOWN
              </button>
              <button 
                onClick={() => handleTouchAction(() => moveHorizontally(1), false)}
                className="py-3 bg-zinc-900 hover:bg-zinc-850 border border-white/5 rounded-lg text-white font-black text-xs active:scale-90 font-mono"
                title="R-Direction"
              >
                RIGHT ▶
              </button>
              <button 
                onClick={hardDrop}
                className="py-3 bg-secondary-fixed/15 hover:bg-secondary-fixed/25 border border-secondary-fixed/30 text-secondary-fixed rounded-lg font-black text-[9px] active:scale-90 font-mono leading-none flex flex-col items-center justify-center"
                title="Landing Drop"
              >
                ⚡ DROP
                <span className="text-[7px] text-zinc-500 leading-none block uppercase">[SPACE]</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MOBILE SETTINGS MODAL OVERLAY */}
      {showVisualSettings && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-3">
          <div className="w-full max-w-[290px] bg-zinc-950 border border-white/10 rounded-2xl p-4 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowVisualSettings(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-md font-mono font-bold w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full"
            >
              ✕
            </button>
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Layers className="text-[#0dffc3]" size={15} />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">VIZUAL SOZLAMALAR</h3>
            </div>
            
            {/* Visual modes selection */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-gray-500 block tracking-widest uppercase">SAHNA KO'RINISHI:</span>
              <div className="grid grid-cols-1 gap-1">
                <button 
                  onClick={() => { setViewMode('2d'); setShowVisualSettings(false); }}
                  className={`py-1.5 px-2.5 rounded-lg text-left text-xs font-mono transition-all flex items-center justify-between ${
                    viewMode === '2d' 
                      ? 'bg-[#0dffc3]/15 border border-[#0dffc3] text-[#0dffc3]' 
                      : 'bg-zinc-900 border border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <span>2D Classic Flat</span>
                  {viewMode === '2d' && <Sparkles size={11} className="animate-spin" />}
                </button>
                <button 
                  onClick={() => { setViewMode('middle'); setShowVisualSettings(false); }}
                  className={`py-1.5 px-2.5 rounded-lg text-left text-xs font-mono transition-all flex items-center justify-between ${
                    viewMode === 'middle' 
                      ? 'bg-[#a855f7]/15 border border-[#a855f7] text-[#a855f7]' 
                      : 'bg-zinc-900 border border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Silliq 3D Perspektiva</span>
                  {viewMode === 'middle' && <Sparkles size={11} className="animate-pulse" />}
                </button>
                <button 
                  onClick={() => { setViewMode('3d'); setShowVisualSettings(false); }}
                  className={`py-1.5 px-2.5 rounded-lg text-left text-xs font-mono transition-all flex items-center justify-between ${
                    viewMode === '3d' 
                      ? 'bg-amber-500/15 border border-amber-500 text-amber-500' 
                      : 'bg-zinc-900 border border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Egri 3D Isometriya</span>
                  {viewMode === '3d' && <Sparkles size={11} className="animate-bounce" />}
                </button>
              </div>
            </div>

            {/* O'yin Tezligi / Game Speed selection */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-gray-500 block tracking-widest uppercase">O'YIN TEZLIGI:</span>
              <div className="grid grid-cols-3 gap-1 bg-zinc-900 border border-white/5 p-1 rounded-lg">
                <button
                  onClick={() => { setGameSpeedMode('normal'); setShowVisualSettings(false); }}
                  className={`py-1.5 text-[10px] font-mono font-bold rounded transition-all ${
                    gameSpeedMode === 'normal'
                      ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => { setGameSpeedMode('fast'); setShowVisualSettings(false); }}
                  className={`py-1.5 text-[10px] font-mono font-bold rounded transition-all ${
                    gameSpeedMode === 'fast'
                      ? 'bg-amber-500/25 text-amber-400 border border-amber-500/40 font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Tez
                </button>
                <button
                  onClick={() => { setGameSpeedMode('max'); setShowVisualSettings(false); }}
                  className={`py-1.5 text-[10px] font-mono font-bold rounded transition-all ${
                    gameSpeedMode === 'max'
                      ? 'bg-red-500/25 text-red-400 border border-red-500/40 font-black animate-pulse'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  MAX⚡
                </button>
              </div>
            </div>

            {/* Colors Preset preset themes */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-gray-500 block tracking-widest uppercase">Mavzuni Tanlash:</span>
              <div className="grid grid-cols-1 gap-1 max-h-[140px] overflow-y-auto scrollbar-thin">
                {Object.keys(COLOR_THEMES).map((kVal) => {
                  const configItem = COLOR_THEMES[kVal as keyof typeof COLOR_THEMES];
                  const active = themeName === kVal;
                  return (
                    <button
                      key={kVal}
                      onClick={() => { setThemeName(kVal as any); setShowVisualSettings(false); }}
                      className={`py-1.5 px-2 rounded-lg text-left text-[10px] font-mono transition-all flex items-center justify-between truncate ${
                        active 
                          ? 'bg-zinc-800 text-white border border-teal-500' 
                          : 'bg-zinc-900 text-gray-400 border border-transparent hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: configItem.I }} />
                        <span className="truncate">{configItem.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={() => setShowVisualSettings(false)}
              className="w-full bg-[#0dffc3] hover:bg-[#0dffc3]/90 text-black py-2 rounded-xl font-mono text-xs font-bold leading-none cursor-pointer mt-1"
            >
              ORTGA QAYTISH
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
