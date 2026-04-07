/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, ArrowLeft, RefreshCcw, AlertCircle } from 'lucide-react';
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
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'timeout' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>(''); 
  const [gameStatus, setGameStatus] = useState<'start' | 'playing' | 'finished'>('start');

  // 9x9 Practice State
  const [unlockedPractice, setUnlockedPractice] = useState<Set<string>>(new Set());
  const [practiceQuestion, setPracticeQuestion] = useState<{n1: number, n2: number} | null>(null);
  const [practiceInput, setPracticeInput] = useState('');
  const [practiceKey, setPracticeKey] = useState(0);

  // Workshop State (練功坊)
  const [workshopProblem, setWorkshopProblem] = useState<{n1: number, n2: number} | null>(null);
  const [workshopStep, setWorkshopStep] = useState(1);
  const [workshopInput, setWorkshopInput] = useState('');
  const [workshopFeedback, setWorkshopFeedback] = useState<'correct' | 'wrong' | null>(null);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const clayCardClass = "bg-[#fcf8f2] border-[6px] border-[#d9c5b2] shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.05),4px_4px_15px_rgba(0,0,0,0.1)] rounded-[40px_25px_45px_30px]";

  const wrongMessages = ["差一點點，再想一下！", "別灰心，再試一次！", "喔喔！再想一下。", "加油！大冒險還沒結束！", "你做得到，再試一次！"];

  const triggerWrongFeedback = () => {
    const randomMsg = wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
    setFeedbackMessage(randomMsg);
    setFeedback('wrong');
    setTimeout(() => { setFeedback(null); setFeedbackMessage(''); }, 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('multiplication_adventure_save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setPlayerName(data.name || '');
        setStars(data.stars || 0);
        setUnlockedPractice(new Set(data.unlocked || []));
        if (data.name) setIsNameEntered(true);
      } catch (e) { console.error(e); }
    }
  }, []);

  const saveGame = () => {
    localStorage.setItem('multiplication_adventure_save', JSON.stringify({ name: playerName, stars, unlocked: Array.from(unlockedPractice) }));
    setSaveMessage("進度已儲存！");
    setTimeout(() => setSaveMessage(null), 2000);
    confetti({ particleCount: 30 });
  };

  const handleStartAdventure = (g: Grade) => {
    setQuestions(generateQuestions(g));
    setGrade(g);
    setMode('adventure');
    setGameStatus('playing');
    setCurrentIndex(0);
    setUserInput('');
  };

  const resetPractice = () => {
    if (confirm("要重新挑戰，清空左側乘法表嗎？")) {
      setUnlockedPractice(new Set());
      setPracticeKey(k => k + 1);
      setPracticeQuestion({ n1: Math.floor(Math.random() * 9) + 1, n2: Math.floor(Math.random() * 9) + 1 });
      setPracticeInput('');
    }
  };

  const handlePracticeAnswer = () => {
    if (!practiceQuestion) return;
    if (parseInt(practiceInput) === practiceQuestion.n1 * practiceQuestion.n2) {
      setUnlockedPractice(prev => new Set(prev).add(`${practiceQuestion.n1}x${practiceQuestion.n2}`));
      confetti({ particleCount: 30 });
      setTimeout(() => {
        setPracticeQuestion({ n1: Math.floor(Math.random() * 9) + 1, n2: Math.floor(Math.random() * 9) + 1 });
        setPracticeInput('');
      }, 1000);
    } else {
      triggerWrongFeedback();
      setPracticeInput('');
    }
  };

  const handleWorkshopAnswer = () => {
    if (!workshopProblem) return;
    const { n1, n2 } = workshopProblem;
    const isCorrect = workshopStep === 1 
      ? parseInt(workshopInput) === (n1 % 10) * n2 
      : parseInt(workshopInput) === (Math.floor(n1 / 10) * n2) + Math.floor(((n1 % 10) * n2) / 10);

    if (isCorrect) {
      setWorkshopFeedback('correct');
      if (workshopStep === 1) {
        setTimeout(() => { 
          setWorkshopStep(2); 
          setWorkshopInput(''); 
          setWorkshopFeedback(null); 
        }, 1000);
      } else {
        setStars(s => s + 2);
        confetti({ particleCount: 50 });
        setTimeout(() => {
          setWorkshopProblem({ n1: Math.floor(Math.random() * 90) + 10, n2: Math.floor(Math.random() * 8) + 2 });
          setWorkshopStep(1); 
          setWorkshopInput(''); 
          setWorkshopFeedback(null);
        }, 1500);
      }
    } else {
      setWorkshopFeedback('wrong');
      triggerWrongFeedback();
      setWorkshopInput('');
      setTimeout(() => setWorkshopFeedback(null), 1500);
    }
  };

  const handleAnswer = () => {
    if (!userInput || !questions[currentIndex]) return;
    if (parseInt(userInput) === questions[currentIndex].answer) {
      setStars(prev => prev + 1);
      confetti({ particleCount: 50 });
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setUserInput('');
      } else setGameStatus('finished');
    } else {
      triggerWrongFeedback();
      setUserInput('');
    }
  };

  return (
    <div className="min-h-screen font-sans text-[#2D3436] bg-[#f7f1e3]">
      <AnimatePresence mode="wait">
        {!isNameEntered ? (
          <motion.div key="login" className="min-h-screen w-full flex items-center justify-center relative bg-cover bg-center" style={{ backgroundImage: `url('https://github.com/emilychen89405264-prog/For-WE/blob/main/multiplication_homepage.png?raw=true')` }}>
            <div className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[34%] h-[12%] flex items-center justify-center">
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="w-full h-full bg-transparent border-none text-center text-3xl font-black text-[#7a4a3a] outline-none" placeholder="輸入姓名" />
            </div>
            <div className="absolute bottom-[13.5%] left-1/2 -translate-x-1/2 w-[76%] h-[15%] flex gap-[3%]">
              <button onClick={() => playerName && setIsNameEntered(true)} className="flex-1 bg-transparent cursor-pointer" />
              <button onClick={() => playerName && setIsNameEntered(true)} className="flex-1 bg-transparent cursor-pointer" />
              <button onClick={() => confirm("要退出嗎？")} className="flex-1 bg-transparent cursor-pointer" />
            </div>
          </motion.div>
        ) : (
          <motion.div key="game-container" className="w-full min-h-screen">
            {mode === 'menu' ? (
              <div className="fixed inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('https://github.com/emilychen89405264-prog/For-WE/blob/main/multiplication_mainpage.png?raw=true')` }}>
                <div className="absolute top-[29%] left-[85%] -translate-x-1/2 -translate-y-1/2 w-[34%] h-[15%] flex items-center justify-center"><div className="text-[4vw] font-black text-[#7a4a3a]">{playerName}</div></div>
                <div className="absolute bottom-[42%] left-[85%] -translate-x-1/2 w-[16%] h-[12%] flex items-center justify-center gap-2"><Star className="fill-[#f5ba50] text-[#f5ba50] w-10 h-10" /><span className="text-4xl font-black text-[#7a4a3a]">{stars}</span></div>
                <button onClick={saveGame} className="absolute bottom-[17.5%] right-[19%] w-[13.5%] h-[11%] bg-transparent cursor-pointer hover:bg-white/20 rounded-3xl" />
                <button onClick={() => setIsNameEntered(false)} className="absolute bottom-[6%] right-[4%] w-[13.5%] h-[11%] bg-transparent cursor-pointer hover:bg-white/20 rounded-3xl" />
                
                <button onClick={() => { setWorkshopProblem({ n1: 13, n2: 8 }); setWorkshopStep(1); setWorkshopFeedback(null); setMode('workshop'); }} className="absolute top-[16%] left-[7%] w-[26%] h-[31%] bg-transparent cursor-pointer hover:scale-105 transition-all" />
                <button onClick={() => { setPracticeQuestion({ n1: 8, n2: 7 }); setMode('practice'); }} className="absolute bottom-[13%] left-[7%] w-[26%] h-[31%] bg-transparent cursor-pointer hover:scale-105 transition-all" />
                
                <div className="absolute top-[39%] left-[50.5%] -translate-x-1/2 w-[16.5%] h-[48.5%] flex flex-col justify-between">
                  {[1, 2, 3, 4].map((g) => (
                    <button key={g} onClick={() => handleStartAdventure(g as Grade)} className="h-[21%] w-full bg-transparent cursor-pointer hover:bg-white/30 rounded-2xl" />
                  ))}
                </div>
                {saveMessage && <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#7a4a3a] text-white px-6 py-2 rounded-full font-black z-[100]">✨ {saveMessage}</div>}
              </div>
            ) : (
              <div className="fixed inset-0 w-full h-full bg-cover bg-center overflow-y-auto p-4 md:p-12" style={{ backgroundImage: `url('https://github.com/emilychen89405264-prog/For-WE/blob/main/BG.png?raw=true')` }}>
                <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                  <div className="flex justify-between items-center">
                    <button onClick={() => setMode('menu')} className="bg-[#fcf8f2] border-4 border-[#d9c5b2] px-6 py-2 rounded-[20px] font-black text-[#7a4a3a] shadow-md hover:scale-105 transition-transform"><ArrowLeft size={30} /> 返回基地</button>
                    <AnimatePresence>{feedback === 'wrong' && (
                      <motion.div initial={{ opacity: 0, scale: 0.5, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500 text-white px-8 py-3 rounded-full font-black shadow-2xl flex items-center gap-3 z-[100] border-4 border-white"><AlertCircle size={24} /><span className="text-xl">{feedbackMessage}</span></motion.div>
                    )}</AnimatePresence>
                  </div>

                  {/* 模式：練功坊 (除錯修正處) */}
                  {mode === 'workshop' && workshopProblem && (
                    <div className={`${clayCardClass} p-12 max-w-2xl mx-auto text-center space-y-8`}>
                      <div className="flex justify-center items-end text-8xl font-black tracking-widest py-10">
                        <div className="text-right space-y-2 text-[#2d3436]">
                          {workshopStep > 1 && <div className="text-blue-500 text-3xl">{Math.floor(((workshopProblem.n1 % 10) * workshopProblem.n2) / 10)}</div>}
                          <div>{Math.floor(workshopProblem.n1 / 10)} <span className={workshopStep === 1 ? "text-orange-600" : ""}>{workshopProblem.n1 % 10}</span></div>
                          <div>× <span className="text-purple-600">{workshopProblem.n2}</span></div>
                          <div className="h-3 bg-[#7a4a3a] w-full rounded-full" />
                          <div className="flex justify-end gap-2">
                            {/* 十位數答案顯示修正：只有在第二步且回答正確後才顯示數字 */}
                            <span className={(workshopStep === 2 && workshopFeedback === 'correct') ? "text-green-600" : "text-transparent"}>
                              {(Math.floor(workshopProblem.n1 / 10) * workshopProblem.n2) + Math.floor(((workshopProblem.n1 % 10) * workshopProblem.n2) / 10)}
                            </span>
                            {/* 個位數答案顯示修正：第一步正確後或進入第二步才顯示數字 */}
                            <span className={(workshopStep > 1 || (workshopStep === 1 && workshopFeedback === 'correct')) ? "text-green-600" : "text-black"}>
                              {workshopStep === 1 && workshopFeedback !== 'correct' ? "?" : (workshopProblem.n1 % 10 * workshopProblem.n2) % 10}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`p-6 rounded-[30px] border-4 shadow-inner transition-colors ${workshopFeedback === 'wrong' ? 'bg-red-50 border-red-500 animate-shake' : 'bg-[#eff6ff] border-[#bfdbfe]'}`}>
                        <p className="text-xl font-bold mb-4">{workshopStep === 1 ? `第一步：計算 ${workshopProblem.n2} × ${workshopProblem.n1 % 10}` : "第二步：計算十位數並加上進位"}</p>
                        <div className="flex gap-4"><input type="number" value={workshopInput} onChange={e => setWorkshopInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWorkshopAnswer()} className="flex-1 text-center text-3xl p-4 bg-white rounded-[20px] outline-none border-2 border-[#d9c5b2]" /><button onClick={handleWorkshopAnswer} className="bg-[#3b82f6] text-white px-8 font-black rounded-[20px] hover:brightness-110">確認</button></div>
                      </div>
                    </div>
                  )}

                  {/* 模式：修練場 */}
                  {mode === 'practice' && (
                    <div key={practiceKey} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className={`${clayCardClass} p-6`}><div className="grid grid-cols-10 gap-1"><div className="bg-slate-200 aspect-square flex items-center justify-center font-black rounded-sm">X</div>{[1,2,3,4,5,6,7,8,9].map(n => <div key={n} className="bg-yellow-100 aspect-square flex items-center justify-center font-black">{n}</div>)}{[1,2,3,4,5,6,7,8,9].map(r => (<Fragment key={r}><div className="bg-blue-100 aspect-square flex items-center justify-center font-black">{r}</div>{[1,2,3,4,5,6,7,8,9].map(c => { const isU = unlockedPractice.has(`${r}x${c}`); return <div key={c} className={`aspect-square flex items-center justify-center text-xs font-bold rounded border ${isU ? 'bg-orange-500 text-white' : 'bg-white/50 text-transparent'}`}>{isU ? r*c : ''}</div> })}</Fragment>))}</div></div>
                      <div className={`${clayCardClass} p-8 text-center flex flex-col items-center justify-center`}><h3 className="text-2xl font-black mb-4 text-[#7a4a3a]">熱血修練題！</h3><div className="text-6xl font-black mb-6 italic">{practiceQuestion?.n1} × {practiceQuestion?.n2} = ?</div><input type="number" value={practiceInput} onChange={e => setPracticeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePracticeAnswer()} className="text-center text-4xl p-4 w-40 bg-white border-4 border-[#d9c5b2] rounded-[20px] outline-none mb-6 shadow-inner" placeholder="?" /><div className="flex gap-4"><button onClick={handlePracticeAnswer} className="bg-[#3b82f6] text-white px-10 py-4 rounded-[20px] font-black shadow-lg">擊破!!</button><button onClick={resetPractice} className="bg-[#94a3b8] text-white px-6 py-4 rounded-[20px] shadow-lg flex items-center gap-2 font-black active:scale-95"><RefreshCcw size={20} /> 重新挑戰</button></div></div>
                    </div>
                  )}

                  {/* 模式：大冒險 */}
                  {mode === 'adventure' && questions[currentIndex] && (
                    <div className={`${clayCardClass} p-12 text-center space-y-12`}><div className="text-4xl font-black text-[#7a4a3a]">第 {currentIndex + 1} 關</div><div className="text-[120px] font-black italic">{questions[currentIndex].num1} × {questions[currentIndex].num2}</div><div className="max-w-md mx-auto space-y-6"><input type="number" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAnswer()} className="w-full text-center text-6xl font-black p-8 bg-white border-4 border-[#d9c5b2] rounded-[30px] shadow-inner outline-none" autoFocus /><button onClick={handleAnswer} className="w-full bg-[#f97316] text-white text-3xl font-black py-6 rounded-[35px] shadow-xl hover:scale-105">擊破!!</button></div></div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
