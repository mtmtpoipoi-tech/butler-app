'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface WeatherData {
  condition: string;
  currentTemp: string;
  maxTemp: string;
  minTemp: string;
  comment: string;
  locationName: string;
}

export default function Home() {
  const [isPlayingFire, setIsPlayingFire] = useState<boolean>(false);
  const [isAutoTime, setIsAutoTime] = useState<boolean>(false);
  const [masterName, setMasterName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [inputName, setInputName] = useState<string>('');
  const [bgImage, setBgImage] = useState<string>('/home-bg.jpg');
  const [currentHour, setCurrentHour] = useState<number>(12);

  // 挨拶の表示制御 ＆ フェードアウトアニメーション用ステート
  const [showGreeting, setShowGreeting] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // 📍 位置情報オフ時の参照場所設定用
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [fallbackLocationName, setFallbackLocationName] = useState<string>('埼玉県南部（さいたま）');
  const [fallbackLat, setFallbackLat] = useState<number>(35.8617);
  const [fallbackLon, setFallbackLon] = useState<number>(139.6455);

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

    // 保存されている「位置情報オフ時の場所」を読み込む
    const savedLoc = localStorage.getItem('butler_fallback_location');
    let currentLat = 35.8617;
    let currentLon = 139.6455;
    let currentLocName = '埼玉県南部（さいたま）';

    if (savedLoc) {
      try {
        const parsed = JSON.parse(savedLoc);
        currentLat = parsed.lat;
        currentLon = parsed.lon;
        currentLocName = parsed.name;
        setFallbackLat(parsed.lat);
        setFallbackLon(parsed.lon);
        setFallbackLocationName(parsed.name);
      } catch (e) {}
    }

    // 前回の訪問から数時間空いているかチェック
    const lastVisit = localStorage.getItem('butler_master_last_visit');
    const now = Date.now();
    const hoursThreshold = 3;

    if (!lastVisit) {
      setShowGreeting(true);
    } else {
      const diffHours = (now - parseInt(lastVisit, 10)) / (1000 * 60 * 60);
      if (diffHours >= hoursThreshold) {
        setShowGreeting(true);
      } else {
        setShowGreeting(false);
      }
    }

    fetchWeatherByLocation(currentLat, currentLon, currentLocName);
  }, []);

  // 🌟 位置情報（GPS）またはデフォルト地域からお天気を自動取得する処理
  const fetchWeatherByLocation = (targetLat = fallbackLat, targetLon = fallbackLon, targetName = fallbackLocationName) => {
    setIsLoadingWeather(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          await fetchWeatherApi(lat, lon);
        },
        (error) => {
          // 位置情報がオフの場合は設定された代替場所で取得
          fetchWeatherApi(targetLat, targetLon, targetName);
        },
        { timeout: 8000 }
      );
    } else {
      fetchWeatherApi(targetLat, targetLon, targetName);
    }
  };

  const fetchWeatherApi = async (lat: number, lon: number, defaultLocName?: string) => {
    try {
      let locName = defaultLocName;
      if (!locName) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ja`);
          const geoData = await geoRes.json();
          if (geoData && geoData.address) {
            const addr = geoData.address;
            const pref = addr.province || addr.state || '';
            const city = addr.city || addr.ward || addr.town || '';
            locName = `${pref}${city}`;
          }
        } catch (e) {}
      }

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
          comment = '少々雲が多いようでございます。お足元にお気をつけくださいませ。';
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
          locationName: locName || '現在地',
        });
      }
    } catch (e) {
      setWeatherData({
        condition: '雨時々曇',
        currentTemp: '16℃',
        maxTemp: '19℃',
        minTemp: '15℃',
        comment: 'お出かけの際は、どうぞ傘をお忘れなきようお気を付けくださいませ。',
        locationName: defaultLocName || '埼玉県南部',
      });
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // 📍 位置情報オフ時の地域を変更・保存する処理
  const handleSaveLocationSetting = (name: string, lat: number, lon: number) => {
    setFallbackLocationName(name);
    setFallbackLat(lat);
    setFallbackLon(lon);
    localStorage.setItem('butler_fallback_location', JSON.stringify({ name, lat, lon }));
    setShowLocationModal(false);
    fetchWeatherByLocation(lat, lon, name);
  };

  const handleDismissGreeting = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowGreeting(false);
      localStorage.setItem('butler_master_last_visit', Date.now().toString());
    }, 500);
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

        {/* 📍 位置情報オフ時の参照場所選択モーダル */}
        {showLocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div 
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl border relative text-[#F3ECD8]"
              style={{ backgroundColor: 'rgba(59, 18, 24, 0.95)', borderColor: '#BB8632' }}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#BB8632]/40">
                <h2 className="text-lg font-bold text-[#F3ECD8]">📍 地域選択手帳</h2>
                <button 
                  onClick={() => setShowLocationModal(false)}
                  className="text-xs text-[#BB8632] hover:underline"
                >
                  閉じる ✖
                </button>
              </div>

              <p className="text-xs text-[#F3ECD8]/80 mb-4 leading-relaxed">
                ※位置情報サービス（GPS）がオフの際に参照する地域を以下からお選びいただけます。
              </p>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                <button
                  onClick={() => handleSaveLocationSetting('埼玉県南部（さいたま）', 35.8617, 139.6455)}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#3B1218] border border-[#BB8632]/40 hover:border-[#BB8632] text-xs text-left text-[#F3ECD8] font-bold flex justify-between items-center"
                >
                  <span>埼玉県南部（さいたま・川越）</span>
                  <span className="text-[10px] text-[#BB8632]">選択</span>
                </button>
                <button
                  onClick={() => handleSaveLocationSetting('埼玉県北部（熊谷）', 36.1472, 139.3886)}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#3B1218] border border-[#BB8632]/40 hover:border-[#BB8632] text-xs text-left text-[#F3ECD8] font-bold flex justify-between items-center"
                >
                  <span>埼玉県北部（熊谷・深谷）</span>
                  <span className="text-[10px] text-[#BB8632]">選択</span>
                </button>
                <button
                  onClick={() => handleSaveLocationSetting('東京都（千代田）', 35.6895, 139.6917)}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#3B1218] border border-[#BB8632]/40 hover:border-[#BB8632] text-xs text-left text-[#F3ECD8] font-bold flex justify-between items-center"
                >
                  <span>東京都（23区）</span>
                  <span className="text-[10px] text-[#BB8632]">選択</span>
                </button>
                <button
                  onClick={() => handleSaveLocationSetting('千葉県（千葉）', 35.6074, 140.1065)}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#3B1218] border border-[#BB8632]/40 hover:border-[#BB8632] text-xs text-left text-[#F3ECD8] font-bold flex justify-between items-center"
                >
                  <span>千葉県（北西部・千葉）</span>
                  <span className="text-[10px] text-[#BB8632]">選択</span>
                </button>
                <button
                  onClick={() => handleSaveLocationSetting('神奈川県（横浜）', 35.4437, 139.6380)}
                  className="w-full py-2.5 px-3 rounded-lg bg-[#3B1218] border border-[#BB8632]/40 hover:border-[#BB8632] text-xs text-left text-[#F3ECD8] font-bold flex justify-between items-center"
                >
                  <span>神奈川県（横浜・川崎）</span>
                  <span className="text-[10px] text-[#BB8632]">選択</span>
                </button>
              </div>
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
              onClick={() => setShowLocationModal(true)}
              className="px-3 py-1 rounded-full border border-[#BB8632]/60 bg-[#561B24]/80 text-xs text-[#BB8632] hover:bg-[#6B212B] transition"
            >
              📍 地域を設定
            </button>
          </div>
        </div>

        {/* 挨拶カード（滑らかなフェードアウト） ＆ 天気情報 */}
        <div className="relative z-10 w-full max-w-sm my-auto flex flex-col gap-3">
          {/* 執事よりのご挨拶（タップでふんわりフェードアウト） */}
          {showGreeting && (
            <div 
              onClick={handleDismissGreeting}
              className={`rounded-2xl p-5 shadow-2xl backdrop-blur-md text-center border cursor-pointer hover:brightness-110 transition-all duration-500 relative ${
                isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
              }`}
              style={{ backgroundColor: 'rgba(86, 27, 36, 0.92)', borderColor: '#BB8632' }}
              title="タップして挨拶をしまう"
            >
              <p className="text-xs font-semibold mb-1.5 tracking-widest text-[#BB8632]">
                執事よりのご挨拶
              </p>
              <p className="text-sm sm:text-base leading-relaxed italic font-light text-[#F3ECD8]">
                {getButlerGreeting()}
              </p>
            </div>
          )}

          {/* 自動気象情報カード */}
          <div 
            className="rounded-2xl p-4 shadow-2xl backdrop-blur-md text-center border"
            style={{ backgroundColor: 'rgba(59, 18, 24, 0.88)', borderColor: '#BB8632' }}
          >
            <p className="text-[10px] tracking-widest text-[#BB8632] font-bold mb-2">
              WEATHER INFORMATION
            </p>
            {isLoadingWeather ? (
              <p className="text-xs text-[#F3ECD8]/70 italic py-2">お天気を確認中でございます……</p>
            ) : weatherData ? (
              <div className="leading-relaxed">
                <p className="text-xs font-bold text-[#BB8632] mb-1">
                  📍 {weatherData.locationName}
                </p>
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
              <p className="text-xs text-[#F3ECD8]/70 italic py-2">お天気データを読み込んでおります……</p>
            )}
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