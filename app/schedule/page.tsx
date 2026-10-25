'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SchedulePage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [activitySeconds, setActivitySeconds] = useState<Record<string, number>>({});
  const [activityLogs, setActivityLogs] = useState<Record<string, string>>({});
  
  // スタディプランナー風のカスタマイズステート
  const [memoText, setMemoText] = useState<string>('毎日しっかりと集中する！');
  const [todoList, setTodoList] = useState<Array<{ category: string; content: string; ok: boolean }>>([
    { category: '勉強', content: '集中タイマーセッション完遂', ok: true },
    { category: '読書', content: '専門書のインプット', ok: false },
    { category: '作業', content: 'お屋敷のタスク整理', ok: false },
  ]);
  const [impression, setImpression] = useState<string>('落ち着いた環境で深く集中できてよかった！');
  const [rating, setRating] = useState<number>(5);

  const [dateInfo, setDateInfo] = useState({ month: 9, date: 23, day: '火' });

  const hours = [
    '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    '21:00', '22:00', '23:00', '24:00', '1:00', '2:00', '3:00', '4:00'
  ];

  useEffect(() => {
    const now = new Date();
    setDateInfo({
      month: now.getMonth() + 1,
      date: now.getDate(),
      day: ['日', '月', '火', '水', '木', '金', '土'][now.getDay()]
    });

    const savedSeconds = localStorage.getItem('butler_master_activity_seconds');
    if (savedSeconds) {
      try { setActivitySeconds(JSON.parse(savedSeconds)); } catch (e) {}
    }

    const savedLogs = localStorage.getItem('butler_master_activity_logs');
    if (savedLogs) {
      try { setActivityLogs(JSON.parse(savedLogs)); } catch (e) {}
    }

    const savedMemo = localStorage.getItem('butler_schedule_memo');
    if (savedMemo) setMemoText(savedMemo);

    const savedImpression = localStorage.getItem('butler_schedule_impression');
    if (savedImpression) setImpression(savedImpression);
  }, []);

  const handleBackToTimer = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/timer');
    }, 400);
  };

  const updateMemo = (val: string) => {
    setMemoText(val);
    localStorage.setItem('butler_schedule_memo', val);
  };

  const updateImpression = (val: string) => {
    setImpression(val);
    localStorage.setItem('butler_schedule_impression', val);
  };

  const toggleTodoOk = (index: number) => {
    const next = [...todoList];
    next[index].ok = !next[index].ok;
    setTodoList(next);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&family=Cinzel:wght@400;600;700&display=swap');
        body, button, input, textarea, p, span, h1, div {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 bg-[#1A070B] text-[#F3ECD8] relative">
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

        <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
          <button onClick={handleBackToTimer} className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#3B1218] px-3 py-1.5 rounded-lg border border-[#BB8632]/60 cursor-pointer">
            ← タイマー画面へ戻る
          </button>
          <p className="text-xs text-[#BB8632] tracking-widest">STUDY PLANNER - MANOR EDITION</p>
        </div>

        {/* 📋 スタディプランナー本体（画像のデザインをゴシック＆バーガンディ調に再現） */}
        <div className="w-full max-w-4xl rounded-2xl p-6 sm:p-8 shadow-2xl border bg-[#2B0C12] border-[#BB8632] relative">
          
          {/* 上部ヘッダー */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#BB8632]/40 pb-5 mb-6 gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-[#F3ECD8] font-serif">TODAY'S SCHEDULE</h1>
              <div className="flex items-center gap-1.5 bg-[#3B1218] px-3 py-1 rounded-full border border-[#BB8632]/50">
                <span className="text-lg font-bold text-[#BB8632]">{dateInfo.month}</span><span className="text-xs">月</span>
                <span className="text-lg font-bold text-[#BB8632]">{dateInfo.date}</span><span className="text-xs">日</span>
                <span className="text-sm font-bold text-[#F3ECD8] ml-1">({dateInfo.day})</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-[#3B1218] px-4 py-2 rounded-xl border border-[#BB8632]/40">
              <span className="text-xs text-[#BB8632]">期末テストまで</span>
              <span className="text-xl font-bold text-[#F3ECD8]">あと 12 日</span>
            </div>

            <div className="w-full md:w-72 bg-[#3B1218] p-2.5 rounded-xl border border-[#BB8632]/40">
              <p className="text-[10px] text-[#BB8632] tracking-widest mb-1">MEMO</p>
              <input
                type="text"
                value={memoText}
                onChange={(e) => updateMemo(e.target.value)}
                className="w-full bg-transparent text-xs text-[#F3ECD8] outline-none border-b border-[#BB8632]/30 pb-0.5"
                placeholder="毎日の目標を記入..."
              />
            </div>
          </div>

          {/* 2カラムレイアウト（左：ToDoリスト、右：Time schedule） */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 左側：To do list */}
            <div className="lg:col-span-6 bg-[#23090E] p-4 rounded-xl border border-[#BB8632]/30 flex flex-col">
              <div className="flex items-center justify-between border-b border-[#BB8632]/40 pb-2 mb-3">
                <span className="text-xs font-bold text-[#BB8632] tracking-wider">✏️ To do list (本日の実践内容)</span>
                <span className="text-[10px] text-[#F3ECD8]/60">OK!</span>
              </div>

              <div className="space-y-2 mb-4">
                {todoList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#3B1218]/60 p-2 rounded border border-[#BB8632]/20">
                    <span className="text-[10px] bg-[#BB8632] text-[#1A070B] px-1.5 py-0.5 rounded font-bold">{item.category}</span>
                    <span className="text-xs text-[#F3ECD8] flex-1">{item.content}</span>
                    <button
                      onClick={() => toggleTodoOk(idx)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition cursor-pointer ${item.ok ? 'bg-[#BB8632] text-[#1A070B]' : 'bg-[#1A070B] text-[#BB8632] border border-[#BB8632]/50'}`}
                    >
                      {item.ok ? '✓' : ''}
                    </button>
                  </div>
                ))}
              </div>

              {/* 本日の活動時間サマリーカード */}
              <div className="mt-auto bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40">
                <p className="text-xs font-bold text-[#BB8632] mb-1.5">⏱️ カテゴリ別 集中時間</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activitySeconds).length > 0 ? (
                    Object.entries(activitySeconds).map(([act, secs]) => (
                      <div key={act} className="bg-[#2B0C12] px-2.5 py-1 rounded border border-[#BB8632]/30 text-xs">
                        <span className="text-[#BB8632] font-bold">{act}:</span> {Math.floor(secs / 60)}分
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-[#F3ECD8]/60 italic">本日のタイマー記録はまだありません</span>
                  )}
                </div>
              </div>
            </div>

            {/* 右側：Time schedule（時間ごとの作業実績） */}
            <div className="lg:col-span-6 bg-[#23090E] p-4 rounded-xl border border-[#BB8632]/30 max-h-[500px] overflow-y-auto">
              <div className="border-b border-[#BB8632]/40 pb-2 mb-3 sticky top-0 bg-[#23090E] z-10 flex justify-between items-center">
                <span className="text-xs font-bold text-[#BB8632] tracking-wider">🕒 Time schedule (作業の足跡)</span>
                <span className="text-[10px] text-[#F3ECD8]/60">自動記録</span>
              </div>

              <div className="space-y-1.5">
                {hours.map((h) => {
                  const loggedTask = activityLogs[h];
                  return (
                    <div key={h} className="flex items-center text-xs py-1.5 border-b border-[#BB8632]/10">
                      <span className="w-14 font-mono text-[#BB8632] font-bold">{h}</span>
                      <div className="flex-1 min-h-[24px] bg-[#3B1218]/40 px-3 py-1 rounded border border-[#BB8632]/20 flex items-center">
                        {loggedTask ? (
                          <span className="bg-[#BB8632] text-[#1A070B] px-2 py-0.5 rounded text-[11px] font-bold">
                            {loggedTask}中
                          </span>
                        ) : h === '8:00' ? (
                          <span className="text-[#F3ECD8]/70 italic">学校・お屋敷の準備</span>
                        ) : h === '18:00' ? (
                          <span className="text-[#F3ECD8]/70 italic">夕飯・ティータイム</span>
                        ) : (
                          <span className="text-[#F3ECD8]/30">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 下部：TODAY'S IMPRESSION */}
          <div className="mt-6 bg-[#23090E] p-4 rounded-xl border border-[#BB8632]/30 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-3/4">
              <p className="text-[10px] text-[#BB8632] tracking-widest mb-1">TODAY'S IMPRESSION (本日の振り返り)</p>
              <input
                type="text"
                value={impression}
                onChange={(e) => updateImpression(e.target.value)}
                className="w-full bg-[#3B1218] px-3 py-2 rounded border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none"
                placeholder="今日の感想や反省を記入..."
              />
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-xl cursor-pointer transition ${star <= rating ? 'text-[#BB8632]' : 'text-white/20'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}