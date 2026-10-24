'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// 全国地域データ定義
const JAPAN_REGIONS: Record<string, Record<string, Record<string, { lat: number; lon: number }>>> = {
  '北海道地方': {
    北海道: {
      '札幌・石狩': { lat: 43.0642, lon: 141.3469 },
      '函館・渡島': { lat: 41.7687, lon: 140.7288 },
      '旭川・上川': { lat: 43.7706, lon: 142.3648 },
      '釧路・釧路': { lat: 42.9849, lon: 144.3818 },
    },
  },
  '東北地方': {
    青森県: { 青森市: { lat: 40.8244, lon: 140.741 }, 八戸市: { lat: 40.5123, lon: 141.4884 } },
    岩手県: { 盛岡市: { lat: 39.7036, lon: 141.1527 }, 宮古市: { lat: 39.6414, lon: 141.9572 } },
    宮城県: { 仙台市: { lat: 38.2682, lon: 140.8694 }, 石巻市: { lat: 38.4342, lon: 141.303 } },
    秋田県: { 秋田市: { lat: 39.7186, lon: 140.1024 } },
    山形県: { 山形市: { lat: 38.2404, lon: 140.3633 }, 庄内: { lat: 38.9143, lon: 139.8364 } },
    福島県: { 福島市: { lat: 37.7608, lon: 140.4748 }, 郡山市: { lat: 37.3985, lon: 140.3883 }, 会津若松市: { lat: 37.4952, lon: 139.9272 } },
  },
  '関東地方': {
    茨城県: { 水戸市: { lat: 36.3659, lon: 140.4712 }, つくば市: { lat: 36.0835, lon: 140.0766 } },
    栃木県: { 宇都宮市: { lat: 36.5657, lon: 139.8836 } },
    群馬県: { 前橋市: { lat: 36.3895, lon: 139.0634 }, 高崎市: { lat: 36.3219, lon: 139.0033 } },
    埼玉県: { '南部（さいたま・川越）': { lat: 35.8617, lon: 139.6455 }, '北部（熊谷・深谷）': { lat: 36.1472, lon: 139.3886 }, '秩父地方': { lat: 35.9918, lon: 139.0777 } },
    千葉県: { '北西部（千葉・船橋）': { lat: 35.6074, lon: 140.1065 }, 北東部: { lat: 35.7347, lon: 140.8267 }, 南部: { lat: 34.9962, lon: 139.8696 } },
    東京都: { '23区': { lat: 35.6895, lon: 139.6917 }, 多摩地域: { lat: 35.7056, lon: 139.4687 } },
    神奈川県: { '横浜・川崎': { lat: 35.4437, lon: 139.638 }, 相模原: { lat: 35.5713, lon: 139.3731 }, 湘南: { lat: 35.3189, lon: 139.5502 } },
  },
  '中部地方': {
    新潟県: { 新潟市: { lat: 37.9162, lon: 139.0364 }, 長岡市: { lat: 37.4468, lon: 138.8512 } },
    富山県: { 富山市: { lat: 36.6959, lon: 137.2137 } },
    石川県: { 金沢市: { lat: 36.5613, lon: 136.6562 } },
    福井県: { 福井市: { lat: 36.0641, lon: 136.2196 } },
    山梨県: { 甲府市: { lat: 35.6642, lon: 138.5684 } },
    長野県: { 長野市: { lat: 36.6485, lon: 138.1942 }, 松本市: { lat: 36.238, lon: 137.972 } },
    岐阜県: { 岐阜市: { lat: 35.4233, lon: 136.7607 } },
    静岡県: { 静岡市: { lat: 34.9756, lon: 138.3828 }, 浜松市: { lat: 34.7108, lon: 137.7261 } },
    愛知県: { 名古屋市: { lat: 35.1815, lon: 136.9064 }, 豊橋市: { lat: 34.7613, lon: 137.3828 } },
  },
  '近畿地方': {
    三重県: { 津市: { lat: 34.7303, lon: 136.5086 }, 四日市市: { lat: 34.9654, lon: 136.6236 } },
    滋賀県: { 大津市: { lat: 35.0178, lon: 135.8552 } },
    京都府: { 京都市: { lat: 35.0116, lon: 135.7681 }, '南丹・丹波': { lat: 35.1558, lon: 135.4674 } },
    大阪府: { 大阪市: { lat: 34.6937, lon: 135.5023 }, 堺市: { lat: 34.5733, lon: 135.483 } },
    兵庫県: { 神戸市: { lat: 34.6901, lon: 135.1955 }, 姫路市: { lat: 34.8151, lon: 134.6854 } },
    奈良県: { 奈良市: { lat: 34.6851, lon: 135.8049 } },
    和歌山県: { 和歌山市: { lat: 34.2305, lon: 135.1708 } },
  },
  '中国地方': {
    鳥取県: { 鳥取市: { lat: 35.5011, lon: 134.2351 } },
    島根県: { 松江市: { lat: 35.4723, lon: 133.0505 } },
    岡山県: { 岡山市: { lat: 34.6618, lon: 133.9344 }, 倉敷市: { lat: 34.585, lon: 133.7714 } },
    広島県: { 広島市: { lat: 34.3853, lon: 132.4553 }, 福山市: { lat: 34.4859, lon: 133.3625 } },
    山口県: { 山口市: { lat: 34.1785, lon: 131.4737 }, 下関市: { lat: 33.9578, lon: 130.9415 } },
  },
  '四国地方': {
    徳島県: { 徳島市: { lat: 34.0703, lon: 134.5548 } },
    香川県: { 高松市: { lat: 34.3402, lon: 134.0433 } },
    愛媛県: { 松山市: { lat: 33.8416, lon: 132.7654 } },
    高知県: { 高知市: { lat: 33.5597, lon: 133.5311 } },
  },
  '九州・沖縄地方': {
    福岡県: { 福岡市: { lat: 33.5904, lon: 130.4017 }, 北九州市: { lat: 33.8834, lon: 130.8752 } },
    佐賀県: { 佐賀市: { lat: 33.2635, lon: 130.3008 } },
    長崎県: { 長崎市: { lat: 32.7503, lon: 129.8777 }, 佐世保市: { lat: 33.1599, lon: 129.7237 } },
    熊本県: { 熊本市: { lat: 32.7898, lon: 130.7417 } },
    大分県: { 大分市: { lat: 33.2382, lon: 131.6126 } },
    宮崎県: { 宮崎市: { lat: 31.9077, lon: 131.4202 } },
    鹿児島県: { 鹿児島市: { lat: 31.5966, lon: 130.5571 } },
    沖縄県: { 那覇市: { lat: 26.2124, lon: 127.6809 }, '石垣・八重山': { lat: 24.3448, lon: 124.1572 } },
  },
};

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

  const [showGreeting, setShowGreeting] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // ⚙️ 設定モーダル用ステート
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  
  // 🌤️ お天気モーダル用ステート ＆ フェードアウト用ステート
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);
  const [isWeatherFadingOut, setIsWeatherFadingOut] = useState<boolean>(false);

  // 🔑 同期・ログイン用ステート
  const [userId, setUserId] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // 📍 地域選択用ステート
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [selectedRegionGroup, setSelectedRegionGroup] = useState<string>('関東地方');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('埼玉県');
  const [fallbackLocationName, setFallbackLocationName] = useState<string>('埼玉県 南部（さいたま・川越）');
  const [fallbackLat, setFallbackLat] = useState<number>(35.8617);
  const [fallbackLon, setFallbackLon] = useState<number>(139.6455);

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('butler_master_account_id');
    if (savedUser) {
      setIsLoggedIn(true);
      setUserId(savedUser);
    }

    const savedName = localStorage.getItem('butler_master_name');
    if (savedName) {
      setMasterName(savedName);
    } else {
      setShowNameModal(true);
    }

    const savedLoc = localStorage.getItem('butler_fallback_location');
    let currentLat = 35.8617;
    let currentLon = 139.6455;
    let currentLocName = '埼玉県 南部（さいたま・川越）';

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

  const handleSelectArea = (areaName: string, coords: { lat: number; lon: number }) => {
    const fullName = `${selectedPrefecture} ${areaName}`;
    setFallbackLocationName(fullName);
    setFallbackLat(coords.lat);
    setFallbackLon(coords.lon);
    localStorage.setItem('butler_fallback_location', JSON.stringify({ name: fullName, lat: coords.lat, lon: coords.lon }));
    setShowLocationModal(false);
    fetchWeatherByLocation(coords.lat, coords.lon, fullName);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !userPassword.trim()) return;

    localStorage.setItem('butler_master_account_id', userId.trim());
    localStorage.setItem('butler_master_account_pw', userPassword.trim());
    setIsLoggedIn(true);
    alert(`「${userId.trim()}様、アカウント情報を登録いたしました。※別デバイスでの完全同期にはクラウドサーバー連携が必要となります。」`);
  };

  const handleLogout = () => {
    localStorage.removeItem('butler_master_account_id');
    localStorage.removeItem('butler_master_account_pw');
    setIsLoggedIn(false);
    setUserId('');
    setUserPassword('');
  };

  const handleDismissGreeting = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowGreeting(false);
      localStorage.setItem('butler_master_last_visit', Date.now().toString());
    }, 500);
  };

  // 天気手帳を開く
  const handleOpenWeatherModal = () => {
    setIsWeatherFadingOut(false);
    setShowWeatherModal(true);
  };

  // 天気手帳をフワッと閉じる
  const handleCloseWeatherModal = () => {
    setIsWeatherFadingOut(true);
    setTimeout(() => {
      setShowWeatherModal(false);
      setIsWeatherFadingOut(false);
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
        
        body, button, p, span, h1, h2, div, input, select {
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

        /* 🌟 天気ボタン用ホバー浮き上がりエフェクト */
        .gothic-weather-btn {
          transition: all 0.3s ease-in-out;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7);
        }

        .gothic-weather-btn:hover {
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

        {/* 🌟 画面右上「⚙️ 設定」ボタン */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-1.5 rounded-lg border border-[#BB8632] bg-[#3B1218]/90 text-xs text-[#F3ECD8] hover:bg-[#561B24] transition shadow-lg flex items-center gap-1.5"
          >
            <span>⚙️ 設定</span>
          </button>
        </div>

        {/* 初回お名前入力モーダル */}
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

        {/* ⚙️ 総合「お屋敷の設定」モーダル */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div 
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl border relative text-[#F3ECD8] max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: 'rgba(59, 18, 24, 0.95)', borderColor: '#BB8632' }}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#BB8632]/40">
                <h2 className="text-lg font-bold text-[#F3ECD8]">⚙️ お屋敷の設定</h2>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="text-xs text-[#BB8632] hover:underline"
                >
                  閉じる ✖
                </button>
              </div>

              {/* 1. お名前設定 */}
              <div className="mb-5 pb-4 border-b border-[#BB8632]/30">
                <p className="text-xs font-bold text-[#BB8632] mb-1.5">👤 主様のお名前</p>
                <div className="flex justify-between items-center bg-[#2B0C12] px-3 py-2 rounded border border-[#BB8632]/40">
                  <span className="text-xs text-[#F3ECD8]">{masterName || '主'} 様</span>
                  <button
                    onClick={handleChangeName}
                    className="px-2.5 py-1 rounded bg-[#BB8632] text-[#2B0C12] font-bold text-[10px] hover:bg-[#D49E4B] transition"
                  >
                    名前を変更
                  </button>
                </div>
              </div>

              {/* 2. 地域設定 */}
              <div className="mb-5 pb-4 border-b border-[#BB8632]/30">
                <p className="text-xs font-bold text-[#BB8632] mb-1.5">📍 参照地域の設定（位置情報オフ時）</p>
                <div className="flex justify-between items-center bg-[#2B0C12] px-3 py-2 rounded border border-[#BB8632]/40">
                  <span className="text-xs text-[#F3ECD8]">{fallbackLocationName}</span>
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="px-2.5 py-1 rounded bg-[#BB8632] text-[#2B0C12] font-bold text-[10px] hover:bg-[#D49E4B] transition"
                  >
                    全国から選択
                  </button>
                </div>
              </div>

              {/* 3. アカウント同期設定 */}
              <div>
                <p className="text-xs font-bold text-[#BB8632] mb-1.5">🔑 端末データ同期・アカウント</p>
                <p className="text-[10px] text-[#F3ECD8]/70 mb-3 leading-relaxed">
                  ※複数端末間での完全な自動同期には専用のクラウドサーバーが必要となりますが、こちらでIDを紐付けることができます。
                </p>

                {isLoggedIn ? (
                  <div className="bg-[#2B0C12] p-3 rounded border border-[#BB8632]/40 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-[#BB8632]">ログイン中</p>
                      <p className="text-xs font-bold text-[#F3ECD8]">{userId} 様</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-2.5 py-1 rounded bg-[#561B24] text-[#F3ECD8] border border-[#BB8632]/50 text-[10px] hover:bg-[#6B212B] transition"
                    >
                      同期解除
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-2.5 bg-[#2B0C12] p-3 rounded border border-[#BB8632]/40">
                    <input
                      type="text"
                      placeholder="アカウントID"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-[#1A070B] border border-[#BB8632]/50 text-xs text-[#F3ECD8] outline-none"
                      required
                    />
                    <input
                      type="password"
                      placeholder="パスワード"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-[#1A070B] border border-[#BB8632]/50 text-xs text-[#F3ECD8] outline-none"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded bg-[#BB8632] text-[#2B0C12] font-bold text-xs hover:bg-[#D49E4B] transition"
                    >
                      アカウントを登録する
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}

        {/* 🌤️ 「本日の天気手帳」モーダル */}
        {showWeatherModal && (
          <div 
            onClick={handleCloseWeatherModal}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer transition-opacity duration-500 ${
              isWeatherFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border relative text-[#F3ECD8] cursor-default transition-all duration-500 ${
                isWeatherFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
              }`}
              style={{ backgroundColor: 'rgba(59, 18, 24, 0.95)', borderColor: '#BB8632' }}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#BB8632]/40">
                <h2 className="text-lg font-bold text-[#F3ECD8]">🌤️ 本日の天気手帳</h2>
                <button 
                  onClick={handleCloseWeatherModal}
                  className="text-xs text-[#BB8632] hover:underline"
                >
                  閉じる ✖
                </button>
              </div>

              {isLoadingWeather ? (
                <p className="text-xs text-[#F3ECD8]/70 italic py-6 text-center">お天気を確認中でございます……</p>
              ) : weatherData ? (
                <div className="leading-relaxed text-center py-2">
                  <p className="text-xs font-bold text-[#BB8632] mb-2">
                    📍 {weatherData.locationName}
                  </p>
                  <p className="text-base font-bold text-[#F3ECD8] mb-1">
                    天気：{weatherData.condition}
                  </p>
                  <p className="text-lg font-bold text-[#F3ECD8] mb-2">
                    現在の気温：{weatherData.currentTemp}
                  </p>
                  <p className="text-xs text-[#F3ECD8]/80 mb-4">
                    （最高気温：{weatherData.maxTemp} / 最低気温：{weatherData.minTemp}）
                  </p>
                  <p className="text-xs text-[#F3ECD8]/90 italic leading-relaxed border-t border-[#BB8632]/30 pt-3">
                    「{weatherData.comment} {masterName || '主'}様」
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#F3ECD8]/70 italic py-6 text-center">お天気データを読み込んでおります……</p>
              )}
            </div>
          </div>
        )}

        {/* 📍 全国階層型地域選択モーダル */}
        {showLocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div 
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl border relative text-[#F3ECD8]"
              style={{ backgroundColor: 'rgba(59, 18, 24, 0.95)', borderColor: '#BB8632' }}
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#BB8632]/40">
                <h2 className="text-lg font-bold text-[#F3ECD8]">📍 全国地域選択手帳</h2>
                <button 
                  onClick={() => setShowLocationModal(false)}
                  className="text-xs text-[#BB8632] hover:underline"
                >
                  閉じる ✖
                </button>
              </div>

              <div className="mb-3">
                <label className="text-xs text-[#BB8632] font-bold block mb-1">① 地方を選択（全国）</label>
                <select
                  value={selectedRegionGroup}
                  onChange={(e) => {
                    const r = e.target.value;
                    setSelectedRegionGroup(r);
                    const firstPref = Object.keys(JAPAN_REGIONS[r])[0];
                    setSelectedPrefecture(firstPref);
                  }}
                  className="w-full px-3 py-2 rounded bg-[#2B0C12] border border-[#BB8632]/60 text-xs text-[#F3ECD8] outline-none"
                >
                  {Object.keys(JAPAN_REGIONS).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="text-xs text-[#BB8632] font-bold block mb-1">② 都道府県を選択</label>
                <select
                  value={selectedPrefecture}
                  onChange={(e) => setSelectedPrefecture(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#2B0C12] border border-[#BB8632]/60 text-xs text-[#F3ECD8] outline-none"
                >
                  {JAPAN_REGIONS[selectedRegionGroup] &&
                    Object.keys(JAPAN_REGIONS[selectedRegionGroup]).map((pref) => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#BB8632] font-bold block mb-1.5">③ 詳細地域を選択</label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {JAPAN_REGIONS[selectedRegionGroup]?.[selectedPrefecture] ? (
                    Object.entries(JAPAN_REGIONS[selectedRegionGroup][selectedPrefecture]).map(([area, coords]) => (
                      <button
                        key={area}
                        onClick={() => handleSelectArea(area, coords)}
                        className="w-full py-2 px-3 rounded-lg bg-[#3B1218] border border-[#BB8632]/40 hover:border-[#BB8632] text-xs text-left text-[#F3ECD8] font-bold flex justify-between items-center transition"
                      >
                        <span>{selectedPrefecture} {area}</span>
                        <span className="text-[10px] text-[#BB8632]">決定 ➔</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-[#F3ECD8]/60 italic">地域データがございません。</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 w-full max-w-lg text-center pt-6 flex flex-col items-center">
          <p className="text-xs tracking-[0.3em] text-[#BB8632] mb-1">THE BUTLER'S MANOR</p>

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
          </div>
        </div>

        {/* 挨拶カード */}
        <div className="relative z-10 w-full max-w-sm my-auto flex flex-col gap-3">
          {showGreeting && (
            <div 
              onClick={handleDismissGreeting}
              className={`rounded-2xl p-5 shadow-2xl backdrop-blur-md text-center border cursor-pointer hover:brightness-110 transition-all duration-500 relative ${
                isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
              }`}
              style={{ backgroundColor: 'rgba(59, 18, 24, 0.92)', borderColor: '#BB8632' }}
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
        </div>

        {/* 🌟 下のバーの上の「天気」ボタン（ホバーアニメーション付き） ＆ 下のバー（ドック） */}
        <div className="relative z-10 w-full max-w-md pb-4 flex flex-col gap-2">
          {/* 天気ボタン */}
          <button
            onClick={handleOpenWeatherModal}
            className="gothic-weather-btn w-full py-2.5 px-4 rounded-xl border border-[#BB8632] bg-[#3B1218]/90 text-xs text-[#F3ECD8] flex items-center justify-center gap-2 font-bold tracking-wider cursor-pointer"
          >
            <span>🌤️ 天気</span>
          </button>

          {/* ドックメニュー */}
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