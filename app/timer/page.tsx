'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type TimerMode = 'pomodoro25' | 'deep50' | 'min60' | 'min90' | 'min180';

interface ModeConfig {
  name: string;
  workSeconds: number;
  breakSeconds: number | null;
  butlerMessage: string;
}

const MODES: Record<TimerMode, ModeConfig> = {
  pomodoro25: {
    name: 'ポモドーロ (25分/5分)',
    workSeconds: 25 * 60,
    breakSeconds: 5 * 60,
    butlerMessage: '「主様の努力の足跡は、一秒たりとも混ざり合うことなく、日付ごとに大切にお守りいたします。」',
  },
  deep50: {
    name: 'ディープワーク (50分/10分)',
    workSeconds: 50 * 60,
    breakSeconds: 10 * 60,
    butlerMessage: '「50分の本格的な集中ですね。主様の勉強時間、責任を持ってお守りいたします。」',
  },
  min60: {
    name: '60分 集中',
    workSeconds: 60 * 60,
    breakSeconds: null,
    butlerMessage: '「1時間の長丁場です。マイペースに、確実に積み上げていきましょう。」',
  },
  min90: {
    name: '90分 集中',
    workSeconds: 90 * 60,
    breakSeconds: null,
    butlerMessage: '「1時間半ですね。途中の水分補給も忘れずになさってくださいね。」',
  },
  min180: {
    name: '180分 超集中',
    workSeconds: 180 * 60,
    breakSeconds: null,
    butlerMessage: '「3時間……！大変な覚悟ですね。主様の歩みを全力でサポートいたします。」',
  },
};

const BGM_LIST = [
  { id: 'yukidoke', name: '雪解けの頃 / ruha', file: '/yukidoke.mp4' },
  { id: 'departure', name: 'Departure / メインBGM', file: '/Departure_7651.mp3' },
  { id: 'rain', name: '🌧️ 雨音 (Lofi Rain)', file: '/source-2.mp4' },
];

const ACTIVITY_LIST = ['勉強', '仕事', '作業', '読書', '創作'];

interface TodoItem {
  category: string;
  content: string;
  ok: boolean;
}

