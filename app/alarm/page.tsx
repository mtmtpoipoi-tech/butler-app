'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface AlarmItem {
  id: string;
  type: 'wake' | 'schedule';
  time: string;
  label: string;
  isRinging: boolean;
}

export default function AlarmPage() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [alarms, setAlarms] = useState<AlarmItem[]>([
    { id: '1', type: 'wake', time: '07:00', label: '起床', isRinging: false },
  ]);

  const [formType, setFormType] = useState<'wake' | 'schedule'>('wake');
  const [formTime, setFormTime] = useState<string>('08:00');
  const [formLabel, setFormLabel] = useState<string>('');

  const [butlerMessage, setButlerMessage] = useState<string>(
    '「複数のアラームやご予定を管理いたします。お好きな時間にご設定くださいませ。」'
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;
      const fullStr = `${hours}:${minutes}:${seconds}`;

      setCurrentTime(fullStr);

      setAlarms((prevAlarms) => {
        let triggered = false;
        const updated = prevAlarms.map((alarm) => {
          if (!alarm.isRinging && alarm.time === timeStr) {
            triggered = true;
            return { ...alarm, isRinging: true };
          }
          return alarm;
        });

        if (triggered) {
          setButlerMessage('「主様、お時間でございます！ご予定の時刻となりました。」');
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        }

        return updated;
      });
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlarm: AlarmItem = {
      id: Date.now().toString(),
      type: formType,
      time: formTime,
      label: formType === 'wake' ? '起床' : (formLabel.trim() || 'ご予定'),
      isRinging: false,
    };

    setAlarms([...alarms, newAlarm]);
    setFormLabel('');
    setButlerMessage(`「かしこまりました。[${formTime}] に${formType === 'wake' ? '起床用' : '予定用'}のアラームを追加いたしました。」`);
  };

  const handleDeleteAlarm = (id: string) => {
    if (window.confirm('アラームを削除しますか？')) {
      setAlarms(alarms.filter((alarm) => alarm.id !== id));
      setButlerMessage('「アラームを削除いたしました。」');
    }
  };

  const handleStopRinging = (id: string) => {
    setAlarms(
      alarms.map((alarm) => (alarm.id === id ? { ...alarm, isRinging: false } : alarm))
    );
    
    const stillRinging = alarms.some((a) => a.id !== id && a.isRinging);
    if (!stillRinging && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setButlerMessage('「アラームを停止いたしました。」');
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');
        
        body, button, input, select, p, span, h1, div {
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

      <audio ref={audioRef} src="/Departure_7651.mp3" loop />

      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/485142.jpg')", color: '#F3ECD8' }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          
          <div className="w-full mb-3 flex justify-start">
            <Link href="/" className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50">
              ← エントランス（ホーム）へ戻る
            </Link>
          </div>

          <div 
            className="w-full rounded-2xl px-5 py-3 mb-4 shadow-2xl backdrop-blur-md text-center"
            style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}
          >
            <p className="text-xs text-[#BB8632] mb-1 font-bold tracking-widest">現在の時刻</p>
            <p className="text-2xl font-bold font-mono tracking-widest" style={{ color: '#F3ECD8' }}>
              {currentTime || '--:--:--'}
            </p>
          </div>

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

          <div 
            className="w-full rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md border-2"
            style={{ backgroundColor: 'rgba(86, 27, 36, 0.92)', borderColor: '#BB8632' }}
          >
            <h1 className="text-2xl font-bold mb-1 tracking-wide text-center" style={{ color: '#F3ECD8' }}>
              執事のアラーム
            </h1>
            <p className="text-xs mb-6 tracking-wider text-center" style={{ color: '#F3ECD8', opacity: 0.7 }}>
              起床用・予定用のアラームを追加・管理できます
            </p>

            <form onSubmit={handleAddAlarm} className="mb-6 p-4 rounded-2xl border" style={{ backgroundColor: 'rgba(59, 18, 24, 0.6)', borderColor: 'rgba(187, 134, 50, 0.4)' }}>
              <p className="text-xs font-semibold mb-3 tracking-wider text-[#BB8632]">新しいアラームを追加</p>
              
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setFormType('wake')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${
                    formType === 'wake' 
                      ? 'bg-[#8A5A2D] text-[#F3ECD8] border-[#BB8632]' 
                      : 'bg-[#3B1218] text-[#F3ECD8]/70 border-transparent'
                  }`}
                >
                  起床用
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('schedule')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition border ${
                    formType === 'schedule' 
                      ? 'bg-[#8A5A2D] text-[#F3ECD8] border-[#BB8632]' 
                      : 'bg-[#3B1218] text-[#F3ECD8]/70 border-transparent'
                  }`}
                >
                  予定用
                </button>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  required
                  className="text-xl font-mono px-3 py-2 rounded-xl outline-none cursor-pointer flex-1"
                  style={{ backgroundColor: '#3B1218', color: '#F3ECD8', border: '1px solid #BB8632' }}
                />
                
                <button
                  type="submit"
                  className="gothic-btn px-5 py-2 rounded-xl text-sm font-bold tracking-wider"
                  style={{ background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)', color: '#F3ECD8', border: '1px solid #BB8632' }}
                >
                  追加
                </button>
              </div>

              {formType === 'schedule' && (
                <input
                  type="text"
                  placeholder="予定の内容（例: 模試の開始、学習計画など）"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ backgroundColor: '#3B1218', color: '#F3ECD8', border: '1px solid #BB8632' }}
                />
              )}
            </form>

            <div>
              <p className="text-xs mb-3 tracking-wider text-[#BB8632]">設定されたアラーム一覧 ({alarms.length})</p>
              
              {alarms.length === 0 ? (
                <p className="text-center text-xs py-4 text-[#F3ECD8]/60">アラームは設定されておりません。</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {alarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                        alarm.isRinging ? 'border-red-500 bg-red-950/80 animate-pulse' : 'border-[#BB8632]/50 bg-[#3B1218]/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-mono font-bold tracking-wider text-[#F3ECD8]">
                          {alarm.time}
                        </span>
                        <div>
                          <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-[#8A5A2D]/40 text-[#BB8632] border border-[#BB8632]/30 mr-2">
                            {alarm.type === 'wake' ? '起床' : '予定'}
                          </span>
                          <span className="text-sm font-medium text-[#F3ECD8]">
                            {alarm.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {alarm.isRinging ? (
                          <button
                            onClick={() => handleStopRinging(alarm.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md animate-bounce"
                          >
                            止める
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteAlarm(alarm.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#561B24] hover:bg-red-900 text-[#F3ECD8]/80 hover:text-white border border-[#BB8632]/40 transition"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}