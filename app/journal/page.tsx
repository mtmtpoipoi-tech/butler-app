'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  totalWorkSeconds?: number; // 🌟 記録時の総集中時間（秒）
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [todayWorkSeconds, setTodayWorkSeconds] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [butlerMessage, setButlerMessage] = useState(
    '「主様の本日の学びや想い、そして重ねられた努力の軌跡を、どうぞこの羊皮紙にお認めくださいませ。」'
  );

  // 🌟 ローカルストレージからの読み込み（更新で消えないマスターキーを使用）
  useEffect(() => {
    setIsMounted(true);

    // タイマー側で計測している本ジの総集中時間を取得
    const savedSeconds = localStorage.getItem('butler_master_total_seconds');
    if (savedSeconds) {
      setTodayWorkSeconds(parseInt(savedSeconds, 10) || 0);
    }

    // 日記データの読み込み
    const saved = localStorage.getItem('butler_master_journal_entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
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
      totalWorkSeconds: todayWorkSeconds, // 🌟 投稿時点の総集中時間を保存
    };

    const updated = [newEntry, ...entries];
    saveToStorage(updated);

    setTitle('');
    setContent('');
    setButlerMessage('「素晴らしいお言葉と、本日の努力の足跡をしっかりとお納めいたしました。」');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('この日記を破棄いたしますか？')) {
      const updated = entries.filter((item) => item.id !== id);
      saveToStorage(updated);
      setButlerMessage('「日記を一つ整理いたしました。」');
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

            {/* 日記執筆エリア（羊皮紙風） */}
            <form onSubmit={handleSave} className="mb-8">
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
                  rows={5}
                  placeholder="ここに本日の出来事や想いをお認めくださいませ..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none resize-none leading-8"
                  style={{ color: '#2B1A09' }}
                  required
                />
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className="text-[11px] text-[#F3ECD8]/70 italic">
                  ※現在の集中時間 ({isMounted ? formatTotalTime(todayWorkSeconds) : '0分'}) が一緒に記録されます
                </span>
                <button
                  type="submit"
                  className="gothic-btn px-6 py-2.5 rounded-xl text-sm font-bold tracking-wider text-[#F3ECD8]"
                  style={{ background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)', border: '1px solid #BB8632' }}
                >
                  日記を記す
                </button>
              </div>
            </form>

            {/* 過去の日記一覧 */}
            <div>
              <p className="text-xs font-bold mb-3 tracking-wider text-[#BB8632]">これまでの日記（{entries.length} 冊）</p>

              {entries.length === 0 ? (
                <p className="text-center text-xs py-6 text-[#F3ECD8]/50 italic">まだ日記は綴られておりません。</p>
              ) : (
                <div className="flex flex-col gap-4 max-h-72 overflow-y-auto pr-1">
                  {entries.map((item) => (
                    <div key={item.id} className="rounded-xl p-4 border shadow-md relative" style={{ backgroundColor: '#F4EAD4', borderColor: '#B08D57', color: '#2B1A09' }}>
                      <div className="flex justify-between items-start mb-2 pb-1 border-b border-[#B08D57]/30">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] tracking-wider text-[#8A5A2D] font-semibold">{item.date}</span>
                            {item.totalWorkSeconds !== undefined && item.totalWorkSeconds > 0 && (
                              <span className="text-[10px] bg-[#8A5A2D]/20 text-[#6B3E13] px-1.5 py-0.5 rounded font-bold">
                                集中: {formatTotalTime(item.totalWorkSeconds)}
                              </span>
                            )}
                          </div>
                          <h2 className="text-sm font-bold text-[#3A2B1D] mt-0.5">{item.title}</h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-[#8A2D2D] hover:underline opacity-70 hover:opacity-100"
                        >
                          破棄
                        </button>
                      </div>
                      <p className="text-xs whitespace-pre-wrap leading-6 text-[#4A3828]">{item.content}</p>
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