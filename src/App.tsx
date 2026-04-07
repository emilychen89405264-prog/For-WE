/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, ArrowLeft, Lightbulb, CheckCircle2, XCircle, RefreshCcw, GraduationCap, ChevronRight, Zap, BookOpen, Calculator, Save, LogOut, User, ShieldCheck, Timer, AlertTriangle } from 'lucide-react';
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

  // Load game on mount
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

  // Timer Logic for Adventure Mode
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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, gameStatus, currentIndex, showAnswer, feedback]);

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFeedback('timeout');
    setStars(prev => Math.max(0, prev - 1));
    setShowAnswer(true);
  };

  const saveGame = () => {
    const data = {
      name: playerName,
      stars: stars,
      unlocked: Array.from(unlockedPractice)
    };
    localStorage.setItem('multiplication_adventure_save', JSON.stringify(data));
    setSaveMessage("進度已儲存！");
    setTimeout(() => setSaveMessage(null), 2000);
    
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { y: 0.9 },
      colors: ['#4ade80']
    });
  };

  const confirmExit = () => {
    setMode('menu');
    setGrade(null);
    setGameStatus('start');
    setIsNameEntered(false);
    setShowExitConfirm(false);
    setTimeLeft(30);
  };

  const generatePracticeQuestion = () => {
    // Pick a random question that hasn't been unlocked yet if possible
    const allPairs: [number, number][] = [];
    for (let i = 1; i <= 9; i++) {
      for (let j = 1; j <= 9; j++) {
        if (!unlockedPractice.has(`${i}x${j}`)) {
          allPairs.push([i, j]);
        }
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
    if (mode === 'practice' && !practiceQuestion) {
      generatePracticeQuestion();
    }
  }, [mode]);

  const handlePracticeAnswer = () => {
    if (!practiceQuestion || !practiceInput) return;
    const isCorrect = parseInt(practiceInput) === practiceQuestion.n1 * practiceQuestion.n2;
    if (isCorrect) {
      setPracticeFeedback('correct');
      // Unlock the cell
      const key = `${practiceQuestion.n1}x${practiceQuestion.n2}`;
      setUnlockedPractice(prev => new Set(prev).add(key));
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4ade80', '#fbbf24']
      });
      setTimeout(() => {
        generatePracticeQuestion();
      }, 1500);
    } else {
      setPracticeFeedback('wrong');
      setTimeout(() => setPracticeFeedback(null), 1000);
    }
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
    } else {
      alert("無法產生題目，請稍後再試。");
    }
  };

  const generateWorkshopProblem = () => {
    // Generate a 2-digit by 1-digit problem (e.g., 10-99 x 2-9)
    const n1 = Math.floor(Math.random() * 90) + 10;
    const n2 = Math.floor(Math.random() * 8) + 2;
    setWorkshopProblem({ n1, n2 });
    setWorkshopStep(1);
    setWorkshopInput('');
    setWorkshopFeedback(null);
  };

  const handleWorkshopAnswer = () => {
    if (!workshopProblem || !workshopInput) return;
    const { n1, n2 } = workshopProblem;
    const units = n1 % 10;
    const tens = Math.floor(n1 / 10);
    const carry = Math.floor((units * n2) / 10);

    let isCorrect = false;
    if (workshopStep === 1) {
      isCorrect = parseInt(workshopInput) === units * n2;
    } else if (workshopStep === 2) {
      isCorrect = parseInt(workshopInput) === (tens * n2) + carry;
    }

    if (isCorrect) {
      setWorkshopFeedback('correct');
      if (workshopStep === 1) {
        setTimeout(() => {
          setWorkshopStep(2);
          setWorkshopInput('');
          setWorkshopFeedback(null);
        }, 1500);
      } else {
        setStars(prev => prev + 2);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          generateWorkshopProblem();
        }, 2000);
      }
    } else {
      setWorkshopFeedback('wrong');
      setTimeout(() => setWorkshopFeedback(null), 1000);
    }
  };

  useEffect(() => {
    if (mode === 'workshop' && !workshopProblem) {
      generateWorkshopProblem();
    }
  }, [mode]);

  const handleBack = () => {
    setGrade(null);
    setMode('menu');
    setGameStatus('start');
    setTimeLeft(30);
  };

  const handleAnswer = () => {
    if (!userInput || feedback !== null) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = parseInt(userInput) === currentQuestion.answer;

    if (isCorrect) {
      if (timerRef.current) clearInterval(timerRef.current);
      setFeedback('correct');
      setStars(prev => prev + 1);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF4500', '#1E90FF']
      });
      
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    } else {
      setFeedback('wrong');
      setStars(prev => Math.max(0, prev - 1));
      setTimeout(() => {
        setFeedback(null);
        setUserInput('');
      }, 1000);
    }
  };

  const handleShowAnswer = () => {
    if (showAnswer) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setShowAnswer(true);
    setStars(prev => Math.max(0, prev - 1));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setShowAnswer(false);
      setFeedback(null);
      setTimeLeft(30);
    } else {
      setGameStatus('finished');
    }
  };

  const handleRestart = () => {
    if (grade) {
      setQuestions(generateQuestions(grade));
      setCurrentIndex(0);
      setUserInput('');
      setShowAnswer(false);
      setFeedback(null);
      setGameStatus('playing');
      setTimeLeft(30);
    }
  };

  const currentQuestion = questions[currentIndex];

 if (!isNameEntered) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url('https://github.com/emilychen89405264-prog/For-WE/blob/main/multiplication_homepage.png?raw=true')`,
          backgroundColor: '#e5d1b8' // 防止全黑的墊底色
        }}
      >
        {/* 全域背景點擊微暗效果 */}
        <div className="absolute inset-0 bg-black/10 active:bg-black/30 transition-colors pointer-events-none" />

        {/* 1. 冒險者姓名輸入框 - 修正位置：從 44.5% 調降至 48% */}
        <div className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[34%] h-[12%]">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && playerName && setIsNameEntered(true)}
            placeholder="點擊輸入姓名"
            className="w-full h-full bg-transparent border-none text-center text-3xl md:text-4xl font-black text-[#7a4a3a] outline-none placeholder:text-[#b08d75]/50"
            autoFocus
          />
        </div>

        {/* 下方黏土風格按鈕區 (存檔、Leg's go!!, 退出) */}
        <div className="absolute bottom-[13.5%] left-1/2 -translate-x-1/2 w-[76%] h-[15%] flex gap-[3%] items-stretch">
          
          {/* 2. 存檔按鈕 感應區 (左側藍色) */}
          <motion.button 
            onClick={saveGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="flex-1 bg-white/0 hover:bg-white/10 rounded-[30px] transition-colors cursor-pointer"
          />

          {/* 3. Leg's go!! 按鈕 感應區 (中間綠色) */}
          <motion.button 
            onClick={() => playerName && setIsNameEntered(true)}
            disabled={!playerName}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="flex-1 bg-white/0 hover:bg-white/10 rounded-[40px] transition-colors cursor-pointer group relative disabled:cursor-not-allowed disabled:grayscale"
          >
            {/* 未輸入姓名時的懸停提示 */}
            {!playerName && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-red-500 font-bold bg-white px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 whitespace-nowrap text-xs">
                請先輸入姓名
              </div>
            )}
          </motion.button>

          {/* 4. 退出按鈕 感應區 (右側紅色) */}
          <motion.button 
            onClick={() => setShowExitConfirm(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="flex-1 bg-white/0 hover:bg-white/10 rounded-[30px] transition-colors cursor-pointer"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-[#2D3436] p-4 md:p-8 selection:bg-yellow-200">
      <div className="max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white/90 anime-border p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg text-white anime-border">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Challenger</div>
              <div className="text-xl font-black italic text-black">{playerName}</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-yellow-400 anime-border px-4 py-1.5 rounded-full">
              <Star className="fill-black text-black" size={20} />
              <span className="font-black text-black text-xl">{stars}</span>
            </div>
            <div className="flex gap-2 relative">
              {saveMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-10 right-0 bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full whitespace-nowrap anime-border"
                >
                  {saveMessage}
                </motion.div>
              )}
              <button 
                onClick={saveGame}
                className="p-2 bg-green-500 text-white anime-button hover:bg-green-600"
                title="儲存進度"
              >
                <Save size={20} />
              </button>
              <button 
                onClick={() => setShowExitConfirm(true)}
                className="p-2 bg-red-500 text-white anime-button hover:bg-red-600"
                title="退出系統"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Exit Confirmation Modal */}
        <AnimatePresence>
          {showExitConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="anime-card p-8 max-w-sm w-full text-center space-y-6"
              >
                <h3 className="text-2xl font-black italic text-black">確定要退出嗎？</h3>
                <p className="font-bold text-slate-600">未儲存的進度將會遺失喔！</p>
                <div className="flex gap-4">
                  <button 
                    onClick={confirmExit}
                    className="flex-1 bg-red-500 text-white font-black py-3 anime-button"
                  >
                    退出
                  </button>
                  <button 
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 bg-white text-black font-black py-3 anime-button"
                  >
                    取消
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {mode === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-12 py-4"
            >
              <div className="relative inline-block">
                <motion.div
                  animate={{ rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="bg-yellow-400 anime-border p-6 rounded-3xl relative z-10"
                >
                  <h1 className="text-5xl md:text-7xl font-black text-black tracking-tighter uppercase italic">
                    夢幻學園 <br />
                    <span className="text-white anime-text-shadow">學習冒險起點</span>
                  </h1>
                </motion.div>
                <div className="absolute -top-6 -right-6 bg-red-500 text-white anime-border px-4 py-2 rounded-full font-bold rotate-12 z-20">
                  冒險開始!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Workshop Mode */}
                <motion.div 
                  whileHover={{ y: -10 }}
                  onClick={() => setMode('workshop')}
                  className="anime-card p-8 bg-gradient-to-br from-purple-400 to-pink-500 space-y-6 cursor-pointer"
                >
                  <div className="bg-white/20 p-4 rounded-2xl inline-block">
                    <GraduationCap size={48} className="text-white fill-white" />
                  </div>
                  <h2 className="text-3xl font-black text-white anime-text-shadow">乘法練功坊</h2>
                  <p className="text-white/90 font-bold">一步步引導你如何計算兩位數乘法！</p>
                  <button className="w-full bg-white text-black font-black py-4 rounded-xl anime-button hover:bg-purple-100">
                    開始練功
                  </button>
                </motion.div>

                {/* Practice Mode */}
                <motion.div 
                  whileHover={{ y: -10 }}
                  onClick={() => setMode('practice')}
                  className="anime-card p-8 bg-gradient-to-br from-blue-400 to-indigo-500 space-y-6 cursor-pointer"
                >
                  <div className="bg-white/20 p-4 rounded-2xl inline-block">
                    <BookOpen size={48} className="text-white fill-white" />
                  </div>
                  <h2 className="text-3xl font-black text-white anime-text-shadow">九九乘法修練場</h2>
                  <p className="text-white/90 font-bold">解鎖神秘表格！答對題目才能看見隱藏的乘積。</p>
                  <button className="w-full bg-white text-black font-black py-4 rounded-xl anime-button hover:bg-blue-100">
                    進入修練
                  </button>
                </motion.div>

                {/* Adventure Mode */}
                <motion.div 
                  whileHover={{ y: -10 }}
                  className="anime-card p-8 bg-gradient-to-br from-orange-400 to-yellow-500 space-y-6"
                >
                  <div className="bg-white/20 p-4 rounded-2xl inline-block">
                    <Zap size={48} className="text-white fill-white" />
                  </div>
                  <h2 className="text-3xl font-black text-white anime-text-shadow">熱血大冒險</h2>
                  <p className="text-white/90 font-bold">挑戰 50 道難題，每題限時 30 秒！</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((g) => (
                      <button
                        key={g}
                        onClick={() => handleStartAdventure(g as Grade)}
                        className="bg-white text-black font-black py-3 rounded-xl anime-button hover:bg-yellow-100"
                      >
                        {g} 年級
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>

              <div className="comic-bubble p-6 max-w-md mx-auto">
                <p className="font-black text-lg text-black">
                  「{playerName}，現在就開始挑戰乘法，贏得屬於你的星星勳章吧！」
                </p>
              </div>
            </motion.div>
          )}

          {mode === 'workshop' && (
            <motion.div
              key="workshop"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button onClick={handleBack} className="anime-button bg-white p-3">
                  <ArrowLeft size={24} className="text-black" />
                </button>
                <h2 className="text-3xl font-black italic text-white anime-text-shadow">乘法練功坊</h2>
                <div className="w-12"></div>
              </div>

              <div className="anime-card p-8 bg-white/95 max-w-2xl mx-auto space-y-8">
                {workshopProblem && (
                  <div className="space-y-8">
                    {/* Vertical Layout Display */}
                    <div className="flex justify-center items-end font-mono text-7xl font-black text-black tracking-widest relative py-12">
                      <div className="text-right space-y-2">
                        {/* Carry Indicator */}
                        <div className="h-12 flex justify-end pr-12">
                          {workshopStep > 1 && (
                            <motion.div
                              initial={{ scale: 0, y: 10 }}
                              animate={{ scale: 1, y: 0 }}
                              className="text-3xl text-blue-500 bg-blue-50 px-2 rounded-lg border-2 border-blue-200"
                            >
                              {Math.floor(((workshopProblem.n1 % 10) * workshopProblem.n2) / 10)}
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Top Number */}
                        <div className="flex justify-end gap-4">
                          <span className={workshopStep === 2 ? "text-blue-600 scale-110 transition-all" : ""}>
                            {Math.floor(workshopProblem.n1 / 10)}
                          </span>
                          <span className={workshopStep === 1 ? "text-orange-600 scale-110 transition-all" : ""}>
                            {workshopProblem.n1 % 10}
                          </span>
                        </div>

                        {/* Bottom Number */}
                        <div className="flex justify-end items-center gap-4">
                          <span className="text-4xl text-slate-400">×</span>
                          <span className="text-purple-600">{workshopProblem.n2}</span>
                        </div>

                        {/* Line */}
                        <div className="h-2 bg-black w-full rounded-full"></div>

                        {/* Result Line */}
                        <div className="flex justify-end gap-4 h-20">
                          {(workshopStep === 2 && workshopFeedback === 'correct') ? (
                            <motion.span 
                              initial={{ opacity: 0, y: 10 }} 
                              animate={{ opacity: 1, y: 0 }}
                              className="text-green-600"
                            >
                              {(Math.floor(workshopProblem.n1 / 10) * workshopProblem.n2) + Math.floor(((workshopProblem.n1 % 10) * workshopProblem.n2) / 10)}
                            </motion.span>
                          ) : (
                            <span className="text-slate-200">?</span>
                          )}
                          
                          {(workshopStep > 1 || (workshopStep === 1 && workshopFeedback === 'correct')) ? (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-green-600"
                            >
                              {((workshopProblem.n1 % 10) * workshopProblem.n2) % 10}
                            </motion.span>
                          ) : (
                            <span className="text-slate-200">?</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={workshopStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200"
                        >
                          <h3 className="text-xl font-black text-blue-900 mb-4 flex items-center gap-2">
                            <Zap className="text-blue-500" />
                            {workshopStep === 1 && "第一步：個位數相乘"}
                            {workshopStep === 2 && "第二步：十位數相乘並加上進位"}
                          </h3>

                          <p className="text-lg font-bold text-slate-700 mb-6">
                            {workshopStep === 1 && (
                              <span>
                                請計算 <span className="text-orange-600 text-2xl">{workshopProblem.n2} × {workshopProblem.n1 % 10}</span> 是多少？
                              </span>
                            )}
                            {workshopStep === 2 && (
                              <span>
                                很好！接著計算 <span className="text-blue-600 text-2xl">{workshopProblem.n2} × {Math.floor(workshopProblem.n1 / 10)}</span>，
                                再加上剛才進位的 <span className="text-blue-500 text-2xl">{Math.floor(((workshopProblem.n1 % 10) * workshopProblem.n2) / 10)}</span>，
                                答案是多少？
                              </span>
                            )}
                          </p>

                          <div className="flex gap-4">
                            <input
                              type="number"
                              value={workshopInput}
                              onChange={(e) => setWorkshopInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleWorkshopAnswer()}
                              placeholder="輸入答案"
                              className="flex-1 text-center text-3xl font-black p-4 bg-white anime-border focus:ring-4 focus:ring-blue-200 outline-none rounded-xl text-black"
                              autoFocus
                            />
                            <button
                              onClick={handleWorkshopAnswer}
                              className="bg-blue-500 text-white font-black px-8 py-4 anime-button text-xl"
                            >
                              確認
                            </button>
                          </div>

                          <AnimatePresence>
                            {workshopFeedback === 'correct' && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="mt-4 text-green-600 font-black flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 /> 答對了！
                              </motion.div>
                            )}
                            {workshopFeedback === 'wrong' && (
                              <motion.div
                                initial={{ x: -10 }}
                                animate={{ x: [10, -10, 10, -10, 0] }}
                                className="mt-4 text-red-500 font-black flex items-center justify-center gap-2"
                              >
                                <XCircle /> 唔... 再想一下喔！
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {mode === 'practice' && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button onClick={handleBack} className="anime-button bg-white p-3">
                  <ArrowLeft size={24} className="text-black" />
                </button>
                <h2 className="text-3xl font-black italic text-white anime-text-shadow">九九乘法修練場</h2>
                <div className="w-12"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="anime-card p-6 bg-white/95">
                  <div className="grid grid-cols-10 gap-1 md:gap-2">
                    <div className="bg-slate-100 aspect-square flex items-center justify-center font-black text-slate-400 rounded text-xs">X</div>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                      <div key={n} className="bg-yellow-100 aspect-square flex items-center justify-center font-black rounded text-xs text-black">{n}</div>
                    ))}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(row => (
                      <Fragment key={row}>
                        <div className="bg-blue-100 aspect-square flex items-center justify-center font-black rounded text-xs text-black">{row}</div>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(col => {
                          const isUnlocked = unlockedPractice.has(`${row}x${col}`);
                          return (
                            <div
                              key={`${row}x${col}`}
                              className={`aspect-square flex items-center justify-center text-xs md:text-sm font-bold rounded border ${
                                isUnlocked ? 'bg-orange-500 text-white border-black' : 'bg-slate-50 border-slate-200 text-transparent'
                              }`}
                            >
                              {isUnlocked ? row * col : '?'}
                            </div>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                  <div className="mt-4 text-center text-xs font-bold text-slate-400 italic">
                    * 答對左側題目即可解鎖對應格子 *
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="anime-card p-8 bg-white flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
                    <div className="absolute top-4 left-4 text-slate-100"><Calculator size={100} /></div>
                    
                    <h3 className="text-2xl font-black mb-6 relative z-10 italic text-black">熱血修練題！</h3>
                    
                    {practiceQuestion && (
                      <div className="text-center space-y-6 relative z-10 w-full">
                        <div className="text-6xl font-black text-black flex items-center justify-center gap-3 italic">
                          <span>{practiceQuestion.n1}</span>
                          <span className="text-orange-500">×</span>
                          <span>{practiceQuestion.n2}</span>
                          <span className="text-slate-400">=</span>
                          <span className="text-orange-500">?</span>
                        </div>

                        <div className="max-w-[200px] mx-auto space-y-4">
                          <input
                            type="number"
                            value={practiceInput}
                            onChange={(e) => setPracticeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePracticeAnswer()}
                            placeholder="答"
                            className="w-full text-center text-4xl font-black p-3 bg-slate-50 anime-border focus:bg-white outline-none rounded-xl text-black"
                          />
                          <button
                            onClick={handlePracticeAnswer}
                            className="w-full bg-blue-500 text-white font-black py-3 anime-button text-xl"
                          >
                            擊破!!
                          </button>
                        </div>

                        <AnimatePresence>
                          {practiceFeedback === 'correct' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="text-green-500 font-black text-xl flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 size={24} /> 成功解鎖表格！
                            </motion.div>
                          )}
                          {practiceFeedback === 'wrong' && (
                            <motion.div
                              initial={{ x: -10 }}
                              animate={{ x: [10, -10, 10, -10, 0] }}
                              className="text-red-500 font-black text-xl flex items-center justify-center gap-2"
                            >
                              <XCircle size={24} /> 力量不足！再試試！
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-400 anime-card p-6">
                    <h4 className="font-black text-xl mb-4 flex items-center gap-2 text-black">
                      <Zap size={20} className="fill-black" /> 修練秘笈
                    </h4>
                    <ul className="space-y-2 font-bold text-black/80">
                      <li>• 2 的倍數都是偶數喔！</li>
                      <li>• 5 的倍數尾數一定是 0 或 5。</li>
                      <li>• 9 的倍數，各位數相加也會是 9 的倍數！</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {mode === 'adventure' && gameStatus === 'playing' && currentQuestion && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between bg-white/90 anime-border p-4 rounded-2xl">
                <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <ArrowLeft className="text-black" />
                </button>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full anime-border ${timeLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-black'}`}>
                    <Timer size={20} />
                    <span className="font-black text-xl">{timeLeft}s</span>
                  </div>
                  <div className="text-lg font-black italic text-black">
                    STAGE {currentIndex + 1} / 50
                  </div>
                </div>
                <div className="w-10"></div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-slate-200 anime-border h-6 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-orange-500 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / 50) * 100}%` }}
                  />
                </div>
                {/* Timer Bar */}
                <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className={`${timeLeft <= 5 ? 'bg-red-500' : 'bg-blue-500'} h-full`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / 30) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              </div>

              <div className="anime-card p-8 md:p-16 text-center space-y-12 relative overflow-hidden">
                {feedback === 'correct' && (
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute inset-0 bg-yellow-400/95 flex flex-col items-center justify-center z-10"
                  >
                    <div className="text-8xl font-black text-white anime-text-shadow mb-4">GREAT!</div>
                    <CheckCircle2 size={100} className="text-white" />
                  </motion.div>
                )}

                {feedback === 'timeout' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-red-500/95 flex flex-col items-center justify-center z-10"
                  >
                    <div className="text-8xl font-black text-white anime-text-shadow mb-4">TIME OUT!</div>
                    <AlertTriangle size={100} className="text-white mb-4" />
                    <p className="text-white text-2xl font-black">超時扣除 1 顆星！</p>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="text-7xl md:text-9xl font-black text-black tracking-tighter flex items-center justify-center gap-6 italic">
                    <span>{currentQuestion.num1}</span>
                    <span className="text-orange-500 text-5xl md:text-7xl">×</span>
                    <span>{currentQuestion.num2}</span>
                  </div>
                </div>

                <div className="max-w-md mx-auto space-y-6">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="number"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAnswer()}
                      placeholder="?"
                      className="w-full text-center text-6xl font-black p-6 bg-slate-50 anime-border focus:bg-white outline-none transition-all rounded-2xl text-black"
                      autoFocus
                      disabled={feedback !== null}
                    />
                    <div className="absolute -top-4 -left-4 bg-black text-white px-4 py-1 font-black italic rounded-lg">ANSWER</div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={handleAnswer}
                      disabled={!userInput || feedback !== null}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white font-black text-2xl py-6 anime-button shadow-orange-900/20"
                    >
                      擊破!!
                    </button>
                    <button
                      onClick={handleShowAnswer}
                      disabled={feedback !== null}
                      className="p-6 bg-white anime-button text-black group disabled:opacity-50"
                      title="查看解答 (扣1顆星)"
                    >
                      <Lightbulb className="group-hover:fill-yellow-400" size={32} />
                    </button>
                  </div>
                </div>

                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-red-50 anime-border rounded-2xl inline-block"
                  >
                    <span className="text-red-900 font-black text-xl">奧義揭曉：</span>
                    <span className="text-4xl font-black text-red-600 ml-2">{currentQuestion.answer}</span>
                    <button 
                      onClick={nextQuestion}
                      className="ml-6 bg-black text-white px-6 py-2 rounded-xl font-black hover:bg-slate-800 transition-colors"
                    >
                      下一關 <ChevronRight size={20} className="inline" />
                    </button>
                  </motion.div>
                )}

                {feedback === 'wrong' && (
                  <motion.div
                    initial={{ x: -10 }}
                    animate={{ x: [10, -10, 10, -10, 0] }}
                    className="text-red-600 font-black text-2xl flex items-center justify-center gap-2"
                  >
                    <XCircle size={32} /> 唔... 力量不足! 再試一次!
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {gameStatus === 'finished' && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-12"
            >
              <div className="relative inline-block">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy size={160} className="text-yellow-400 drop-shadow-[0_10px_0_rgba(0,0,0,0.2)]" />
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Star size={40} className="text-white fill-white animate-ping" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-6xl font-black italic text-white anime-text-shadow">MISSION COMPLETE!</h2>
                <p className="text-2xl font-bold text-slate-400">
                  你在 {grade} 年級的修練中一共奪得了
                </p>
                <div className="flex items-center justify-center gap-4 text-8xl font-black text-orange-500 my-8">
                  <Star size={80} className="fill-orange-500" />
                  <span className="anime-text-shadow text-white">{stars}</span>
                </div>
              </div>

              <div className="flex flex-col gap-6 max-w-sm mx-auto">
                <button
                  onClick={handleRestart}
                  className="w-full bg-orange-500 text-white font-black text-2xl py-6 anime-button shadow-orange-900/20 flex items-center justify-center gap-3"
                >
                  <RefreshCcw size={24} /> 再次修練
                </button>
                <button
                  onClick={handleBack}
                  className="w-full bg-white text-black font-black text-2xl py-6 anime-button"
                >
                  回到基地
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
