'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isPlayingFire, setIsPlayingFire] = useState<boolean>(false);
  const [isAutoTime, setIsAutoTime] = useState<boolean>(false);
  const [masterName, setMasterName] = useState<string>('主');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ローカルストレージから主様のお名前を読み込む（ハイドレーションエラー対策）
  useEffect(() => {
    const savedName = localStorage.getItem('butler_master_name');
    if (savedName) {
      setMasterName(savedName);
    }
  }, []);

  // お名前を変更する関数
  const handleChangeName = () => {
    const newName = window.prompt('執事がお呼びするお名前（主様のお名前）を入力してくださいませ：', masterName);
    if (newName && newName.trim() !== '') {
      const trimmed = newName.trim();
      setMasterName(trimmed);
      localStorage.setItem('butler_master_name', trimmed);
    }
  };

  // 期間と時間の自動判定
  useEffect(() => {
    const checkEnvironment = () => {
      const now = new Date();
      const month = now.getMonth(); // 0:1月 〜 11:12月
      const date = now.getDate();
      const hours = now.getHours();

      // 1. 期間判定：秋分の日（約9月23日）〜 春分の日（約3月21日）
      let isSeason = false;
      if (month > 8 || month < 2) {
        isSeason = true;
      } else if (month === 8 && date >= 23) {
        isSeason = true;
      } else if (month === 2 && date <= 21) {
        isSeason = true;
      }

      // 2. 時間判定：17:00 〜 07:00
      const isTime = hours >= 17 || hours < 7;

      const shouldPlay = isSeason && isTime;
      setIsAutoTime(shouldPlay);

      if (shouldPlay && audioRef.current && !isPlayingFire) {
        audioRef.current.play().then(() => {
          setIsPlayingFire(true);
        }).catch(() => {
          setIsPlayingFire(false);
        });
      } else if (!shouldPlay && isPlayingFire) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlayingFire(false);
      }
    };

    checkEnvironment();
    const timer = setInterval(checkEnvironment, 30000);
    return () => clearInterval(timer);
  }, [isPlayingFire]);

  // 手動で焚き火の音をON/OFFするスイッチ
  const toggleFireSound = () => {
    if (audioRef.current) {
      if (isPlayingFire) {
        audioRef.current.pause();
        setIsPlayingFire(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlayingFire(true);
        }).catch(() => {});
      }
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');
        
        body, button, p, span, h1, h2, div {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }

        .gothic-dock-item {
          transition: all 0.3s ease-in-out;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
        }
        
        .gothic-dock-item:hover {
          transform: translateY(-4px);
          filter: brightness(1.15);
          box-shadow: 0 8px 20px rgba(187, 134, 50, 0.5);
        }
      `}</style>

      {/* 焚き火の音声（MP4） */}
      <audio ref={audioRef} src="/fireplace.mp4" loop />

      <div
        className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: "url('/home-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />

        {/* 上部：タイトル ＆ お名前変更ボタン ＆ 暖炉スイッチ */}
        <div className="relative z-10 w-full max-w-lg text-center pt-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs tracking-[0.3em] text-[#BB8632]">THE BUTLER'S MANOR</p>
            <button
              onClick={handleChangeName}
              className="text-[10px] px-2 py-0.5 rounded border border-[#BB8632]/50 bg-[#310F14] text-[#BB8632] hover:bg-[#561B24] transition"
              title="お名前を変更する"
            >
              ✏️ 変更: {masterName}様
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-[#F3ECD8] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] mb-3">
            {masterName}様の邸宅
          </h1>

          {/* 暖炉の音のON/OFFスライドスイッチ */}
          <div className="px-4 py-1.5 rounded-full border border-[#BB8632]/60 bg-[#561B24]/80 shadow-md flex items-center gap-3">
            <span className="text-xs text-[#F3ECD8]">
              {isPlayingFire ? '🔥 暖炉の火が燃えております' : '🕯️ 暖炉を静かに見つめる'}
            </span>
            <button
              type="button"
              onClick={toggleFireSound}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPlayingFire ? 'bg-[#BB8632]' : 'bg-[#310F14]'
              }`}
              role="switch"
              aria-checked={isPlayingFire}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#F3ECD8] shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isPlayingFire ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            {isAutoTime && <span className="text-[10px] text-[#BB8632] font-bold">（夜長モード）</span>}
          </div>
        </div>

        {/* 中央：執事からのウェルカムメッセージ */}
        <div className="relative z-10 w-full max-w-sm my-auto">
          <div 
            className="rounded-2xl p-5 shadow-2xl backdrop-blur-md text-center border"
            style={{ backgroundColor: 'rgba(86, 27, 36, 0.85)', borderColor: '#BB8632' }}
          >
            <p className="text-xs font-semibold mb-1.5 tracking-widest text-[#BB8632]">
              執事よりのご挨拶
            </p>
            <p className="text-sm sm:text-base leading-relaxed italic font-light text-[#F3ECD8]">
              {isAutoTime 
                ? `「お部屋の暖炉に心地よい火を灯しております、${masterName}様。どうぞ温まりながらお過ごしくださいませ。」` 
                : `「おかえりなさいませ、${masterName}様。本日はどの空間へ赴かれますか？」`}
            </p>
          </div>
        </div>

        {/* 下部：アイコンが並ぶアンティーク・ドック */}
        <div className="relative z-10 w-full max-w-md pb-4">
          <div 
            className="rounded-2xl p-3 shadow-2xl backdrop-blur-md border flex items-center justify-around gap-2"
            style={{ backgroundColor: 'rgba(59, 18, 24, 0.9)', borderColor: '#BB8632' }}
          >
            
            <Link href="/timer" className="flex flex-col items-center group">
              <div 
                className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#2B0C12]"
                style={{ borderColor: '#BB8632' }}
              >
                <img src="/icon-timer.jpg" alt="タイマー" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">タイマー</span>
            </Link>

            <Link href="/alarm" className="flex flex-col items-center group">
              <div 
                className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#2B0C12]"
                style={{ borderColor: '#BB8632' }}
              >
                <img src="/icon-alarm.jpg" alt="アラーム" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">アラーム</span>
            </Link>

            <Link href="/journal" className="flex flex-col items-center group">
              <div 
                className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#2B0C12]"
                style={{ borderColor: '#BB8632' }}
              >
                <img src="/icon-journal.jpg" alt="日記帳" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">日記帳</span>
            </Link>

            <Link href="/calendar" className="flex flex-col items-center group">
              <div 
                className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl"
                style={{ backgroundColor: '#4A171F', borderColor: '#BB8632', color: '#F3ECD8' }}
              >
                📅
              </div>
              <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">予定帳</span>
            </Link>

            <button 
              onClick={() => alert(`「${masterName}様、ティーサロンの設えはまもなく完了いたします。」`)}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div 
                className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl opacity-80"
                style={{ backgroundColor: '#310F14', borderColor: 'rgba(187, 134, 50, 0.5)', color: '#F3ECD8' }}
              >
                ☕
              </div>
              <span className="text-[10px] mt-1 text-[#F3ECD8]/70 group-hover:text-[#BB8632] transition">サロン</span>
            </button>

          </div>
        </div>

      </div>
    </>
  );
}