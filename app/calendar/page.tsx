'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');
  
  // 🌟 エラー回避のため、初期値は固定値にしておき、マウント時に現在時刻を設定します
  const [currentYearMonth, setCurrentYearMonth] = useState<{ year: number; month: number }>({
    year: 2026,
    month: 10,
  });

  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [butlerMessage, setButlerMessage] = useState<string>(
    '「主様の大切なご予定を、どうぞお気軽にお申し付けくださいませ。外部カレンダーへの連携も承ります。」'
  );

  const getTodayStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    setIsMounted(true);
    setSelectedDate(getTodayStr());

    // 🌟 マウント時に安全に現在の年月に更新
    const now = new Date();
    setCurrentYearMonth({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });

    const saved = localStorage.getItem('butler_master_calendar_events');
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        setEvents([]);
      }
    } else {
      setEvents([]);
    }
  }, []);

  const saveToStorage = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem('butler_master_calendar_events', JSON.stringify(newEvents));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !eventTitle.trim()) return;

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      date: selectedDate,
      title: eventTitle.trim(),
    };

    const updated = [...events, newEvent];
    saveToStorage(updated);
    setEventTitle('');
    setButlerMessage(`「${selectedDate}に『${newEvent.title}』のご予定を承りました。」`);
  };

  const handleDelete = (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    saveToStorage(updated);
    setButlerMessage('「ご予定をひとつ整理いたしました。」');
  };

  // Googleカレンダー追加リンク生成
  const getGoogleCalendarUrl = (ev: CalendarEvent) => {
    const dateFormatted = ev.date.replace(/-/g, '');
    const titleEncoded = encodeURIComponent(ev.title);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${titleEncoded}&dates=${dateFormatted}/${dateFormatted}`;
  };

  // Appleカレンダー (.ics) ダウンロード
  const downloadIcs = (ev: CalendarEvent) => {
    const dateFormatted = ev.date.replace(/-/g, '');
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${ev.title}\nDTSTART;VALUE=DATE:${dateFormatted}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${ev.title}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // カレンダーグリッド計算
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    const firstDayIndex = date.getDay();
    const lastDate = new Date(year, month, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDate; d++) {
      days.push(d);
    }
    return days;
  };

  const daysGrid = getDaysInMonth(currentYearMonth.year, currentYearMonth.month);

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
          <div className="w-full mb-3 flex justify-start">
            <Link href="/" className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50">
              ← エントランス（ホーム）へ戻る
            </Link>
          </div>

          <div className="w-full rounded-2xl p-4 mb-4 shadow-2xl backdrop-blur-md" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
            <p className="text-xs font-semibold mb-1 tracking-wider text-[#BB8632]">執事からの言葉</p>
            <p className="text-sm leading-relaxed">{butlerMessage}</p>
          </div>

          <div className="w-full rounded-2xl p-5 shadow-2xl border mb-4" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            <h1 className="text-xl font-bold tracking-widest text-center text-[#F3ECD8] mb-4 border-b border-[#BB8632]/40 pb-2">
              主の予定帳
            </h1>

            {/* 当月カレンダー表示 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#BB8632]">
                  {currentYearMonth.year}年 {currentYearMonth.month}月
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                  <span key={d} className={`font-bold py-1 ${i === 0 ? 'text-[#D45D5D]' : i === 6 ? 'text-[#5D8BD4]' : 'text-[#BB8632]'}`}>
                    {d}
                  </span>
                ))}
                {daysGrid.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} className="h-7" />;
                  const dateStr = `${currentYearMonth.year}-${String(currentYearMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = selectedDate === dateStr;
                  const hasEvent = events.some((e) => e.date === dateStr);

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-7 rounded-lg text-xs font-bold transition relative flex items-center justify-center ${
                        isSelected ? 'bg-[#BB8632] text-[#240A0E]' : 'bg-[#3B1218] text-[#F3ECD8] hover:bg-[#561B24]'
                      }`}
                    >
                      {day}
                      {hasEvent && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#D49E4B]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 登録フォーム */}
            <form onSubmit={handleAddEvent} className="flex flex-col gap-2 mb-4 bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 px-3 py-1.5 rounded-lg text-xs outline-none"
                required
              />
              <input
                type="text"
                placeholder="ご予定内容（例: 模試、受診、面談）"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 px-3 py-1.5 rounded-lg text-xs outline-none"
                required
              />
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg font-bold text-xs text-[#2B0C12] bg-[#BB8632] hover:bg-[#D49E4B] transition"
              >
                ご予定を記録する
              </button>
            </form>

            {/* 予定一覧 ＆ 外部カレンダー連携ボタン */}
            <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1">
              {isMounted && events.length === 0 ? (
                <p className="text-center text-xs text-[#F3ECD8]/50 italic py-2">登録されたご予定はございません。</p>
              ) : (
                isMounted && events.map((ev) => (
                  <div key={ev.id} className="flex flex-col bg-[#3B1218] p-2.5 rounded-xl border border-[#BB8632]/40 gap-1.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-[#BB8632] block">{ev.date}</span>
                        <span className="text-xs font-bold text-[#F3ECD8]">{ev.title}</span>
                      </div>
                      <button onClick={() => handleDelete(ev.id)} className="text-[10px] text-[#8A2D2D] hover:underline">
                        削除
                      </button>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-[#BB8632]/20">
                      <a
                        href={getGoogleCalendarUrl(ev)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] px-2 py-0.5 rounded bg-[#240A0E] text-[#BB8632] border border-[#BB8632]/40 hover:bg-[#561B24]"
                      >
                        📅 Google連携
                      </a>
                      <button
                        onClick={() => downloadIcs(ev)}
                        className="text-[9px] px-2 py-0.5 rounded bg-[#240A0E] text-[#BB8632] border border-[#BB8632]/40 hover:bg-[#561B24]"
                      >
                        🍏 Apple/iCal連携
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