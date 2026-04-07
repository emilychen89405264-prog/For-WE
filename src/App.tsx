/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, ArrowLeft, Lightbulb, CheckCircle2, XCircle, RefreshCcw, ChevronRight, Zap, Calculator, Save, LogOut, ShieldCheck, AlarmClock, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateQuestions, Question, Grade } from './utils/questions';

export default function App() {
  const [playerName, setPlayerName] = useState('');
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [mode, setMode] = useState<'menu' | 'adventure' | 'practice' | 'workshop'>('menu');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [gameStatus, setGameStatus] = useState<'start' | 'playing' | 'finished'>('start');
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 9x9 Practice State
  const [unlockedPractice, setUnlockedPractice] = useState<Set<string>>(new Set());
  const [practiceQuestion, setPracticeQuestion] = useState<{n1: number, n2: number} | null>(null);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceFeedback, setPracticeFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Workshop State
  const [workshopProblem, setWorkshopProblem] = useState<{n1: number, n2: number} | null>(null);
  const [workshopStep, setWorkshopStep] = useState(1);
  const [workshopInput, setWorkshopInput] = useState('');
  const [workshopFeedback, setWorkshopFeedback] = useState<'correct' | 'wrong' | null>(null);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 1. Load game on mount
  useEffect(() => {
    const savedData = localStorage.getItem('multiplication_adventure_save');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setPlayerName(data.name || '');
        setStars(data.stars || 0);
        setUnlockedPractice(new Set(data.unlocked || []));
        if (data.name) setIsNameEntered(true);
      } catch (e) {
        console.error("Failed to load save data", e);
      }
    }
  }, []);

  // 2. Timer Logic for Adventure Mode
  useEffect(() => {
    if (mode === 'adventure' && gameStatus === 'playing' && !showAnswer && feedback === null) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, gameStatus, currentIndex, showAnswer, feedback]);

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFeedback('timeout');
    setStars(prev => Math.max(0, prev - 1));
    setShowAnswer(true);
  };

  const saveGame = () => {
    const data = { name: playerName, stars: stars, unlocked: Array.from(unlockedPractice) };
    localStorage.setItem('multiplication_adventure_save', JSON.stringify(data));
    setSaveMessage("進度已儲存！");
    setTimeout(() => setSaveMessage(null), 2000);
    confetti({ particleCount: 30, spread: 40, origin: { y: 0.9 }, colors: ['#4ade80'] });
  };

  const confirmExit = () => {
    setMode('menu');
    setGrade(null);
    setGameStatus('start');
    setIsNameEntered(false);
    setShowExitConfirm(false);
    setTimeLeft(30);
  };

  const handleStartAdventure = (selectedGrade: Grade) => {
    const newQuestions = generateQuestions(selectedGrade);
    if (newQuestions.length > 0) {
      setQuestions(newQuestions);
      setGrade(selectedGrade);
      setMode('adventure');
      setGameStatus('playing');
      setCurrentIndex(0);
      setUserInput('');
      setShowAnswer(false);
      setFeedback(null);
      setTimeLeft(30);
    }
  };

  const handleBack = () => {
    setGrade(null);
    setMode('menu');
    setGameStatus('start');
  };

  // 3. Practice & Workshop Generator Logic
  const generatePracticeQuestion = () => {
    const allPairs: [number, number][] = [];
    for (let i = 1; i <= 9; i++) {
      for (let j = 1; j <= 9; j++) {
        if (!unlockedPractice.has(`${i}x${j}`)) allPairs.push([i, j]);
      }
    }
    let n1, n2;
    if (allPairs.length > 0) {
      const randomPair = allPairs[Math.floor(Math.random() * allPairs.length)];
      [n1, n2] = randomPair;
    } else {
      n1 = Math.floor(Math.random() * 9) + 1;
      n2 = Math.floor(Math.random() * 9) + 1;
    }
    setPracticeQuestion({ n1, n2 });
    setPracticeInput('');
    setPracticeFeedback(null);
  };

  useEffect(() => {
    if (mode === 'practice' && !practiceQuestion) generatePracticeQuestion();
  }, [mode]);

  const handlePracticeAnswer = () => {
    if (!practiceQuestion || !practiceInput) return;
    const isCorrect = parseInt(practiceInput) === practiceQuestion.n1 * practiceQuestion.n2;
    if (isCorrect) {
      setPracticeFeedback('correct');
      setUnlockedPractice(prev => new Set(prev).add(`${practiceQuestion.n1}x${practiceQuestion.n2}`));
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => generatePracticeQuestion(), 1500);
    } else {
      setPracticeFeedback('wrong');
      setTimeout(() => setPracticeFeedback(null), 1000);
    }
  };

  const generateWorkshopProblem = () => {
    const n1 = Math.floor(Math.random() * 90) + 10;
    const n2 = Math.floor(Math.random() * 8) + 2;
    setWorkshopProblem({ n1, n2 });
    setWorkshopStep(1);
    setWorkshopInput('');
    setWorkshopFeedback(null);
  };

  useEffect(() => {
    if (mode === 'workshop' && !workshopProblem) generateWorkshopProblem();
  }, [mode]);

  const handleWorkshopAnswer = () => {
    if (!workshopProblem || !workshopInput) return;
    const { n1, n2 } = workshopProblem;
    const units = n1 % 10;
    const tens = Math.floor(n1 / 10);
    const carry = Math.floor((units * n2) / 10);
    let isCorrect = false;
    if (workshopStep === 1) isCorrect = parseInt(workshopInput) === units * n2;
    else isCorrect = parseInt(workshopInput) === (tens * n2) + carry;

    if (isCorrect) {
      setWorkshopFeedback('correct');
      if (workshopStep === 1) {
        setTimeout(() => { setWorkshopStep(2); setWorkshopInput(''); setWorkshopFeedback(null); }, 1500);
      } else {
        setStars(prev => prev + 2);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => generateWorkshopProblem(), 2000);
      }
    } else {
      setWorkshopFeedback('wrong');
      setTimeout(() => setWorkshopFeedback(null), 1000);
    }
  };

  // 4. Adventure Logic
  const handleAnswer = () => {
    if (!userInput || feedback !== null) return;
    const currentQ = questions[currentIndex];
    const isCorrect = parseInt(userInput) === currentQ.answer;
    if (isCorrect) {
      if (timerRef.current) clearInterval(timerRef.current);
      setFeedback('correct');
      setStars(prev => prev + 1);
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setUserInput(''); setShowAnswer(false); setFeedback(null); setTimeLeft(30);
        } else setGameStatus('finished');
      }, 1500);
    } else {
      setFeedback('wrong');
      setStars(prev => Math.max(0, prev - 1));
      setTimeout(() => { setFeedback(null); setUserInput(''); }, 1000);
    }
  };

  return (
    <div className="min-h-screen font-sans text-[#2D3436] selection:bg-yellow-200 bg-[#f7f1e3]">
      <AnimatePresence mode="wait">
        {!isNameEntered ? (
          /* --- 登入首頁 --- */
          <motion.div 
            key="login" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="min-h-screen w-full flex items-center justify-center relative bg-cover bg-center" 
            style={{ backgroundImage: `url('https://github.com/emilychen89405264-prog/For-WE/blob/main/multiplication_homepage.png?raw=true')` }}
          >
            <div className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[34%] h-[12%]">
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && playerName && setIsNameEntered(true)} className="w-full h-full bg-transparent border-none text-center text-3xl font-black text-[#7a4a3a] outline-none placeholder:text-[#b08d75]/50" placeholder="點擊輸入姓名" autoFocus />
            </div>
            <div className="absolute bottom-[13.5%] left-1/2 -translate-x-1/2 w-[76%] h-[15%] flex gap-[3%]">
              <button onClick={saveGame} className="flex-1 bg-transparent cursor-pointer" />
              <button onClick={() => playerName && setIsNameEntered(true)} className="flex-1 bg-transparent cursor-pointer" />
              <button onClick={() => setShowExitConfirm(true)} className="flex-1 bg-transparent cursor-pointer" />
            </div>
          </motion.div>
        ) : (
          <motion.div key="game-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-h-screen">
            {mode === 'menu' ? (
              /* --- 黏土風主選單 --- 依據 new image_501006.jpg 精準定位 --- */
              <div className="fixed inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('https://github.com/emilychen89405264-prog/For-WE/blob/main/multiplication_mainpage.png?raw=true')` }}>
                
                {/* 1. 挑戰者姓名：置中放大對準中央姓名捲軸 */}
                {/* 位置調整：向下移並稍微加大高度 */}
                <div className="absolute top-[29%] left-[85%] -translate-x-1/2 -translate-y-1/2 w-[34%] h-[15%] flex items-center justify-center">
                  <div className="text-[min(8vw,64px)] font-black text-[#7a4a3a] text-center drop-shadow-md leading-none">{playerName}</div>
                </div>

                {/* 2. 積分顯示：星星 + 數字 (左下方積分框) */}
                {/* 位置調整：從右側移到左下方積分空白處 */}
                <div className="absolute bottom-[42%] left-[85%] -translate-x-1/2 w-[16%] h-[12%] flex items-center justify-center gap-2">
                  <Star className="fill-[#f5ba50] text-[#f5ba50] w-8 h-8 md:w-12 md:h-12" />
                  <span className="text-[min(6vw,48px)] font-black text-[#7a4a3a] drop-shadow-md">{stars}</span>
                </div>

                {/* 3. Save & Exit 按鈕 (右下方) */}
                {/* 位置調整：Save 移到紅框位置，Exit 移到藍框位置 */}
                <button onClick={(e) => { e.stopPropagation(); saveGame(); }} className="absolute bottom-[17.5%] right-[19%] w-[13.5%] h-[11%] cursor-pointer bg-transparent hover:bg-white/10 rounded-2xl transition-colors" title="儲存進度" />
                <button onClick={(e) => { e.stopPropagation(); setShowExitConfirm(true); }} className="absolute bottom-[6%] right-[4%] w-[13.5%] h-[11%] cursor-pointer bg-transparent hover:bg-white/10 rounded-2xl transition-colors" title="退出遊戲" />

                {/* 4. 左側功能圓框連結 (藍/綠框) */}
                {/* 位置調整：workshop 對準上方藍框，practice 對準下方綠框 */}
                <button onClick={() => setMode('workshop')} className="absolute top-[16%] left-[7%] w-[26%] h-[31%] bg-transparent cursor-pointer hover:bg-white/5 rounded-[40px]" title="乘法練功坊" />
                <button onClick={() => setMode('practice')} className="absolute bottom-[13%] left-[7%] w-[26%] h-[31%] bg-transparent cursor-pointer hover:bg-white/5 rounded-[40px]" title="九九乘法修練場" />

                {/* 5. 熱血大冒險 1-4年級垂直連結 (中央捲軸下方) */}
                {/* 位置調整：從中間移到右側垂直按鈕區 (黃/綠/黃/橘按鈕) */}
                <div className="absolute top-[38%] left-[50%] -translate-x-1/2 w-[16.5%] h-[52%] flex flex-col justify-between p-1">
                  {[1, 2, 3, 4].map((g) => (
                    <button key={g} onClick={() => handleStartAdventure(g as Grade)} className="h-[21%] w-full bg-transparent cursor-pointer hover:bg-white/20 rounded-2xl active:scale-95" title={`開始 ${g} 年級大冒險`} />
                  ))}
                </div>

                <AnimatePresence>
                  {saveMessage && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#7a4a3a] text-white px-8 py-3 rounded-full font-black shadow-2xl z-[60]">✨ {saveMessage}</motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* --- 遊戲模式內頁 --- */
              <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
                <button onClick={() => setMode('menu')} className="clay-button bg-white p-4 flex items-center gap-2 font-black text-[#7a4a3a] mb-6">
                  <ArrowLeft /> 返回冒險中心
                </button>

                {/* 九九乘法修練場 */}
                {mode === 'practice' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="clay-card p-6 bg-white/95">
                      <div className="grid grid-cols-10 gap-1">
                        <div className="bg-slate-100 aspect-square flex items-center justify-center text-xs font-black">X</div>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <div key={n} className="bg-yellow-100 aspect-square flex items-center justify-center font-black text-[#7a4a3a]">{n}</div>)}
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(row => (
                          <Fragment key={row}>
                            <div className="bg-blue-100 aspect-square flex items-center justify-center font-black text-[#7a4a3a]">{row}</div>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(col => {
                              const isUnlocked = unlockedPractice.has(`${row}x${col}`);
                              return <div key={`${row}x${col}`} className={`aspect-square flex items-center justify-center text-xs font-bold rounded border ${isUnlocked ? 'bg-orange-500 text-white border-[#7a4a3a]' : 'bg-slate-50 text-transparent'}`}>{isUnlocked ? row * col : '?'}</div>
                            })}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="clay-card p-8 bg-white flex flex-col items-center justify-center">
                       <h3 className="text-2xl font-black mb-6 text-[#7a4a3a]">熱血修練題！</h3>
                       <div className="text-6xl font-black mb-6 italic">{practiceQuestion?.n1} × {practiceQuestion?.n2} = ?</div>
                       <input type="number" value={practiceInput} onChange={e => setPracticeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePracticeAnswer()} className="text-center text-4xl p-4 clay-card w-40 mb-4 bg-slate-50 outline-none" />
                       <button onClick={handlePracticeAnswer} className="clay-button bg-blue-500 text-white px-12 py-4 text-xl">擊破!!</button>
                    </div>
                  </div>
                )}

                {/* 乘法練功坊 */}
                {mode === 'workshop' && workshopProblem && (
                  <div className="clay-card p-12 bg-white/95 max-w-2xl mx-auto space-y-8">
                     <div className="flex justify-center items-end text-7xl font-black tracking-widest py-10">
                        <div className="text-right space-y-2 text-[#2d3436]">
                           {workshopStep > 1 && <div className="text-blue-500 text-3xl">{Math.floor(((workshopProblem.n1 % 10) * workshopProblem.n2) / 10)}</div>}
                           <div>{Math.floor(workshopProblem.n1 / 10)} <span className={workshopStep === 1 ? "text-orange-500" : ""}>{workshopProblem.n1 % 10}</span></div>
                           <div>× <span className="text-purple-600">{workshopProblem.n2}</span></div>
                           <div className="h-2 bg-[#2d3436] w-full" />
                           <div className="flex justify-end gap-4">
                             {workshopStep === 2 && workshopFeedback === 'correct' ? <span className="text-green-600">{(Math.floor(workshopProblem.n1 / 10) * workshopProblem.n2) + Math.floor(((workshopProblem.n1 % 10) * workshopProblem.n2) / 10)}</span> : <span>?</span>}
                             {workshopStep > 1 || (workshopStep === 1 && workshopFeedback === 'correct') ? <span className="text-green-600">{(workshopProblem.n1 % 10 * workshopProblem.n2) % 10}</span> : <span>?</span>}
                           </div>
                        </div>
                     </div>
                     <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200">
                        <p className="text-xl font-bold mb-4 text-slate-700">{workshopStep === 1 ? `第一步：請計算 ${workshopProblem.n2} × ${workshopProblem.n1 % 10}` : "第二步：計算十位數乘法並加上進位"}</p>
                        <div className="flex gap-4">
                          <input type="number" value={workshopInput} onChange={e => setWorkshopInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWorkshopAnswer()} className="flex-1 text-center text-3xl p-4 clay-card bg-white outline-none" />
                          <button onClick={handleWorkshopAnswer} className="clay-button bg-blue-500 text-white px-8">確認</button>
                        </div>
                     </div>
                  </div>
                )}

                {/* 熱血大冒險 */}
                {mode === 'adventure' && questions[currentIndex] && (
                  <div className="clay-card p-12 text-center space-y-12">
                    <div className="flex justify-between items-center px-4">
                      <div className="text-2xl font-black text-[#7a4a3a]">第 {currentIndex + 1} / 50 關</div>
                      <div className={`text-2xl font-black px-6 py-2 rounded-full border-4 ${timeLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-black'}`}>剩餘時間：{timeLeft}s</div>
                    </div>
                    <div className="text-[120px] font-black italic text-[#2d3436]">{questions[currentIndex].num1} × {questions[currentIndex].num2}</div>
                    <div className="max-w-md mx-auto space-y-6">
                       <input type="number" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAnswer()} className="w-full text-center text-6xl font-black p-8 clay-card outline-none bg-slate-50" placeholder="?" autoFocus />
                       <button onClick={handleAnswer} className="w-full clay-button bg-orange-500 text-white text-3xl py-6">擊破!!</button>
                    </div>
                  </div>
                )}

                {/* 結算畫面 */}
                {gameStatus === 'finished' && (
                  <div className="clay-card p-16 text-center space-y-8">
                    <Trophy size={160} className="text-yellow-400 mx-auto drop-shadow-lg" />
                    <h2 className="text-6xl font-black text-[#7a4a3a]">MISSION COMPLETE!</h2>
                    <div className="text-4xl font-bold text-slate-600">你在 {grade} 年級中一共奪得了 {stars} 顆星星！</div>
                    <button onClick={() => { setMode('menu'); setGameStatus('start'); }} className="clay-button bg-orange-500 text-white text-2xl px-12 py-6">回到基地</button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 退出確認彈窗 */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="clay-card p-8 max-w-sm w-full text-center space-y-6 bg-white">
              <h3 className="text-2xl font-black text-[#7a4a3a]">確定退出冒險中心？</h3>
              <div className="flex gap-4">
                <button onClick={confirmExit} className="flex-1 bg-red-500 text-white font-black py-3 clay-button">退出</button>
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-white text-black font-black py-3 clay-button border-2 border-[#7a4a3a]/10">取消</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
