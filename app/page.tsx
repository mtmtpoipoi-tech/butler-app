'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [dateTimeStr, setDateTimeStr] = useState<string>('');
  const [masterName, setMasterName] = useState<string>('主');
  const [bgImage, setBgImage] = useState<string>('/home-bg.jpg');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isSettingOpen, setIsSettingOpen] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');

  // BGM / 暖炉の音用
  const [isPlayingFire, setIsPlayingFire] = useState<boolean>(false);
  const fireAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsTransitioning(false);

    // お名前の読み込み
    const savedName = localStorage.getItem('butler_master_name');
    if (savedName) {
      setMasterName(savedName);
      setTempName(savedName);
    } else {
      setTempName('主');
    }

    // 背景設定の読み込み
    const savedBg = localStorage.getItem('butler_master_bg');
    if (savedBg) {
      setBgImage(savedBg);
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

  // 画面遷移
  const handleNavigate = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (fireAudioRef.current) {
      fireAudioRef.current.pause();
    }
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(path);
    }, 400);
  };

  // 暖炉の音トグル
  const toggleFireAudio = () => {
    if (!fireAudioRef.current) return;
    if (isPlayingFire) {
      fireAudioRef.current.pause();
      setIsPlayingFire(false);
    } else {
      fireAudioRef.current.play().then(() => {
        setIsPlayingFire(true);
      }).catch(() => {});
    }
  };

  // 設定保存
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setMasterName(tempName.trim());
      localStorage.setItem('butler_master_name', tempName.trim());
    }
    localStorage.setItem('butler_master_bg', bgImage);
    setIsSettingOpen(false);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');
        body, button, input, p, span, h1, div, select {
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

      {/* 暖炉の環境音 */}
      <audio ref={fireAudioRef} src="/fireplace.mp4" loop />

      <div
        className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8] transition-all duration-700"
        style={{ backgroundImage: `url('${bgImage}')` }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        
        {/* 画面遷移時の暗転 */}
        <div className={`fixed inset-0 bg-black z-50 pointer-events-none transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-between h-full flex-1">
          
          {/* 上部ヘッダー（設定ボタン＆暖炉音トグル） */}
          <div className="w-full flex justify-between items-center mb-2">
            <button
              onClick={() => setIsSettingOpen(true)}
              className="text-xs text-[#BB8632] bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50 hover:brightness-110 cursor-pointer shadow-md"
            >
              ⚙️ お部屋の設定
            </button>

            <button
              onClick={toggleFireAudio}
              className="text-xs text-[#BB8632] bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50 hover:brightness-110 cursor-pointer shadow-md flex items-center gap-1"
            >
              🔥 暖炉の音: {isPlayingFire ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* 日時ヘッダー */}
          <div className="w-full rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-md text-center border" style={{ backgroundColor: 'rgba(86, 27, 36, 0.85)', borderColor: '#BB8632' }}>
            <p className="text-base font-bold tracking-widest text-[#F3ECD8]">{dateTimeStr || '----年--月--日 (-) --:--:--'}</p>
          </div>

          {/* 執事からの歓迎メッセージ */}
          <div className="w-full rounded-2xl p-5 my-auto shadow-2xl backdrop-blur-md border text-center" style={{ backgroundColor: 'rgba(46, 18, 23, 0.9)', borderColor: '#BB8632' }}>
            <p className="text-xs font-semibold mb-2 tracking-wider text-[#BB8632]">執事ベリアン</p>
            <p className="text-base leading-relaxed text-[#F3ECD8]">
              「お帰りなさいませ、{masterName}様。<br />本日も主様のお手伝いをさせていただけますこと、心より光栄に思います。」
            </p>
          </div>

          {/* 下部ドックメニュー（画像アイコン対応版） */}
          <div className="w-full rounded-3xl p-4 shadow-2xl backdrop-blur-md border mb-4" style={{ backgroundColor: 'rgba(46, 18, 23, 0.92)', borderColor: '#BB8632' }}>
            <div className="grid grid-cols-5 gap-2 items-center justify-items-center">
              
              {/* タイマー */}
              <a href="/timer" onClick={(e) => handleNavigate(e, '/timer')} className="flex flex-col items-center group cursor-pointer">
                <div className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl bg-[#310F14]" style={{ borderColor: '#BB8632' }}>
                  ⏳
                </div>
                <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">タイマー</span>
              </a>

              {/* 予定帳（カレンダー） */}
              <a href="/calendar" onClick={(e) => handleNavigate(e, '/calendar')} className="flex flex-col items-center group cursor-pointer">
                <div className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#310F14]" style={{ borderColor: '#BB8632' }}>
                  <img src="/icon-calendar.jpg" alt="カレンダー" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerText = '📅'; }} />
                </div>
                <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">予定帳</span>
              </a>

              {/* 日記帳 */}
              <a href="/journal" onClick={(e) => handleNavigate(e, '/journal')} className="flex flex-col items-center group cursor-pointer">
                <div className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#310F14]" style={{ borderColor: '#BB8632' }}>
                  <img src="/icon-journal.jpg" alt="日記帳" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerText = '📖'; }} />
                </div>
                <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">日記帳</span>
              </a>

              {/* アラーム */}
              <a href="/alarm" onClick={(e) => handleNavigate(e, '/alarm')} className="flex flex-col items-center group cursor-pointer">
                <div className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#310F14]" style={{ borderColor: '#BB8632' }}>
                  <img src="/icon-alarm.jpg" alt="アラーム" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerText = '🔔'; }} />
                </div>
                <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">アラーム</span>
              </a>

              {/* ☕ ティーサロン（会話機能） */}
              <a href="/salon" onClick={(e) => handleNavigate(e, '/salon')} className="flex flex-col items-center group cursor-pointer">
                <div className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl bg-[#310F14]" style={{ borderColor: '#BB8632', color: '#F3ECD8' }}>
                  ☕
                </div>
                <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">サロン</span>
              </a>

            </div>
          </div>

        </div>

        {/* ⚙️ お部屋の設定モーダル */}
        {isSettingOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl p-6 border shadow-2xl" style={{ backgroundColor: '#2E1217', borderColor: '#BB8632' }}>
              <h2 className="text-base font-bold text-[#F3ECD8] mb-4 text-center border-b border-[#BB8632]/40 pb-2">
                ⚙️ お屋敷の設定
              </h2>

              <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-[#BB8632] font-semibold mb-1 block">主様のお呼び名:</label>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 p-2 rounded-lg text-xs outline-none"
                    placeholder="例: 主, お嬢様"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#BB8632] font-semibold mb-1 block">お部屋の背景スタイル:</label>
                  <select
                    value={bgImage}
                    onChange={(e) => setBgImage(e.target.value)}
                    className="w-full bg-[#240A0E] text-[#F3ECD8] border border-[#BB8632]/60 p-2 rounded-lg text-xs outline-none cursor-pointer"
                  >
                    <option value="/485142.jpg">標準のお部屋 (クラシック)</option>
                    <option value="/home-bg-morning.jpg">朝の執事室</option>
                    <option value="/home-bg-night.jpg">夜の執事室</option>
                    <option value="/home-bg.jpg">メインホール</option>
                  </select>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingOpen(false)}
                    className="flex-1 py-2 rounded-xl text-xs text-[#F3ECD8] bg-[#3B1218] border border-[#BB8632]/40 hover:bg-[#561B24] cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-[#2B0C12] bg-[#BB8632] hover:bg-[#D49E4B] cursor-pointer shadow-md"
                  >
                    保存する
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}