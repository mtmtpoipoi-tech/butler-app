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
    butlerMessage: '「まずは肩の力を抜いて、25分間だけ私と一緒に集中いたしましょう。」',
  },
  deep50: {
    name: 'ディープワーク (50分/10分)',
    workSeconds: 50 * 60,
    breakSeconds: 10 * 60,
    butlerMessage: '「50分の本格的な集中ですね。主様の背中、私が見守っております。」',
  },
  min60: {
    name: '60分 集中',
    workSeconds: 60 * 60,
    breakSeconds: null,
    butlerMessage: '「1時間の長丁場です。無理をなさらず、マイペースに進めてくださいね。」',
  },
  min90: {
    name: '90分 集中',
    workSeconds: 90 * 60,
    breakSeconds: null,
    butlerMessage: '「1時間半ですね。途中で水分補給も忘れないようにお願いいたします。」',
  },
  min180: {
    name: '180分 超集中',
    workSeconds: 180 * 60,
    breakSeconds: null,
    butlerMessage: '「3時間……！大変な覚悟ですね。主様のお供を、喜んでさせていただきます。」',
  },
};

interface BgmOption {
  id: string;
  name: string;
  file: string;
}

const BGM_LIST: BgmOption[] = [
  { id: 'yukidoke', name: '雪解けの頃 / ruha', file: '/yukidoke.mp4' },
  { id: 'departure', name: 'Departure / メインBGM', file: '/Departure_7651.mp3' },
];

const ACTIVITY_LIST = ['勉強', '仕事', '作業', '読書', '創作'];

interface TodoItem {
  category: string;
  content: string;
  ok: boolean;
}