// 🛠️ デフォルト引数をなくし、ビルド時のエラーを完全に回避する日付変換関数
const getLocalDateStr = (d: Date) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function TimerPage() {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<TimerMode>('pomodoro25');
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(MODES.pomodoro25.workSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(MODES.pomodoro25.butlerMessage);
  const [selectedActivity, setSelectedActivity] = useState<string>('勉強');

  const [dateTimeStr, setDateTimeStr] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isFadingToBlack, setIsFadingToBlack] = useState<boolean>(false);

  const [selectedBgm, setSelectedBgm] = useState<string>(BGM_LIST[0].file);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  
  const [viewDateStr, setViewDateStr] = useState<string>('');
  
  const [allActivitySeconds, setAllActivitySeconds] = useState<Record<string, Record<string, number>>>({});
  const [allActivityLogs, setAllActivityLogs] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [allMemos, setAllMemos] = useState<Record<string, string>>({});
  const [allImpressions, setAllImpressions] = useState<Record<string, string>>({});
  const [allRatings, setAllRatings] = useState<Record<string, number>>({});
  const [allTodos, setAllTodos] = useState<Record<string, TodoItem[]>>({});

  const [newCategory, setNewCategory] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');

  const hours = [
    '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    '21:00', '22:00', '23:00', '24:00', '1:00', '2:00', '3:00', '4:00'
  ];

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const today = getLocalDateStr(new Date());
    setViewDateStr(today);

    try {
      const sSecs = localStorage.getItem('butler_all_activity_seconds');
      if (sSecs) setAllActivitySeconds(JSON.parse(sSecs));
      const sLogs = localStorage.getItem('butler_all_activity_detail_logs');
      if (sLogs) setAllActivityLogs(JSON.parse(sLogs));
      const sMemos = localStorage.getItem('butler_all_schedule_memos');
      if (sMemos) setAllMemos(JSON.parse(sMemos));
      const sImps = localStorage.getItem('butler_all_schedule_impressions');
      if (sImps) setAllImpressions(JSON.parse(sImps));
      const sRates = localStorage.getItem('butler_all_schedule_ratings');
      if (sRates) setAllRatings(JSON.parse(sRates));
      const sTodos = localStorage.getItem('butler_all_schedule_todos');
      if (sTodos) setAllTodos(JSON.parse(sTodos));
    } catch (e) {}
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      setDateTimeStr(`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 (${days[now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigateHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (audioRef.current) audioRef.current.pause();
    setIsTransitioning(true);
    setTimeout(() => router.push('/'), 400);
  };

  useEffect(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(MODES[currentMode].workSeconds);
    setMessage(MODES[currentMode].butlerMessage);
  }, [currentMode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });

        if (!isBreak) {
          const curTodayStr = getLocalDateStr(new Date());
          const curLife = Number(localStorage.getItem('butler_lifetime_seconds') || '0');
          localStorage.setItem('butler_lifetime_seconds', String(curLife + 1));

          setAllActivitySeconds((prev) => {
            const dayObj = prev[curTodayStr] || {};
            const nextDay = { ...dayObj, [selectedActivity]: (Number(dayObj[selectedActivity]) || 0) + 1 };
            const nextAll = { ...prev, [curTodayStr]: nextDay };
            localStorage.setItem('butler_all_activity_seconds', JSON.stringify(nextAll));
            return nextAll;
          });

          const hourKey = `${new Date().getHours()}:00`;
          setAllActivityLogs((prev) => {
            const dayLogs = prev[curTodayStr] || {};
            const hLog = dayLogs[hourKey] || {};
            const nextHLog = { ...hLog, [selectedActivity]: (Number(hLog[selectedActivity]) || 0) + 1 };
            const nextDayLogs = { ...dayLogs, [hourKey]: nextHLog };
            const nextAllLogs = { ...prev, [curTodayStr]: nextDayLogs };
            localStorage.setItem('butler_all_activity_detail_logs', JSON.stringify(nextAllLogs));
            return nextAllLogs;
          });
        }
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      try { new Audio('/dragon-studio-bell-ring-390294.mp3').play().catch(() => {}); } catch (e) {}

      if (isBreak) {
        setMessage('「休憩時間が終了しました。また一緒に頑張りましょう、主様。」');
        setIsBreak(false);
        setTimeLeft(MODES[currentMode].workSeconds);
      } else if (MODES[currentMode].breakSeconds !== null) {
        setMessage('「お疲れ様でした！素晴らしい集中力です。少し休憩になさってください。」');
        setIsBreak(true);
        setTimeLeft(MODES[currentMode].breakSeconds);
      } else {
        setMessage('「お疲れ様でした！見事な集中力でしたね。本当によく頑張りました。」');
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isBreak, currentMode, selectedActivity]);

  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const toggleTimer = () => {
    setIsFadingToBlack(true);
    setTimeout(() => {
      setIsRunning(!isRunning);
      setIsFadingToBlack(false);
    }, 400);
  };

  const handleReset = () => {
    setIsFadingToBlack(true);
    setTimeout(() => {
      setIsRunning(false);
      setIsBreak(false);
      setTimeLeft(MODES[currentMode].workSeconds);
      setMessage(MODES[currentMode].butlerMessage);
      setIsFadingToBlack(false);
    }, 400);
  };

  const renderTodaySummary = () => {
    const curTodayStr = getLocalDateStr(new Date());
    const obj = allActivitySeconds[curTodayStr] || {};
    const entries = Object.entries(obj).filter(([_, s]) => (Number(s) || 0) > 0);
    if (entries.length === 0) return '0分 (0秒)';
    return entries.map(([act, s]) => {
      const totalSec = Number(s) || 0;
      const m = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${act} ${m}分(${sec}秒)`;
    }).join(' ');
  };

  const handleShiftDateByDays = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setViewDateStr(getLocalDateStr(d));
  };

  const updateMemo = (val: string) => {
    if (!viewDateStr) return;
    const next = { ...allMemos, [viewDateStr]: val };
    setAllMemos(next);
    localStorage.setItem('butler_all_schedule_memos', JSON.stringify(next));
  };
  const updateImpression = (val: string) => {
    if (!viewDateStr) return;
    const next = { ...allImpressions, [viewDateStr]: val };
    setAllImpressions(next);
    localStorage.setItem('butler_all_schedule_impressions', JSON.stringify(next));
  };
  const updateRating = (val: number) => {
    if (!viewDateStr) return;
    const next = { ...allRatings, [viewDateStr]: val };
    setAllRatings(next);
    localStorage.setItem('butler_all_schedule_ratings', JSON.stringify(next));
  };
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewDateStr || !newContent.trim()) return;
    const cur = allTodos[viewDateStr] || [];
    const nextTodos = [...cur, { category: newCategory.trim() || '全般', content: newContent.trim(), ok: false }];
    const nextAll = { ...allTodos, [viewDateStr]: nextTodos };
    setAllTodos(nextAll);
    localStorage.setItem('butler_all_schedule_todos', JSON.stringify(nextAll));
    setNewContent('');
  };
  const toggleTodoOk = (idx: number) => {
    if (!viewDateStr) return;
    const cur = [...(allTodos[viewDateStr] || [])];
    cur[idx].ok = !cur[idx].ok;
    const nextAll = { ...allTodos, [viewDateStr]: cur };
    setAllTodos(nextAll);
    localStorage.setItem('butler_all_schedule_todos', JSON.stringify(nextAll));
  };
  const deleteTodo = (idx: number) => {
    if (!viewDateStr) return;
    const cur = (allTodos[viewDateStr] || []).filter((_, i) => i !== idx);
    const nextAll = { ...allTodos, [viewDateStr]: cur };
    setAllTodos(nextAll);
    localStorage.setItem('butler_all_schedule_todos', JSON.stringify(nextAll));
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&family=Cinzel:wght@400;600;700&display=swap');
        body, button, select, input, textarea, p, span, h1, div {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }
        .gothic-btn {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease-in-out;
        }
        .gothic-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .gothic-btn:active { transform: translateY(1px); }
        audio { height: 32px; border-radius: 8px; filter: invert(0.9) hue-rotate(180deg); width: 100%; }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: isRunning ? "url('/window-forest.jpg')" : "url('/485142.jpg')" }}
      >
        <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out ${isRunning ? 'bg-black/10' : 'bg-black/40 backdrop-blur-[1px]'}`} />
        
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-400 ease-in-out ${isFadingToBlack ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-400 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

        {isRunning ? (
          <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center px-4 py-8">
            <div className="absolute top-4 left-6 flex items-center gap-3">
              <button onClick={toggleTimer} type="button" className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#F3ECD8] bg-black/50 hover:bg-black/70 border border-[#BB8632]/60 backdrop-blur-md cursor-pointer shadow-lg z-20">
                ⏸ 一時停止して設定へ戻る
              </button>
            </div>

            <div className="mb-8 max-w-md bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#BB8632]/40 shadow-2xl">
              <p className="text-sm sm:text-base leading-relaxed text-[#F3ECD8] font-serif">{message}</p>
            </div>

            <div className="my-6">
              <p className="text-xl sm:text-2xl font-bold tracking-widest text-[#F3ECD8] mb-2">{dateTimeStr || '----年--月--日 (-) --:--:--'}</p>
              <div className="text-7xl sm:text-9xl font-extrabold tracking-widest text-[#F3ECD8] my-4 font-serif">{formatTime(timeLeft)}</div>
              <p className="text-sm sm:text-base tracking-widest text-[#BB8632] font-bold">現在取り組中：{selectedActivity}</p>
            </div>

            <div className="mt-8 w-full max-w-sm rounded-2xl p-3.5 backdrop-blur-md flex flex-col gap-3 bg-black/70 border border-[#BB8632]/50 shadow-2xl z-20">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#F3ECD8] tracking-wider mb-1">🎵 BGM プレイヤー</span>
                <select
                  value={selectedBgm}
                  onChange={(e) => setSelectedBgm(e.target.value)}
                  className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer bg-black/85 text-[#F3ECD8] border border-[#BB8632]/50 mb-1"
                >
                  {BGM_LIST.map((b) => <option key={b.id} value={b.file}>{b.name}</option>)}
                </select>
                <audio ref={audioRef} src={selectedBgm} controls loop preload="auto" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 w-full max-w-md flex flex-col items-center">
            <div className="w-full mb-3 flex justify-between items-center">
              <a href="/" onClick={handleNavigateHome} className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50 cursor-pointer">
                ← エントランスへ
              </a>
              <button onClick={() => setIsScheduleModalOpen(true)} type="button" className="text-xs text-[#F3ECD8] font-bold hover:brightness-110 flex items-center gap-1 bg-[#A46D37]/90 px-3 py-1.5 rounded-lg border border-[#BB8632] shadow-lg cursor-pointer">
                📋 作業記録手帳 (過去ログ)
              </button>
            </div>

            <div className="w-full rounded-2xl px-5 py-3 mb-4 shadow-2xl backdrop-blur-md text-center" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
              <p className="text-base font-bold tracking-widest">{dateTimeStr || '----年--月--日 (-) --:--:--'}</p>
            </div>

            <div className="w-full rounded-2xl p-4 mb-4 shadow-2xl backdrop-blur-md" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
              <p className="text-xs font-semibold mb-1 tracking-wider opacity-80">執事からの言葉</p>
              <p className="text-base leading-relaxed">{message}</p>
            </div>

            <div className="w-full rounded-2xl px-5 py-3 mb-6 shadow-2xl backdrop-blur-md flex flex-col gap-1.5" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
              <span className="text-xs font-semibold tracking-wider opacity-80">本日の集中実績 (秒単位で保存中)</span>
              <span className="text-sm font-bold tracking-wide text-[#BB8632]">{isMounted ? renderTodaySummary() : '0分 (0秒)'}</span>
            </div>

            <div className="w-full rounded-3xl p-8 shadow-2xl text-center backdrop-blur-md" style={{ backgroundColor: 'rgba(86, 27, 36, 0.92)', border: '1px solid #BB8632' }}>
              <h1 className="text-2xl font-bold mb-1 tracking-wide">{isBreak ? '休憩時間' : MODES[currentMode].name}</h1>
              <p className="text-xs mb-4 tracking-wider opacity-70">{isBreak ? '次のセッションに向けてリラックスしてください' : '主様の集中をサポートいたします'}</p>

              {!isBreak && (
                <div className="mb-6 flex justify-center items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-[#BB8632] mr-1">内容:</span>
                  {ACTIVITY_LIST.map((act) => (
                    <button
                      key={act}
                      onClick={() => setSelectedActivity(act)}
                      type="button"
                      className="px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer"
                      style={{ backgroundColor: selectedActivity === act ? '#BB8632' : '#3B1218', color: selectedActivity === act ? '#240A0E' : '#F3ECD8', border: '1px solid #BB8632' }}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              )}

              <div className="text-5xl font-extrabold tracking-widest mb-8">{formatTime(timeLeft)}</div>

              <div className="flex justify-center space-x-4 mb-8">
                <button onClick={toggleTimer} type="button" className="gothic-btn px-8 py-3 rounded-xl text-lg font-bold tracking-wider cursor-pointer" style={{ background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)', color: '#F3ECD8', border: '1px solid #BB8632' }}>
                  {isBreak ? '休憩開始' : `${selectedActivity}開始`}
                </button>
                <button onClick={handleReset} type="button" className="gothic-btn px-6 py-3 rounded-xl text-lg font-bold tracking-wider cursor-pointer" style={{ background: 'linear-gradient(180deg, #3B1218 0%, #240A0E 100%)', color: '#F3ECD8', border: '1px solid rgba(187, 134, 50, 0.5)' }}>
                  リセット
                </button>
              </div>

              <div className="border-t pt-6 mb-6" style={{ borderColor: 'rgba(187, 134, 50, 0.3)' }}>
                <p className="text-xs mb-3 text-left tracking-wider opacity-70">モード選択</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {(Object.keys(MODES) as TimerMode[]).map((mk) => (
                    <button
                      key={mk}
                      onClick={() => setCurrentMode(mk)}
                      type="button"
                      className="gothic-btn w-full py-3 px-4 rounded-xl text-base font-medium text-left transition cursor-pointer"
                      style={{ background: currentMode === mk && !isBreak ? 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)' : 'linear-gradient(180deg, #3B1218 0%, #2A0C11 100%)', color: '#F3ECD8', border: currentMode === mk && !isBreak ? '1px solid #BB8632' : '1px solid rgba(187, 134, 50, 0.3)' }}
                    >
                      {MODES[mk].name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full rounded-2xl p-3 shadow-inner backdrop-blur-md flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'rgba(187, 134, 50, 0.3)' }}>
                <span className="text-xs text-[#F3ECD8]/85 tracking-wider text-left">🎵 BGM セレクター</span>
                <select
                  value={selectedBgm}
                  onChange={(e) => setSelectedBgm(e.target.value)}
                  className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer bg-[#3B1218] text-[#F3ECD8] border border-[#BB8632] mb-1"
                >
                  {BGM_LIST.map((b) => <option key={b.id} value={b.file}>{b.name}</option>)}
                </select>
                <audio ref={audioRef} src={selectedBgm} controls loop preload="auto" />
              </div>
            </div>
          </div>
        )}

        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl border bg-[#2B0C12] border-[#BB8632] text-[#F3ECD8] relative">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#BB8632]/40 pb-3 mb-4 gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h2 className="text-base sm:text-xl font-bold tracking-widest text-[#F3ECD8]">WORK LOG & SCHEDULE</h2>
                  
                  <div className="flex items-center gap-1.5 bg-[#3B1218] px-3 py-1.5 rounded-lg border border-[#BB8632]">
                    <button onClick={() => handleShiftDateByDays(-2)} type="button" className="text-xs bg-[#2B0C12] text-[#BB8632] px-2 py-0.5 rounded font-bold hover:bg-[#BB8632] hover:text-[#1A070B] transition cursor-pointer">一昨日</button>
                    <button onClick={() => handleShiftDateByDays(-1)} type="button" className="text-xs bg-[#2B0C12] text-[#BB8632] px-2 py-0.5 rounded font-bold hover:bg-[#BB8632] hover:text-[#1A070B] transition cursor-pointer">昨日</button>
                    <button onClick={() => setViewDateStr(getLocalDateStr(new Date()))} type="button" className="text-xs bg-[#BB8632] text-[#1A070B] px-2.5 py-0.5 rounded font-bold hover:brightness-110 transition cursor-pointer">今日</button>
                  </div>
                </div>

                <button onClick={() => setIsScheduleModalOpen(false)} type="button" className="text-xs text-[#BB8632] hover:underline font-bold px-2.5 py-1.5 bg-[#3B1218] rounded-lg border border-[#BB8632]/50 cursor-pointer shrink-0">
                  閉じる ✕
                </button>
              </div>

              <div className="mb-4 bg-[#A46D37]/20 p-2.5 rounded-xl border border-[#BB8632] text-center">
                <p className="text-xs sm:text-sm font-bold tracking-wider text-[#BB8632]">
                  現在表示している記録の日付： <span className="text-[#F3ECD8] underline text-base ml-1">{viewDateStr}</span>
                </p>
              </div>

              <div className="mb-4 bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40">
                <p className="text-[10px] text-[#BB8632] tracking-widest mb-1 font-bold">MEMO / {viewDateStr} の目標</p>
                <input
                  type="text"
                  value={allMemos[viewDateStr] || ''}
                  onChange={(e) => updateMemo(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#F3ECD8] outline-none border-b border-[#BB8632]/30 pb-1 placeholder-[#F3ECD8]/30"
                  placeholder="この日の目標やメモを入力..."
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-6 bg-[#23090E] p-3.5 rounded-xl border border-[#BB8632]/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#BB8632]/40 pb-2 mb-3">
                      <span className="text-xs font-bold text-[#BB8632] tracking-wider">✏️ To do list</span>
                      <span className="text-[10px] text-[#F3ECD8]/60">{viewDateStr}</span>
                    </div>

                    <form onSubmit={handleAddTodo} className="flex gap-1.5 mb-3 items-center">
                      <input type="text" placeholder="教科" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-16 sm:w-20 px-2 py-1 rounded bg-[#3B1218] border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none" />
                      <input type="text" placeholder="内容を入力..." value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-32 sm:w-44 px-2 py-1 rounded bg-[#3B1218] border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none" />
                      <button type="submit" className="px-2.5 py-1 bg-[#BB8632] text-[#1A070B] font-bold text-xs rounded hover:bg-[#D49E4B] transition cursor-pointer shrink-0">追加</button>
                    </form>

                    <div className="space-y-2 mb-4 max-h-[160px] overflow-y-auto pr-1">
                      {(allTodos[viewDateStr] || []).length > 0 ? (
                        (allTodos[viewDateStr] || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-[#3B1218]/60 p-2 rounded border border-[#BB8632]/20">
                            <span className="text-[10px] bg-[#BB8632] text-[#1A070B] px-1.5 py-0.5 rounded font-bold shrink-0">{item.category}</span>
                            <span className={`text-xs text-[#F3ECD8] flex-1 break-all ${item.ok ? 'line-through opacity-50' : ''}`}>{item.content}</span>
                            <button onClick={() => toggleTodoOk(idx)} type="button" className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold cursor-pointer shrink-0 ${item.ok ? 'bg-[#BB8632] text-[#1A070B]' : 'bg-[#1A070B] text-[#BB8632] border border-[#BB8632]/50'}`}>{item.ok ? '✓' : ''}</button>
                            <button onClick={() => deleteTodo(idx)} type="button" className="text-[10px] text-red-400 hover:underline px-1 cursor-pointer opacity-60">✕</button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#F3ECD8]/40 italic py-4 text-center">この日のTo do listはありません</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40">
                    <p className="text-xs font-bold text-[#BB8632] mb-1.5">⏱️ {viewDateStr} の総集中時間</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(allActivitySeconds[viewDateStr] || {}).filter(([_, s]) => (Number(s) || 0) > 0).length > 0 ? (
                        Object.entries(allActivitySeconds[viewDateStr] || {}).map(([act, s]) => {
                          const totalSec = Number(s) || 0;
                          const m = Math.floor(totalSec / 60);
                          const sec = totalSec % 60;
                          return (
                            <div key={act} className="bg-[#2B0C12] px-2.5 py-1 rounded border border-[#BB8632]/30 text-xs">
                              <span className="text-[#BB8632] font-bold">{act}:</span> {m}分({sec}秒)
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-[#F3ECD8]/50 italic">この日の集中記録はありません</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#23090E] p-3.5 rounded-xl border border-[#BB8632]/30 max-h-[340px] overflow-y-auto">
                  <div className="border-b border-[#BB8632]/40 pb-2 mb-3 sticky top-0 bg-[#23090E] z-10 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#BB8632] tracking-wider">🕒 Time schedule</span>
                    <span className="text-[10px] text-[#F3ECD8]/60">{viewDateStr}</span>
                  </div>

                  <div className="space-y-1.5">
                    {hours.map((h) => {
                      const dayLogs = allActivityLogs[viewDateStr] || {};
                      const hLog = dayLogs[h] || {};
                      const entries = Object.entries(hLog).filter(([_, s]) => Number(s) > 0);

                      return (
                        <div key={h} className="flex items-center text-xs py-1.5 border-b border-[#BB8632]/10">
                          <span className="w-12 sm:w-14 font-mono text-[#BB8632] font-bold shrink-0">{h}</span>
                          <div className="flex-1 min-h-[26px] bg-[#3B1218]/40 px-2.5 py-1 rounded border border-[#BB8632]/20 flex items-center flex-wrap gap-1.5">
                            {entries.length > 0 ? (
                              entries.map(([act, s]) => {
                                const totalSec = Number(s) || 0;
                                const m = Math.floor(totalSec / 60);
                                const sec = totalSec % 60;
                                return (
                                  <span key={act} className="bg-[#BB8632] text-[#1A070B] px-2 py-0.5 rounded text-[11px] font-bold">
                                    {act} {m}分({sec}秒)
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[#F3ECD8]/20">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-[#23090E] p-3.5 rounded-xl border border-[#BB8632]/30 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="w-full sm:w-3/4">
                  <p className="text-[10px] text-[#BB8632] tracking-widest mb-1 font-bold">IMPRESSION / この日の振り返り</p>
                  <input
                    type="text"
                    value={allImpressions[viewDateStr] || ''}
                    onChange={(e) => updateImpression(e.target.value)}
                    className="w-full bg-[#3B1218] px-3 py-2 rounded border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none"
                    placeholder="この日の感想や反省を自由に入力してください..."
                  />
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => updateRating(star)}
                      type="button"
                      className={`text-2xl cursor-pointer transition ${star <= (allRatings[viewDateStr] || 0) ? 'text-[#BB8632]' : 'text-white/20'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}