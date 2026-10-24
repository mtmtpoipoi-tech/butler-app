'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  sender: 'master' | 'butler';
  text: string;
}

export default function SalonPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [masterName, setMasterName] = useState<string>('主');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsTransitioning(false);
    const savedName = localStorage.getItem('butler_master_name');
    const currentName = savedName && savedName.trim() !== '' ? savedName.trim() : '主';
    setMasterName(currentName);

    setMessages([
      {
        sender: 'butler',
        text: `「お話し相手をお探しでございますか、${currentName}様？何なりとお聞かせくださいませ。」`,
      },
    ]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNavigateHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/');
    }, 400);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { sender: 'master', text: userText },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, masterName }),
      });

      const data = await res.json();
      setMessages([
        ...updatedMessages,
        { sender: 'butler', text: data.reply },
      ]);
    } catch (error) {
      setMessages([
        ...updatedMessages,
        {
          sender: 'butler',
          text: `「大変申し訳ございません、${masterName}様。お声が届きにくくなっているようでございます。」`,
        },
      ]);
    } finally {
      setLoading(false);
    }
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
        className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: "url('/485142.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center h-full flex-1 justify-between">
          <div className="w-full mb-3 flex justify-start">
            <Link 
              href="/" 
              onClick={handleNavigateHome}
              className="text-xs text-[#BB8632] hover:underline flex items-center gap-1 bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50 cursor-pointer"
            >
              ← エントランス（ホーム）へ戻る
            </Link>
          </div>

          <div className="w-full rounded-2xl p-4 sm:p-5 shadow-2xl border flex flex-col flex-1 max-h-[68vh] mb-4 overflow-hidden" style={{ backgroundColor: 'rgba(46, 18, 23, 0.92)', borderColor: '#BB8632' }}>
            <div className="border-b border-[#BB8632]/40 pb-2 mb-3 text-center">
              <h1 className="text-base font-bold text-[#F3ECD8] tracking-widest">
                ☕ 執事のティーサロン
              </h1>
              <p className="text-[10px] text-[#BB8632]">執事とのご歓談</p>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'master' ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-[#BB8632] mb-1 px-1">
                    {msg.sender === 'master' ? `${masterName}様` : '執事'}
                  </span>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                      msg.sender === 'master'
                        ? 'bg-[#8B5A2B] text-[#F3ECD8] rounded-br-none border border-[#BB8632]/60'
                        : 'bg-[#3B1218] text-[#F3ECD8] rounded-bl-none border border-[#BB8632]/40'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-[#BB8632] mb-1 px-1">執事</span>
                  <div className="bg-[#3B1218] text-[#BB8632] italic text-xs p-3 rounded-2xl rounded-bl-none border border-[#BB8632]/40">
                    言葉をお選びしております……
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="w-full flex gap-2 mb-2">
            <input
              type="text"
              placeholder="執事にお話ししたいことを入力してください..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 px-4 py-2.5 rounded-xl text-xs sm:text-sm outline-none placeholder-[#F3ECD8]/40"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#2B0C12] bg-[#BB8632] hover:bg-[#D49E4B] transition cursor-pointer disabled:opacity-50 shadow-md shrink-0"
            >
              話しかける
            </button>
          </form>
        </div>
      </div>
    </>
  );
}