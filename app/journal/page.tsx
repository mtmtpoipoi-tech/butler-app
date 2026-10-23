'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  totalWorkSeconds?: number;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [todayWorkSeconds, setTodayWorkSeconds] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0); // 🌟 現在開いているページのインデックス
  const [butlerMessage, setButlerMessage] = useState(
    '「主様の日記帳をページごとに優雅にめくっていただけるよう製本いたしました。過去の軌跡をゆっくりと振り返りましょう。」'
  );

  // ローカルストレージからの読み込み（更新で消えないマスターキーを使用）
  useEffect(() => {
    setIsMounted(true);

    const savedSeconds = localStorage.getItem('butler_master_total_seconds');
    if (savedSeconds) {
      setTodayWorkSeconds(parseInt(savedSeconds, 10) || 0);
    }

    const saved = localStorage.getItem('butler_master_journal_entries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEntries(parsed);
      } catch (e) {}
    }
  }, []);

  // ローカルストレージへの保存
  const saveToStorage = (newEntries: JournalEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem('butler_master_journal_entries', JSON.stringify(newEntries));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: dateStr,
      title: title.trim() || '無題の日記',
      content: content.trim(),
      totalWorkSeconds: todayWorkSeconds,
    };

    const updated = [newEntry, ...entries];
    saveToStorage(updated);
    setCurrentIndex(0); // 新規作成時は最新のページを開く

    setTitle('');
    setContent('');
    setButlerMessage('「新しいページに素晴らしいお言葉と努力の足跡を刻み、本棚へとお納めいたしました。」');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('このページの記録を破棄いたしますか？')) {
      const updated = entries.filter((item) => item.id !== id);
      saveToStorage(updated);
      if (currentIndex >= updated.length && updated.length > 0) {
        setCurrentIndex(updated.length - 1);
      }
      setButlerMessage('「日記の1ページを丁寧に整理いたしました。」');
    }
  };

  // ページめくり操作
  const handlePrevPage = () => {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setButlerMessage('「過去のページへと紐解いてまいります……。」');
    }
  };

  const handleNextPage = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setButlerMessage('「より新しい日付のページへと進んでまいります。」');
    }
  };

  const formatTotalTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}時間 ${mins}分`;
    }
    return `${mins}分 ${secs}秒`;
  };

  const currentEntry = entries[currentIndex];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');

        body, button, input, textarea, p, span, h1, div {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }

        .notebook-paper {
          background-color: #f4ead4;
          background-image: linear-gradient(#e1d3b7 1px, transparent 1px);
          background-size: 100% 2rem;
          line-height: 2rem;
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
        style={{ backgroundImage: "url('/485142.jpg')", color: '#3A2B1D' }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
          
          {/* ホームに戻るボタン */}
          <div className="w-full mb-3 flex justify-start">
            <Link href="/" className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50">
              ← エントランス（ホーム）へ戻る
            </Link>
          </div>

          {/* 執事からのメッセージ */}
          <div 
            className="w-full rounded-2xl p-4 mb-4 shadow-2xl backdrop-blur-md"
            style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632', color: '#F3ECD8' }}
          >
            <p className="text-xs font-semibold mb-1 tracking-wider text-[#BB8632]">
              執事からの言葉
            </p>
            <p className="text-sm leading-relaxed">
              {butlerMessage}
            </p>
          </div>

          {/* 本日の総集中時間インジケーター */}
          <div 
            className="w-full rounded-2xl px-5 py-3 mb-4 shadow-2xl backdrop-blur-md flex items-center justify-between"
            style={{ backgroundColor: 'rgba(86, 27, 36, 0.9)', border: '1px solid #BB8632', color: '#F3ECD8' }}
          >
            <span className="text-xs font-semibold tracking-wider text-[#BB8632]">
              本日の蓄積された集中時間
            </span>
            <span className="text-sm font-bold">
              {isMounted ? formatTotalTime(todayWorkSeconds) : '0分'}
            </span>
          </div>

          {/* アンティークノート本体 */}
          <div className="w-full rounded-2xl p-6 sm:p-8 shadow-2xl border-4 relative overflow-hidden" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
            
            {/* ノートの見出し */}
            <div className="text-center mb-6 pb-3 border-b border-[#BB8632]/40">
              <h1 className="text-2xl font-bold tracking-widest text-[#F3ECD8]">主の日記帳</h1>
              <p className="text-xs text-[#BB8632] mt-1">THE BUTLER'S JOURNAL</p>
            </div>

            {/* 新規日記執筆エリア */}
            <form onSubmit={handleSave} className="mb-8 pb-6 border-b border-[#BB8632]/30">
              <p className="text-xs font-bold mb-2 tracking-wider text-[#BB8632]">✦ 新しいページを綴る</p>
              <div className="rounded-xl p-5 shadow-inner border border-[#B08D57] notebook-paper" style={{ color: '#2B1A09' }}>
                <input
                  type="text"
                  placeholder="題名（例: 本日の学習成果、振り返り）"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent font-bold text-base outline-none mb-2 border-b border-[#B08D57]/40 pb-1"
                  style={{ color: '#2B1A09' }}
                />
                <textarea
                  rows={4}
                  placeholder="ここに本日の出来事や想いをお認めくださいませ..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none resize-none leading-8"
                  style={{ color: '#2B1A09' }}
                  required
                />
              </div>

              <div className="mt-3 flex justify-between items-center">
                <span className="text-[11px] text-[#F3ECD8]/75 italic">
                  ※集中時間 ({isMounted ? formatTotalTime(todayWorkSeconds) : '0分'}) が一緒に記録されます
                </span>
                <button
                  type="submit"
                  className="gothic-btn px-6 py-2 rounded-xl text-xs font-bold tracking-wider text-[#F3ECD8]"
                  style={{ background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)', border: '1px solid #BB8632' }}
                >
                  日記を記す
                </button>
              </div>
            </form>

            {/* 過去の日記閲覧・ページめくりエリア */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-bold tracking-wider text-[#BB8632]">✦ 過去の日記をめくる</p>
                {entries.length > 0 && (
                  <span className="text-[11px] text-[#F3ECD8]/80 font-semibold">
                    {currentIndex + 1} / {entries.length} ページ目
                  </span>
                )}
              </div>

              {entries.length === 0 ? (
                <p className="text-center text-xs py-6 text-[#F3ECD8]/50 italic">まだ日記は綴られておりません。</p>
              ) : (
                <div>
                  {/* 現在表示中のページカード */}
                  {currentEntry && (
                    <div className="rounded-xl p-5 border shadow-md relative mb-4" style={{ backgroundColor: '#F4EAD4', borderColor: '#B08D57', color: '#2B1A09' }}>
                      <div className="flex justify-between items-start mb-3 pb-2 border-b border-[#B08D57]/30">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] tracking-wider text-[#8A5A2D] font-bold">{currentEntry.date}</span>
                            {currentEntry.totalWorkSeconds !== undefined && currentEntry.totalWorkSeconds > 0 && (
                              <span className="text-[10px] bg-[#8A5A2D]/20 text-[#6B3E13] px-2 py-0.5 rounded font-bold">
                                集中時間: {formatTotalTime(currentEntry.totalWorkSeconds)}
                              </span>
                            )}
                          </div>
                          <h2 className="text-base font-bold text-[#3A2B1D]">{currentEntry.title}</h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(currentEntry.id)}
                          className="text-xs text-[#8A2D2D] hover:underline opacity-70 hover:opacity-100"
                        >
                          破棄
                        </button>
                      </div>
                      <p className="text-xs whitespace-pre-wrap leading-6 text-[#4A3828] min-h-[100px]">{currentEntry.content}</p>
                    </div>
                  )}

                  {/* ページめくりボタン */}
                  <div className="flex justify-between items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={currentIndex >= entries.length - 1}
                      className="gothic-btn flex-1 py-2 px-3 rounded-xl text-xs font-bold tracking-wider text-[#F3ECD8] transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(180deg, #3B1218 0%, #240A0E 100%)', border: '1px solid #BB8632' }}
                    >
                      ◀ 前のページ（古い記録）
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={currentIndex <= 0}
                      className="gothic-btn flex-1 py-2 px-3 rounded-xl text-xs font-bold tracking-wider text-[#F3ECD8] transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(180deg, #3B1218 0%, #240A0E 100%)', border: '1px solid #BB8632' }}
                    >
                      次のページ（新しい記録） ▶
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}