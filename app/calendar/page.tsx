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
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [butlerMessage, setButlerMessage] = useState<string>(
    '「主様の大切なご予定を、どうぞお気軽にお申し付けくださいませ。」'
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

    const saved = localStorage.getItem('butler_master_calendar_events');
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        setEvents([]);
      }
    } else {
      // 🌟 最初から空の状態にする
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

          <div className="w-full rounded-2xl p-6 shadow-2xl border" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            <h1 className="text-xl font-bold tracking-widest text-center text-[#F3ECD8] mb-6 border-b border-[#BB8632]/40 pb-2">
              主の予定帳
            </h1>

            <form onSubmit={handleAddEvent} className="flex flex-col gap-3 mb-6 bg-[#3B1218] p-4 rounded-xl border border-[#BB8632]/40">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 px-3 py-2 rounded-lg text-xs outline-none"
                required
              />
              <input
                type="text"
                placeholder="ご予定内容（例: 模試、受診、面談）"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 px-3 py-2 rounded-lg text-xs outline-none"
                required
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg font-bold text-xs text-[#2B0C12] bg-[#BB8632] hover:bg-[#D49E4B] transition"
              >
                ご予定を記録する
              </button>
            </form>

            <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
              {isMounted && events.length === 0 ? (
                <p className="text-center text-xs text-[#F3ECD8]/50 italic py-4">登録されたご予定はございません。</p>
              ) : (
                isMounted && events.map((ev) => (
                  <div key={ev.id} className="flex justify-between items-center bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40">
                    <div>
                      <span className="text-xs font-bold text-[#BB8632] block">{ev.date}</span>
                      <span className="text-sm text-[#F3ECD8]">{ev.title}</span>
                    </div>
                    <button onClick={() => handleDelete(ev.id)} className="text-xs text-[#8A2D2D] hover:underline">
                      削除
                    </button>
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