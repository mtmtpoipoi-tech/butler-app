'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EventItem {
  id: string;
  date: string;
  title: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [dateTimeStr, setDateTimeStr] = useState<string>('');
  const [currentYearMonth, setCurrentYearMonth] = useState<{ year: number; month: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [butlerMessage, setButlerMessage] = useState<string>('「主様の大切なご予定を、執事が責任をもってお預かりいたします。」');

  const getTodayLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  useEffect(() => {
    const today = getTodayLocalDateStr();
    setSelectedDate(today);

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

    const savedEvents = localStorage.getItem('butler_master_calendar_events');
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (e) {
        setEvents([]);
      }
    }

    const savedUrl = localStorage.getItem('butler_master_external_calendar_url');
    if (savedUrl) {
      setExternalUrl(savedUrl);
    }

    return () => clearInterval(interval);
  }, []);

  const saveEvents = (newEvents: EventItem[]) => {
    setEvents(newEvents);
    localStorage.setItem('butler_master_calendar_events', JSON.stringify(newEvents));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !eventTitle.trim()) return;

    const newEv: EventItem = {
      id: Date.now().toString(),
      date: selectedDate,
      title: eventTitle.trim(),
    };

    const updated = [...events, newEv];
    saveEvents(updated);
    setEventTitle('');
    setButlerMessage(`「${selectedDate}に『${newEv.title}』のご予定をお控えいたしました。」`);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    saveEvents(updated);
    setButlerMessage('「ご予定をひとつ取り消しいたしました。」');
  };

  const handleSaveExternalUrl = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('butler_master_external_calendar_url', externalUrl);
    setButlerMessage('「外部カレンダーのURLを紐付けいたしました。」');
  };

  const handleNavigateHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  const prevMonth = () => {
    setCurrentYearMonth((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrentYearMonth((prev) => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const getCalendarDays = () => {
    const { year, month } = currentYearMonth;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const days: ({ dateStr: string; dayNum: number; isCurrentMonth: boolean } | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dateStr: `${year}-${mStr}-${dStr}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    return days;
  };

  const filteredEvents = events.filter((ev) => ev.date === selectedDate);

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
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="w-full mb-3 flex justify-start">
            <Link href="/" onClick={handleNavigateHome} className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50 cursor-pointer">
              ← エントランス（ホーム）へ戻る
            </Link>
          </div>

          <div className="w-full rounded-2xl px-5 py-3 mb-4 shadow-2xl backdrop-blur-md text-center" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
            <p className="text-base font-bold tracking-widest text-[#F3ECD8]">{dateTimeStr || '----年--月--日 (-) --:--:--'}</p>
          </div>

          <div className="w-full rounded-2xl p-4 mb-4 shadow-2xl backdrop-blur-md" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
            <p className="text-xs font-semibold mb-1 tracking-wider text-[#BB8632]">執事からの言葉</p>
            <p className="text-sm leading-relaxed">{butlerMessage}</p>
          </div>

          <div className="w-full rounded-2xl p-5 mb-4 shadow-2xl border" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            <div className="flex justify-between items-center mb-4">
              <button onClick={prevMonth} className="text-xs text-[#BB8632] font-bold hover:underline cursor-pointer">◀ 前月</button>
              <h2 className="text-base font-bold text-[#F3ECD8]">
                {currentYearMonth.year}年 {currentYearMonth.month}月
              </h2>
              <button onClick={nextMonth} className="text-xs text-[#BB8632] font-bold hover:underline cursor-pointer">次月 ▶</button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#BB8632] mb-2">
              <span className="text-[#8A2D2D]">日</span>
              <span>月</span>
              <span>火</span>
              <span>水</span>
              <span>木</span>
              <span>金</span>
              <span className="text-[#5B82A6]">土</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {getCalendarDays().map((item, idx) => {
                if (!item) {
                  return <div key={`empty-${idx}`} className="h-9" />;
                }
                const isSelected = selectedDate === item.dateStr;
                const hasEvent = events.some((e) => e.date === item.dateStr);

                return (
                  <button
                    key={item.dateStr}
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={`h-9 rounded-lg flex flex-col items-center justify-center relative cursor-pointer transition ${
                      isSelected ? 'bg-[#BB8632] text-[#2B0C12] font-bold' : 'bg-[#3B1218] hover:bg-[#561B24] text-[#F3ECD8]'
                    }`}
                  >
                    <span>{item.dayNum}</span>
                    {hasEvent && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-[#2B0C12]' : 'bg-[#BB8632]'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full rounded-2xl p-5 shadow-2xl border" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            <p className="text-xs font-bold text-[#BB8632] mb-3">📅 {selectedDate} のご予定</p>

            <form onSubmit={handleAddEvent} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="新しいご予定を入力..."
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 px-3 py-1.5 rounded-lg text-xs outline-none flex-1"
                required
              />
              <button type="submit" className="px-3 py-1.5 rounded-lg font-bold text-xs text-[#2B0C12] bg-[#BB8632] hover:bg-[#D49E4B] transition cursor-pointer">
                追加
              </button>
            </form>

            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredEvents.length === 0 ? (
                <p className="text-center text-xs text-[#F3ECD8]/50 italic py-2">この日のご予定はございません。</p>
              ) : (
                filteredEvents.map((ev) => (
                  <div key={ev.id} className="flex justify-between items-center bg-[#3B1218] p-2.5 rounded-xl border border-[#BB8632]/40">
                    <span className="text-xs font-bold text-[#F3ECD8]">{ev.title}</span>
                    <button onClick={() => handleDeleteEvent(ev.id)} className="text-[10px] text-[#8A2D2D] hover:underline cursor-pointer">
                      削除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-full rounded-2xl p-4 mt-4 shadow-2xl border" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            <p className="text-xs font-semibold mb-2 text-[#BB8632]">🔗 外部カレンダー連携 (iCal / Google Calendar URL)</p>
            <form onSubmit={handleSaveExternalUrl} className="flex gap-2">
              <input
                type="url"
                placeholder="https://... (.ics)"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 px-3 py-1.5 rounded-lg text-xs outline-none flex-1"
              />
              <button type="submit" className="px-3 py-1.5 rounded-lg font-bold text-xs text-[#2B0C12] bg-[#BB8632] hover:bg-[#D49E4B] transition cursor-pointer">
                保存
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}