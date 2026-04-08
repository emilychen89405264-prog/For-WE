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

  // Workshop State
  const [workshopProblem, setWorkshopProblem] = useState<{n1: number, n2: number} | null>(null);
  const [workshopStep, setWorkshopStep] = useState(1);
  const [workshopInput, setWorkshopInput] = useState('');
  const [workshopFeedback, setWorkshopFeedback] = useState<'correct' | 'wrong' | null>(null);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const clayCardClass = "bg-[#fcf8f2] border-[6px] border-[#d9c5b2] shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.05),4px_4px_15px_rgba(0,0,0,0.1)] rounded-[40px_25px_45px_30px]";

  const wrongMessages = ["差一點點，再想一下！", "別灰心，你做得到！", "喔喔！再試一次。", "加油！大冒險還沒結束！"];

  // 統一隨機出題邏輯
  const generateNewPractice = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setPracticeQuestion({ n1, n2 });
    setPracticeInput('');
  };

  const generateNewWorkshop = () => {
    const n1 = Math.floor(Math.random() * 90) + 10;
    const n2 = Math.floor(Math.random() * 8) + 2;
    setWorkshopProblem({ n1, n2 });
    setWorkshopStep(1);
    setWorkshopInput('');
    setWorkshopFeedback(null);
  };

  const triggerWrongFeedback = () => {
    setFeedbackMessage(wrongMessages[Math.floor(Math.random() * wrongMessages.length)]);
    setFeedback('wrong');
    setTimeout(() => { setFeedback(null); setFeedbackMessage(''); }, 3000);
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('multiplication_all_players') || '{}');
    const data = saved[playerName];
    if (data && isNameEntered) {
      setStars(data.stars || 0);
      setUnlockedPractice(new Set(data.unlocked || []));
    }
  }, [isNameEntered, playerName]);

  const saveGame = () => {
    const allSaves = JSON.parse(localStorage.getItem('multiplication_all_players') || '{}');
    allSaves[playerName] = { stars, unlocked: Array.from(unlockedPractice) };
    localStorage.setItem('multiplication_all_players', JSON.stringify(allSaves));
    setSaveMessage("進度已儲存！");
    setTimeout(() => setSaveMessage(null), 2000);
    confetti({ particleCount: 30 });
  };

  const handleLogin = () => {
    if (!playerName.trim()) return;
    const allSaves = JSON.parse(localStorage.getItem('multiplication_all_players') || '{}');
    const data = allSaves[playerName.trim()];
    if (data) {
      setStars(data.stars || 0);
      setUnlockedPractice(new Set(data.unlocked || []));
    } else {
      setStars(0);
      setUnlockedPractice(new Set());
    }
    setIsNameEntered(true);
  };

  const handlePracticeAnswer = () => {
    if (!practiceQuestion) return;
    if (parseInt(practiceInput) === practiceQuestion.n1 * practiceQuestion.n2) {
      setUnlockedPractice(prev => new Set(prev).add(`${practiceQuestion.n1}x${practiceQuestion.n2}`));
      confetti({ particleCount: 30 });
      setTimeout(generateNewPractice, 1000);
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
        setTimeout(() => { setWorkshopStep(2); setWorkshopInput(''); setWorkshopFeedback(null); }, 1000);
      } else {
        setStars(s => s + 2);
        confetti({ particleCount: 50 });
        setTimeout(generateNewWorkshop, 1500);
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
    } else { triggerWrongFeedback(); setUserInput(''); }
  };

  return (
    <div className="min-h-screen font-sans text-[#2D3436] bg-[#f7f1e3]">
      <AnimatePresence mode="wait">
        {!isNameEntered ? (
          <motion.div key="login" className="min-h-screen w-full flex items-center justify-center relative bg-cover bg-center" style={{ backgroundImage: `url('https://github.com/emilychen89405264-prog/For-WE/blob/main/multiplication_homepage.png?raw=true')` }}>
            <div className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[34%] h-[12%] flex items-center justify-center">
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="w-full h-full bg-transparent border-none text-center text-5xl font-black text-[#7a4a3a] outline-none" placeholder="輸入姓名" />
            </div>
            <div className="absolute bottom-[13.5%] left-1/2 -translate-x-1/2 w-[76%] h-[15%] flex gap-[3%]">
              <button onClick={() => playerName && handleLogin()} className="flex-1 bg-transparent cursor-pointer" />
              <button onClick={() => playerName && handleLogin()} className="flex-1 bg-transparent cursor-pointer" />
              <button onClick={() => confirm("退出？")} className="flex-1 bg-transparent cursor-pointer" />
            </div>
          </motion.div>
        ) : (
          <motion.div key="game-container" className="w-full min-h-screen">
            {mode === 'menu' ? (
              <div className="fixed inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('https://github.com/emilychen89405264-prog/For-WE/blob/main/multiplication_mainpage.png?raw=true')` }}>
                <div className="absolute top-[29%] left-[85%] -translate-x-1/2 -translate-y-1/2 w-[34%] h-[15%] flex items-center justify-center"><div className="text-[4vw] font-black text-[#7a4a3a]">{playerName}</div></div>
                <div className="absolute bottom-[42%] left-[85%] -translate-x-1/2 w-[16%] h-[12%] flex items-center justify-center gap-2"><Star className="fill-[#f5ba50] text-[#f5ba50] w-10 h-10" /><span className="text-6xl font-black text-[#7a4a3a]">{stars}</span></div>
                <button onClick={saveGame} className="absolute bottom-[17.5%] right-[19%] w-[13.5%] h-[11%] bg-transparent cursor-pointer hover:bg-white/3 rounded-3xl" />
                <button onClick={() => setIsNameEntered(false)} className="absolute bottom-[6%] right-[4%] w-[13.5%] h-[11%] bg-transparent cursor-pointer hover:bg-white/3 rounded-3xl" />
                
                {/* 模式入口修正：進入前強制初始化 */}
                <button onClick={() => { generateNewWorkshop(); setMode('workshop'); }} className="absolute top-[16%] left-[7%] w-[26%] h-[31%] bg-transparent cursor-pointer hover:scale-105 transition-all" />
                <button onClick={() => { generateNewPractice(); setMode('practice'); }} className="absolute bottom-[13%] left-[7%] w-[26%] h-[31%] bg-transparent cursor-pointer hover:scale-105 transition-all" />
                
                <div className="absolute top-[39%] left-[50.5%] -translate-x-1/2 w-[16.5%] h-[50%] flex flex-col justify-between">
                  {[1, 2, 3, 4].map((g) => (
                    <button key={g} onClick={() => { setQuestions(generateQuestions(g as Grade)); setGrade(g as Grade); setMode('adventure'); setGameStatus('playing'); setCurrentIndex(0); }} className="h-[21%] w-full bg-transparent cursor-pointer hover:bg-white/3 rounded-2xl" />
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

                  {/* 模式：修練場 (修正處：確保 key 與 practiceQuestion 存在) */}
                  {mode === 'practice' && practiceQuestion && (
                    <div key={practiceKey} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className={`${clayCardClass} p-6`}>
                        <div className="grid grid-cols-10 gap-1">
                          <div className="bg-slate-200 aspect-square flex items-center justify-center font-black rounded-sm">X</div>
                          {[1,2,3,4,5,6,7,8,9].map(n => <div key={n} className="bg-yellow-100 aspect-square flex items-center justify-center font-black" key={`h-${n}`}>{n}</div>)}
                          {[1,2,3,4,5,6,7,8,9].map(row => (
                            <Fragment key={`row-${row}`}>
                              <div className="bg-blue-100 aspect-square flex items-center justify-center font-black">{row}</div>
                              {[1,2,3,4,5,6,7,8,9].map(col => {
                                const isU = unlockedPractice.has(`${row}x${col}`);
                                return <div key={`${row}-${col}`} className={`aspect-square flex items-center justify-center text-xs font-bold rounded border ${isU ? 'bg-orange-500 text-white border-[#7a4a3a]' : 'bg-white/3 text-transparent'}`}>{isU ? row*col : ''}</div>
                              })}
                            </Fragment>
                          ))}
                        </div>
                      </div>
                      <div className={`${clayCardClass} p-8 text-center flex flex-col items-center justify-center`}>
                        <h3 className="text-2xl font-black mb-4 text-[#7a4a3a]">熱血修練題！</h3>
                        <div className="text-6xl font-black mb-6 italic">{practiceQuestion.n1} × {practiceQuestion.n2} = ?</div>
                        <input type="number" value={practiceInput} onChange={e => setPracticeInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePracticeAnswer()} className="text-center text-6xl p-4 w-40 bg-white border-4 border-[#d9c5b2] rounded-[20px] outline-none mb-6 shadow-inner" placeholder="?" />
                        <div className="flex gap-4">
                          <button onClick={handlePracticeAnswer} className="bg-[#3b82f6] text-white px-10 py-4 rounded-[20px] font-black shadow-lg">擊破!!</button>
                          <button onClick={() => { setUnlockedPractice(new Set()); setPracticeKey(k=>k+1); generateNewPractice(); }} className="bg-[#94a3b8] text-white px-6 py-4 rounded-[20px] shadow-lg flex items-center gap-2 font-black active:scale-95"><RefreshCcw size={20} /> 重新挑戰</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 模式：練功坊 */}
                  {mode === 'workshop' && workshopProblem && (
                    <div className={`${clayCardClass} p-12 max-w-2xl mx-auto text-center space-y-8`}>
                      <div className="flex justify-center items-end text-8xl font-black tracking-widest py-10 relative">
                        <div className="text-right space-y-2 text-[#2d3436]">
                          {workshopStep > 1 && <div className="text-blue-500 text-3xl">{Math.floor(((workshopProblem.n1 % 10) * workshopProblem.n2) / 10)}</div>}
                          <div>{Math.floor(workshopProblem.n1 / 10)} <span className={workshopStep === 1 ? "text-orange-600" : ""}>{workshopProblem.n1 % 10}</span></div>
                          <div>× <span className="text-purple-600">{workshopProblem.n2}</span></div>
                          <div className="h-3 bg-[#7a4a3a] w-full rounded-full" />
                          <div className="flex justify-end gap-2">
                            <span className={(workshopStep === 2 && workshopFeedback === 'correct') ? "text-green-600" : "text-transparent"}>{(Math.floor(workshopProblem.n1 / 10) * workshopProblem.n2) + Math.floor(((workshopProblem.n1 % 10) * workshopProblem.n2) / 10)}</span>
                            <span className={(workshopStep > 1 || (workshopStep === 1 && workshopFeedback === 'correct')) ? "text-green-600" : "text-black"}>{workshopStep === 1 && workshopFeedback !== 'correct' ? "?" : (workshopProblem.n1 % 10 * workshopProblem.n2) % 10}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`p-6 rounded-[30px] border-4 shadow-inner transition-colors ${workshopFeedback === 'wrong' ? 'bg-red-50 border-red-500' : 'bg-[#eff6ff] border-[#bfdbfe]'}`}>
                        <p className="text-xl font-bold mb-4">{workshopStep === 1 ? `第一步：計算 ${workshopProblem.n2} × ${workshopProblem.n1 % 10}` : "第二步：計算十位數並加上進位"}</p>
                        <div className="flex gap-4"><input type="number" value={workshopInput} onChange={e => setWorkshopInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleWorkshopAnswer()} className="flex-1 text-center text-3xl p-4 bg-white rounded-[20px] outline-none border-2 border-[#d9c5b2]" /><button onClick={handleWorkshopAnswer} className="bg-[#3b82f6] text-white px-8 font-black rounded-[20px] hover:brightness-110">確認</button></div>
                      </div>
                    </div>
                  )}

                  {/* 模式：大冒險 */}
                  {mode === 'adventure' && questions[currentIndex] && (
                    <div className={`${clayCardClass} p-12 text-center space-y-12`}>
                      <div className="text-5xl font-black text-[#7a4a3a]">第 {currentIndex + 1} 關</div>
                      <div className="text-[120px] font-black italic">{questions[currentIndex].num1} × {questions[currentIndex].num2}</div>
                      <div className="max-w-md mx-auto space-y-6">
                        <input type="number" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAnswer()} className="w-full text-center text-6xl font-black p-8 bg-white border-4 border-[#d9c5b2] rounded-[30px] shadow-inner outline-none" autoFocus />
                        <button onClick={handleAnswer} className="w-full bg-[#f97316] text-white text-3xl font-black py-6 rounded-[35px] shadow-xl hover:scale-105">擊破!!</button>
                      </div>
                    </div>
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
