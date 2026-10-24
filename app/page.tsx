'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [dateTimeStr, setDateTimeStr] = useState<string>('');
  const [masterName, setMasterName] = useState<string>('主');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  useEffect(() => {
    setIsTransitioning(false);

    // お名前の読み込み
    const savedName = localStorage.getItem('butler_master_name');
    if (savedName) {
      setMasterName(savedName);
    }

    // 時計の更新
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

  const handleNavigate = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(path);
    }, 400);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');
        body, button, input, p, span, h1, div {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }
        .gothic-dock-item {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease-in-out;
        }
        .gothic-dock-item:hover {
          transform: translateY(-3px) scale(1.05);
          filter: brightness(1.2);
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8]"
        style={{ backgroundImage: "url('/485142.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        
        {/* 画面遷移時の暗転 */}
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-between h-full flex-1">
          
          {/* 日時ヘッダー */}
          <div className="w-full rounded-2xl px-5 py-3 mt-2 shadow-2xl backdrop-blur-md text-center border" style={{ backgroundColor: 'rgba(86, 27, 36, 0.85)', borderColor: '#BB8632' }}>
            <p className="text-base font-bold tracking-widest text-[#F3ECD8]">{dateTimeStr || '----年--月--日 (-) --:--:--'}</p>
          </div>

          {/* 執事からの歓迎メッセージ */}
          <div className="w-full rounded-2xl p-5 my-auto shadow-2xl backdrop-blur-md border text-center" style={{ backgroundColor: 'rgba(46, 18, 23, 0.9)', borderColor: '#BB8632' }}>
            <p className="text-xs font-semibold mb-2 tracking-wider text-[#BB8632]">執事ベリアン</p>
            <p className="text-base leading-relaxed text-[#F3ECD8]">
              「お帰りなさいませ、{masterName}様。<br />本日も主様のお手伝いをさせていただけますこと、心より光栄に思います。」
            </p>
          </div>

          {/* 下部ドックメニュー（各機能へのアイコン） */}
          <div className="w-full rounded-3xl p-4 shadow-2xl backdrop-blur-md border mb-4" style={{ backgroundColor: 'rgba(46, 18, 23, 0.92)', borderColor: '#BB8632' }}>
            <div className="grid grid-cols-5 gap-2 items-center justify-items-center">
              
              {/* タイマー */}
              <a href="/timer" onClick={(e) => handleNavigate(e, '/timer')} className="flex flex-col items-center group cursor-pointer">
                <div className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl" style={{ backgroundColor: '#310F14', borderColor: '#BB8632', color: '#F3ECD8' }}>
                  ⏳
                </div>
                <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">タイマー</span>
              </a>

              {/* 予定帳（カレンダー） */}
              <a href="/calendar" onClick={(e) => handleNavigate(e, '/calendar')} className="flex flex-col items-center group cursor-pointer">
                <div className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl" style={{ backgroundColor: '#310F14', borderColor: '#BB8632', color: '#F3ECD8' }}>
                  📅
                </div>
                <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">予定帳</span>
              </a>

              {/* 日記帳 */}
              <a href="/journal" onClick={(e) => handleNavigate(e, '/journal')} className="flex flex-col items-center group cursor-pointer">
                <div className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl" style={{ backgroundColor: '#310F14', borderColor: '#BB8632', color: '#F3ECD8' }}>
                  📖
                </div>
                <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">日記帳</span>
              </a>

              {/* アラーム */}
              <a href="/alarm" onClick={(e) => handleNavigate(e, '/alarm')} className="flex flex-col items-center group cursor-pointer">
                <div className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl" style={{ backgroundColor: '#310F14', borderColor: '#BB8632', color: '#F3ECD8' }}>
                  🔔
                </div>
                <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">アラーム</span>
              </a>

              {/* 🌟 ティーサロン（会話機能） */}
              <a href="/salon" onClick={(e) => handleNavigate(e, '/salon')} className="flex flex-col items-center group cursor-pointer">
                <div className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl" style={{ backgroundColor: '#310F14', borderColor: '#BB8632', color: '#F3ECD8' }}>
                  ☕
                </div>
                <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">サロン</span>
              </a>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}