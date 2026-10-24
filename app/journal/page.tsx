'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function JournalPage() {
  const router = useRouter();
  const [dateTimeStr, setDateTimeStr] = useState<string>('');
  const [activitySummary, setActivitySummary] = useState<string>('本日の集中記録はまだございません。');
  const [journalText, setJournalText] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [butlerMessage, setButlerMessage] = useState<string>('「本日のご記録でございますね。執事がしっかりと書き留めさせていただきます。」');

  const getTodayLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

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

    // 🌟 タイマーの活動実績をローカルストレージから読み込む
    const savedDate = localStorage.getItem('butler_master_activity_date');
    const savedData = localStorage.getItem('butler_master_activity_seconds');
    const todayStr = getTodayLocalDateStr();

    if (savedDate === todayStr && savedData) {
      try {
        const parsed: Record<string, number> = JSON.parse(savedData);
        const entries = Object.entries(parsed).filter(([_, secs]) => secs > 0);
        if (entries.length > 0) {
          const summaryText = entries.map(([act, secs]) => {
            const mins = Math.floor(secs / 60);
            return `${act} ${mins}分`;
          }).join(' / ');
          setActivitySummary(summaryText);
        }
      } catch (e) {}
    }

    // 保存済みの日記内容をロード
    const savedJournal = localStorage.getItem(`butler_journal_${todayStr}`);
    if (savedJournal) {
      setJournalText(savedJournal);
    }

    return () => clearInterval(interval);
  }, []);

  const handleNavigateHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/');
    }, 500);
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = getTodayLocalDateStr();
    localStorage.setItem(`butler_journal_${todayStr}`, journalText);
    setButlerMessage('「本日のご日記を大切に保管いたしました。」');
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');
        body, button, textarea, p, span, h1, div {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: "url('/485142.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />

        <div
          className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-500 ${
            isTransitioning ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="w-full mb-3 flex justify-start">
            <Link 
              href="/" 
              onClick={handleNavigateHome}
              className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50 cursor-pointer"
            >
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

          {/* 🌟 タイマー作業実績の反映表示 */}
          <div className="w-full rounded-2xl p-4 mb-4 shadow-2xl border" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            <p className="text-xs font-semibold mb-1 text-[#BB8632]">📊 本日のタイマー集中実績</p>
            <p className="text-sm font-bold text-[#F3ECD8]">{activitySummary}</p>
          </div>

          <div className="w-full rounded-2xl p-6 shadow-2xl border" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            <h1 className="text-xl font-bold tracking-widest text-center text-[#F3ECD8] mb-4 border-b border-[#BB8632]/40 pb-2">
              主様の日記帳
            </h1>

            <form onSubmit={handleSaveJournal} className="flex flex-col gap-3">
              <textarea
                rows={5}
                placeholder="本日の出来事や想いを自由にお書きくださいませ……"
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                className="bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 p-3 rounded-xl text-sm outline-none resize-none leading-relaxed"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-xs text-[#2B0C12] bg-[#BB8632] hover:bg-[#D49E4B] transition cursor-pointer shadow-lg"
              >
                日記を保存する
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}