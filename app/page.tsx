'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');
        
        body, button, p, span, h1, h2, div {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }

        .gothic-btn {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease-in-out;
        }
        
        .gothic-btn:hover {
          filter: brightness(1.2);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(187, 134, 50, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.4);
        }

        .gothic-btn:active {
          transform: translateY(1px);
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-between p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: "url('/home-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

        {/* ヘルパー・上部装飾 */}
        <div className="relative z-10 w-full max-w-lg text-center pt-8">
          <p className="text-xs sm:text-sm tracking-[0.3em] text-[#BB8632] mb-2">THE BUTLER'S MANOR</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-widest text-[#F3ECD8] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            主の邸宅
          </h1>
        </div>

        {/* 中央：執事からのウェルカムメッセージ ＆ メニュー */}
        <div className="relative z-10 w-full max-w-md flex flex-col gap-6 my-auto">
          
          <div 
            className="rounded-2xl p-6 shadow-2xl backdrop-blur-md text-center border"
            style={{ backgroundColor: 'rgba(86, 27, 36, 0.85)', borderColor: '#BB8632' }}
          >
            <p className="text-xs font-semibold mb-2 tracking-widest text-[#BB8632]">
              執事よりのご挨拶
            </p>
            <p className="text-base sm:text-lg leading-relaxed italic font-light text-[#F3ECD8]">
              「おかえりなさいませ、主様。お待ちしておりました。」
            </p>
          </div>

          {/* メニューボタン群 */}
          <div className="flex flex-col gap-3">
            
            {/* 1. 集中タイマー */}
            <Link href="/timer" className="w-full">
              <button 
                className="gothic-btn w-full py-4 px-6 rounded-xl text-lg font-bold tracking-wider flex items-center justify-between border"
                style={{
                  background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)',
                  color: '#F3ECD8',
                  borderColor: '#BB8632'
                }}
              >
                <span>⏳ 執事の集中タイマー</span>
                <span className="text-sm opacity-80">入室する →</span>
              </button>
            </Link>

            {/* 2. アラーム機能 */}
            <Link href="/alarm" className="w-full">
              <button 
                className="gothic-btn w-full py-4 px-6 rounded-xl text-lg font-bold tracking-wider flex items-center justify-between border"
                style={{
                  background: 'linear-gradient(180deg, #A46D37 0%, #8A5A2D 100%)',
                  color: '#F3ECD8',
                  borderColor: '#BB8632'
                }}
              >
                <span>🔔 執事のアラーム</span>
                <span className="text-sm opacity-80">入室する →</span>
              </button>
            </Link>

            {/* 3. ティーサロン（準備中） */}
            <button 
              onClick={() => alert('「主様、ティーサロンの設えはまもなく完了いたします。」')}
              className="gothic-btn w-full py-3.5 px-6 rounded-xl text-base font-medium tracking-wider flex items-center justify-between border opacity-80 hover:opacity-100"
              style={{
                background: 'linear-gradient(180deg, #3B1218 0%, #240A0E 100%)',
                color: '#F3ECD8',
                borderColor: 'rgba(187, 134, 50, 0.4)'
              }}
            >
              <span>☕ ティーサロン・息抜き（準備中）</span>
              <span className="text-xs opacity-60">近日公開</span>
            </button>

          </div>
        </div>

        <div className="relative z-10 pb-4 text-center">
          <p className="text-xs tracking-widest text-[#BB8632]/70">
            © 2026 Butler Productivity Manor
          </p>
        </div>

      </div>
    </>
  );
}