import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Sparkles, 
  Award, 
  RotateCcw, 
  Cpu, 
  Timer, 
  Clock, 
  AlertTriangle, 
  Brain, 
  HelpCircle,
  Eye,
  Activity,
  Award as AwardIcon
} from 'lucide-react';

interface Piece {
  player: 'user' | 'ai'; // 'user' (Orange) vs 'ai' (Cyan/Blue)
  isKing: boolean;
}

type Board = (Piece | null)[][];

interface CheckersGameProps {
  soundEnabled: boolean;
  onGameOver: (score: number) => void;
}

// 8x8 Board dimensions
const BOARD_SIZE = 8;

interface SavedScore {
  name: string;
  score: number;
  date: string;
  result: 'WON' | 'LOST' | 'DRAW';
  duration: string;
}

export default function CheckersGame({ soundEnabled, onGameOver }: CheckersGameProps) {
  const [board, setBoard] = useState<Board>([]);
  const [gameMode, setGameMode] = useState<'vs-ai' | 'local-2p'>('vs-ai');
  const [turn, setTurn] = useState<'user' | 'ai'>('user');
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ r: number; c: number; captured?: { r: number; c: number } }[]>([]);
  const [userCaptured, setUserCaptured] = useState(0); // AI pieces eaten by user
  const [aiCaptured, setAiCaptured] = useState(0);     // User pieces eaten by AI
  const [aiThinking, setAiThinking] = useState(false);
  const [aiMoveLog, setAiMoveLog] = useState<string[]>([]);
  const [theme, setTheme] = useState<'cyber-neon' | 'golden-solar' | 'cosmic-purple'>('cyber-neon');
  const [pieceStyle, setPieceStyle] = useState<'neon-core' | 'circuit-chassis' | 'crystal-3d'>('neon-core');
  const [aiPerfection, setAiPerfection] = useState<number>(90); // Default AI Perfection rate is 90% (Expert calibre!)
  const [aiStatusMessage, setAiStatusMessage] = useState<string>("Navbatingizni kuting...");
  const [aiJustMadeError, setAiJustMadeError] = useState<boolean>(false);
  const [scoreEarned, setScoreEarned] = useState<number>(0);

  // Enhancements states:
  const [lastMove, setLastMove] = useState<{ from: { r: number; c: number }; to: { r: number; c: number } } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30); // 30 sec turn limit
  const [matchSeconds, setMatchSeconds] = useState<number>(0);
  const [aiOptimalVisualChoice, setAiOptimalVisualChoice] = useState<{ r: number; c: number } | null>(null);

  // Custom game ending and log stats states:
  const [isCustomGameOver, setIsCustomGameOver] = useState<boolean>(false);
  const [wonState, setWonState] = useState<boolean | null>(null);
  const [finalScoreComputed, setFinalScoreComputed] = useState<number>(0);
  const [matchHistory, setMatchHistory] = useState<string[]>([]);

  // Persistent Top 10 Leaderboard Records
  const [highScores, setHighScores] = useState<SavedScore[]>(() => {
    const saved = localStorage.getItem('cyber_shashka_highscores');
    if (saved) return JSON.parse(saved);
    return [
      { name: 'Kiber-Samuray (AI)', score: 580, date: '04.06.2026', result: 'WON', duration: '02:45' },
      { name: 'RogueHacker_99', score: 512, date: '05.06.2026', result: 'WON', duration: '03:12' },
      { name: 'Matrix_Rider', score: 450, date: '05.06.2026', result: 'WON', duration: '04:05' },
      { name: 'Volt_Daemon', score: 380, date: '05.06.2026', result: 'LOST', duration: '02:50' },
      { name: 'Byte_Buster', score: 290, date: '05.06.2026', result: 'WON', duration: '05:30' }
    ];
  });

  // Play audio beeps
  const playRetroSound = (freq: number, dur: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine') => {
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
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {
      // Audio context might be blocked
    }
  };

  // Initialize board with standard Russian Shashka layout
  const initBoard = () => {
    const newBoard: Board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    // AI pieces (rows 0 to 2)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 === 1) {
          newBoard[r][c] = { player: 'ai', isKing: false };
        }
      }
    }

    // User pieces (rows 5 to 7)
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 === 1) {
          newBoard[r][c] = { player: 'user', isKing: false };
        }
      }
    }

    setBoard(newBoard);
    setTurn('user');
    setSelectedCell(null);
    setValidMoves([]);
    setUserCaptured(0);
    setAiCaptured(0);
    setScoreEarned(0);
    setAiJustMadeError(false);
    setLastMove(null);
    setAiOptimalVisualChoice(null);
    setTimeLeft(30);
    setMatchSeconds(0);
    setIsCustomGameOver(false);
    setWonState(null);
    setFinalScoreComputed(0);
    setMatchHistory([]);
    
    const startMsg = gameMode === 'vs-ai'
      ? "Yangi o'yin boshlandi! Xavfsiz yurish qiling."
      : "2 kishilik mahalliy o'yin boshlandi! Navbat: 1-O'yinchi (To'q sariq)";
    
    setAiStatusMessage(startMsg);
    setAiMoveLog([`Tizim: ${startMsg}`]);
    playRetroSound(440, 0.1, 'sine');
    setTimeout(() => playRetroSound(880, 0.15, 'sine'), 100);
  };

  useEffect(() => {
    initBoard();
  }, [gameMode]);

  // Timer countdown and match progression interval
  useEffect(() => {
    const timer = setInterval(() => {
      // Increment overall match duration while playing
      setMatchSeconds(prev => prev + 1);

      // Decrement countdown turn timer
      if (!aiThinking) {
        // In local 2 player mode, both players have a countdown limit!
        // In vs AI mode, only the user has a countdown limit.
        const isCountdownActive = gameMode === 'local-2p' || (gameMode === 'vs-ai' && turn === 'user');
        
        if (isCountdownActive) {
          setTimeLeft(prev => {
            if (prev <= 1) {
              // Time is UP! Forced random moves
              playRetroSound(180, 0.4, 'sawtooth');
              const currentTurn = turn;
              const legalMoves = getAllLegalMovesForPlayer(board, currentTurn);
              if (legalMoves.length > 0) {
                const randomPair = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                const randomMove = randomPair.moves[Math.floor(Math.random() * randomPair.moves.length)];
                
                const turnLabel = currentTurn === 'user' 
                  ? (gameMode === 'vs-ai' ? "Siz" : "1-O'yinchi") 
                  : "2-O'yinchi";
                
                setAiStatusMessage(`⚠️ ${turnLabel}ning vaqti tugadi! Majburiy tasodifiy yurish qilindi.`);
                setAiMoveLog(prevLogs => [`Tizim: ${turnLabel} vaqti tugadi! Tasodifiy yurish.` , ...prevLogs].slice(0, 10));
                executeMove(randomPair.r, randomPair.c, randomMove.r, randomMove.c, randomMove.captured);
              }
              return 30; // reset
            }
            
            if (prev <= 6) {
              playRetroSound(350, 0.08, 'sine');
            }

            return prev - 1;
          });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [turn, board, aiThinking, gameMode]);

  // Helper to verify if coordinate inside board
  const isValidCoord = (r: number, c: number) => r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

  // Find all legal moves for a piece.
  // In Russian/Uzbek checkers, standard pieces can capture backward and forwards.
  // Captures are mandatory!
  const getMovesForPiece = (b: Board, r: number, c: number, forceCapturesOnly: boolean): any[] => {
    const piece = b[r][c];
    if (!piece) return [];
    
    const moves: any[] = [];
    const isKing = piece.isKing;
    const opponent = piece.player === 'user' ? 'ai' : 'user';

    const dirs = [
      { dr: -1, dc: -1 },
      { dr: -1, dc: 1 },
      { dr: 1, dc: -1 },
      { dr: 1, dc: 1 }
    ];

    if (isKing) {
      // King (Dama) rules: slide multiple squares diagonally
      for (const d of dirs) {
        let currR = r + d.dr;
        let currC = c + d.dc;
        let pFound: { r: number; c: number } | null = null;

        while (isValidCoord(currR, currC)) {
          const occupant = b[currR][currC];
          if (occupant) {
            if (occupant.player === opponent) {
              if (pFound) {
                break; // blocked by second piece
              } else {
                pFound = { r: currR, c: currC };
              }
            } else {
              break; // blocked by friendly piece
            }
          } else {
            // Empty cell
            if (pFound) {
              // Landing spot for a capture!
              moves.push({
                r: currR,
                c: currC,
                captured: pFound
              });
            } else if (!forceCapturesOnly) {
              // Normal sliding step
              moves.push({ r: currR, c: currC });
            }
          }
          currR += d.dr;
          currC += d.dc;
        }
      }
    } else {
      // Standard Shashka rules:
      const moveSteps = piece.player === 'user' ? [-1] : [1];

      // Standard Move
      if (!forceCapturesOnly) {
        for (const dr of moveSteps) {
          for (const dc of [-1, 1]) {
            const nextR = r + dr;
            const nextC = c + dc;
            if (isValidCoord(nextR, nextC) && !b[nextR][nextC]) {
              moves.push({ r: nextR, c: nextC });
            }
          }
        }
      }

      // Standard piece Captures (can jump backward and forward!)
      for (const d of dirs) {
        const midR = r + d.dr;
        const midC = c + d.dc;
        const landR = r + (d.dr * 2);
        const landC = c + (d.dc * 2);

        if (isValidCoord(midR, midC) && isValidCoord(landR, landC)) {
          const middle = b[midR][midC];
          const landing = b[landR][landC];
          if (middle && middle.player === opponent && !landing) {
            moves.push({
              r: landR,
              c: landC,
              captured: { r: midR, c: midC }
            });
          }
        }
      }
    }

    return moves;
  };

  // Get ALL legal moves for a given player turn.
  const getAllLegalMovesForPlayer = (b: Board, player: 'user' | 'ai'): { r: number; c: number; moves: any[] }[] => {
    let pieceMoves: { r: number; c: number; moves: any[] }[] = [];
    let captureExists = false;

    // Test if any captures exist across the entire team
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = b[r][c];
        if (piece && piece.player === player) {
          const pieceCaps = getMovesForPiece(b, r, c, true).filter(m => m.captured);
          if (pieceCaps.length > 0) {
            captureExists = true;
          }
        }
      }
    }

    // Assemble moves
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = b[r][c];
        if (piece && piece.player === player) {
          const moves = getMovesForPiece(b, r, c, captureExists);
          if (moves.length > 0) {
            pieceMoves.push({ r, c, moves });
          }
        }
      }
    }

    return pieceMoves;
  };

  // Turn transition and End Condition checkers
  const checkGameEnd = (currentBoard: Board, nextTurn: 'user' | 'ai') => {
    const legalMoves = getAllLegalMovesForPlayer(currentBoard, nextTurn);
    if (legalMoves.length === 0) {
      // No moves left - current turn player lost!
      const player1Won = nextTurn === 'ai';
      
      const userWon = player1Won;
      const userFinalScore = scoreEarned + (userWon ? 500 + (12 - aiCaptured) * 35 : 60);

      playRetroSound(userWon ? 600 : 150, 0.4, 'sine');
      setTimeout(() => playRetroSound(userWon ? 1200 : 100, 0.6, 'sine'), 150);

      setWonState(userWon);
      setFinalScoreComputed(userFinalScore);
      setIsCustomGameOver(true);

      // Register score on global persistent leaderboard list
      const currentGamerName = localStorage.getItem('gamerName') || 'O\'yinchi';
      const durationFormatted = `${Math.floor(matchSeconds / 60).toString().padStart(2, '0')}:${(matchSeconds % 60).toString().padStart(2, '0')}`;
      
      const newScoreEntry: SavedScore = {
        name: gameMode === 'vs-ai' ? currentGamerName : "PVP Mahalliy Jang",
        score: userFinalScore,
        date: new Date().toLocaleDateString('uz-UZ'),
        result: userWon ? 'WON' : 'LOST',
        duration: durationFormatted
      };

      setHighScores(prev => {
        const nextList = [newScoreEntry, ...prev].sort((a, b) => b.score - a.score).slice(0, 10);
        localStorage.setItem('cyber_shashka_highscores', JSON.stringify(nextList));
        return nextList;
      });
    }
  };

  // Handle cell clicks for User / Player 2
  const handleCellClick = (r: number, c: number) => {
    if (gameMode === 'vs-ai') {
      if (turn !== 'user' || aiThinking) return;
    } else {
      if (aiThinking) return;
    }

    const piece = board[r][c];
    
    if (piece && piece.player === turn) {
      const allPlayerMoves = getAllLegalMovesForPlayer(board, turn);
      const thisPieceMoves = allPlayerMoves.find(m => m.r === r && m.c === c);
      
      if (thisPieceMoves) {
        setSelectedCell({ r, c });
        setValidMoves(thisPieceMoves.moves);
        playRetroSound(350, 0.05, 'triangle');
      } else {
        setSelectedCell(null);
        setValidMoves([]);
        playRetroSound(200, 0.1, 'sawtooth');
        setAiStatusMessage("⚠ Bu dona hozir biron-bir majburiy xavfsiz yo'lga ega emas!");
      }
      return;
    }

    // If valid destination is clicked, move piece!
    const move = validMoves.find(m => m.r === r && m.c === c);
    if (selectedCell && move) {
      executeMove(selectedCell.r, selectedCell.c, r, c, move.captured);
    } else {
      setSelectedCell(null);
      setValidMoves([]);
    }
  };

  // Move Execution logic (now with support for sequential multiple jump chains)
  const executeMove = (
    fromR: number,
    fromC: number,
    toR: number,
    toC: number,
    capturedCell?: { r: number; c: number },
    customBoard?: Board
  ) => {
    const activeBoard = customBoard || board;
    const nextBoard = activeBoard.map(row => row.map(cell => cell ? { ...cell } : null));
    const movingPiece = nextBoard[fromR][fromC];
    
    if (!movingPiece) return;

    // Highlight and trail
    setLastMove({ from: { r: fromR, c: fromC }, to: { r: toR, c: toC } });

    // Movement execution
    nextBoard[fromR][fromC] = null;
    nextBoard[toR][toC] = movingPiece;

    // Promotion to King (Dama)
    let promoted = false;
    if (movingPiece.player === 'user' && toR === 0 && !movingPiece.isKing) {
      movingPiece.isKing = true;
      promoted = true;
      setScoreEarned(prev => prev + 50);
      playRetroSound(900, 0.3, 'sine');
    } else if (movingPiece.player === 'ai' && toR === 7 && !movingPiece.isKing) {
      movingPiece.isKing = true;
      promoted = true;
      if (gameMode === 'local-2p') {
        setScoreEarned(prev => prev + 50);
      }
      playRetroSound(300, 0.3, 'sawtooth');
    }

    // Capture mechanics
    let captureStep = false;
    if (capturedCell) {
      nextBoard[capturedCell.r][capturedCell.c] = null;
      captureStep = true;
      if (movingPiece.player === 'user') {
        setUserCaptured(prev => prev + 1);
        setScoreEarned(prev => prev + 30);
        playRetroSound(700, 0.15, 'triangle');
      } else {
        setAiCaptured(prev => prev + 1);
        if (gameMode === 'local-2p') {
          setScoreEarned(prev => prev + 30);
        }
        playRetroSound(280, 0.15, 'triangle');
      }
    } else {
      playRetroSound(500, 0.08, 'sine');
    }

    // Logs coordinates representation index (e.g. g5, f4)
    const fromStr = `${String.fromCharCode(97 + fromC)}${8 - fromR}`;
    const toStr = `${String.fromCharCode(97 + toC)}${8 - toR}`;
    
    let playerLabel = '';
    if (gameMode === 'vs-ai') {
      playerLabel = movingPiece.player === 'user' ? "O'yinchi" : "AI Robot";
    } else {
      playerLabel = movingPiece.player === 'user' ? "1-O'yinchi (To'q sariq)" : "2-O'yinchi (Havorang)";
    }

    const logMsg = `${playerLabel}: ${fromStr} ${capturedCell ? '×' : '→'} ${toStr}${promoted ? ' (DAMA!👑)' : ''}`;

    setAiMoveLog(prev => [logMsg, ...prev].slice(0, 10));
    setMatchHistory(prev => [...prev, logMsg]);
    setBoard(nextBoard);
    setSelectedCell(null);
    setValidMoves([]);

    // Multi-jump calculations:
    let keepJumping = false;
    if (captureStep) {
      const remainingCaps = getMovesForPiece(nextBoard, toR, toC, true).filter(m => m.captured);
      if (remainingCaps.length > 0) {
        keepJumping = true;
        if (gameMode === 'vs-ai') {
          if (movingPiece.player === 'user') {
            // Force player to jump again, pre-selecting piece
            setSelectedCell({ r: toR, c: toC });
            setValidMoves(remainingCaps);
            setAiStatusMessage("Davomiy xavfsiz zarba! Yana bir raqib donasini urib oling.");
          } else {
            // AI multi-jump sequence chain trigger automatically
            setAiStatusMessage("Kiber AI davomiy zarba yo'llamoqda... (Double/Triple Jump) 🔥");
            setTimeout(() => {
              // Find the capture option
              const chosenNextCap = remainingCaps[0];
              executeMove(toR, toC, chosenNextCap.r, chosenNextCap.c, chosenNextCap.captured, nextBoard);
            }, 1100);
            return;
          }
        } else {
          // Local 2P mode multi-jump:
          setSelectedCell({ r: toR, c: toC });
          setValidMoves(remainingCaps);
          setAiStatusMessage(`${movingPiece.player === 'user' ? "1-O'yinchi" : "2-O'yinchi"}: Davomiy xavfsiz zarba! Yana bir donani urib oling.`);
        }
      }
    }

    if (!keepJumping) {
      const nextTurn = movingPiece.player === 'user' ? 'ai' : 'user';
      setTurn(nextTurn);
      setAiJustMadeError(false);
      setAiOptimalVisualChoice(null);
      setTimeLeft(30); 
      
      const turnMsg = gameMode === 'vs-ai'
        ? (nextTurn === 'user' ? "Sizning navbatingiz! Tafakkur qiling." : "Kiber AI kelgusi yo'lni hisoblamoqda...")
        : (nextTurn === 'user' ? "Navbat: 1-O'yinchi (To'q sariq)" : "Navbat: 2-O'yinchi (Havorang)");
        
      setAiStatusMessage(turnMsg);
      checkGameEnd(nextBoard, nextTurn);
      if (nextTurn === 'user') {
        setAiThinking(false);
      }
    }
  };

  // Smarter Board Evaluator for minimax
  const evaluateBoardState = (b: Board): number => {
    let score = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const piece = b[r][c];
        if (piece) {
          let value = piece.isKing ? 460 : 100;
          
          if (piece.player === 'ai') {
            if (!piece.isKing) {
              value += r * 15; 
              if (c >= 2 && c <= 5) value += 12;
              if (r === 0) value += 35;
            } else {
              value += 20;
              if (r >= 2 && r <= 5 && c >= 2 && c <= 5) value += 15;
            }
            score += value;
          } else {
            if (!piece.isKing) {
              value += (7 - r) * 15; 
              if (c >= 2 && c <= 5) value += 12;
              if (r === 7) value += 35;
            } else {
              value += 20;
              if (r >= 2 && r <= 5 && c >= 2 && c <= 5) value += 15;
            }
            score -= value;
          }
        }
      }
    }
    return score;
  };

  // AI execution brain with complete recursive multi-jump looks simulated
  useEffect(() => {
    if (gameMode !== 'vs-ai') return;
    if (turn === 'ai') {
      setAiThinking(true);
      setAiStatusMessage("Kiber AI kelgusi oqilona yo'llarni chuqur tahlil qilmoqda...");
      
      const calcDelay = 950; 

      setTimeout(() => {
        const legalAiPairs = getAllLegalMovesForPlayer(board, 'ai');
        if (legalAiPairs.length === 0) {
          setAiThinking(false);
          checkGameEnd(board, 'ai');
          return;
        }

        const allFlatMoves: { fromR: number; fromC: number; toR: number; toC: number; weight: number; captured?: any }[] = [];

        for (const pair of legalAiPairs) {
          for (const m of pair.moves) {
            // Simulate AI playing this move
            const simBoard = board.map(row => row.map(cell => cell ? { ...cell } : null));
            const p = simBoard[pair.r][pair.c];
            if (!p) continue;
            
            // Execute first jump on simulator board
            simBoard[pair.r][pair.c] = null;
            simBoard[m.r][m.c] = p;
            
            if (m.captured) {
              simBoard[m.captured.r][m.captured.c] = null;
            }

            // RECURSIVE CHAIN CALCULATION:
            // If it is a capture, simulate subsequent captures recursively for the same piece!
            let totalCapsInChain = 0;
            let currentSimR = m.r;
            let currentSimC = m.c;

            if (m.captured) {
              totalCapsInChain = 1;
              let chainBoard = simBoard.map(row => row.map(cell => cell ? { ...cell } : null));
              while (true) {
                const subCaps = getMovesForPiece(chainBoard, currentSimR, currentSimC, true).filter(subM => subM.captured);
                if (subCaps.length === 0) break;
                // Execute remaining simulated sub capture in the chain
                const chosenSub = subCaps[0];
                chainBoard[currentSimR][currentSimC] = null;
                chainBoard[chosenSub.r][chosenSub.c] = p;
                chainBoard[chosenSub.captured.r][chosenSub.captured.c] = null;
                
                totalCapsInChain++;
                currentSimR = chosenSub.r;
                currentSimC = chosenSub.c;
              }
            }

            // Depth-2 reply simulated
            const replies = getAllLegalMovesForPlayer(simBoard, 'user');
            let worstCaseScore = Infinity;

            if (replies.length === 0) {
              worstCaseScore = 15000; // instant victory simulated
            } else {
              for (const uPair of replies) {
                for (const um of uPair.moves) {
                  const replyBoard = simBoard.map(row => row.map(cell => cell ? { ...cell } : null));
                  const up = replyBoard[uPair.r][uPair.c];
                  if (!up) continue;

                  replyBoard[uPair.r][uPair.c] = null;
                  replyBoard[um.r][um.c] = up;
                  if (um.captured) {
                    replyBoard[um.captured.r][um.captured.c] = null;
                  }
                  if (um.r === 0 && !up.isKing) {
                    up.isKing = true;
                  }

                  const score = evaluateBoardState(replyBoard);
                  if (score < worstCaseScore) {
                    worstCaseScore = score;
                  }
                }
              }
            }

            // Combine Lookahead score with total captured bonuses (Highly favors multi-take moves!)
            let totalWeight = worstCaseScore;
            if (totalCapsInChain > 1) {
              totalWeight += totalCapsInChain * 180; // Massive weight addition for double/triple captures!
            } else if (totalCapsInChain === 1) {
              totalWeight += 60;
            }

            allFlatMoves.push({
              fromR: pair.r,
              fromC: pair.c,
              toR: m.r,
              toC: m.c,
              weight: totalWeight,
              captured: m.captured
            });
          }
        }

        // Sort descending: highest weights first
        allFlatMoves.sort((x, y) => y.weight - x.weight);

        const rollsDice = Math.random() * 100;
        const makeError = rollsDice > aiPerfection;

        let chosenMove = allFlatMoves[0];

        if (makeError && allFlatMoves.length > 1) {
          const errorIdx = 1 + Math.floor(Math.random() * (allFlatMoves.length - 1));
          chosenMove = allFlatMoves[errorIdx];
          setAiJustMadeError(true);
          setAiStatusMessage("⚠️ AI TIZIMIDA KUTILMAGAN XATOLIK! ZAIFROQ VARIANT TANLANDI 👾");
          playRetroSound(180, 0.25, 'sawtooth');
        } else {
          setAiJustMadeError(false);
          setAiStatusMessage("Kiber AI Optimal harakatni aniqladi va yurmoqda...");
        }

        if (chosenMove) {
          // Highlight
          setAiOptimalVisualChoice({ r: chosenMove.fromR, c: chosenMove.fromC });
          setSelectedCell({ r: chosenMove.fromR, c: chosenMove.fromC });
          setValidMoves([{ r: chosenMove.toR, c: chosenMove.toC, captured: chosenMove.captured }]);

          setTimeout(() => {
            if (chosenMove) {
              executeMove(
                chosenMove.fromR,
                chosenMove.fromC,
                chosenMove.toR,
                chosenMove.toC,
                chosenMove.captured
              );
            }
          }, 1100);
        } else {
          setAiThinking(false);
        }

      }, calcDelay);
    }
  }, [turn]);

  // Color theme map
  const getThemeColors = () => {
    switch (theme) {
      case 'golden-solar':
        return {
          bgDark: 'bg-[#1e1503]',
          gridTileDark: 'bg-[#5c3e09]',
          gridTileLight: 'bg-[#fef3c7]',
          userPiece: 'from-amber-505 to-yellow-600 shadow-yellow-500/50 border-amber-300',
          aiPiece: 'from-slate-700 to-zinc-900 shadow-slate-500/40 border-slate-400',
          boardBorder: 'border-amber-500/40',
          accentGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]'
        };
      case 'cosmic-purple':
        return {
          bgDark: 'bg-[#120024]',
          gridTileDark: 'bg-[#3b0764]',
          gridTileLight: 'bg-[#faf5ff]',
          userPiece: 'from-purple-500 to-purple-800 shadow-purple-500/50 border-purple-300',
          aiPiece: 'from-emerald-600 to-teal-800 shadow-emerald-500/50 border-emerald-400',
          boardBorder: 'border-purple-500/40',
          accentGlow: 'shadow-[0_0_30px_rgba(168,85,247,0.4)]'
        };
      case 'cyber-neon':
      default:
        return {
          bgDark: 'bg-[#030712]',
          gridTileDark: 'bg-[#18181b]',
          gridTileLight: 'bg-[#f4f4f5]',
          userPiece: 'from-orange-500 to-red-650 shadow-orange-500/50 border-orange-300',
          aiPiece: 'from-cyan-500 to-blue-600 shadow-cyan-400/50 border-cyan-300',
          boardBorder: 'border-zinc-800',
          accentGlow: 'shadow-[0_0_30px_rgba(249,115,22,0.35)]'
        };
    }
  };

  const scheme = getThemeColors();

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 p-3 bg-zinc-950 font-sans text-white select-none">
      
      {/* 2. Left panel: Board with coordinates stretch grids */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 relative h-full">
        
        {/* Deliberate error banner */}
        {aiJustMadeError && !isCustomGameOver && (
          <div className="absolute top-2 left-2 right-2 z-20 bg-amber-500/90 border border-amber-300 text-black px-4 py-1.5 rounded-xl text-xs font-bold font-mono tracking-wide animate-pulse flex items-center gap-2 justify-center shadow">
            <Cpu size={14} className="animate-spin" />
            <span>AI TIZIMIDA KUTILMAGAN XATOLIK! OSONROQ VARIANT TANLANDI 👾</span>
          </div>
        )}

        {/* Dynamic Game Over scoreboard */}
        {isCustomGameOver && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/98 backdrop-blur-md rounded-2xl p-4 overflow-y-auto w-full">
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 animate-bounce ${
              wonState ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400' : 'bg-red-500/10 border-red-500/40 text-red-500'
            }`}>
              {wonState ? <Award size={24} /> : <AlertTriangle size={24} />}
            </div>

            <h3 className={`font-display text-xl font-black italic tracking-wider uppercase text-center ${
              wonState ? 'text-emerald-400' : 'text-red-500'
            }`}>
              {gameMode === 'vs-ai'
                ? (wonState ? "G'ALABA! (VICTORY)" : "MAG'LUBIYAT! (GAME OVER)")
                : (wonState ? "1-O'YINCHI G'ALABA QOZONDI! 🏆" : "2-O'YINCHI G'ALABA QOZONDI! 🏆")
              }
            </h3>
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5 text-center px-4">
              {gameMode === 'vs-ai'
                ? (wonState ? "Siz AI robotini strategik ustunlik bilan mag'lub etdingiz!" : "AI kelgusi barcha yo'llarni chuqur hisoblab chiqdi.")
                : (wonState ? "1-O'yinchi (To'q sariq) ajoyib taktik zarbalar bilan yutib chiqdi!" : "2-O'yinchi (Havorang) barcha dushman donalarini butkul yakson qildi!")
              }
            </span>

            {/* Top 10 Highscores list of the Arcade! */}
            <div className="w-full max-w-sm mt-3 flex border-t border-white/5 pt-2.5 flex-col">
              <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-[#00daf3] font-mono mb-1 font-bold">
                <AwardIcon size={12} className="text-cyan-400" />
                <span>TOP 10 ENG ZO'R NATIJALAR REKORDLARI</span>
              </div>

              <div className="bg-black/75 rounded-xl border border-white/5 overflow-hidden max-h-[140px] overflow-y-auto scrollbar-thin">
                <div className="grid grid-cols-12 gap-1 py-1.5 px-2 text-[8px] font-mono text-zinc-500 uppercase border-b border-white/5 font-bold text-center">
                  <span className="col-span-2">RANG</span>
                  <span className="col-span-4 text-left">ISMI (USER)</span>
                  <span className="col-span-3 text-right">XP BALL</span>
                  <span className="col-span-3 text-right">NATIJA</span>
                </div>
                {highScores.map((score, index) => (
                  <div 
                    key={index}
                    className="grid grid-cols-12 gap-1 py-1.5 px-2 text-[9px] font-mono hover:bg-white/[0.02] border-b border-white/[0.02] items-center"
                  >
                    <span className="col-span-2 text-center text-zinc-500 font-bold">#{index + 1}</span>
                    <span className="col-span-4 truncate text-gray-300 font-semibold">{score.name}</span>
                    <span className="col-span-3 text-right font-black text-emerald-400">+{score.score} XP</span>
                    <span className={`col-span-3 text-right text-[8px] font-black ${score.result === 'WON' ? 'text-[#0dffc3]' : 'text-zinc-500'}`}>
                      {score.result} ({score.duration})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full max-w-sm mt-4 shadow-inner bg-zinc-950 p-2 rounded-xl border border-white/5">
              <button
                onClick={initBoard}
                className="flex-1 py-2 bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-white rounded-lg text-[10px] font-bold font-mono tracking-wider uppercase cursor-pointer"
              >
                YANA BOSHLASH 🔄
              </button>
              <button
                onClick={() => onGameOver(finalScoreComputed)}
                className="flex-1 py-2 bg-[#00daf3] hover:bg-[#00daf3]/90 text-zinc-950 font-black rounded-lg text-[10px] font-mono tracking-wider uppercase cursor-pointer text-center"
              >
                CHIQQISH 💾
              </button>
            </div>
          </div>
        )}

        {/* Board coordinate grids perfectly stretched */}
        <div className="flex flex-col items-center select-none w-full max-w-[430px]">
          
          {/* Top letters row */}
          <div className="flex justify-between w-full pl-6 pr-6 text-[10px] font-mono font-black text-zinc-400 tracking-wider h-5 items-center select-none mb-1 bg-zinc-950/40 rounded border border-white/[0.02]">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(l => (
              <span key={l} className="w-full text-center">{l}</span>
            ))}
          </div>

          {/* Grid columns matching board height exactly */}
          <div className="grid grid-cols-[20px_1fr_20px] items-stretch gap-1 w-full scale-95 sm:scale-100">
            
            {/* Left numbers column */}
            <div className="flex flex-col justify-around text-center text-[10px] font-mono font-black text-zinc-400 select-none py-4">
              {[8, 7, 6, 5, 4, 3, 2, 1].map(num => (
                <span key={num} className="block">{num}</span>
              ))}
            </div>

            {/* Actual 8x8 Board */}
            <div className={`aspect-square rounded-2xl overflow-hidden border-4 ${scheme.boardBorder} ${scheme.accentGlow} bg-zinc-900 grid grid-cols-8 grid-rows-8 relative p-1 leading-none`}>
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isDarkSquare = (r + c) % 2 === 1;
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  const isValidDestination = validMoves.some(m => m.r === r && m.c === c);

                  const isLastMoveFrom = lastMove && lastMove.from.r === r && lastMove.from.c === c;
                  const isLastMoveTo = lastMove && lastMove.to.r === r && lastMove.to.c === c;
                  const isAiVisualSelect = aiOptimalVisualChoice && aiOptimalVisualChoice.r === r && aiOptimalVisualChoice.c === c;

                  let cellHighlightClasses = "";
                  if (isValidDestination) {
                    cellHighlightClasses = "ring-2 ring-emerald-400 ring-offset-1 ring-offset-zinc-950 scale-[1.02] bg-emerald-500/10";
                  } else if (isAiVisualSelect) {
                    cellHighlightClasses = "ring-4 ring-cyan-400 ring-offset-2 ring-offset-zinc-950 scale-105 bg-cyan-500/15 animate-pulse shadow-md z-10";
                  } else if (isLastMoveFrom) {
                    cellHighlightClasses = "border-2 border-dashed border-amber-500/40 bg-amber-500/5";
                  } else if (isLastMoveTo) {
                    cellHighlightClasses = "border-2 border-emerald-500/50 bg-emerald-500/10";
                  }

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => isDarkSquare && handleCellClick(r, c)}
                      className={`relative flex items-center justify-center transition-all duration-300 cursor-pointer ${
                        isDarkSquare ? scheme.gridTileDark : scheme.gridTileLight
                      } ${cellHighlightClasses}`}
                    >
                      {isValidDestination && (
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping z-10" />
                      )}

                      {/* Checker design renderer based on state */}
                      {cell && (
                        <div
                          className={`relative w-[82%] h-[82%] rounded-full bg-gradient-to-br border-2 flex items-center justify-center transition-all duration-300 ${
                            cell.player === 'user' ? scheme.userPiece : scheme.aiPiece
                          } ${isSelected ? 'scale-110 border-white ring-4 ring-white/20 animate-bounce' : 'shadow-md'}`}
                        >
                          {/* Inner custom designs visual styles */}
                          {pieceStyle === 'chassis' || pieceStyle === 'circuit-chassis' ? (
                            <div className="absolute inset-[15%] rounded-full border border-white/20 flex items-center justify-center bg-black/30">
                              <div className="w-[50%] h-[50%] rounded bg-white/25 rotate-45" />
                            </div>
                          ) : pieceStyle === 'crystal-3d' ? (
                            <div className="absolute top-1 left-1.5 right-1.5 h-2 rounded-full bg-white/40 blur-[0.5px]" />
                          ) : (
                            // Default Neon Sphere / Concentric core
                            <div className="w-[55%] h-[55%] rounded-full border border-white/25 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                            </div>
                          )}

                          {cell.isKing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white font-bold leading-none z-10">
                              <span className="text-[14px]">👑</span>
                              <span className="text-[6px] uppercase font-black font-mono tracking-widest bg-black/40 px-1 rounded">DAMA</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right numbers column */}
            <div className="flex flex-col justify-around text-center text-[10px] font-mono font-black text-zinc-400 select-none py-4">
              {[8, 7, 6, 5, 4, 3, 2, 1].map(num => (
                <span key={num} className="block">{num}</span>
              ))}
            </div>

          </div>

          {/* Bottom letters row */}
          <div className="flex justify-between w-full pl-6 pr-6 text-[10px] font-mono font-black text-zinc-400 tracking-wider h-5 items-center select-none mt-1 bg-zinc-950/40 rounded border border-white/[0.02]">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(l => (
              <span key={l} className="w-full text-center">{l}</span>
            ))}
          </div>

        </div>

      </div>

      {/* 2. Right settings panel */}
      <div className="w-full md:w-[320px] flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4 bg-zinc-900/40 p-4 rounded-xl overflow-y-auto max-h-[580px] scrollbar-thin">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-mono text-gray-400 tracking-widest flex items-center gap-1.5">
              <Shield size={12} className="text-[#00daf3]" />
              KIBER TAHLIL PANEL
            </span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 rounded-full font-mono">
              ONLINE
            </span>
          </div>

          {/* Senders clock timer */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-950/80 p-2.5 rounded-xl border border-white/5">
            <div className={`p-2 rounded-lg flex flex-col items-center text-center ${
              timeLeft <= 7 ? 'bg-red-500/15 border border-red-500/35 animate-pulse' : 'bg-zinc-900 border border-zinc-805'
            }`}>
              <div className="text-[9px] text-gray-400 font-mono">YURISH VAQTI</div>
              <span className={`text-lg font-black font-mono ${timeLeft <= 7 ? 'text-red-400' : 'text-orange-500'}`}>
                {timeLeft}s
              </span>
            </div>

            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-col items-center text-center">
              <div className="text-[9px] text-gray-400 font-mono">UMUMIY VAQT</div>
              <span className="text-lg font-black font-mono text-cyan-400">
                {Math.floor(matchSeconds / 60).toString().padStart(2, '0')}:{(matchSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Points earned */}
          <div className="bg-zinc-950/80 p-3 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-gray-400 uppercase">YIG'ILGAN BALLAR</span>
              <span className="text-[#0dffc3] font-mono font-black">+{scoreEarned} XP</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-500 to-[#00daf3] h-full" 
                style={{ width: `${Math.min(100, (scoreEarned / 400) * 100)}%` }}
              />
            </div>
          </div>

          {/* O'yin rejimi (Game Mode Select) */}
          <div className="space-y-2 bg-zinc-950/45 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">O'YIN REJIMINI TANLASH:</span>
            <div className="grid grid-cols-2 gap-2 text-[9px] font-black font-mono text-center">
              <button
                onClick={() => {
                  playRetroSound(400, 0.1, 'sine');
                  setGameMode('vs-ai');
                }}
                className={`flex items-center justify-center gap-1 py-2 rounded-lg transition-all border cursor-pointer ${
                  gameMode === 'vs-ai' ? 'bg-[#00daf3] border-[#00daf3] text-zinc-950 shadow-[0_0_12px_rgba(0,218,243,0.35)]' : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Cpu size={11} />
                <span>ROBOT GA QARSHI</span>
              </button>
              <button
                onClick={() => {
                  playRetroSound(420, 0.1, 'sine');
                  setGameMode('local-2p');
                }}
                className={`flex items-center justify-center gap-1 py-2 rounded-lg transition-all border cursor-pointer ${
                  gameMode === 'local-2p' ? 'bg-[#f97316] border-[#f97316] text-zinc-950 shadow-[0_0_12px_rgba(249,115,22,0.35)]' : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span>👥 2 KISHILIK</span>
              </button>
            </div>
          </div>

          {/* Captures counts */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-zinc-950/60 rounded-xl border border-white/5 text-center">
              <span className="text-[8px] block text-orange-400 uppercase">
                {gameMode === 'vs-ai' ? "URILGAN DONALAR" : "1-O'YINCHI (SARIQ)"}
              </span>
              <span className="font-display font-black text-sm block mt-0.5 text-orange-400">{userCaptured} / 12</span>
            </div>
            <div className="p-2 bg-zinc-950/60 rounded-xl border border-white/5 text-center">
              <span className="text-[8px] block text-cyan-400 uppercase">
                {gameMode === 'vs-ai' ? "AI YO'QOTGANLARI" : "2-O'YINCHI (HAVORANG)"}
              </span>
              <span className="font-display font-black text-sm block mt-0.5 text-cyan-400">{aiCaptured} / 12</span>
            </div>
          </div>

          {/* Difficulty Sliders (Only visible in VS-AI mode) */}
          {gameMode === 'vs-ai' ? (
            <div className="space-y-2 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">AI QIYNCHILIGI:</span>
                <span className="text-cyan-400 font-bold">{aiPerfection}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={aiPerfection}
                onChange={(e) => setAiPerfection(parseInt(e.target.value))}
                className="w-full accent-cyan-500 bg-zinc-800 cursor-pointer h-1 rounded"
              />
            </div>
          ) : (
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center">
              <span className="text-[10px] font-mono text-orange-400 block tracking-widest uppercase">NAVBATDAGI O'YINCHI</span>
              <div className="flex items-center justify-center gap-1.5 mt-1 font-black text-xs uppercase animate-pulse">
                <div className={`w-2.5 h-2.5 rounded-full ${turn === 'user' ? 'bg-orange-500' : 'bg-cyan-400'}`} />
                <span>{turn === 'user' ? "1-O'yinchi (To'q sariq)" : "2-O'yinchi (Havorang)"}</span>
              </div>
            </div>
          )}

          {/* RESTORED PIECE DONA DIZAYNLARI MENU SCREEN */}
          <div className="space-y-2 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">DONA DIZAYNLARI (SKINS):</span>
            <div className="grid grid-cols-3 gap-1.5 text-[8px] font-bold font-mono text-center">
              <button
                onClick={() => {
                  playRetroSound(600, 0.1, 'sine');
                  setPieceStyle('neon-core');
                }}
                className={`py-1 rounded-lg transition-all border cursor-pointer ${
                  pieceStyle === 'neon-core' ? 'bg-[#f43f5e] border-[#f43f5e] text-zinc-950' : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                NEON ORB
              </button>
              <button
                onClick={() => {
                  playRetroSound(600, 0.1, 'sine');
                  setPieceStyle('circuit-chassis');
                }}
                className={`py-1 rounded-lg transition-all border cursor-pointer ${
                  pieceStyle === 'circuit-chassis' ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                KIBER SHASSI
              </button>
              <button
                onClick={() => {
                  playRetroSound(600, 0.1, 'sine');
                  setPieceStyle('crystal-3d');
                }}
                className={`py-1 rounded-lg transition-all border cursor-pointer ${
                  pieceStyle === 'crystal-3d' ? 'bg-[#00daf3] border-[#00daf3] text-zinc-950' : 'bg-black/40 border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                KRISTALL 3D
              </button>
            </div>
          </div>

          {/* Theme background styling selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">XARITA MAVZUSI (BACKGROUND):</span>
            <div className="grid grid-cols-3 gap-1 text-[8px] font-black font-mono text-center">
              <button
                onClick={() => setTheme('cyber-neon')}
                className={`py-1 rounded-md cursor-pointer transition-all ${
                  theme === 'cyber-neon' ? 'bg-[#f97316] text-black' : 'bg-zinc-950 border border-white/5 text-gray-400'
                }`}
              >
                NEON CYBER
              </button>
              <button
                onClick={() => setTheme('golden-solar')}
                className={`py-1 rounded-md cursor-pointer transition-all ${
                  theme === 'golden-solar' ? 'bg-amber-500 text-black' : 'bg-zinc-950 border border-white/5 text-gray-400'
                }`}
              >
                GOLD SOLAR
              </button>
              <button
                onClick={() => setTheme('cosmic-purple')}
                className={`py-1 rounded-md cursor-pointer transition-all ${
                  theme === 'cosmic-purple' ? 'bg-purple-500 text-black' : 'bg-zinc-950 border border-white/5 text-gray-400'
                }`}
              >
                COSMIC
              </button>
            </div>
          </div>

          {/* Moves tables logs */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">YURISH TABLOSI LOGS:</span>
            <div className="bg-zinc-950/90 rounded-xl p-2 max-h-[105px] overflow-y-auto border border-white/5 space-y-1 text-[9px] font-mono text-gray-400">
              {aiThinking && (
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold animate-pulse py-0.5">
                  <div className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                  <span>AI yo'lni hisoblamoqda...</span>
                </div>
              )}
              {aiMoveLog.map((log, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-1.5 py-0.5 border-b border-white/5 ${
                    log.startsWith("O'yinchi") ? 'text-orange-400' : 'text-cyan-300'
                  }`}
                >
                  <span>⚡</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="space-y-2 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full ${turn === 'user' ? 'bg-orange-500 animate-pulse' : 'bg-cyan-400 animate-ping'}`} />
            <span className="font-mono text-[8px] text-gray-400 truncate">{aiStatusMessage}</span>
          </div>

          <button 
            onClick={initBoard}
            className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
          >
            RESTART JANG 🔄
          </button>
        </div>

      </div>
    </div>
  );
}
