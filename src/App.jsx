import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * --- 国乒大魔王挑战赛 ---
 * 针对手机端和 GitHub Pages 部署优化的版本
 */

const BOSSES = [
  { id: 'grandpa', name: '小区大爷', title: '热身对手', emoji: '👴', quote: '小伙子，拍子拿反了吧？', minScore: 0, speed: 1.0, zone: 25 },
  { id: 'xuxin', name: '许昕', title: '人民艺术家', emoji: '🐍', quote: '让你见识下什么叫神仙球！', minScore: 10, speed: 1.4, zone: 20 },
  { id: 'sys', name: '孙颖莎', title: '小魔王', emoji: '🦈', quote: '我的正手，你接得住吗？', minScore: 25, speed: 1.9, zone: 16 },
  { id: 'malong', name: '马龙', title: '六边形战士', emoji: '🐉', quote: '比赛现在，才真正开始。', minScore: 45, speed: 2.5, zone: 12 },
  { id: 'zyn', name: '张怡宁', title: '大魔王', emoji: '👑', quote: '我都还没出汗，你怎么倒了？', minScore: 70, speed: 3.5, zone: 8 },
  { id: 'lgl', name: '刘国梁', title: '不懂球的胖子', emoji: '😎', quote: '就这？还逼不出我的发球。', minScore: 100, speed: 4.8, zone: 5 }
];

