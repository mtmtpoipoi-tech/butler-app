'use client';

import React, { useState, useEffect, useRef } from 'react';

type Mode = 'pomodoro' | 'deepwork' | 'rest';

const MODE_CONFIG = {
  pomodoro: { name: 'ポモドーロ', workSec: 25 * 60, restSec: 5 * 60, bgm: '/Departure_7651.mp3' },
  deepwork: { name: 'ディープワーク', workSec: 60 * 60, restSec: 10 * 60, bgm: '/Departure_7651.mp3' },
  rest: { name: '休憩', workSec: 5 * 60, restSec: 0, bgm: '' },
};

const BUTLER_MESSAGES = {
  idle: '「主様、本日のご集中のお手伝いをさせていただきます。ご準備が整いましたら開始をお命じください。」',
  work: '「まずは肩の力を抜いて、集中いたしましょう。私も傍で見守っております。」',
  rest: '「お見事でございます、主様。しばしお茶でも召し上がって、お体を休めくださいませ。」',
};

export default function Home() {
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [isRestMode, setIsRestMode] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(MODE_CONFIG.pomodoro.workSec);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [totalFocusSec, setTotalFocusSec] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // リアルタイム時計（日本時間）
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      }) + ' ' + now.toLocaleTimeString('ja-JP', { hour12: false });
      setCurrentTime(formatted);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // タイマーのカウントダウン処理
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        if (!isRestMode) {
          setTotalFocusSec((prev) => prev + 1);
        }
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // モード切り替え（作業終了 -> 休憩 / 休憩終了 -> 作業）
      if (!isRestMode) {
        setIsRestMode(true);
        setTimeLeft(MODE_CONFIG[mode].restSec);
      } else {
        setIsRestMode(false);
        setTimeLeft(MODE_CONFIG[mode].workSec);
        setIsRunning(false);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isRestMode, mode]);

  // BGMの再生・停止制御
  useEffect(() => {
    if (isRunning && !isRestMode && MODE_CONFIG[mode].bgm) {
      if (!audioRef.current) {
        audioRef.current = new Audio(MODE_CONFIG[mode].bgm);
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {});
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isRunning, isRestMode, mode]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsRestMode(false);
    setTimeLeft(MODE_CONFIG[mode].workSec);
  };

  const handleModeChange = (newMode: Mode) => {
    setIsRunning(false);
    setIsRestMode(false);
    setMode(newMode);
    setTimeLeft(MODE_CONFIG[newMode].workSec);
  };

  // フォーマット用関数
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}時間 ${m}分 ${s}秒` : `${m}分 ${s}秒`;
  };

  // 執事の台詞判定
  const butlerMessage = !isRunning
    ? BUTLER_MESSAGES.idle
    : isRestMode
    ? BUTLER_MESSAGES.rest
    : BUTLER_MESSAGES.work;

  return (
    <main className="min-h-screen bg-[#561B24] text-[#E0D3C1] font-serif flex flex-col items-center justify-between p-4 sm:p-6 select-none overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col gap-4 my-auto">
        
        {/* 現在日時・時計 */}
        <div className="bg-[#3D131A]/80 border border-[#BB8632] rounded-lg p-3 text-center shadow-lg backdrop-blur-sm">
          <p className="text-xs sm:text-sm tracking-wider text-[#C49A45] font-medium">{currentTime || '---'}</p>
        </div>

        {/* 執事からの言葉 */}
        <div className="bg-[#3D131A]/80 border border-[#BB8632] rounded-lg p-4 text-center shadow-lg backdrop-blur-sm min-h-[90px] flex flex-col justify-center">
          <p className="text-xs text-[#BB8632] mb-1 font-bold tracking-widest">執事からの言葉</p>
          <p className="text-sm leading-relaxed italic text-[#EAE0D5] font-light">{butlerMessage}</p>
        </div>

        {/* 本日の総集中時間 */}
        <div className="bg-[#3D131A]/80 border border-[#BB8632] rounded-lg p-3 px-5 flex justify-between items-center shadow-lg backdrop-blur-sm">
          <span className="text-xs sm:text-sm text-[#BB8632]">本日の総集中時間</span>
          <span className="text-sm sm:text-base font-bold text-[#E0D3C1] font-mono">{formatTotalTime(totalFocusSec)}</span>
        </div>

        {/* メインタイマーエリア */}
        <div className="bg-[#3D131A]/90 border-2 border-[#BB8632] rounded-xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* 装飾アクセント */}
          <div className="absolute top-2 left-2 text-[#BB8632]/40 text-xs">◆</div>
          <div className="absolute top-2 right-2 text-[#BB8632]/40 text-xs">◆</div>
          <div className="absolute bottom-2 left-2 text-[#BB8632]/40 text-xs">◆</div>
          <div className="absolute bottom-2 right-2 text-[#BB8632]/40 text-xs">◆</div>

          <h2 className="text-lg sm:text-xl font-bold text-[#BB8632] mb-1 tracking-widest">
            {isRestMode ? '【 休憩時間 】' : MODE_CONFIG[mode].name}
          </h2>
          <p className="text-xs text-[#A88B68] mb-6">
            {isRestMode ? 'お体を休めてリフレッシュください' : '主様の集中をサポートいたします'}
          </p>

          {/* タイマーカウントダウン（数字のブレを防ぐためにfont-mono指定） */}
          <div className="text-5xl sm:text-6xl font-extrabold font-mono text-[#F4EAD4] tracking-wider mb-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {formatTime(timeLeft)}
          </div>

          {/* 操作ボタン */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleStartPause}
              className="flex-1 max-w-[130px] py-3 rounded-lg bg-[#8A5A2D] hover:bg-[#A36C37] active:bg-[#6E4622] text-[#F4EAD4] font-bold text-sm tracking-widest border border-[#BB8632] shadow-md transition-all active:scale-95"
            >
              {isRunning ? '一時停止' : '集中開始'}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 max-w-[130px] py-3 rounded-lg bg-[#3D131A] hover:bg-[#521C25] active:bg-[#2A0C12] text-[#A88B68] hover:text-[#E0D3C1] text-sm tracking-widest border border-[#BB8632]/60 shadow-md transition-all active:scale-95"
            >
              リセット
            </button>
          </div>
        </div>

        {/* モード選択ボタン */}
        <div className="bg-[#3D131A]/80 border border-[#BB8632] rounded-lg p-3 grid grid-cols-2 gap-3 shadow-lg backdrop-blur-sm">
          <button
            onClick={() => handleModeChange('pomodoro')}
            className={`py-2.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all border ${
              mode === 'pomodoro'
                ? 'bg-[#8A5A2D] text-[#F4EAD4] border-[#BB8632] shadow-inner font-bold'
                : 'bg-[#2B0C12]/60 text-[#A88B68] border-transparent hover:text-[#E0D3C1]'
            }`}
          >
            ポモドーロ (25分)
          </button>
          <button
            onClick={() => handleModeChange('deepwork')}
            className={`py-2.5 px-3 rounded-md text-xs sm:text-sm font-medium transition-all border ${
              mode === 'deepwork'
                ? 'bg-[#8A5A2D] text-[#F4EAD4] border-[#BB8632] shadow-inner font-bold'
                : 'bg-[#2B0C12]/60 text-[#A88B68] border-transparent hover:text-[#E0D3C1]'
            }`}
          >
            ディープワーク (60分)
          </button>
        </div>

      </div>
    </main>
  );
}