'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface WeatherData {
  condition: string;
  currentTemp: string;
  maxTemp: string;
  minTemp: string;
  comment: string;
}

export default function Home() {
  const [isPlayingFire, setIsPlayingFire] = useState<boolean>(false);
  const [isAutoTime, setIsAutoTime] = useState<boolean>(false);
  const [masterName, setMasterName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [inputName, setInputName] = useState<string>('');
  const [bgImage, setBgImage] = useState<string>('/home-bg.jpg');
  const [currentHour, setCurrentHour] = useState<number>(12);

  // 天気データ保持用
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('butler_master_name');
    if (savedName) {
      setMasterName(savedName);
    } else {
      setShowNameModal(true);
    }

    fetchWeatherByLocation();
  }, []);

  // 🌟 現在地のリアルタイム気温・天気・最高最低気温を取得する関数
  const fetchWeatherByLocation = () => {
    setIsLoadingWeather(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          await fetchWeatherApi(lat, lon);
        },
        (error) => {
          // 許可されなかった場合のフォールバック（東京・埼玉周辺）
          fetchWeatherApi(35.6895, 139.6917);
        },
        { timeout: 10000 }
      );
    } else {
      fetchWeatherApi(35.6895, 139.6917);
    }
  };

  const fetchWeatherApi = async (lat: number, lon: number) => {
    try {
      // 🌟 現在の気温（current）と日別予報（daily）を同時に取得
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo`);
      const data = await res.json();

      if (data && data.current && data.daily) {
        const currentT = Math.round(data.current.temperature_2m);
        const max = Math.round(data.daily.temperature_2m_max[0]);
        const min = Math.round(data.daily.temperature_2m_min[0]);
        const pop = data.daily.precipitation_probability_max[0];
        const code = data.current.weathercode;

        let cond = '晴れ';
        let comment = '本日はとても過ごしやすい一日となりそうでございます。';

        if (code >= 1 && code <= 3) {
          cond = '曇り';
          comment = '少々雲が多いようでございます。お出かけの際はお足元にお気をつけくださいませ。';
        } else if (code >= 51 || pop >= 40) {
          cond = '雨';
          comment = 'お出かけの際は、どうぞ傘をお忘れなきようお気を付けくださいませ。';
        }

        setWeatherData({
          condition: cond,
          currentTemp: `${currentT}℃`,
          maxTemp: `${max}℃`,
          minTemp: `${min}℃`,
          comment: comment,
        });
      }
    } catch (e) {
      setWeatherData({
        condition: '晴れのち曇り',
        currentTemp: '18℃',
        maxTemp: '20℃',
        minTemp: '12℃',
        comment: 'お出かけの際は、どうぞ暖かくしてお過ごしくださいませ。',
      });
    } finally {
      setIsLoadingWeather(false);
    }
  };

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
      return `☕️「おかえりなさいませ。お部屋の暖炉に心地よい火を灯しております、${name}様。どうぞ温まりながらお過ごしくださいませ。」`;
    }
    if (currentHour >= 6 && currentHour < 11) {
      return `☕️「おはようございます、${name}様。」`;
    }
    return `☕️「おかえりなさいませ、${name}様。お待ちしておりました。」`;
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
        
        body, button, p, span, h1, h2, div, input {
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

          <div className="flex items-center gap-2">
            <div className="px-4 py-1 rounded-full border border-[#BB8632]/60 bg-[#561B24]/80 shadow-md flex items-center gap-3">
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
              {isAutoTime && <span className="text-[10px] text-[#BB8632] font-bold">（夜長モード）</span>}
            </div>

            <button
              onClick={fetchWeatherByLocation}
              className="px-3 py-1 rounded-full border border-[#BB8632]/60 bg-[#561B24]/80 text-xs text-[#BB8632] hover:bg-[#6B212B] transition"
            >
              📍 天気を更新
            </button>
          </div>
        </div>

        {/* 🌤 改行して見やすくなった現在地のお天気・気温カード */}
        <div className="relative z-10 w-full max-w-sm my-auto flex flex-col gap-3">
          <div 
            className="rounded-2xl p-4 shadow-2xl backdrop-blur-md text-center border"
            style={{ backgroundColor: 'rgba(59, 18, 24, 0.88)', borderColor: '#BB8632' }}
          >
            <p className="text-[10px] tracking-widest text-[#BB8632] font-bold mb-2">CURRENT LOCATION WEATHER</p>
            {isLoadingWeather ? (
              <p className="text-xs text-[#F3ECD8]/70 italic py-2">現在地のお天気を確認中でございます……</p>
            ) : weatherData ? (
              <div className="leading-relaxed">
                <p className="text-sm font-bold text-[#F3ECD8]">
                  本日の天気：{weatherData.condition}
                </p>
                <p className="text-sm font-bold text-[#F3ECD8] mt-1">
                  現在の気温：{weatherData.currentTemp}
                </p>
                <p className="text-xs text-[#F3ECD8]/80 mt-1">
                  （最高気温：{weatherData.maxTemp} / 最低気温：{weatherData.minTemp}）
                </p>
                <p className="text-xs text-[#F3ECD8]/90 italic leading-relaxed border-t border-[#BB8632]/30 pt-2 mt-2.5">
                  「{weatherData.comment} {masterName || '主'}様」
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#F3ECD8]/70 italic">お天気データの取得に失敗いたしました。</p>
            )}
          </div>

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