export default function PingPongGame() {
  const [gameState, setGameState] = useState('START'); 
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentBossIndex, setCurrentBossIndex] = useState(0);
  const [failReason, setFailReason] = useState('');
  const [flash, setFlash] = useState(false);
  const [perfectText, setPerfectText] = useState(false);

  const ballRef = useRef(null);
  const lastTimeRef = useRef(0);
  const requestRef = useRef();
  
  const engine = useRef({
    pos: 0,
    vel: 0,
    status: 'START',
    score: 0,
    bossIndex: 0,
  });

  const currentBoss = BOSSES[currentBossIndex];

  // 初始化分数
  useEffect(() => {
    const saved = localStorage.getItem('pingpong_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // 更新最高分
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('pingpong_highscore', score.toString());
    }
  }, [score, highScore]);

  // 游戏主循环
  const gameLoop = useCallback((time) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = (time - lastTimeRef.current) / 16.66;
    lastTimeRef.current = time;

    if (engine.current.status === 'PLAYING') {
      const state = engine.current;
      const boss = BOSSES[state.bossIndex];
      
      state.pos += state.vel * deltaTime;

      // 判定漏球
      if (state.vel > 0 && state.pos >= 100) {
        engine.current.status = 'GAMEOVER';
        setGameState('GAMEOVER');
        setFailReason('漏球啦！手速得再快一点！');
      } 
      // 对手接球
      else if (state.vel < 0 && state.pos <= 5) {
        state.pos = 5;
        state.vel = boss.speed; 
        setFlash(true);
        setTimeout(() => setFlash(false), 50);
      }

      if (ballRef.current) {
        ballRef.current.style.top = `${state.pos}%`;
      }
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameLoop]);

  const startGame = () => {
    setScore(0);
    setCurrentBossIndex(0);
    setFailReason('');
    engine.current = { pos: 5, vel: BOSSES[0].speed, status: 'PLAYING', score: 0, bossIndex: 0 };
    setGameState('PLAYING');
  };

  const handleLevelUp = (newScore, currentIdx) => {
    if (currentIdx + 1 < BOSSES.length && newScore >= BOSSES[currentIdx + 1].minScore) {
      engine.current.status = 'TRANSITION';
      setGameState('TRANSITION');
      setCurrentBossIndex(currentIdx + 1);
      engine.current.bossIndex = currentIdx + 1;
      
      setTimeout(() => {
        engine.current.status = 'PLAYING';
        setGameState('PLAYING');
        engine.current.pos = 5;
        engine.current.vel = BOSSES[currentIdx + 1].speed;
      }, 1500);
    }
  };

  const handlePointerDown = (e) => {
    e.preventDefault(); 
    const state = engine.current;

    if (state.status === 'GAMEOVER' || state.status === 'START') {
      startGame();
      return;
    }
    if (state.status === 'TRANSITION' || state.vel < 0) return;

    const boss = BOSSES[state.bossIndex];
    const hitZoneStart = 100 - boss.zone;

    // 击球判定
    if (state.pos >= hitZoneStart && state.pos <= 100) {
      state.score += 1;
      setScore(state.score);
      
      if (state.pos >= (100 - boss.zone * 0.3)) {
        setPerfectText(true);
        setTimeout(() => setPerfectText(false), 400);
      }

      state.vel = -6.0; 
      handleLevelUp(state.score, state.bossIndex);
    } else {
      engine.current.status = 'GAMEOVER';
      setGameState('GAMEOVER');
      setFailReason('挥拍早了！魔王的球有假动作！');
    }
  };

  return (
    <div 
      className="relative w-full h-screen bg-neutral-900 overflow-hidden flex justify-center items-center font-sans touch-none select-none"
      onPointerDown={handlePointerDown}
    >
      <div className={`relative w-full max-w-md h-full bg-[#1a5c3a] shadow-2xl overflow-hidden transition-colors duration-200 ${flash ? 'bg-[#268a56]' : ''}`}>
        
        {/* 球桌中线 */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1 -ml-[0.5px] bg-white/30 border-l border-dashed border-white/50"></div>
        
        {/* 分数背景 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <span className="text-[10rem] font-bold text-white tracking-tighter">{score}</span>
        </div>

        {/* 顶部对手栏 */}
        <div className="absolute top-0 left-0 w-full h-28 bg-black/40 flex flex-col items-center justify-center text-white z-10 border-b-4 border-emerald-800">
          <div className="text-3xl mb-1">{currentBoss.emoji}</div>
          <div className="font-bold text-lg">{currentBoss.name} <span className="text-xs font-normal opacity-60">| {currentBoss.title}</span></div>
          {gameState === 'PLAYING' && (
            <div className="text-[10px] text-gray-300 italic mt-1 animate-pulse px-4 text-center">"{currentBoss.quote}"</div>
          )}
        </div>

        {/* 击球判定区 */}
        <div 
          className="absolute bottom-0 left-0 w-full bg-emerald-500/20 border-t-2 border-dashed border-yellow-400/50 flex items-end justify-center pb-2"
          style={{ height: `${currentBoss.zone}%` }}
        >
           <div className="text-white/40 text-[10px] font-bold tracking-widest">进入黄色虚线区点击</div>
        </div>

        {/* 乒乓球 */}
        {(gameState === 'PLAYING' || gameState === 'GAMEOVER') && (
          <div 
            ref={ballRef}
            className="absolute left-1/2 -ml-3 w-6 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20"
            style={{ top: '5%' }}
          ></div>
        )}

        {/* Perfect提示 */}
        {perfectText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 text-4xl font-black text-yellow-300 italic animate-ping z-40">
            好球!
          </div>
        )}

        {/* UI 蒙层 */}
        {gameState === 'START' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-50 p-6 text-center backdrop-blur-sm">
            <h1 className="text-3xl font-black mb-4 text-emerald-400">国乒大魔王挑战赛</h1>
            <p className="text-sm text-gray-300 mb-8">当球进入底部发光区时点击屏幕<br/>挑战马龙、张怡宁等魔王！</p>
            <div className="text-xs text-gray-500 mb-4">最高连击记录: {highScore}</div>
            <button className="px-10 py-3 bg-emerald-500 rounded-full font-bold text-lg shadow-lg">开始挑战</button>
          </div>
        )}

        {gameState === 'TRANSITION' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white z-50 animate-pulse">
            <div className="text-7xl mb-4">{currentBoss.emoji}</div>
            <h2 className="text-4xl font-black mb-2">{currentBoss.name} 登场</h2>
            <p className="text-xl text-emerald-400 italic">"{currentBoss.quote}"</p>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center text-white z-50 p-6 text-center">
            <h2 className="text-5xl font-black mb-4 tracking-tighter">被虐啦!</h2>
            <p className="text-red-200 mb-6 font-medium">{failReason}</p>
            <div className="bg-black/30 p-4 rounded-xl mb-8 w-full border border-white/10">
              <div className="text-xs opacity-60 mb-1">本次得分 / 历史最高</div>
              <div className="text-3xl font-bold">{score} / {highScore}</div>
            </div>
            <button className="px-12 py-4 bg-white text-red-900 rounded-full font-bold text-xl shadow-xl">不服再战</button>
          </div>
        )}
      </div>
    </div>
  );
}
