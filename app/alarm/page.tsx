'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AlarmPage() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [alarmTime, setAlarmTime] = useState<string>('07:00');
  const [isAlarmSet, setIsAlarmSet] = useState<boolean>(false);
  const [isRinging, setIsRinging] = useState<boolean>(false);
  const [butlerMessage, setButlerMessage] = useState<string>(
    '「お目覚めやご予定の時刻をセットいたします。お気軽にお申し付けください。」'
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 現在時刻の更新
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      const fullStr = `${hours}:${minutes}:${seconds}`;

      setCurrentTime(fullStr);

      // アラーム判定
      if (isAlarmSet && !isRinging && timeStr === alarmTime) {
        setIsRinging(true);
        setButlerMessage('「主様、お時間でございます！ お目覚めのお時間ですよ。」');
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [isAlarmSet, isRinging, alarmTime]);

  const handleSetAlarm = () => {
    setIsAlarmSet(true);
    setIsRinging(false);
    setButlerMessage(`「かしこまりました。[${alarmTime}] にアラームをセットいたしました。」`);
  };

  const handleCancelAlarm = () => {
    setIsAlarmSet(false);
    setIsRinging(false);
    setButlerMessage('「アラームを解除いたしました。」');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');
        
        body, button, input, p, span, h1, div {
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
        }
      `}</style>

      {/* アラーム音源（メインBGMを流用、必要に応じて変更可能） */}
      <audio ref={audioRef} src="/Departure_7651.mp3" loop />

      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/485142.jpg')", color: '#F3ECD8' }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          
          {/* ホームに戻るボタン */}
          <div className="w-full mb-3 flex justify-start">
            <Link href="/" className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50">
              ← エントランス（ホーム）へ戻る
            </Link>
          </div>

          {/* 現在時刻表示 */}
          <div 
            className="w-full rounded-2xl px-5 py-3 mb-4 shadow-2xl backdrop-blur-md text-center"
            style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}
          >
            <p className="text-xs text-[#BB8632] mb-1 font-bold tracking-widest">現在の時刻</p>
            <p className="text-2xl font-bold font-mono tracking-widest" style={{ color: '#F3ECD8' }}>
              {currentTime || '--:--:--'}
            </p>
          </div>

          {/* 執事からのメッセージ枠 */}
          <div 
            className="w-full rounded-2xl p-4 mb-4 shadow-2xl backdrop-blur-md"
            style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}
          >
            <p className="text-xs font-semibold mb-1 tracking-wider" style={{ color: '#F3ECD8', opacity: 0.8 }}>
              執事からの言葉
            </p>
            <p className="text-base leading-relaxed" style={{ color: '#F3ECD8' }}>
              {butlerMessage}
            </p>
          </div>

          {/* アラーム設定カード */}
          <div 
            className={`w-full rounded-3xl p-8 shadow-2xl text-center backdrop-blur-md border-2 transition-all ${
              isRinging ? 'border-red-500 animate-pulse bg-[#6B212B]/95' : ''
            }`}
            style={{ 
              backgroundColor: isRinging ? undefined : 'rgba(86, 27, 36, 0.92)', 
              borderColor: isRinging ? '#ff4d4d' : '#BB8632' 
            }}
          >
            <h1 className="text-2xl font-bold mb-1 tracking-wide" style={{ color: '#F3ECD8' }}>
              {isRinging ? '【 アラーム鳴動中 】' : '執事のアラーム'}
            </h1>
            <p className="text-xs mb-6 tracking-wider" style={{ color: '#F3ECD8', opacity: 0.7 }}>
              {isRinging ? '主様、お時間でございます！' : '時刻を指定してアラームをセット'}
            </p>

            {/* 時刻入力 */}
            <div className="mb-6 flex justify-center items-center gap-3">
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                disabled={isAlarmSet}
                className="text-3xl font-mono px-4 py-2 rounded-xl text-center outline-none cursor-pointer"
                style={{
                  backgroundColor: '#3B1218',
                  color: '#F3ECD8',
                  border: '1px solid #BB8632',
                }}
              />
            </div>

            {/* ステータス表示 */}
            <p className="text-sm mb-6 tracking-wider font-medium text-[#C49A45]">
              {isRinging 
                ? '🔔 アラームが鳴り響いております！' 
                : isAlarmSet 
                ? `⏰ [${alarmTime}] に設定中...` 
                : '（未設定）'}
            </p>

            {/* 操作ボタン */}
            <div className="flex justify-center gap-4">
              {!isAlarmSet ? (
                <button
                  onClick={handleSetAlarm}
                  className="gothic-btn flex-1 py-3 rounded-xl text-base font-bold tracking-wider"
                  style={{ 
                    background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)', 
                    color: '#F3ECD8', 
                    border: '1px solid #BB8632' 
                  }}
                >
                  アラームをセット
                </button>
              ) : (
                <button
                  onClick={handleCancelAlarm}
                  className="gothic-btn flex-1 py-3 rounded-xl text-base font-bold tracking-wider"
                  style={{ 
                    background: 'linear-gradient(180deg, #6B212B 0%, #4A171F 100%)', 
                    color: '#F3ECD8', 
                    border: '1px solid #ff4d4d' 
                  }}
                >
                  {isRinging ? 'アラームを止める' : '解除する'}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}