export default function TimerPage() {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<TimerMode>('pomodoro25');
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(MODES.pomodoro25.workSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(MODES.pomodoro25.butlerMessage);
  const [selectedActivity, setSelectedActivity] = useState<string>('勉強');

  const [dateTimeStr, setDateTimeStr] = useState<string>('');
  const [activitySeconds, setActivitySeconds] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const [selectedBgm, setSelectedBgm] = useState<string>(BGM_LIST[0].file);
  const [isPlayingBgm, setIsPlayingBgm] = useState<boolean>(false);
  
  // 📋 「本日の作業」モーダルの開閉状態
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [activityLogs, setActivityLogs] = useState<Record<string, Record<string, number>>>({});
  const [memoText, setMemoText] = useState<string>('');
  const [impressionText, setImpressionText] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [newCategory, setNewCategory] = useState<string>('教科・カテゴリ');
  const [newContent, setNewContent] = useState<string>('');
  const [dateInfo, setDateInfo] = useState({ month: 9, date: 23, day: '火' });

  const hours = [
    '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    '21:00', '22:00', '23:00', '24:00', '1:00', '2:00', '3:00', '4:00'
  ];

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getTodayLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  useEffect(() => {
    setIsMounted(true);
    setIsTransitioning(false);

    const now = new Date();
    setDateInfo({
      month: now.getMonth() + 1,
      date: now.getDate(),
      day: ['日', '月', '火', '水', '木', '金', '土'][now.getDay()]
    });

    const todayStr = getTodayLocalDateStr();
    const savedDate = localStorage.getItem('butler_master_activity_date');
    const savedData = localStorage.getItem('butler_master_activity_seconds');

    if (savedDate === todayStr && savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // 安全に数値化してセット
        const cleaned: Record<string, number> = {};
        for (const k in parsed) {
          const val = Number(parsed[k]);
          cleaned[k] = isNaN(val) ? 0 : val;
        }
        setActivitySeconds(cleaned);
      } catch (e) {
        setActivitySeconds({});
      }
    } else {
      setActivitySeconds({});
      localStorage.setItem('butler_master_activity_date', todayStr);
      localStorage.setItem('butler_master_activity_seconds', JSON.stringify({}));
    }

    // スケジュール用データのロード
    const savedLogs = localStorage.getItem('butler_master_activity_detail_logs');
    if (savedLogs) {
      try { setActivityLogs(JSON.parse(savedLogs)); } catch (e) {}
    }
    const savedMemo = localStorage.getItem('butler_schedule_memo');
    if (savedMemo) setMemoText(savedMemo);
    const savedImpression = localStorage.getItem('butler_schedule_impression');
    if (savedImpression) setImpressionText(savedImpression);
    const savedRating = localStorage.getItem('butler_schedule_rating');
    if (savedRating) setRating(Number(savedRating) || 0);
    const savedTodos = localStorage.getItem('butler_schedule_todos');
    if (savedTodos) {
      try { setTodoList(JSON.parse(savedTodos)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const day = dayNames[now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setDateTimeStr(`${year}年${month}月${date}日 (${day}) ${hours}:${minutes}:${seconds}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigateHome = (e: React.MouseEvent) => {
    e.preventDefault();
    stopBgmWithFadeOut(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        router.push('/');
      }, 400);
    });
  };

  const playCountdownAudio = () => {
    try {
      const audio = new Audio('/dragon-studio-bell-ring-390294.mp3');
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const playFinishAudio = () => {
    try {
      const audio = new Audio('/dragon-studio-bell-ring-390294.mp3');
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const playBgmWithFadeIn = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => {
        setIsPlayingBgm(true);
        let vol = 0;
        const fadeInInterval = setInterval(() => {
          vol += 0.05;
          if (vol >= 1) {
            if (audioRef.current) audioRef.current.volume = 1;
            clearInterval(fadeInInterval);
          } else {
            if (audioRef.current) audioRef.current.volume = vol;
          }
        }, 150);
      }).catch(() => {});
    }
  };

  const stopBgmWithFadeOut = (onComplete?: () => void) => {
    if (audioRef.current && isPlayingBgm) {
      let vol = audioRef.current.volume;
      const fadeOutInterval = setInterval(() => {
        vol -= 0.05;
        if (vol <= 0) {
          if (audioRef.current) {
            audioRef.current.volume = 0;
            audioRef.current.pause();
          }
          setIsPlayingBgm(false);
          clearInterval(fadeOutInterval);
          if (onComplete) onComplete();
        } else {
          if (audioRef.current) audioRef.current.volume = vol;
        }
      }, 150);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingBgm(false);
      if (onComplete) onComplete();
    }
  };

  useEffect(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(MODES[currentMode].workSeconds);
    setMessage(MODES[currentMode].butlerMessage);
    stopBgmWithFadeOut();
  }, [currentMode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      if (timeLeft === 3) {
        playCountdownAudio();
      }

      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        if (!isBreak) {
          const curLifetime = Number(localStorage.getItem('butler_lifetime_seconds') || '0');
          localStorage.setItem('butler_lifetime_seconds', String((isNaN(curLifetime) ? 0 : curLifetime) + 1));

          setActivitySeconds((prev) => {
            const currentVal = Number(prev[selectedActivity]) || 0;
            const nextVal = currentVal + 1;
            const nextObj = { ...prev, [selectedActivity]: nextVal };
            const todayStr = getTodayLocalDateStr();
            localStorage.setItem('butler_master_activity_date', todayStr);
            localStorage.setItem('butler_master_activity_seconds', JSON.stringify(nextObj));

            const now = new Date();
            const hour = now.getHours();
            const timeKey = `${hour}:00`;

            const logsStr = localStorage.getItem('butler_master_activity_detail_logs');
            let logs = logsStr ? JSON.parse(logsStr) : {};
            
            if (!logs[timeKey]) {
              logs[timeKey] = {};
            }
            const currentActSecs = Number(logs[timeKey][selectedActivity]) || 0;
            logs[timeKey][selectedActivity] = currentActSecs + 1;

            localStorage.setItem('butler_master_activity_detail_logs', JSON.stringify(logs));
            setActivityLogs({ ...logs });

            return nextObj;
          });
        }
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playFinishAudio();
      stopBgmWithFadeOut();

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
  }, [isRunning, timeLeft, isBreak, currentMode, isPlayingBgm, selectedActivity]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      playBgmWithFadeIn();
    } else {
      setIsRunning(false);
      stopBgmWithFadeOut();
    }
  };

  const toggleBgmManually = () => {
    if (isPlayingBgm) {
      stopBgmWithFadeOut();
    } else {
      playBgmWithFadeIn();
    }
  };

  const handleBgmChange = (newFile: string) => {
    setSelectedBgm(newFile);
    if (audioRef.current) {
      audioRef.current.src = newFile;
      if (isPlayingBgm || isRunning) {
        playBgmWithFadeIn();
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(MODES[currentMode].workSeconds);
    setMessage(MODES[currentMode].butlerMessage);
    stopBgmWithFadeOut();
  };

  const renderActivitySummary = () => {
    const entries = Object.entries(activitySeconds).filter(([_, secs]) => (Number(secs) || 0) > 0);
    if (entries.length === 0) return '0分';
    return entries.map(([act, secs]) => {
      const safeSecs = Number(secs) || 0;
      return `${act} ${Math.floor(safeSecs / 60)}分`;
    }).join(' ');
  };

  const updateMemo = (val: string) => {
    setMemoText(val);
    localStorage.setItem('butler_schedule_memo', val);
  };
  const updateImpression = (val: string) => {
    setImpressionText(val);
    localStorage.setItem('butler_schedule_impression', val);
  };
  const updateRating = (val: number) => {
    setRating(val);
    localStorage.setItem('butler_schedule_rating', String(val));
  };
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const next = [...todoList, { category: newCategory.trim() || '全般', content: newContent.trim(), ok: false }];
    setTodoList(next);
    localStorage.setItem('butler_schedule_todos', JSON.stringify(next));
    setNewContent('');
  };
  const toggleTodoOk = (index: number) => {
    const next = [...todoList];
    next[index].ok = !next[index].ok;
    setTodoList(next);
    localStorage.setItem('butler_schedule_todos', JSON.stringify(next));
  };
  const deleteTodo = (index: number) => {
    const next = todoList.filter((_, i) => i !== index);
    setTodoList(next);
    localStorage.setItem('butler_schedule_todos', JSON.stringify(next));
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
        .gothic-btn:active { transform: translateY(1px); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(0, 0, 0, 0.4); }
      `}</style>

      <audio ref={audioRef} src={selectedBgm} loop />

      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: "url('/485142.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="w-full mb-3 flex justify-between items-center">
            <a href="/" onClick={handleNavigateHome} className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50 cursor-pointer">
              ← エントランスへ
            </a>
            <button onClick={() => setIsScheduleModalOpen(true)} className="text-xs text-[#F3ECD8] font-bold hover:brightness-110 flex items-center gap-1 bg-[#A46D37]/90 px-3 py-1.5 rounded-lg border border-[#BB8632] shadow-lg cursor-pointer">
              📋 本日の作業
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
            <span className="text-xs font-semibold tracking-wider opacity-80">本日の集中実績</span>
            <span className="text-sm font-bold tracking-wide text-[#BB8632]">{isMounted ? renderActivitySummary() : '0分'}</span>
          </div>

          <div className="w-full rounded-3xl p-8 shadow-2xl text-center backdrop-blur-md" style={{ backgroundColor: 'rgba(86, 27, 36, 0.92)', border: '1px solid #BB8632' }}>
            <h1 className="text-2xl font-bold mb-1 tracking-wide">{isBreak ? '休憩時間' : MODES[currentMode].name}</h1>
            <p className="text-xs mb-4 tracking-wider opacity-70">{isBreak ? '次のセッションに向けてリラックスしてください' : '主様の集中をサポートいたします'}</p>

            {!isBreak && (
              <div className="mb-6 flex justify-center items-center gap-1.5 flex-wrap">
                <span className="text-xs text-[#BB8632] mr-1">内容:</span>
                {ACTIVITY_LIST.map((activity) => {
                  const isSelected = selectedActivity === activity;
                  return (
                    <button
                      key={activity}
                      onClick={() => setSelectedActivity(activity)}
                      className="px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer"
                      style={{ backgroundColor: isSelected ? '#BB8632' : '#3B1218', color: isSelected ? '#240A0E' : '#F3ECD8', border: '1px solid #BB8632', opacity: isSelected ? 1 : 0.8 }}
                    >
                      {activity}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="text-5xl font-extrabold tracking-widest mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              {formatTime(timeLeft)}
            </div>

            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={toggleTimer}
                className="gothic-btn px-8 py-3 rounded-xl text-lg font-bold tracking-wider cursor-pointer"
                style={{ background: isRunning ? 'linear-gradient(180deg, #6B212B 0%, #4A171F 100%)' : 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)', color: '#F3ECD8', border: '1px solid #BB8632' }}
              >
                {isRunning ? '一時停止' : (isBreak ? '休憩開始' : `${selectedActivity}開始`)}
              </button>
              <button
                onClick={handleReset}
                className="gothic-btn px-6 py-3 rounded-xl text-lg font-bold tracking-wider cursor-pointer"
                style={{ background: 'linear-gradient(180deg, #3B1218 0%, #240A0E 100%)', color: '#F3ECD8', border: '1px solid rgba(187, 134, 50, 0.5)' }}
              >
                リセット
              </button>
            </div>

            <div className="border-t pt-6 mb-6" style={{ borderColor: 'rgba(187, 134, 50, 0.3)' }}>
              <p className="text-xs mb-3 text-left tracking-wider opacity-70">モード選択</p>
              <div className="grid grid-cols-1 gap-2.5">
                {(Object.keys(MODES) as TimerMode[]).map((modeKey) => {
                  const isSelected = currentMode === modeKey && !isBreak;
                  return (
                    <button
                      key={modeKey}
                      onClick={() => setCurrentMode(modeKey)}
                      className="gothic-btn w-full py-3 px-4 rounded-xl text-base font-medium text-left transition cursor-pointer"
                      style={{ background: isSelected ? 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)' : 'linear-gradient(180deg, #3B1218 0%, #2A0C11 100%)', color: '#F3ECD8', opacity: isSelected ? 1 : 0.8, border: isSelected ? '1px solid #BB8632' : '1px solid rgba(187, 134, 50, 0.3)' }}
                    >
                      {MODES[modeKey].name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full rounded-2xl p-3 shadow-inner backdrop-blur-md flex items-center justify-between gap-2 border-t pt-4" style={{ borderColor: 'rgba(187, 134, 50, 0.3)' }}>
              <select
                value={selectedBgm}
                onChange={(e) => handleBgmChange(e.target.value)}
                className="text-sm rounded-xl px-3 py-2 outline-none cursor-pointer flex-1"
                style={{ backgroundColor: '#3B1218', color: '#F3ECD8', border: '1px solid #BB8632' }}
              >
                {BGM_LIST.map((bgm) => (
                  <option key={bgm.id} value={bgm.file} style={{ backgroundColor: '#3B1218', color: '#F3ECD8' }}>
                    {bgm.name}
                  </option>
                ))}
              </select>

              <button
                onClick={toggleBgmManually}
                className="gothic-btn w-11 h-11 rounded-xl text-sm font-semibold transition flex items-center justify-center flex-shrink-0 cursor-pointer"
                style={{ background: isPlayingBgm ? 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)' : 'linear-gradient(180deg, #4A171F 100%, #351016 100%)', color: '#F3ECD8', border: '1px solid #BB8632' }}
                title={isPlayingBgm ? 'BGMを停止' : 'BGMを再生'}
              >
                <span className="text-base font-bold">{isPlayingBgm ? '❚❚' : '▶'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* 📋 「本日の作業」手帳モーダル */}
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border bg-[#2B0C12] border-[#BB8632] text-[#F3ECD8] relative">
              
              <div className="flex justify-between items-center border-b border-[#BB8632]/40 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-widest text-[#F3ECD8]">TODAY'S SCHEDULE</h2>
                  <div className="flex items-center gap-1.5 bg-[#3B1218] px-3 py-1 rounded-full border border-[#BB8632]/50 text-xs">
                    <span className="text-base font-bold text-[#BB8632]">{dateInfo.month}</span>月
                    <span className="text-base font-bold text-[#BB8632]">{dateInfo.date}</span>日
                    <span className="font-bold text-[#F3ECD8] ml-1">({dateInfo.day})</span>
                  </div>
                </div>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-xs text-[#BB8632] hover:underline font-bold px-3 py-1.5 bg-[#3B1218] rounded-lg border border-[#BB8632]/50 cursor-pointer">
                  手帳を閉じる ✕
                </button>
              </div>

              {/* MEMO */}
              <div className="mb-5 bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40">
                <p className="text-[10px] text-[#BB8632] tracking-widest mb-1 font-bold">MEMO / 本日の目標</p>
                <input
                  type="text"
                  value={memoText}
                  onChange={(e) => updateMemo(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#F3ECD8] outline-none border-b border-[#BB8632]/30 pb-1 placeholder-[#F3ECD8]/30"
                  placeholder="ここに本日の目標やメモを入力..."
                />
              </div>

              {/* 2カラム */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 左：ToDo */}
                <div className="lg:col-span-6 bg-[#23090E] p-4 rounded-xl border border-[#BB8632]/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#BB8632]/40 pb-2 mb-3">
                      <span className="text-xs font-bold text-[#BB8632] tracking-wider">✏️ To do list</span>
                      <span className="text-[10px] text-[#F3ECD8]/60">OK!</span>
                    </div>

                    <form onSubmit={handleAddTodo} className="flex gap-1.5 mb-3">
                      <input
                        type="text"
                        placeholder="カテゴリ"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-24 px-2 py-1 rounded bg-[#3B1218] border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none placeholder-[#F3ECD8]/30"
                      />
                      <input
                        type="text"
                        placeholder="内容を入力..."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        className="flex-1 px-2 py-1 rounded bg-[#3B1218] border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none placeholder-[#F3ECD8]/30"
                      />
                      <button type="submit" className="px-3 py-1 bg-[#BB8632] text-[#1A070B] font-bold text-xs rounded hover:bg-[#D49E4B] transition cursor-pointer">
                        追加
                      </button>
                    </form>

                    <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-1">
                      {todoList.length > 0 ? (
                        todoList.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-[#3B1218]/60 p-2 rounded border border-[#BB8632]/20 group">
                            <span className="text-[10px] bg-[#BB8632] text-[#1A070B] px-1.5 py-0.5 rounded font-bold shrink-0">{item.category}</span>
                            <span className={`text-xs text-[#F3ECD8] flex-1 ${item.ok ? 'line-through opacity-50' : ''}`}>{item.content}</span>
                            <button
                              onClick={() => toggleTodoOk(idx)}
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition cursor-pointer ${item.ok ? 'bg-[#BB8632] text-[#1A070B]' : 'bg-[#1A070B] text-[#BB8632] border border-[#BB8632]/50'}`}
                            >
                              {item.ok ? '✓' : ''}
                            </button>
                            <button onClick={() => deleteTodo(idx)} className="text-[10px] text-red-400 hover:underline px-1 cursor-pointer opacity-60 hover:opacity-100">
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#F3ECD8]/40 italic py-4 text-center">To do listを追加してください</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40">
                    <p className="text-xs font-bold text-[#BB8632] mb-1.5">⏱️ 本日の合計集中時間</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(activitySeconds).filter(([_, s]) => (Number(s) || 0) > 0).length > 0 ? (
                        Object.entries(activitySeconds).map(([act, secs]) => {
                          const safeSecs = Number(secs) || 0;
                          return (
                            <div key={act} className="bg-[#2B0C12] px-2.5 py-1 rounded border border-[#BB8632]/30 text-xs">
                              <span className="text-[#BB8632] font-bold">{act}:</span> {Math.floor(safeSecs / 60)}分
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-[#F3ECD8]/50 italic">本日のタイマー記録はまだありません</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右：Time schedule（作業の足跡） */}
                <div className="lg:col-span-6 bg-[#23090E] p-4 rounded-xl border border-[#BB8632]/30 max-h-[400px] overflow-y-auto">
                  <div className="border-b border-[#BB8632]/40 pb-2 mb-3 sticky top-0 bg-[#23090E] z-10 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#BB8632] tracking-wider">🕒 Time schedule (作業の足跡)</span>
                    <span className="text-[10px] text-[#F3ECD8]/60">自動記録中</span>
                  </div>

                  <div className="space-y-1.5">
                    {hours.map((h) => {
                      const hourLogs = activityLogs[h];
                      return (
                        <div key={h} className="flex items-center text-xs py-1.5 border-b border-[#BB8632]/10">
                          <span className="w-14 font-mono text-[#BB8632] font-bold">{h}</span>
                          <div className="flex-1 min-h-[26px] bg-[#3B1218]/40 px-3 py-1 rounded border border-[#BB8632]/20 flex items-center flex-wrap gap-1.5">
                            {hourLogs && Object.keys(hourLogs).length > 0 ? (
                              Object.entries(hourLogs).map(([act, secs]) => {
                                const safeSecs = Number(secs) || 0;
                                const mins = Math.max(1, Math.floor(safeSecs / 60));
                                return (
                                  <span key={act} className="bg-[#BB8632] text-[#1A070B] px-2 py-0.5 rounded text-[11px] font-bold">
                                    {act} {mins}分
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

              {/* 振り返り */}
              <div className="mt-5 bg-[#23090E] p-4 rounded-xl border border-[#BB8632]/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="w-full sm:w-3/4">
                  <p className="text-[10px] text-[#BB8632] tracking-widest mb-1 font-bold">TODAY'S IMPRESSION (本日の振り返り)</p>
                  <input
                    type="text"
                    value={impressionText}
                    onChange={(e) => updateImpression(e.target.value)}
                    className="w-full bg-[#3B1218] px-3 py-2 rounded border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none placeholder-[#F3ECD8]/30"
                    placeholder="本日の感想や反省を自由に入力してください..."
                  />
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => updateRating(star)}
                      className={`text-2xl cursor-pointer transition ${star <= rating ? 'text-[#BB8632]' : 'text-white/20'}`}
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