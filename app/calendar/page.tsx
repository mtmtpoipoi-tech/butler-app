'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  time: string;
  memo: string;
}

export default function CalendarPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    {
      id: '1',
      title: '共通テスト模試',
      date: '2026-10-25',
      time: '09:00',
      memo: '万全の体調で臨む',
    },
  ]);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [memo, setMemo] = useState('');

  const [butlerMessage, setButlerMessage] = useState(
    '「主様の重要なご予定や模試のスケジュール、私がしっかりと管理いたします。」'
  );

  // 予定の追加
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      title: title.trim(),
      date,
      time: time || '09:00',
      memo: memo.trim(),
    };

    setSchedules([newItem, ...schedules]);
    setTitle('');
    setDate('');
    setMemo('');
    setButlerMessage(`「[${newItem.title}] のご予定をスケジュール帳に控えました。」`);
  };

  // Googleカレンダーへ追加するリンクを生成する関数
  const getGoogleCalendarUrl = (item: ScheduleItem) => {
    // 日付と時間をGoogleカレンダー形式 (YYYYMMDDTHHMMSS) に変換
    const startDateTime = `${item.date.replace(/-/g, '')}T${item.time.replace(':', '')}00`;
    // 1時間後を終了時刻とする簡易計算
    const [h, m] = item.time.split(':');
    const endH = String(Number(h) + 1).padStart(2, '0');
    const endDateTime = `${item.date.replace(/-/g, '')}T${endH}${m}00`;

    const text = encodeURIComponent(item.title);
    const details = encodeURIComponent(item.memo ? `【執事の邸宅からの予定】\n${item.memo}` : '【執事の邸宅からの予定】');
    const dates = `${startDateTime}/${endDateTime}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}`;
  };

  // 削除処理
  const handleDelete = (id: string) => {
    if (window.confirm('このスケジュールを削除しますか？')) {
      setSchedules(schedules.filter((item) => item.id !== id));
      setButlerMessage('「スケジュールを一つ整理いたしました。」');
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
          
          {/* ホームに戻るボタン */}
          <div className="w-full mb-3 flex justify-start">
            <Link href="/" className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50">
              ← エントランス（ホーム）へ戻る
            </Link>
          </div>

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

          {/* カレンダー・スケジュールメインカード */}
          <div className="w-full rounded-3xl p-6 sm:p-8 shadow-2xl border-2" style={{ backgroundColor: 'rgba(86, 27, 36, 0.92)', borderColor: '#BB8632' }}>
            
            <h1 className="text-2xl font-bold tracking-wide text-center mb-1 text-[#F3ECD8]">執事のスケジュール帳</h1>
            <p className="text-xs text-center text-[#BB8632] mb-6">予定を登録し、Googleカレンダーへワンタップで連携できます</p>

            {/* 予定追加フォーム */}
            <form onSubmit={handleAddSchedule} className="mb-6 p-4 rounded-2xl border" style={{ backgroundColor: 'rgba(59, 18, 24, 0.6)', borderColor: 'rgba(187, 134, 50, 0.4)' }}>
              <p className="text-xs font-semibold mb-3 tracking-wider text-[#BB8632]">新しい予定を追加</p>

              <div className="flex flex-col gap-3 mb-3">
                <input
                  type="text"
                  placeholder="予定のタイトル（例: 模試、面接対策など）"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ backgroundColor: '#3B1218', color: '#F3ECD8', border: '1px solid #BB8632' }}
                  required
                />

                <div className="flex gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 text-sm px-3 py-2 rounded-xl outline-none cursor-pointer"
                    style={{ backgroundColor: '#3B1218', color: '#F3ECD8', border: '1px solid #BB8632' }}
                    required
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-32 text-sm px-3 py-2 rounded-xl outline-none cursor-pointer"
                    style={{ backgroundColor: '#3B1218', color: '#F3ECD8', border: '1px solid #BB8632' }}
                  />
                </div>

                <input
                  type="text"
                  placeholder="メモ・詳細（任意）"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ backgroundColor: '#3B1218', color: '#F3ECD8', border: '1px solid #BB8632' }}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="gothic-btn px-6 py-2 rounded-xl text-sm font-bold tracking-wider text-[#F3ECD8]"
                  style={{ background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)', border: '1px solid #BB8632' }}
                >
                  予定を登録
                </button>
              </div>
            </form>

            {/* 登録された予定一覧 */}
            <div>
              <p className="text-xs mb-3 tracking-wider text-[#BB8632]">予定一覧 ({schedules.length})</p>

              {schedules.length === 0 ? (
                <p className="text-center text-xs py-4 text-[#F3ECD8]/60">登録されている予定はございません。</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {schedules.map((item) => (
                    <div key={item.id} className="p-3 rounded-2xl border border-[#BB8632]/50 bg-[#3B1218]/70 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs text-[#BB8632] font-semibold block">{item.date} {item.time}</span>
                          <h2 className="text-sm font-bold text-[#F3ECD8]">{item.title}</h2>
                        </div>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-[#F3ECD8]/60 hover:text-red-400 underline"
                        >
                          削除
                        </button>
                      </div>

                      {item.memo && (
                        <p className="text-xs text-[#F3ECD8]/80 bg-[#2B0C12] p-2 rounded-lg">{item.memo}</p>
                      )}

                      {/* Googleカレンダー連携ボタン */}
                      <div className="flex justify-end pt-1">
                        <a
                          href={getGoogleCalendarUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gothic-btn text-xs px-3 py-1.5 rounded-lg font-bold text-[#F3ECD8] flex items-center gap-1 border border-[#BB8632]"
                          style={{ background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)' }}
                        >
                          📅 Googleカレンダーに追加
                        </a>
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