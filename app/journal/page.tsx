'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function JournalPage() {
  const router = useRouter();
  const [dateTimeStr, setDateTimeStr] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activitySummary, setActivitySummary] = useState<string>('選択された日付の集中記録はございません。');
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
    setIsTransitioning(false);
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
    return () => clearInterval(interval);
  }, []);

  // 📖 選択された日付の日記データ ＆ 集中実績のロード
  useEffect(() => {
    if (!selectedDate) return;

    // 日記データのロード
    const savedJournal = localStorage.getItem(`butler_journal_${selectedDate}`);
    setJournalText(savedJournal || '');

    // 📊 集中実績のロード（全日付対応ストレージ butler_all_activity_seconds から取得）
    try {
      const allSecsStr = localStorage.getItem('butler_all_activity_seconds');
      if (allSecsStr) {
        const allSecs = JSON.parse(allSecsStr);
        const daySecs = allSecs[selectedDate];
        if (daySecs) {
          const entries = Object.entries(daySecs).filter(([_, secs]) => Number(secs) > 0);
          if (entries.length > 0) {
            const summaryText = entries.map(([act, secs]) => {
              const totalSec = Number(secs) || 0;
              const mins = Math.floor(totalSec / 60);
              const sec = totalSec % 60;
              return sec > 0 ? `${act} ${mins}分${sec}秒` : `${act} ${mins}分`;
            }).join(' / ');
            setActivitySummary(summaryText);
            setButlerMessage(`「${selectedDate} のご記録と集中実績でございます。」`);
            return;
          }
        }
      }
    } catch (e) {}

    // フォールバック（従来のデータ構造に対する互換性）
    const todayStr = getTodayLocalDateStr();
    if (selectedDate === todayStr) {
      const savedDate = localStorage.getItem('butler_master_activity_date');
      const savedData = localStorage.getItem('butler_master_activity_seconds');
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
            setButlerMessage(`「${selectedDate} のご記録と集中実績でございます。」`);
            return;
          }
        } catch (e) {}
      }
      setActivitySummary('本日の集中記録はまだございません。');
    } else {
      setActivitySummary('選択された日付の集中記録はございません。');
    }
    setButlerMessage(`「${selectedDate} のページでございますね。」`);
  }, [selectedDate]);

  const handleNavigateHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/');
    }, 400);
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    localStorage.setItem(`butler_journal_${selectedDate}`, journalText);
    setButlerMessage(`「${selectedDate} のご日記を大切に保管いたしました。」`);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&family=Cinzel:wght@600&display=swap');
        
        body, button, textarea, p, span, h1, div, input {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }

        /* 📖 アンティーク・ノート風スタイル */
        .journal-notebook {
          background: linear-gradient(135deg, #f7f1e3 0%, #e2d4b7 100%);
          color: #2b1b17;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7), inset 0 0 40px rgba(139, 90, 43, 0.15);
          border: 2px solid #b8860b;
        }

        .journal-textarea {
          background-color: transparent;
          background-image: repeating-linear-gradient(
            transparent,
            transparent 31px,
            rgba(184, 134, 11, 0.25) 31px,
            rgba(184, 134, 11, 0.25) 32px
          );
          line-height: 32px;
          color: #2c1d11;
        }

        .notebook-ribbon {
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: "url('/485142.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          
          {/* ホームに戻るボタン */}
          <div className="w-full mb-3 flex justify-start">
            <Link 
              href="/" 
              onClick={handleNavigateHome}
              className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50 cursor-pointer"
            >
              ← エントランス（ホーム）へ戻る
            </Link>
          </div>

          {/* 日時表示 */}
          <div className="w-full rounded-2xl px-5 py-3 mb-4 shadow-2xl backdrop-blur-md text-center" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
            <p className="text-base font-bold tracking-widest text-[#F3ECD8]">{dateTimeStr || '----年--月--日 (-) --:--:--'}</p>
          </div>

          {/* 執事の言葉 */}
          <div className="w-full rounded-2xl p-4 mb-4 shadow-2xl backdrop-blur-md" style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632' }}>
            <p className="text-xs font-semibold mb-1 tracking-wider text-[#BB8632]">執事からの言葉</p>
            <p className="text-sm leading-relaxed text-[#F3ECD8]">{butlerMessage}</p>
          </div>

          {/* 日付選択バー */}
          <div className="w-full rounded-2xl p-4 mb-4 shadow-2xl border flex items-center justify-between" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            <span className="text-xs font-semibold text-[#BB8632]">📅 閲覧・綴る日付:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 px-3 py-1.5 rounded-lg text-xs outline-none font-bold cursor-pointer"
            />
          </div>

          {/* 集中実績 */}
          <div className="w-full rounded-2xl p-4 mb-4 shadow-2xl border" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            <p className="text-xs font-semibold mb-1 text-[#BB8632]">📊 集中実績 ({selectedDate})</p>
            <p className="text-sm font-bold text-[#F3ECD8]">{activitySummary}</p>
          </div>

          {/* 📖 アンティーク羊皮紙ノート */}
          <div className="journal-notebook w-full rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
            
            {/* ノートのしおり紐風アクセント */}
            <div className="notebook-ribbon absolute top-0 right-8 w-3 h-12 bg-[#8B0000] rounded-b-md" />

            <div className="border-b-2 border-[#8b5a2b]/40 pb-3 mb-5 flex justify-between items-end">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-[#8b5a2b] font-bold">MEMOIR & JOURNAL</p>
                <h1 className="text-xl font-extrabold tracking-widest text-[#3a2212]">
                  主様の日記帳
                </h1>
              </div>
              <span className="text-xs font-bold text-[#8b5a2b]">{selectedDate}</span>
            </div>

            <form onSubmit={handleSaveJournal} className="flex flex-col gap-4">
              <textarea
                rows={7}
                placeholder="本日の出来事や想いを自由にお書きくださいませ……"
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                className="journal-textarea w-full p-2 text-sm outline-none resize-none font-medium placeholder-[#8b5a2b]/50"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-xs text-[#F3ECD8] bg-[#561B24] hover:bg-[#6B212B] transition cursor-pointer shadow-md border border-[#BB8632]/60 mt-2"
              >
                {selectedDate} の日記を羊皮紙に綴る
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}