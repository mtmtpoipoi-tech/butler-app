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
    const todayStr = getTodayLocalDateStr();
    const savedDate = localStorage.getItem('butler_master_activity_date');
    const savedData = localStorage.getItem('butler_master_activity_seconds');

    if (savedDate === todayStr && savedData) {
      try {
        setActivitySeconds(JSON.parse(savedData));
      } catch (e) {
        setActivitySeconds({});
      }
    } else {
      setActivitySeconds({});
      localStorage.setItem('butler_master_activity_date', todayStr);
      localStorage.setItem('butler_master_activity_seconds', JSON.stringify({}));
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
    stopBgmWithFadeOut();
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  const playCountdownAudio = () => {
    const audio = new Audio('/dragon-studio-bell-ring-390294.mp3');
    audio.volume = 1.0;
    audio.play().catch(() => {});
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
        if (isPlayingBgm) {
          stopBgmWithFadeOut();
        }
        playCountdownAudio();
      }

      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        if (!isBreak) {
          setActivitySeconds((prev) => {
            const currentVal = prev[selectedActivity] || 0;
            const nextVal = currentVal + 1;
            const nextObj = { ...prev, [selectedActivity]: nextVal };
            const todayStr = getTodayLocalDateStr();
            localStorage.setItem('butler_master_activity_date', todayStr);
            localStorage.setItem('butler_master_activity_seconds', JSON.stringify(nextObj));
            return nextObj;
          });
        }
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
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
    const entries = Object.entries(activitySeconds).filter(([_, secs]) => secs > 0);
    if (entries.length === 0) {
      return '0分';
    }
    return entries.map(([act, secs]) => {
      const totalMins = Math.floor(secs / 60);
      return `${act} ${totalMins}分`;
    }).join(' ');
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');
        
        body, button, select, input, p, span, h1, div {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }

        .gothic-btn {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease-in-out;
        }
        
        .gothic-btn:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }

        .gothic-btn:active {
          transform: translateY(1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.8), inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }
      `}</style>

      <audio ref={audioRef} src={selectedBgm} loop />

      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: "url('/485142.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

        <div
          className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-500 ${
            isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          
          <div className="w-full mb-3 flex justify-start">
            <a 
              href="/" 
              onClick={handleNavigateHome}
              className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50 cursor-pointer"
            >
              ← エントランス（ホーム）へ戻る
            </a>
          </div>

          <div className="w-full rounded-2xl px-5 py-3 mb-4 shadow-2xl backdrop-blur-md text-center" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
            <p className="text-base font-bold tracking-widest" style={{ color: '#F3ECD8' }}>{dateTimeStr || '----年--月--日 (-) --:--:--'}</p>
          </div>

          <div className="w-full rounded-2xl p-4 mb-4 shadow-2xl backdrop-blur-md" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
            <p className="text-xs font-semibold mb-1 tracking-wider" style={{ color: '#F3ECD8', opacity: 0.8 }}>執事からの言葉</p>
            <p className="text-base leading-relaxed" style={{ color: '#F3ECD8' }}>{message}</p>
          </div>

          <div className="w-full rounded-2xl px-5 py-3 mb-6 shadow-2xl backdrop-blur-md flex flex-col gap-1.5" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
            <span className="text-xs font-semibold tracking-wider" style={{ color: '#F3ECD8', opacity: 0.8 }}>本日の集中実績</span>
            <span className="text-sm font-bold tracking-wide" style={{ color: '#BB8632' }}>{isMounted ? renderActivitySummary() : '0分'}</span>
          </div>

          <div className="w-full rounded-3xl p-8 shadow-2xl text-center backdrop-blur-md" style={{ backgroundColor: 'rgba(86, 27, 36, 0.92)', border: '1px solid #BB8632' }}>
            <h1 className="text-2xl font-bold mb-1 tracking-wide" style={{ color: '#F3ECD8' }}>{isBreak ? '休憩時間' : MODES[currentMode].name}</h1>
            <p className="text-xs mb-4 tracking-wider" style={{ color: '#F3ECD8', opacity: 0.7 }}>{isBreak ? '次のセッションに向けてリラックスしてください' : '主様の集中をサポートいたします'}</p>

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

            <div className="text-5xl font-extrabold tracking-widest mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" style={{ color: '#F3ECD8' }}>
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
              <p className="text-xs mb-3 text-left tracking-wider" style={{ color: '#F3ECD8', opacity: 0.7 }}>モード選択</p>
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
      </div>
    </>
  );
}