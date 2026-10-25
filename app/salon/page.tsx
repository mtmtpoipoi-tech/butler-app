'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function SalonPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: '「お話し相手をお探しでございますか、主様？何なりとお聞かせくださいませ。」' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, masterName: '万柚子' }),
      });

      const data = await res.json();
      
      const replyText = data.reply || '「お聞き及びいたしました、万柚子様。」';
      setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);

    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: `「恐れ入ります、万柚子様。通信中に不具合が生じたようでございます（${err.message || '不明なエラー'}）。」` }
      ]);
    } finally {
      // ★ ここで絶対にローディングを解除する（フリーズを防止）
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-between p-4 bg-cover bg-center" style={{ backgroundImage: `url('/home-bg-night.jpg')` }}>
      {/* 背景の暗幕 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-0" />

      {/* ヘッダー */}
      <div className="relative z-10 w-full max-w-2xl flex justify-between items-center py-4">
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border border-amber-700/50 rounded-lg text-sm transition-all shadow-md"
        >
          ← エントランス（ホーム）へ戻る
        </button>
        <div className="text-center">
          <h1 className="text-amber-100 font-serif text-lg tracking-wider">執事のティーサロン</h1>
          <p className="text-xs text-amber-300/70">執事とのご歓談</p>
        </div>
        <div className="w-24" /> {/* バランス用 */}
      </div>

      {/* チャットメッセージ表示エリア */}
      <div className="relative z-10 w-full max-w-2xl flex-1 my-4 overflow-y-auto space-y-4 pr-2 max-h-[65vh]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-xl shadow-lg leading-relaxed text-sm ${
                msg.role === 'user'
                  ? 'bg-amber-900/80 text-amber-100 border border-amber-600/40 rounded-br-none'
                  : 'bg-stone-900/90 text-amber-100 border border-amber-700/50 rounded-bl-none font-serif'
              }`}
            >
              <p className="text-xs text-amber-400/70 mb-1">
                {msg.role === 'user' ? '万柚子様' : '執事'}
              </p>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* 言葉を選んでいるときの表示 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-900/90 text-amber-200/80 border border-amber-700/50 p-4 rounded-xl rounded-bl-none text-sm font-serif animate-pulse">
              <p className="text-xs text-amber-400/70 mb-1">執事</p>
              <p>「言葉を選んでおります……」</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力フォーム */}
      <div className="relative z-10 w-full max-w-2xl mb-4">
        <form onSubmit={handleSend} className="flex gap-2 bg-stone-900/80 p-2 rounded-xl border border-amber-700/50 shadow-xl">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="執事にお話ししたいことを入力してください..."
            className="flex-1 bg-transparent px-4 py-2 text-amber-100 placeholder-amber-300/40 focus:outline-none text-sm font-serif"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-amber-100 font-serif rounded-lg text-sm transition-all shadow-md"
          >
            話しかける
          </button>
        </form>
      </div>
    </main>
  );
}