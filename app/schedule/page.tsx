'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TodoItem {
  category: string;
  content: string;
  ok: boolean;
}

export default function SchedulePage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [activitySeconds, setActivitySeconds] = useState<Record<string, number>>({});
  const [activityLogs, setActivityLogs] = useState<Record<string, Record<string, number>>>({});
  
  const [memoText, setMemoText] = useState<string>('');
  const [impressionText, setImpressionText] = useState<string>('');
  const [rating, setRating] = useState<number>(0);

  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [newCategory, setNewCategory] = useState<string>('教科・カテゴリ');
  const [newContent, setNewContent] = useState<string>('');

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

    const loadData = () => {
      const savedSeconds = localStorage.getItem('butler_master_activity_seconds');
      if (savedSeconds) {
        try { setActivitySeconds(JSON.parse(savedSeconds)); } catch (e) {}
      }

      const savedLogs = localStorage.getItem('butler_master_activity_detail_logs');
      if (savedLogs) {
        try { setActivityLogs(JSON.parse(savedLogs)); } catch (e) {}
      }
    };

    loadData();
    const interval = setInterval(loadData, 2000); // 定期的にストレージを監視してリアルタイム反映

    const savedMemo = localStorage.getItem('butler_schedule_memo');
    if (savedMemo) setMemoText(savedMemo);

    const savedImpression = localStorage.getItem('butler_schedule_impression');
    if (savedImpression) setImpressionText(savedImpression);

    const savedRating = localStorage.getItem('butler_schedule_rating');
    if (savedRating) setRating(Number(savedRating));

    const savedTodos = localStorage.getItem('butler_schedule_todos');
    if (savedTodos) {
      try { setTodoList(JSON.parse(savedTodos)); } catch (e) {}
    }

    return () => clearInterval(interval);
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
    setImpressionText(val);
    localStorage.setItem('butler_schedule_impression', val);
  };

  const updateRating = (val: number) => {
    setRating(val);
    localStorage.setItem('butler_schedule_rating', String(val));
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    const next = [...todoList, { category: newCategory.trim() || '全般', content: newContent.trim(), ok: false }];
    setTodoList(next);
    localStorage.setItem('butler_schedule_todos', JSON.stringify(next));
    setNewContent('');
  };

  const toggleTodoOk = (index: number) => {
    const next = [...todoList];
    next[index].ok = !next[index].ok;
    setTodoList(next);
    localStorage.setItem('butler_schedule_todos', JSON.stringify(next));
  };

  const deleteTodo = (index: number) => {
    const next = todoList.filter((_, i) => i !== index);
    setTodoList(next);
    localStorage.setItem('butler_schedule_todos', JSON.stringify(next));
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

        <div className="w-full max-w-4xl rounded-2xl p-5 sm:p-8 shadow-2xl border bg-[#2B0C12] border-[#BB8632] relative">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#BB8632]/40 pb-5 mb-6 gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-[#F3ECD8] font-serif">TODAY'S SCHEDULE</h1>
              <div className="flex items-center gap-1.5 bg-[#3B1218] px-3 py-1 rounded-full border border-[#BB8632]/50">
                <span className="text-lg font-bold text-[#BB8632]">{dateInfo.month}</span><span className="text-xs">月</span>
                <span className="text-lg font-bold text-[#BB8632]">{dateInfo.date}</span><span className="text-xs">日</span>
                <span className="text-sm font-bold text-[#F3ECD8] ml-1">({dateInfo.day})</span>
              </div>
            </div>

            <div className="w-full md:w-80 bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40">
              <p className="text-[10px] text-[#BB8632] tracking-widest mb-1 font-bold">MEMO / 本日の目標</p>
              <input
                type="text"
                value={memoText}
                onChange={(e) => updateMemo(e.target.value)}
                className="w-full bg-transparent text-xs text-[#F3ECD8] outline-none border-b border-[#BB8632]/30 pb-1 placeholder-[#F3ECD8]/30"
                placeholder="ここに本日の目標やメモを入力..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-6 bg-[#23090E] p-4 rounded-xl border border-[#BB8632]/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#BB8632]/40 pb-2 mb-3">
                  <span className="text-xs font-bold text-[#BB8632] tracking-wider">✏️ To do list</span>
                  <span className="text-[10px] text-[#F3ECD8]/60">OK!</span>
                </div>

                <form onSubmit={handleAddTodo} className="flex gap-1.5 mb-3">
                  <input
                    type="text"
                    placeholder="カテゴリ"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-24 px-2 py-1 rounded bg-[#3B1218] border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none placeholder-[#F3ECD8]/30"
                  />
                  <input
                    type="text"
                    placeholder="内容を入力..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-[#3B1218] border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none placeholder-[#F3ECD8]/30"
                  />
                  <button type="submit" className="px-3 py-1 bg-[#BB8632] text-[#1A070B] font-bold text-xs rounded hover:bg-[#D49E4B] transition cursor-pointer">
                    追加
                  </button>
                </form>

                <div className="space-y-2 mb-4 max-h-[260px] overflow-y-auto pr-1">
                  {todoList.length > 0 ? (
                    todoList.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#3B1218]/60 p-2 rounded border border-[#BB8632]/20 group">
                        <span className="text-[10px] bg-[#BB8632] text-[#1A070B] px-1.5 py-0.5 rounded font-bold shrink-0">{item.category}</span>
                        <span className={`text-xs text-[#F3ECD8] flex-1 ${item.ok ? 'line-through opacity-50' : ''}`}>{item.content}</span>
                        <button
                          onClick={() => toggleTodoOk(idx)}
                          className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition cursor-pointer ${item.ok ? 'bg-[#BB8632] text-[#1A070B]' : 'bg-[#1A070B] text-[#BB8632] border border-[#BB8632]/50'}`}
                        >
                          {item.ok ? '✓' : ''}
                        </button>
                        <button onClick={() => deleteTodo(idx)} className="text-[10px] text-red-400 hover:underline px-1 cursor-pointer opacity-60 hover:opacity-100">
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#F3ECD8]/40 italic py-4 text-center">To do listを追加してください</p>
                  )}
                </div>
              </div>

              <div className="bg-[#3B1218] p-3 rounded-xl border border-[#BB8632]/40 mt-2">
                <p className="text-xs font-bold text-[#BB8632] mb-1.5">⏱️ 本日の合計集中時間</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activitySeconds).filter(([_, s]) => s > 0).length > 0 ? (
                    Object.entries(activitySeconds).map(([act, secs]) => (
                      <div key={act} className="bg-[#2B0C12] px-2.5 py-1 rounded border border-[#BB8632]/30 text-xs">
                        <span className="text-[#BB8632] font-bold">{act}:</span> {Math.floor(secs / 60)}分
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-[#F3ECD8]/50 italic">本日のタイマー記録はまだありません</span>
                  )}
                </div>
              </div>
            </div>

            {/* 右側：Time schedule（作業の足跡） */}
            <div className="lg:col-span-6 bg-[#23090E] p-4 rounded-xl border border-[#BB8632]/30 max-h-[500px] overflow-y-auto">
              <div className="border-b border-[#BB8632]/40 pb-2 mb-3 sticky top-0 bg-[#23090E] z-10 flex justify-between items-center">
                <span className="text-xs font-bold text-[#BB8632] tracking-wider">🕒 Time schedule (作業の足跡)</span>
                <span className="text-[10px] text-[#F3ECD8]/60">自動記録</span>
              </div>

              <div className="space-y-1.5">
                {hours.map((h) => {
                  const hourLogs = activityLogs[h]; // 例: { 勉強: 120, 読書: 60 }
                  return (
                    <div key={h} className="flex items-center text-xs py-1.5 border-b border-[#BB8632]/10">
                      <span className="w-14 font-mono text-[#BB8632] font-bold">{h}</span>
                      <div className="flex-1 min-h-[26px] bg-[#3B1218]/40 px-3 py-1 rounded border border-[#BB8632]/20 flex items-center flex-wrap gap-1.5">
                        {hourLogs && Object.keys(hourLogs).length > 0 ? (
                          Object.entries(hourLogs).map(([act, secs]) => {
                            const mins = Math.max(1, Math.floor(secs / 60));
                            return (
                              <span key={act} className="bg-[#BB8632] text-[#1A070B] px-2 py-0.5 rounded text-[11px] font-bold">
                                {act} {mins}分
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[#F3ECD8]/20">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="mt-6 bg-[#23090E] p-4 rounded-xl border border-[#BB8632]/30 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-3/4">
              <p className="text-[10px] text-[#BB8632] tracking-widest mb-1 font-bold">TODAY'S IMPRESSION (本日の振り返り)</p>
              <input
                type="text"
                value={impressionText}
                onChange={(e) => updateImpression(e.target.value)}
                className="w-full bg-[#3B1218] px-3 py-2 rounded border border-[#BB8632]/40 text-xs text-[#F3ECD8] outline-none placeholder-[#F3ECD8]/30"
                placeholder="本日の感想や反省を自由に入力してください..."
              />
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => updateRating(star)}
                  className={`text-2xl cursor-pointer transition ${star <= rating ? 'text-[#BB8632]' : 'text-white/20'}`}
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