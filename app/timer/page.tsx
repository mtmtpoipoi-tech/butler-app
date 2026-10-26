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
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isFadingToBlack, setIsFadingToBlack] = useState<boolean>(false);

  const [selectedBgm, setSelectedBgm] = useState<string>(BGM_LIST[0].file);
  const [isPlayingBgm, setIsPlayingBgm] = useState<boolean>(false);
  
  // 🌧️ 雨音の状態 ＆ 天気状態
  const [isPlayingRain, setIsPlayingRain] = useState<boolean>(false);
  const [weatherText, setWeatherText] = useState<string>('お天気確認中');

  // 📋 「本日の作業」＆ 過去ログ閲覧用ステート
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const getTodayLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const [viewDateStr, setViewDateStr] = useState<string>(getTodayLocalDateStr());
  
  // 各データ保存用（日付別管理）
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
  const rainAudioRef = useRef<HTMLAudioElement | null>(null);

  // 🌤️ お天気自動判定（曇り・雨なら初期状態で雨音ON）
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const data = await res.json();
            const weatherCode = data.current_weather?.weathercode;
            
            let isRainOrCloudy = false;
            let desc = '晴れ';

            if (weatherCode === 0) {
              isRainOrCloudy = false;
              desc = '晴れ';
            } else if (weatherCode >= 1 && weatherCode <= 3) {
              isRainOrCloudy = true;
              desc = '曇り';
            } else if (weatherCode >= 51) {
              isRainOrCloudy = true;
              desc = '雨';
            }

            setWeatherText(desc);
            setIsPlayingRain(isRainOrCloudy);
          } catch (e) {
            setWeatherText('晴れ');
            setIsPlayingRain(false);
          }
        },
        () => {
          setWeatherText('晴れ');
          setIsPlayingRain(false);
        },
        { timeout: 5000 }
      );
    } else {
      setWeatherText('晴れ');
      setIsPlayingRain(false);
    }
  }, []);

  // 📂 ローカルストレージからのデータ読み込み（全日付対応）
  useEffect(() => {
    setIsMounted(true);
    setIsTransitioning(false);

    const today = getTodayLocalDateStr();
    setViewDateStr(today);

    try {
      const savedSecs = localStorage.getItem('butler_all_activity_seconds');
      if (savedSecs) setAllActivitySeconds(JSON.parse(savedSecs));

      const savedLogs = localStorage.getItem('butler_all_activity_detail_logs');
      if (savedLogs) setAllActivityLogs(JSON.parse(savedLogs));

      const savedMemos = localStorage.getItem('butler_all_schedule_memos');
      if (savedMemos) setAllMemos(JSON.parse(savedMemos));

      const savedImps = localStorage.getItem('butler_all_schedule_impressions');
      if (savedImps) setAllImpressions(JSON.parse(savedImps));

      const savedRatings = localStorage.getItem('butler_all_schedule_ratings');
      if (savedRatings) setAllRatings(JSON.parse(savedRatings));

      const savedTodos = localStorage.getItem('butler_all_schedule_todos');
      if (savedTodos) setAllTodos(JSON.parse(savedTodos));
    } catch (e) {
      console.log('Load error:', e);
    }
  }, []);

  // 時計の更新
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
    if (audioRef.current) audioRef.current.pause();
    if (rainAudioRef.current) rainAudioRef.current.pause();
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/');
    }, 400);
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

  // 🎵 BGMの手動ON/OFF（確実に同期）
  const toggleBgmManually = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.volume = 1.0;
        audioRef.current.play()
          .then(() => setIsPlayingBgm(true))
          .catch((err) => {
            console.log('BGM play error:', err);
            setIsPlayingBgm(false);
          });
      } else {
        audioRef.current.pause();
        setIsPlayingBgm(false);
      }
    }
  };

  // 🌧️ 雨音の手動ON/OFF（確実に同期）
  const toggleRainManually = () => {
    if (rainAudioRef.current) {
      if (rainAudioRef.current.paused) {
        rainAudioRef.current.volume = 0.8;
        rainAudioRef.current.play()
          .then(() => setIsPlayingRain(true))
          .catch((err) => {
            console.log('Rain play error:', err);
            setIsPlayingRain(false);
          });
      } else {
        rainAudioRef.current.pause();
        setIsPlayingRain(false);
      }
    }
  };

  useEffect(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(MODES[currentMode].workSeconds);
    setMessage(MODES[currentMode].butlerMessage);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingBgm(false);
  }, [currentMode]);

  // ⏱️ タイマー稼働中の処理（本日の日付に自動加算）
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      if (timeLeft === 3) {
        playCountdownAudio();
      }

      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });

        if (!isBreak) {
          const todayStr = getTodayLocalDateStr();
          const curLifetime = Number(localStorage.getItem('butler_lifetime_seconds') || '0');
          localStorage.setItem('butler_lifetime_seconds', String((isNaN(curLifetime) ? 0 : curLifetime) + 1));

          // 本日の実績を更新
          setAllActivitySeconds((prevAll) => {
            const todaySecs = prevAll[todayStr] || {};
            const currentVal = Number(todaySecs[selectedActivity]) || 0;
            const updatedTodaySecs = { ...todaySecs, [selectedActivity]: currentVal + 1 };
            const nextAll = { ...prevAll, [todayStr]: updatedTodaySecs };
            localStorage.setItem('butler_all_activity_seconds', JSON.stringify(nextAll));
            return nextAll;
          });

          // 本日の詳細ログを更新
          const now = new Date();
          const hour = now.getHours();
          const timeKey = `${hour}:00`;

          setAllActivityLogs((prevLogsAll) => {
            const todayLogs = prevLogsAll[todayStr] || {};
            const hourLog = todayLogs[timeKey] || {};
            const currentActSecs = Number(hourLog[selectedActivity]) || 0;
            const updatedHourLog = { ...hourLog, [selectedActivity]: currentActSecs + 1 };
            const updatedTodayLogs = { ...todayLogs, [timeKey]: updatedHourLog };
            const nextLogsAll = { ...prevLogsAll, [todayStr]: updatedTodayLogs };
            localStorage.setItem('butler_all_activity_detail_logs', JSON.stringify(nextLogsAll));
            return nextLogsAll;
          });
        }
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playFinishAudio();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingBgm(false);
      if (rainAudioRef.current) {
        rainAudioRef.current.pause();
      }
      setIsPlayingRain(false);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 🎬 タイマー開始・停止（暗転＆音声同期）
  const toggleTimer = () => {
    if (!isRunning) {
      if (audioRef.current) {
        audioRef.current.volume = 1.0;
        audioRef.current.play().then(() => setIsPlayingBgm(true)).catch(() => {});
      }
      if (rainAudioRef.current && isPlayingRain) {
        rainAudioRef.current.volume = 0.8;
        rainAudioRef.current.play().then(() => setIsPlayingRain(true)).catch(() => {});
      }

      setIsFadingToBlack(true);
      setTimeout(() => {
        setIsRunning(true);
        setIsFadingToBlack(false);
      }, 400);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingBgm(false);

      if (rainAudioRef.current) {
        rainAudioRef.current.pause();
      }
      setIsPlayingRain(false);

      setIsFadingToBlack(true);
      setTimeout(() => {
        setIsRunning(false);
        setIsFadingToBlack(false);
      }, 400);
    }
  };

  const handleBgmChange = (newFile: string) => {
    setSelectedBgm(newFile);
    if (audioRef.current) {
      audioRef.current.src = newFile;
      if (isPlayingBgm || isRunning) {
        audioRef.current.play().then(() => setIsPlayingBgm(true)).catch(() => {});
      }
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingBgm(false);
    if (rainAudioRef.current) {
      rainAudioRef.current.pause();
    }
    setIsPlayingRain(false);

    setIsFadingToBlack(true);
    setTimeout(() => {
      setIsRunning(false);
      setIsBreak(false);
      setTimeLeft(MODES[currentMode].workSeconds);
      setMessage(MODES[currentMode].butlerMessage);
      setIsFadingToBlack(false);
    }, 400);
  };

  const renderActivitySummaryToday = () => {
    const todayStr = getTodayLocalDateStr();
    const todaySecsObj = allActivitySeconds[todayStr] || {};
    const entries = Object.entries(todaySecsObj).filter(([_, secs]) => (Number(secs) || 0) > 0);
    if (entries.length === 0) return '0分';
    return entries.map(([act, secs]) => {
      const safeSecs = Number(secs) || 0;
      return `${act} ${Math.floor(safeSecs / 60)}分`;
    }).join(' ');
  };

  // 📝 各種データの更新関数（選択中の日付 viewDateStr に対して保存）
  const updateMemo = (val: string) => {
    const next = { ...allMemos, [viewDateStr]: val };
    setAllMemos(next);
    localStorage.setItem('butler_all_schedule_memos', JSON.stringify(next));
  };
  const updateImpression = (val: string) => {
    const next = { ...allImpressions, [viewDateStr]: val };
    setAllImpressions(next);
    localStorage.setItem('butler_all_schedule_impressions', JSON.stringify(next));
  };
  const updateRating = (val: number) => {
    const next = { ...allRatings, [viewDateStr]: val };
    setAllRatings(next);
    localStorage.setItem('butler_all_schedule_ratings', JSON.stringify(next));
  };
  
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const currentTodos = allTodos[viewDateStr] || [];
    const nextTodos = [...currentTodos, { category: newCategory.trim() || '全般', content: newContent.trim(), ok: false }];
    const nextAll = { ...allTodos, [viewDateStr]: nextTodos };
    setAllTodos(nextAll);
    localStorage.setItem('butler_all_schedule_todos', JSON.stringify(nextAll));
    setNewContent('');
  };

  const toggleTodoOk = (index: number) => {
    const currentTodos = allTodos[viewDateStr] || [];
    const nextTodos = [...currentTodos];
    nextTodos[index].ok = !nextTodos[index].ok;
    const nextAll = { ...allTodos, [viewDateStr]: nextTodos };
    setAllTodos(nextAll);
    localStorage.setItem('butler_all_schedule_todos', JSON.stringify(nextAll));
  };

  const deleteTodo = (index: number) => {
    const currentTodos = allTodos[viewDateStr] || [];
    const nextTodos = currentTodos.filter((_, i) => i !== index);
    const nextAll = { ...allTodos, [viewDateStr]: nextTodos };
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
        .gothic-btn:active { transform: translateY(1px); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(0, 0, 0, 0.4); }
      `}</style>

      {/* 🎵 音声要素 */}
      <audio ref={audioRef} src={selectedBgm} loop preload="auto" />
      <audio ref={rainAudioRef} src="/source-2.mp4" loop preload="auto" />

      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: isRunning ? "url('/window-forest.jpg')" : "url('/485142.jpg')" }}
      >
        <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out ${isRunning ? 'bg-black/10' : 'bg-black/40 backdrop-blur-[1px]'}`} />
        
        {/* 暗転フェード */}
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-400 ease-in-out ${isFadingToBlack ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-400 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

        {/* 🌟 【集中開始中（isRunning === true）の画面】 */}
        {isRunning ? (
          <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center px-4 py-8">
            
            <div className="absolute top-4 left-6 flex items-center gap-3">
              <button
                onClick={toggleTimer}
                type="button"
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#F3ECD8] bg-black/50 hover:bg-black/70 border border-[#BB8632]/60 backdrop-blur-md cursor-pointer shadow-lg transition z-20"
              >
                ⏸ 一時停止して設定へ戻る
              </button>
            </div>

            <div className="mb-8 max-w-md bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-[#BB8632]/40 shadow-2xl">
              <p className="text-sm sm:text-base leading-relaxed text-[#F3ECD8] font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {message}
              </p>
            </div>

            <div className="my-6">
              <p className="text-xl sm:text-2xl font-bold tracking-widest text-[#F3ECD8] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-2">
                {dateTimeStr || '----年--月--日 (-) --:--:--'}
              </p>
              
              <div className="text-7xl sm:text-9xl font-extrabold tracking-widest text-[#F3ECD8] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] my-4 font-serif">
                {formatTime(timeLeft)}
              </div>
              
              <p className="text-sm sm:text-base tracking-widest text-[#BB8632] font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                現在取り組中：{selectedActivity}
              </p>
            </div>

            {/* BGM ＆ 雨音コントローラー */}
            <div className="mt-12 w-full max-w-sm rounded-2xl p-3 backdrop-blur-md flex flex-col gap-2.5 bg-black/50 border border-[#BB8632]/50 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <select
                  value={selectedBgm}
                  onChange={(e) => handleBgmChange(e.target.value)}
                  className="text-xs rounded-xl px-2 py-1.5 outline-none cursor-pointer flex-1 bg-black/70 text-[#F3ECD8] border border-[#BB8632]/50"
                >
                  {BGM_LIST.map((bgm) => (
                    <option key={bgm.id} value={bgm.file} style={{ backgroundColor: '#1A070B', color: '#F3ECD8' }}>
                      {bgm.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={toggleBgmManually}
                  type="button"
                  className="w-9 h-9 rounded-xl text-xs font-semibold transition flex items-center justify-center flex-shrink-0 cursor-pointer bg-[#A46D37] text-[#F3ECD8] hover:brightness-110 shadow-md z-20"
                  title={isPlayingBgm ? 'BGMを停止' : 'BGMを再生'}
                >
                  <span className="font-bold">{isPlayingBgm ? '❚❚' : '▶'}</span>
                </button>
              </div>

              {/* 🌧️ 確実にON/OFFできる雨音ボタン */}
              <div className="flex items-center justify-between px-2 pt-1 border-t border-[#BB8632]/30">
                <span className="text-xs text-[#F3ECD8] tracking-wider">🌧️ 雨音 ({weatherText})</span>
                <button
                  onClick={toggleRainManually}
                  type="button"
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border z-20 ${isPlayingRain ? 'bg-[#A46D37] text-[#F3ECD8] border-[#BB8632]' : 'bg-black/50 text-[#F3ECD8]/60 border-[#BB8632]/40'}`}
                >
                  {isPlayingRain ? '再生中 (ON)' : '停止中 (OFF)'}
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* 🌟 【通常時（設定・選択画面）】 */
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
              <span className="text-xs font-semibold tracking-wider opacity-80">本日の集中実績</span>
              <span className="text-sm font-bold tracking-wide text-[#BB8632]">{isMounted ? renderActivitySummaryToday() : '0分'}</span>
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
                        type="button"
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
                  type="button"
                  className="gothic-btn px-8 py-3 rounded-xl text-lg font-bold tracking-wider cursor-pointer"
                  style={{ background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)', color: '#F3ECD8', border: '1px solid #BB8632' }}
                >
                  {isBreak ? '休憩開始' : `${selectedActivity}開始`}
                </button>
                <button
                  onClick={handleReset}
                  type="button"
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
                        type="button"
                        className="gothic-btn w-full py-3 px-4 rounded-xl text-base font-medium text-left transition cursor-pointer"
                        style={{ background: isSelected ? 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)' : 'linear-gradient(180deg, #3B1218 0%, #2A0C11 100%)', color: '#F3ECD8', opacity: isSelected ? 1 : 0.8, border: isSelected ? '1px solid #BB8632' : '1px solid rgba(187, 134, 50, 0.3)' }}
                      >
                        {MODES[modeKey].name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full rounded-2xl p-3 shadow-inner backdrop-blur-md flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'rgba(187, 134, 50, 0.3)' }}>
                <div className="flex items-center justify-between gap-2">
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
                    type="button"
                    className="gothic-btn w-11 h-11 rounded-xl text-sm font-semibold transition flex items-center justify-center flex-shrink-0 cursor-pointer"
                    style={{ background: isPlayingBgm ? 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)' : 'linear-gradient(180deg, #4A171F 100%, #351016 100%)', color: '#F3ECD8', border: '1px solid #BB8632' }}
                    title={isPlayingBgm ? 'BGMを停止' : 'BGMを再生'}
                  >
                    <span className="text-base font-bold">{isPlayingBgm ? '❚❚' : '▶'}</span>
                  </button>
                </div>

                {/* 🌧️ 通常時用 雨音ボタン */}
                <div className="flex items-center justify-between px-2 pt-1 border-t border-[#BB8632]/20">
                  <span className="text-xs text-[#F3ECD8]/85 tracking-wider">🌧️ 雨音 ({weatherText})</span>
                  <button
                    onClick={toggleRainManually}
                    type="button"
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border z-20 ${isPlayingRain ? 'bg-[#A46D37] text-[#F3ECD8] border-[#BB8632]' : 'bg-[#3B1218] text-[#F3ECD8]/60 border-[#BB8632]/40'}`}
                  >
                    {isPlayingRain ? '再生中 (ON)' : '停止中 (OFF)'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 📋 「作業記録手帳」モーダル（過去の集中実績・スケジュール閲覧対応） */}
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl border bg-[#2B0C12] border-[#BB8632] text-[#F3ECD8] relative">
              
              {/* ヘッダー ＆ 日付切り替えセレクター */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#BB8632]/40 pb-3 mb-4 gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h2 className="text-base sm:text-xl font-bold tracking-widest text-[#F3ECD8]">WORK LOG & SCHEDULE</h2>
                  
                  {/* 📅 日付選択ピッカー */}
                  <div className="flex items-center gap-1.5 bg-[#3B1218] px-3 py-1 rounded-lg border border-[#BB8632]/60">
                    <span className="text-xs text-[#BB8632] font-bold">日付:</span>
                    <input
                      type="date"
                      value={viewDateStr}
                      onChange={(e) => setViewDateStr(e.target.value)}
                      className="bg-transparent text-xs text-[#F3ECD8] outline-none cursor-pointer font-bold"
                    />
                    <button
                      onClick={() => setViewDateStr(getTodayLocalDateStr())}
                      type="button"
                      className="text-[10px] bg-[#BB8632] text-[#1A070B] px-1.5 py-0.5 rounded font-bold hover:brightness-110 ml-1"
                    >
                      今日
                    </button>
                  </div>
                </div>

                <button onClick={() => setIsScheduleModalOpen(false)} type="button" className="text-xs text-[#BB8632] hover:underline font-bold px-2.5 py-1.5 bg-[#3B1218] rounded-lg border border-[#BB8632]/50 cursor-pointer shrink-0">
                  閉じる ✕
                </button>
              </div>

              {/* MEMO */}
              <div className="mb-4 bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40">
                <p className="text-[10px] text-[#BB8632] tracking-widest mb-1 font-bold">MEMO / この日の目標 ({viewDateStr})</p>
                <input
                  type="text"
                  value={allMemos[viewDateStr] || ''}
                  onChange={(e) => updateMemo(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#F3ECD8] outline-none border-b border-[#BB8632]/30 pb-1 placeholder-[#F3ECD8]/30"
                  placeholder="この日の目標やメモを入力..."
                />
              </div>

              {/* 2カラム */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* 左：ToDoリスト ＆ 選択日付の集中時間 */}
                <div className="lg:col-span-6 bg-[#23090E] p-3.5 rounded-xl border border-[#BB8632]/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#BB8632]/40 pb-2 mb-3">
                      <span className="text-xs font-bold text-[#BB8632] tracking-wider">✏️ To do list ({viewDateStr})</span>
                      <span className="text-[10px] text-[#F3ECD8]/60">OK!</span>
                    </div>

                    <form onSubmit={handleAddTodo} className="flex gap-1.5 mb-3 items-center">
                      <input
                        type="text"
                        placeholder="教科"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-16 sm:w-20 px-2 py-1 rounded bg-[#3B1218] border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none placeholder-[#F3ECD8]/30 shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="内容を入力..."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        className="w-32 sm:w-44 px-2 py-1 rounded bg-[#3B1218] border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none placeholder-[#F3ECD8]/30 shrink-0"
                      />
                      <button type="submit" className="px-2.5 py-1 bg-[#BB8632] text-[#1A070B] font-bold text-xs rounded hover:bg-[#D49E4B] transition cursor-pointer shrink-0">
                        追加
                      </button>
                    </form>

                    <div className="space-y-2 mb-4 max-h-[180px] overflow-y-auto pr-1">
                      {(allTodos[viewDateStr] || []).length > 0 ? (
                        (allTodos[viewDateStr] || []).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-[#3B1218]/60 p-2 rounded border border-[#BB8632]/20 group">
                            <span className="text-[10px] bg-[#BB8632] text-[#1A070B] px-1.5 py-0.5 rounded font-bold shrink-0">{item.category}</span>
                            <span className={`text-xs text-[#F3ECD8] flex-1 break-all ${item.ok ? 'line-through opacity-50' : ''}`}>{item.content}</span>
                            <button
                              onClick={() => toggleTodoOk(idx)}
                              type="button"
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition cursor-pointer shrink-0 ${item.ok ? 'bg-[#BB8632] text-[#1A070B]' : 'bg-[#1A070B] text-[#BB8632] border border-[#BB8632]/50'}`}
                            >
                              {item.ok ? '✓' : ''}
                            </button>
                            <button onClick={() => deleteTodo(idx)} type="button" className="text-[10px] text-red-400 hover:underline px-1 cursor-pointer opacity-60 hover:opacity-100 shrink-0">
                              ✕
                            </button>
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
                        Object.entries(allActivitySeconds[viewDateStr] || {}).map(([act, secs]) => {
                          const safeSecs = Number(secs) || 0;
                          return (
                            <div key={act} className="bg-[#2B0C12] px-2.5 py-1 rounded border border-[#BB8632]/30 text-xs">
                              <span className="text-[#BB8632] font-bold">{act}:</span> {Math.floor(safeSecs / 60)}分
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-[#F3ECD8]/50 italic">この日の集中記録はありません</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 右：Time schedule (選択日付の足跡) */}
                <div className="lg:col-span-6 bg-[#23090E] p-3.5 rounded-xl border border-[#BB8632]/30 max-h-[360px] overflow-y-auto">
                  <div className="border-b border-[#BB8632]/40 pb-2 mb-3 sticky top-0 bg-[#23090E] z-10 flex justify-between items-center">
                    <span className="text-xs font-bold text-[#BB8632] tracking-wider">🕒 Time schedule ({viewDateStr})</span>
                    <span className="text-[10px] text-[#F3ECD8]/60">記録データ</span>
                  </div>

                  <div className="space-y-1.5">
                    {hours.map((h) => {
                      const dayLogs = allActivityLogs[viewDateStr] || {};
                      const hourLogs = dayLogs[h] || {};
                      
                      const mergedLogs: Record<string, number> = {};
                      Object.entries(hourLogs).forEach(([act, secs]) => {
                        if (!act || act.includes('minutes') || act.includes('NaN')) return;
                        const safeSecs = Number(secs) || 0;
                        mergedLogs[act] = (mergedLogs[act] || 0) + safeSecs;
                      });

                      const logEntries = Object.entries(mergedLogs).filter(([_, secs]) => secs > 0);

                      return (
                        <div key={h} className="flex items-center text-xs py-1.5 border-b border-[#BB8632]/10">
                          <span className="w-12 sm:w-14 font-mono text-[#BB8632] font-bold shrink-0">{h}</span>
                          <div className="flex-1 min-h-[26px] bg-[#3B1218]/40 px-2.5 py-1 rounded border border-[#BB8632]/20 flex items-center flex-wrap gap-1.5">
                            {logEntries.length > 0 ? (
                              logEntries.map(([act, secs]) => {
                                const mins = Math.max(1, Math.floor(secs / 60));
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
              <div className="mt-4 bg-[#23090E] p-3.5 rounded-xl border border-[#BB8632]/30 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="w-full sm:w-3/4">
                  <p className="text-[10px] text-[#BB8632] tracking-widest mb-1 font-bold">IMPRESSION / この日の振り返り ({viewDateStr})</p>
                  <input
                    type="text"
                    value={allImpressions[viewDateStr] || ''}
                    onChange={(e) => updateImpression(e.target.value)}
                    className="w-full bg-[#3B1218] px-3 py-2 rounded border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none placeholder-[#F3ECD8]/30"
                    placeholder="この日の感想や反省を自由に入力してください..."
                  />
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const currentRating = allRatings[viewDateStr] || 0;
                    return (
                      <button
                        key={star}
                        onClick={() => updateRating(star)}
                        type="button"
                        className={`text-2xl cursor-pointer transition ${star <= currentRating ? 'text-[#BB8632]' : 'text-white/20'}`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}