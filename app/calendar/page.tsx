'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  memo?: string;
  source?: 'local' | 'external';
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [icalUrl, setIcalUrl] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // 新規予定追加用フォーム
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newMemo, setNewMemo] = useState('');

  const [butlerMessage, setButlerMessage] = useState(
    '「主様、カレンダーの日付をタップしていただきますと、その日の詳細なご予定をご確認いただけます。」'
  );

  // 初回ロード時に現在日付を設定（Hydrationエラー防止）
  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDateStr(todayStr);

    // 初期サンプル予定
    setEvents([
      {
        id: '1',
        title: '共通テスト模試',
        date: todayStr,
        time: '09:00',
        memo: '会場：〇〇ホール / 万全の体調で臨む',
        source: 'local',
      },
      {
        id: '2',
        title: '英単語 復習',
        date: todayStr,
        time: '20:00',
        memo: 'セッション目標：100単語',
        source: 'local',
      },
    ]);
  }, []);

  if (!currentDate || !selectedDateStr) {
    return (
      <div className="min-h-screen bg-[#561B24] flex items-center justify-center text-[#F3ECD8] font-serif">
        <p className="text-sm tracking-widest animate-pulse">「スケジュール帳をお手元にご用意しております……」</p>
      </div>
    );
  }

  // カレンダー描画用ロジック
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0: Sun, 1: Mon...
  const totalDays = lastDayOfMonth.getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push(i);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateStr(formattedDate);
    setButlerMessage(`「[${year}年${month + 1}月${day}日] のご予定でございます。」`);
  };

  // 選択された日の予定リスト
  const selectedEvents = events.filter((e) => e.date === selectedDateStr);

  // 新しい予定の追加
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      date: selectedDateStr,
      time: newTime,
      memo: newMemo.trim(),
      source: 'local',
    };

    setEvents([...events, newEvent]);
    setNewTitle('');
    setNewMemo('');
    setButlerMessage(`「[${selectedDateStr}] に新しいご予定を控えました。」`);
  };

  // 削除処理
  const handleDeleteEvent = (id: string) => {
    if (window.confirm('この予定を削除しますか？')) {
      setEvents(events.filter((e) => e.id !== id));
      setButlerMessage('「ご予定をひとつ削除いたしました。」');
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');

        body, button, input, textarea, p, span, h1, div {
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

      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/485142.jpg')", color: '#F3ECD8' }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
          
          {/* ホームに戻る ＆ 連携設定ボタン */}
          <div className="w-full mb-3 flex justify-between items-center">
            <Link href="/" className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50">
              ← エントランス（ホーム）へ戻る
            </Link>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs text-[#BB8632] hover:underline bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50"
            >
              ⚙️ 外部カレンダー連携
            </button>
          </div>

          {/* 外部カレンダー連携案内モーダル */}
          {showSettings && (
            <div className="w-full rounded-2xl p-4 mb-4 shadow-2xl bg-[#3D131A] border border-[#BB8632]">
              <p className="text-xs font-bold text-[#BB8632] mb-2">🔗 Google / iPhone カレンダーの自動連携</p>
              <p className="text-xs leading-relaxed text-[#F3ECD8]/80 mb-3">
                GoogleカレンダーやiPhoneの「非公開のiCal（.ics）アドレス」を入力することで、スマホで追加した予定が自動的にここに表示されます。
              </p>
              <input
                type="url"
                placeholder="https://calendar.google.com/.../basic.ics"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl outline-none mb-2"
                style={{ backgroundColor: '#2B0C12', color: '#F3ECD8', border: '1px solid #BB8632' }}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    alert('「連携URLを設定いたしました（※iCal読み込みエンジン準備完了）」');
                    setShowSettings(false);
                  }}
                  className="gothic-btn text-xs px-3 py-1 rounded-lg bg-[#8A5A2D] text-[#F3ECD8] border border-[#BB8632]"
                >
                  保存する
                </button>
              </div>
            </div>
          )}

          {/* 執事からのメッセージ */}
          <div 
            className="w-full rounded-2xl p-4 mb-4 shadow-2xl backdrop-blur-md"
            style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}
          >
            <p className="text-xs font-semibold mb-1 tracking-wider text-[#BB8632]">
              執事からの言葉
            </p>
            <p className="text-sm leading-relaxed text-[#F3ECD8]">
              {butlerMessage}
            </p>
          </div>

          {/* 月間カレンダーカード */}
          <div className="w-full rounded-3xl p-5 sm:p-6 shadow-2xl border-2 mb-6" style={{ backgroundColor: 'rgba(86, 27, 36, 0.92)', borderColor: '#BB8632' }}>
            
            {/* 年月切り替え */}
            <div className="flex justify-between items-center mb-4">
              <button onClick={handlePrevMonth} className="text-sm px-3 py-1 rounded-lg bg-[#3B1218] border border-[#BB8632]/50 hover:border-[#BB8632]">
                ＜ 前月
              </button>
              <h2 className="text-lg font-bold font-mono tracking-widest text-[#F3ECD8]">
                {year}年 {month + 1}月
              </h2>
              <button onClick={handleNextMonth} className="text-sm px-3 py-1 rounded-lg bg-[#3B1218] border border-[#BB8632]/50 hover:border-[#BB8632]">
                次月 ＞
              </button>
            </div>

            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 text-center text-xs font-bold mb-2 text-[#BB8632]">
              <span className="text-red-400">日</span>
              <span>月</span>
              <span>火</span>
              <span>水</span>
              <span>木</span>
              <span>金</span>
              <span className="text-blue-400">土</span>
            </div>

            {/* カレンダー日付グリッド */}
            <div className="grid grid-cols-7 gap-1">
              {daysArray.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-10 sm:h-12" />;
                }

                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDateStr;
                const hasEvent = events.some((e) => e.date === dateStr);

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => handleDateClick(day)}
                    className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center relative transition border ${
                      isSelected
                        ? 'bg-[#8A5A2D] text-[#F3ECD8] border-[#BB8632] font-bold shadow-inner'
                        : 'bg-[#3B1218]/60 text-[#F3ECD8]/80 border-transparent hover:border-[#BB8632]/40'
                    }`}
                  >
                    <span className="text-xs font-mono">{day}</span>
                    {hasEvent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BB8632] mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 選択された日の詳細・本日の予定カード */}
          <div className="w-full rounded-3xl p-6 shadow-2xl border-2" style={{ backgroundColor: 'rgba(86, 27, 36, 0.92)', borderColor: '#BB8632' }}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#BB8632]/40">
              <h3 className="text-base font-bold text-[#F3ECD8]">
                📅 {selectedDateStr} のご予定
              </h3>
              <span className="text-xs text-[#BB8632]">（{selectedEvents.length} 件）</span>
            </div>

            {/* 該当日の予定一覧 */}
            {selectedEvents.length === 0 ? (
              <p className="text-center text-xs py-4 text-[#F3ECD8]/50 italic">この日のご予定はございません。</p>
            ) : (
              <div className="flex flex-col gap-3 mb-6 max-h-52 overflow-y-auto pr-1">
                {selectedEvents.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl border border-[#BB8632]/40 bg-[#3B1218]/80 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#BB8632]">{item.time}</span>
                        <h4 className="text-sm font-bold text-[#F3ECD8]">{item.title}</h4>
                      </div>
                      {item.memo && (
                        <p className="text-xs text-[#F3ECD8]/70 mt-1 bg-[#2B0C12] p-2 rounded-lg">{item.memo}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(item.id)}
                      className="text-xs text-[#F3ECD8]/50 hover:text-red-400 underline ml-2"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* この日に予定をクイック追加 */}
            <form onSubmit={handleAddEvent} className="pt-2 border-t border-[#BB8632]/30">
              <p className="text-xs font-semibold mb-2 text-[#BB8632]">この日に予定を追加</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="予定のタイトル"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl outline-none"
                  style={{ backgroundColor: '#3B1218', color: '#F3ECD8', border: '1px solid #BB8632' }}
                  required
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-24 text-xs px-2 py-2 rounded-xl outline-none cursor-pointer"
                  style={{ backgroundColor: '#3B1218', color: '#F3ECD8', border: '1px solid #BB8632' }}
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="メモ（任意）"
                  value={newMemo}
                  onChange={(e) => setNewMemo(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl outline-none"
                  style={{ backgroundColor: '#3B1218', color: '#F3ECD8', border: '1px solid #BB8632' }}
                />
                <button
                  type="submit"
                  className="gothic-btn px-4 py-2 rounded-xl text-xs font-bold text-[#F3ECD8]"
                  style={{ background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)', border: '1px solid #BB8632' }}
                >
                  追加
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </>
  );
}