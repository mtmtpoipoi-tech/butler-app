'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface AlarmItem {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
}

export default function AlarmPage() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [time, setTime] = useState<string>('07:00');
  const [label, setLabel] = useState<string>('起床');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [lastFiredKey, setLastFiredKey] = useState<string>('');
  
  const [butlerMessage, setButlerMessage] = useState<string>(
    '「主様のお目覚めやお時間のお知らせを、心を込めて務めさせていただきます。」'
  );

  // 🔔 ブラウザ通知の許可を求める関数
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        setButlerMessage('「通知の許可を承りました。お時間になりましたら、端末へ確実にお知らせいたします。」');
      } else {
        setButlerMessage('「通知がブロックされております。ブラウザのアドレスバー等から通知を許可してくださいませ。」');
      }
    } else {
      alert('お使いの環境はブラウザ通知に対応しておりません。');
    }
  };

  // 🔔 アラーム音（ベル等）を鳴らす関数
  const playAlarmSound = () => {
    try {
      const audio = new Audio('/bell.mp3'); // 音声ファイルがある場合
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // 🌟 現在時刻のリアルタイム時計 ＆ アラーム監視
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const currentHM = `${h}:${m}`;
      setCurrentTimeStr(`${currentHM}:${s}`);

      // アラーム時刻のチェック
      const saved = localStorage.getItem('butler_master_alarms');
      if (saved) {
        try {
          const parsedAlarms: AlarmItem[] = JSON.parse(saved);
          parsedAlarms.forEach((alarm) => {
            if (alarm.enabled && alarm.time === currentHM) {
              const fireKey = `${currentHM}-${alarm.id}`;
              // 同じ分に何度も鳴らないように制御
              if (lastFiredKey !== fireKey) {
                setLastFiredKey(fireKey);

                // 1. パソコンやスマホのプッシュ通知を送信
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  new Notification('執事からの時刻のお知らせ', {
                    body: `「時間でございます、主様。『${alarm.label}』のお時間です。」`,
                  });
                }

                // 2. 音声を再生
                playAlarmSound();
                setButlerMessage(`「時間でございます、主様。『${alarm.label}』のお時間です。」`);
              }
            }
          });
        } catch (e) {}
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    const saved = localStorage.getItem('butler_master_alarms');
    if (saved) {
      try {
        setAlarms(JSON.parse(saved));
      } catch (e) {
        setAlarms([]);
      }
    }

    return () => clearInterval(interval);
  }, [lastFiredKey]);

  const saveToStorage = (newAlarms: AlarmItem[]) => {
    setAlarms(newAlarms);
    localStorage.setItem('butler_master_alarms', JSON.stringify(newAlarms));
  };

  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlarm: AlarmItem = {
      id: Date.now().toString(),
      time,
      label: label.trim() || '無題のアラーム',
      enabled: true,
    };
    const updated = [...alarms, newAlarm];
    saveToStorage(updated);
    setButlerMessage(`「${time}に『${newAlarm.label}』のご予定をお受けいたしました。」`);
  };

  const toggleAlarm = (id: string) => {
    const updated = alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    saveToStorage(updated);
  };

  const handleDelete = (id: string) => {
    const updated = alarms.filter((a) => a.id !== id);
    saveToStorage(updated);
    setButlerMessage('「アラームの設定をひとつ解除いたしました。」');
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');
        body, button, input, p, span, h1, div {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: "url('/485142.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="w-full mb-3 flex justify-between items-center">
            <Link href="/" className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50">
              ← エントランス（ホーム）へ戻る
            </Link>

            {/* 通知許可ボタン */}
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="text-xs text-[#2B0C12] bg-[#BB8632] hover:bg-[#D49E4B] px-3 py-1.5 rounded-lg font-bold transition shadow-md cursor-pointer"
              >
                🔔 通知を受け取る
              </button>
            )}
          </div>

          {/* 現在時刻表示時計 */}
          <div className="w-full rounded-2xl px-5 py-3 mb-4 shadow-2xl backdrop-blur-md text-center" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
            <p className="text-xs text-[#BB8632] font-semibold mb-0.5">PRESENT TIME</p>
            <p className="text-3xl font-extrabold tracking-widest text-[#F3ECD8]">
              {currentTimeStr || '--:--:--'}
            </p>
          </div>

          <div className="w-full rounded-2xl p-4 mb-4 shadow-2xl backdrop-blur-md" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
            <p className="text-xs font-semibold mb-1 tracking-wider text-[#BB8632]">執事からの言葉</p>
            <p className="text-sm leading-relaxed">{butlerMessage}</p>
          </div>

          <div className="w-full rounded-2xl p-6 shadow-2xl border" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            <h1 className="text-xl font-bold tracking-widest text-center text-[#F3ECD8] mb-6 border-b border-[#BB8632]/40 pb-2">
              時刻のお知らせ（アラーム）
            </h1>

            <form onSubmit={handleAddAlarm} className="flex flex-col gap-3 mb-6 bg-[#3B1218] p-4 rounded-xl border border-[#BB8632]/40">
              <div className="flex gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 px-3 py-2 rounded-lg text-lg font-bold outline-none flex-1"
                  required
                />
                <input
                  type="text"
                  placeholder="ラベル（例: 起床、勉強開始）"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 px-3 py-2 rounded-lg text-sm outline-none flex-1"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg font-bold text-xs text-[#2B0C12] bg-[#BB8632] hover:bg-[#D49E4B] transition cursor-pointer"
              >
                アラームをセットする
              </button>
            </form>

            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
              {isMounted && alarms.length === 0 ? (
                <p className="text-center text-xs text-[#F3ECD8]/50 italic py-4">設定中のアラームはございません。</p>
              ) : (
                isMounted && alarms.map((alarm) => (
                  <div key={alarm.id} className="flex justify-between items-center bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40">
                    <div>
                      <span className="text-lg font-bold text-[#F3ECD8] mr-2">{alarm.time}</span>
                      <span className="text-xs text-[#BB8632]">{alarm.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleAlarm(alarm.id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-bold cursor-pointer ${alarm.enabled ? 'bg-[#BB8632] text-[#240A0E]' : 'bg-[#240A0E] text-[#F3ECD8]/50'}`}
                      >
                        {alarm.enabled ? 'ON' : 'OFF'}
                      </button>
                      <button onClick={() => handleDelete(alarm.id)} className="text-xs text-[#8A2D2D] hover:underline cursor-pointer">
                        削除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}