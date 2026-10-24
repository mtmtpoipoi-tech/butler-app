'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isPlayingFire, setIsPlayingFire] = useState<boolean>(false);
  const [isAutoTime, setIsAutoTime] = useState<boolean>(false);
  const [masterName, setMasterName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [inputName, setInputName] = useState<string>('');
  const [bgImage, setBgImage] = useState<string>('/home-bg.jpg');
  const [currentHour, setCurrentHour] = useState<number>(12);

  // 🌟 天気モーダル用のステート
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);
  const [weatherCondition, setWeatherCondition] = useState<string>('');
  const [maxTemp, setMaxTemp] = useState<string>('');
  const [minTemp, setMinTemp] = useState<string>('');
  const [indexComment, setIndexComment] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初回訪問の判定 ＆ ローカルストレージから主様のお名前・お天気情報を読み込む
  useEffect(() => {
    const savedName = localStorage.getItem('butler_master_name');
    if (savedName) {
      setMasterName(savedName);
    } else {
      setShowNameModal(true);
    }

    // お天気データの復元
    const savedWeather = localStorage.getItem('butler_today_weather');
    if (savedWeather) {
      try {
        const parsed = JSON.parse(savedWeather);
        setWeatherCondition(parsed.condition || '');
        setMaxTemp(parsed.maxTemp || '');
        setMinTemp(parsed.minTemp || '');
        setIndexComment(parsed.indexComment || '');
      } catch (e) {}
    }
  }, []);

  const handleSaveInitialName = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToSave = inputName.trim() || '主';
    setMasterName(nameToSave);
    localStorage.setItem('butler_master_name', nameToSave);
    setShowNameModal(false);
  };

  const handleChangeName = () => {
    const newName = window.prompt('執事がお呼びするお名前（主様のお名前）を入力してくださいませ：', masterName || '主');
    if (newName && newName.trim() !== '') {
      const trimmed = newName.trim();
      setMasterName(trimmed);
      localStorage.setItem('butler_master_name', trimmed);
    }
  };

  // 🌟 お天気情報の保存
  const handleSaveWeather = (e: React.FormEvent) => {
    e.preventDefault();
    const weatherData = {
      condition: weatherCondition,
      maxTemp,
      minTemp,
      indexComment,
    };
    localStorage.setItem('butler_today_weather', JSON.stringify(weatherData));
    setShowWeatherModal(false);
  };

  useEffect(() => {
    const checkEnvironment = () => {
      const now = new Date();
      const month = now.getMonth();
      const date = now.getDate();
      const hours = now.getHours();

      setCurrentHour(hours);

      if (hours >= 6 && hours < 8) {
        setBgImage('/home-bg-morning.jpg');
      } else if (hours >= 17 || hours < 6) {
        setBgImage('/home-bg-night.jpg');
      } else {
        setBgImage('/home-bg.jpg');
      }

      let isSeason = false;
      if (month > 8 || month < 2) {
        isSeason = true;
      } else if (month === 8 && date >= 23) {
        isSeason = true;
      } else if (month === 2 && date <= 21) {
        isSeason = true;
      }

      const isTime = hours >= 17 || hours < 7;
      const shouldPlay = isSeason && isTime;
      setIsAutoTime(shouldPlay);

      if (shouldPlay && audioRef.current && !isPlayingFire) {
        audioRef.current.play().then(() => {
          setIsPlayingFire(true);
        }).catch(() => {
          setIsPlayingFire(false);
        });
      } else if (!shouldPlay && isPlayingFire) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlayingFire(false);
      }
    };

    checkEnvironment();
    const timer = setInterval(checkEnvironment, 30000);
    return () => clearInterval(timer);
  }, [isPlayingFire]);

  const getButlerGreeting = () => {
    const name = masterName || '主';
    if (isAutoTime || currentHour >= 17 || currentHour < 6) {
      return `「おかえりなさいませ。お部屋の暖炉に心地よい火を灯しております、${name}様。どうぞ温まりながらお過ごしくださいませ。」`;
    }
    if (currentHour >= 6 && currentHour < 11) {
      return `「おはようございます、${name}様。」`;
    }
    return `「おかえりなさいませ、${name}様。お待ちしておりました。」`;
  };

  const toggleFireSound = () => {
    if (audioRef.current) {
      if (isPlayingFire) {
        audioRef.current.pause();
        setIsPlayingFire(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlayingFire(true);
        }).catch(() => {});
      }
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&display=swap');
        
        body, button, p, span, h1, h2, div, input, textarea {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }

        .gothic-dock-item {
          transition: all 0.3s ease-in-out;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
        }
        
        .gothic-dock-item:hover {
          transform: translateY(-4px);
          filter: brightness(1.15);
          box-shadow: 0 8px 20px rgba(187, 134, 50, 0.5);
        }
      `}</style>

      <audio ref={audioRef} src="/fireplace.mp4" loop />

      <div
        className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 bg-cover bg-center bg-no-repeat relative text-[#F3ECD8] transition-all duration-1000"
        style={{ backgroundImage: `url('${bgImage}')` }}
      >
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />

        {/* 🌹 初回お名前入力モーダル */}
        {showNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div 
              className="w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl border text-center relative"
              style={{ backgroundColor: 'rgba(59, 18, 24, 0.95)', borderColor: '#BB8632' }}
            >
              <p className="text-xs tracking-[0.3em] text-[#BB8632] mb-2">WELCOME TO MANOR</p>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F3ECD8] mb-4">
                ようこそ、主のお屋敷へ
              </h2>
              <p className="text-xs sm:text-sm text-[#F3ECD8]/90 leading-relaxed italic mb-6">
                「はじめまして。私はこの邸宅でお仕えする執事でございます。<br />
                執事としてお仕えするにあたり、お名前をお伺いしてもよろしいでしょうか？」
              </p>

              <form onSubmit={handleSaveInitialName} className="flex flex-col items-center gap-4">
                <input
                  type="text"
                  placeholder="お名前を入力してください"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#2B0C12] border border-[#BB8632]/60 text-[#F3ECD8] placeholder-[#F3ECD8]/40 text-center text-sm focus:outline-none focus:border-[#BB8632]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#BB8632] text-[#2B0C12] font-bold text-sm hover:bg-[#D49E4B] transition shadow-lg"
                >
                  邸宅に入る
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ☀️ 天気情報 設定・確認モーダル */}
        {showWeatherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div 
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl border relative text-[#F3ECD8]"
              style={{ backgroundColor: 'rgba(59, 18, 24, 0.95)', borderColor: '#BB8632' }}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#BB8632]/40">
                <h2 className="text-lg font-bold text-[#F3ECD8]">☀️ 本日の天気手帳</h2>
                <button 
                  onClick={() => setShowWeatherModal(false)}
                  className="text-xs text-[#BB8632] hover:underline"
                >
                  閉じる ✖
                </button>
              </div>

              <form onSubmit={handleSaveWeather} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-[#BB8632] block mb-1">本日の天気（例：曇りのち雨）</label>
                  <input
                    type="text"
                    placeholder="晴れ / 曇りのち雨 など"
                    value={weatherCondition}
                    onChange={(e) => setWeatherCondition(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-[#2B0C12] border border-[#BB8632]/50 text-xs text-[#F3ECD8] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-[#BB8632] block mb-1">最高気温（℃）</label>
                    <input
                      type="text"
                      placeholder="25℃"
                      value={maxTemp}
                      onChange={(e) => setMaxTemp(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-[#2B0C12] border border-[#BB8632]/50 text-xs text-[#F3ECD8] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#BB8632] block mb-1">最低気温（℃）</label>
                    <input
                      type="text"
                      placeholder="15℃"
                      value={minTemp}
                      onChange={(e) => setMinTemp(e.target.value)}
                      className="w-full px-3 py-1.5 rounded bg-[#2B0C12] border border-[#BB8632]/50 text-xs text-[#F3ECD8] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#BB8632] block mb-1">
                    Yahoo!天気の指数欄（マーク3以上のコメント）
                  </label>
                  <textarea
                    rows={3}
                    placeholder="例: お出かけの際は、どうぞ傘をお忘れなきようお気を付けくださいませ。"
                    value={indexComment}
                    onChange={(e) => setIndexComment(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-[#2B0C12] border border-[#BB8632]/50 text-xs text-[#F3ECD8] outline-none resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full py-2 rounded-lg bg-[#BB8632] text-[#2B0C12] font-bold text-xs hover:bg-[#D49E4B] transition"
                >
                  天気情報を保存する
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 上部：タイトル ＆ お名前変更 ＆ 暖炉・お天気ボタン */}
        <div className="relative z-10 w-full max-w-lg text-center pt-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs tracking-[0.3em] text-[#BB8632]">THE BUTLER'S MANOR</p>
            {masterName && (
              <button
                onClick={handleChangeName}
                className="text-[10px] px-2 py-0.5 rounded border border-[#BB8632]/50 bg-[#310F14] text-[#BB8632] hover:bg-[#561B24] transition"
                title="お名前を変更する"
              >
                ✏️ 変更: {masterName}様
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-[#F3ECD8] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] mb-3">
            {masterName ? `${masterName}様の邸宅` : '主の邸宅'}
          </h1>

          {/* コントロールバー（暖炉 ＆ お天気） */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="px-3 py-1 rounded-full border border-[#BB8632]/60 bg-[#561B24]/80 shadow-md flex items-center gap-2">
              <span className="text-xs text-[#F3ECD8]">暖炉の火</span>
              <button
                type="button"
                onClick={toggleFireSound}
                className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPlayingFire ? 'bg-[#BB8632]' : 'bg-[#310F14]'
                }`}
                role="switch"
                aria-checked={isPlayingFire}
              >
                <span
                  className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-[#F3ECD8] shadow transition duration-200 ease-in-out ${
                    isPlayingFire ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              {isAutoTime && <span className="text-[9px] text-[#BB8632] font-bold">（夜長）</span>}
            </div>

            {/* お天気確認ボタン */}
            <button
              onClick={() => setShowWeatherModal(true)}
              className="px-3 py-1 rounded-full border border-[#BB8632]/60 bg-[#561B24]/80 shadow-md text-xs text-[#F3ECD8] hover:bg-[#6B212B] transition flex items-center gap-1"
            >
              ☀️ 天気・気温を設定
            </button>
          </div>
        </div>

        {/* 🌤 天気表示欄 ＆ 執事よりのご挨拶 */}
        <div className="relative z-10 w-full max-w-sm my-auto flex flex-col gap-3">
          {/* 天気情報表示カード（設定されている場合） */}
          {(weatherCondition || maxTemp || minTemp || indexComment) && (
            <div 
              className="rounded-2xl p-4 shadow-2xl backdrop-blur-md text-center border"
              style={{ backgroundColor: 'rgba(59, 18, 24, 0.88)', borderColor: '#BB8632' }}
            >
              <p className="text-[10px] tracking-widest text-[#BB8632] font-bold mb-1">WEATHER & TEMPERATURE</p>
              <p className="text-sm font-bold text-[#F3ECD8] mb-1">
                本日の天気：{weatherCondition || '未設定'} / 最高気温：{maxTemp || '--'}、最低気温：{minTemp || '--'}
              </p>
              {indexComment && (
                <p className="text-xs text-[#F3ECD8]/90 italic leading-relaxed border-t border-[#BB8632]/30 pt-2 mt-2">
                  「{indexComment} {masterName || '主'}様」
                </p>
              )}
            </div>
          )}

          {/* 執事よりのご挨拶 */}
          <div 
            className="rounded-2xl p-5 shadow-2xl backdrop-blur-md text-center border"
            style={{ backgroundColor: 'rgba(86, 27, 36, 0.85)', borderColor: '#BB8632' }}
          >
            <p className="text-xs font-semibold mb-1.5 tracking-widest text-[#BB8632]">
              執事よりのご挨拶
            </p>
            <p className="text-sm sm:text-base leading-relaxed italic font-light text-[#F3ECD8]">
              {getButlerGreeting()}
            </p>
          </div>
        </div>

        {/* 下部：ドック */}
        <div className="relative z-10 w-full max-w-md pb-4">
          <div 
            className="rounded-2xl p-3 shadow-2xl backdrop-blur-md border flex items-center justify-around gap-2"
            style={{ backgroundColor: 'rgba(59, 18, 24, 0.9)', borderColor: '#BB8632' }}
          >
            <Link href="/timer" className="flex flex-col items-center group">
              <div 
                className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#2B0C12]"
                style={{ borderColor: '#BB8632' }}
              >
                <img src="/icon-timer.jpg" alt="タイマー" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">タイマー</span>
            </Link>

            <Link href="/alarm" className="flex flex-col items-center group">
              <div 
                className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#2B0C12]"
                style={{ borderColor: '#BB8632' }}
              >
                <img src="/icon-alarm.jpg" alt="アラーム" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">アラーム</span>
            </Link>

            <Link href="/journal" className="flex flex-col items-center group">
              <div 
                className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#2B0C12]"
                style={{ borderColor: '#BB8632' }}
              >
                <img src="/icon-journal.jpg" alt="日記帳" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">日記帳</span>
            </Link>

            <Link href="/calendar" className="flex flex-col items-center group">
              <div 
                className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-[#2B0C12]"
                style={{ borderColor: '#BB8632' }}
              >
                <img src="/icon-calendar.jpg" alt="予定帳" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] mt-1 text-[#F3ECD8] group-hover:text-[#BB8632] transition">予定帳</span>
            </Link>

            <button 
              onClick={() => alert(`「${masterName || '主'}様、ティーサロンの設えはまもなく完了いたします。」`)}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div 
                className="gothic-dock-item w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 flex items-center justify-center text-xl opacity-80"
                style={{ backgroundColor: '#310F14', borderColor: 'rgba(187, 134, 50, 0.5)', color: '#F3ECD8' }}
              >
                ☕
              </div>
              <span className="text-[10px] mt-1 text-[#F3ECD8]/70 group-hover:text-[#BB8632] transition">サロン</span>
            </button>

          </div>
        </div>

      </div>
    </>
  );
}