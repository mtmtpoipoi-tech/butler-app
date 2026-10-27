'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type TimerMode = 'pomodoro25' | 'deep50' | 'min60' | 'min90' | 'min180';

interface ModeConfig {
  name: string;
  workSeconds: number;
  breakSeconds: number | null;
  butlerMessage: string;
}

const MODES: Record<TimerMode, ModeConfig> = {
  pomodoro25: {
    name: 'ポモドーロ (25分/5分)',
    workSeconds: 25 * 60,
    breakSeconds: 5 * 60,
    butlerMessage: '「主様の努力の足跡は、一秒たりとも混ざり合うことなく、日付ごとに大切にお守りいたします。」',
  },
  deep50: {
    name: 'ディープワーク (50分/10分)',
    workSeconds: 50 * 60,
    breakSeconds: 10 * 60,
    butlerMessage: '「50分の本格的な集中ですね。主様の勉強時間、責任を持ってお守りいたします。」',
  },
  min60: {
    name: '60分 集中',
    workSeconds: 60 * 60,
    breakSeconds: null,
    butlerMessage: '「1時間の長丁場です。マイペースに、確実に積み上げていきましょう。」',
  },
  min90: {
    name: '90分 集中',
    workSeconds: 90 * 60,
    breakSeconds: null,
    butlerMessage: '「1時間半ですね。途中の水分補給も忘れずになさってくださいね。」',
  },
  min180: {
    name: '180分 超集中',
    workSeconds: 180 * 60,
    breakSeconds: null,
    butlerMessage: '「3時間……！大変な覚悟ですね。主様の歩みを全力でサポートいたします。」',
  },
};

const BGM_LIST = [
  { id: 'cafejazz', name: '☕ カフェジャズ (cafe-jazz.m4a)', file: '/cafe-jazz.m4a' },
  { id: 'nyarupaka', name: '🌙 深い夜に浮かぶLoop (オルゴール)', file: '/nyarupaka.wav' },
  { id: 'yukidoke', name: '雪解けの頃 / ruha', file: '/yukidoke.mp4' },
  { id: 'departure', name: 'Departure / メインBGM', file: '/Departure_7651.mp3' },
];

const ACTIVITY_LIST = ['勉強', '仕事', '作業', '読書', '創作'];

interface TodoItem {
  category: string;
  content: string;
  ok: boolean;
}

export default function TimerPage() {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<TimerMode>('pomodoro25');
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(MODES.pomodoro25.workSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(MODES.pomodoro25.butlerMessage);
  const [selectedActivity, setSelectedActivity] = useState<string>('勉強');

  const [dateTimeStr, setDateTimeStr] = useState<string>('');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isFadingToBlack, setIsFadingToBlack] = useState<boolean>(false);

  const [selectedBgm, setSelectedBgm] = useState<string>(BGM_LIST[0].file);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  
  const [viewDateStr, setViewDateStr] = useState<string>('');
  
  const [allActivitySeconds, setAllActivitySeconds] = useState<Record<string, Record<string, number>>>({});
  const [allActivityLogs, setAllActivityLogs] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [allMemos, setAllMemos] = useState<Record<string, string>>({});
  const [allImpressions, setAllImpressions] = useState<Record<string, string>>({});
  const [allRatings, setAllRatings] = useState<Record<string, number>>({});
  const [allTodos, setAllTodos] = useState<Record<string, TodoItem[]>>({});

  const [newCategory, setNewCategory] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');

  const hours = [
    '5:00', '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    '21:00', '22:00', '23:00', '24:00', '1:00', '2:00', '3:00', '4:00'
  ];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<any>(null);

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    setIsMounted(true);
    const today = getTodayStr();
    setViewDateStr(today);

    try {
      const loadSafe = (key: string) => {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : {};
      };

      setAllActivitySeconds(loadSafe('butler_all_activity_seconds'));
      setAllActivityLogs(loadSafe('butler_all_activity_detail_logs'));
      setAllMemos(loadSafe('butler_all_schedule_memos'));
      setAllImpressions(loadSafe('butler_all_schedule_impressions'));
      setAllRatings(loadSafe('butler_all_schedule_ratings'));
      setAllTodos(loadSafe('butler_all_schedule_todos'));
    } catch (e) {
      console.error('データ復元エラー:', e);
    }
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const days = ['日', '月', '火', '水', '木', '金', '土'];
      setDateTimeStr(`${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 (${days[now.getDay()]}) ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigateHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (audioRef.current) audioRef.current.pause();
    setIsTransitioning(true);
    setTimeout(() => router.push('/'), 400);
  };

  useEffect(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(MODES[currentMode].workSeconds);
    setMessage(MODES[currentMode].butlerMessage);
  }, [currentMode]);

  useEffect(() => {
    const requestWakeLock = async () => {
      if (isRunning && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.log('Wake Lock error:', err);
        }
      }
    };

    if (isRunning) {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isRunning) {
      audioRef.current.play().catch((err) => {
        console.log("Autoplay was prevented:", err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isRunning, selectedBgm]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });

        if (!isBreak) {
          const curTodayStr = getTodayStr();
          const curLife = Number(localStorage.getItem('butler_lifetime_seconds') || '0');
          localStorage.setItem('butler_lifetime_seconds', String(curLife + 1));

          setAllActivitySeconds((prev) => {
            const dayObj = prev[curTodayStr] || {};
            const nextDay = { ...dayObj, [selectedActivity]: (Number(dayObj[selectedActivity]) || 0) + 1 };
            const nextAll = { ...prev, [curTodayStr]: nextDay };
            localStorage.setItem('butler_all_activity_seconds', JSON.stringify(nextAll));
            return nextAll;
          });

          const hourKey = `${new Date().getHours()}:00`;
          setAllActivityLogs((prev) => {
            const dayLogs = prev[curTodayStr] || {};
            const hLog = dayLogs[hourKey] || {};
            const nextHLog = { ...hLog, [selectedActivity]: (Number(hLog[selectedActivity]) || 0) + 1 };
            const nextDayLogs = { ...dayLogs, [hourKey]: nextHLog };
            const nextAllLogs = { ...prev, [curTodayStr]: nextDayLogs };
            localStorage.setItem('butler_all_activity_detail_logs', JSON.stringify(nextAllLogs));
            return nextAllLogs;
          });
        }
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      try { new Audio('/dragon-studio-bell-ring-390294.mp3').play().catch(() => {}); } catch (e) {}

      if (isBreak) {
        setMessage('「休憩時間が終了しました。また一緒に頑張りましょう、主様。」');
        setIsBreak(false);
        setTimeLeft(MODES[currentMode].workSeconds);
      } else if (MODES[currentMode].breakSeconds !== null) {
        setMessage('「お疲れ様でした！素晴らしい集中力です。少し休憩になさってください。」');
        setIsBreak(true);
        setTimeLeft(MODES[currentMode].breakSeconds);
      } else {
        setMessage('「お疲れ様でした！見事な集中力でしたね。本当によく頑張りました。」');
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, isBreak, currentMode, selectedActivity]);

  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const toggleTimer = () => {
    setIsFadingToBlack(true);
    setTimeout(() => {
      setIsRunning(!isRunning);
      setIsFadingToBlack(false);
    }, 400);
  };

  const handleReset = () => {
    setIsFadingToBlack(true);
    setTimeout(() => {
      setIsRunning(false);
      setIsBreak(false);
      setTimeLeft(MODES[currentMode].workSeconds);
      setMessage(MODES[currentMode].butlerMessage);
      setIsFadingToBlack(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 400);
  };

  const renderTodaySummary = () => {
    const curTodayStr = getTodayStr();
    const obj = allActivitySeconds[curTodayStr] || {};
    const entries = Object.entries(obj).filter(([_, s]) => (Number(s) || 0) > 0);
    if (entries.length === 0) return '0分 (0秒)';
    return entries.map(([act, s]) => {
      const totalSec = Number(s) || 0;
      const m = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${act} ${m}分(${sec}秒)`;
    }).join(' ');
  };

  const handleShiftDate = (daysOffset: number) => {
    if (!viewDateStr) return;
    const parts = viewDateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + daysOffset);
    setViewDateStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const handleResetToToday = () => {
    setViewDateStr(getTodayStr());
  };

  const handleExportData = () => {
    try {
      const backupData = {
        seconds: localStorage.getItem('butler_all_activity_seconds'),
        logs: localStorage.getItem('butler_all_activity_detail_logs'),
        memos: localStorage.getItem('butler_all_schedule_memos'),
        impressions: localStorage.getItem('butler_all_schedule_impressions'),
        ratings: localStorage.getItem('butler_all_schedule_ratings'),
        todos: localStorage.getItem('butler_all_schedule_todos'),
        lifetime: localStorage.getItem('butler_lifetime_seconds'),
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `butler_backup_${getTodayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('「主様の尊い記録のバックアップをダウンロードいたしました。これでいつでも安心です。」');
    } catch (e) {
      alert('バックアップの作成に失敗しました。');
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.seconds) localStorage.setItem('butler_all_activity_seconds', data.seconds);
        if (data.logs) localStorage.setItem('butler_all_activity_detail_logs', data.logs);
        if (data.memos) localStorage.setItem('butler_all_schedule_memos', data.memos);
        if (data.impressions) localStorage.setItem('butler_all_schedule_impressions', data.impressions);
        if (data.ratings) localStorage.setItem('butler_all_schedule_ratings', data.ratings);
        if (data.todos) localStorage.setItem('butler_all_schedule_todos', data.todos);
        if (data.lifetime) localStorage.setItem('butler_lifetime_seconds', data.lifetime);

        setAllActivitySeconds(data.seconds ? JSON.parse(data.seconds) : {});
        setAllActivityLogs(data.logs ? JSON.parse(data.logs) : {});
        setAllMemos(data.memos ? JSON.parse(data.memos) : {});
        setAllImpressions(data.impressions ? JSON.parse(data.impressions) : {});
        setAllRatings(data.ratings ? JSON.parse(data.ratings) : {});
        setAllTodos(data.todos ? JSON.parse(data.todos) : {});

        alert('「主様の記録が完璧に復元されました！」');
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。正しいバックアップファイルを選択してください。');
      }
    };
    reader.readAsText(file);
  };

  const updateMemo = (val: string) => {
    if (!viewDateStr) return;
    const next = { ...allMemos, [viewDateStr]: val };
    setAllMemos(next);
    localStorage.setItem('butler_all_schedule_memos', JSON.stringify(next));
  };
  const updateImpression = (val: string) => {
    if (!viewDateStr) return;
    const next = { ...allImpressions, [viewDateStr]: val };
    setAllImpressions(next);
    localStorage.setItem('butler_all_schedule_impressions', JSON.stringify(next));
  };
  const updateRating = (val: number) => {
    if (!viewDateStr) return;
    const next = { ...allRatings, [viewDateStr]: val };
    setAllRatings(next);
    localStorage.setItem('butler_all_schedule_ratings', JSON.stringify(next));
  };
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewDateStr || !newContent.trim()) return;
    const cur = allTodos[viewDateStr] || [];
    const nextTodos = [...cur, { category: newCategory.trim() || '全般', content: newContent.trim(), ok: false }];
    const nextAll = { ...allTodos, [viewDateStr]: nextTodos };
    setAllTodos(nextAll);
    localStorage.setItem('butler_all_schedule_todos', JSON.stringify(nextAll));
    setNewContent('');
  };
  const toggleTodoOk = (idx: number) => {
    if (!viewDateStr) return;
    const cur = [...(allTodos[viewDateStr] || [])];
    cur[idx].ok = !cur[idx].ok;
    const nextAll = { ...allTodos, [viewDateStr]: cur };
    setAllTodos(nextAll);
    localStorage.setItem('butler_all_schedule_todos', JSON.stringify(nextAll));
  };
  const deleteTodo = (idx: number) => {
    if (!viewDateStr) return;
    const cur = (allTodos[viewDateStr] || []).filter((_, i) => i !== idx);
    const nextAll = { ...allTodos, [viewDateStr]: cur };
    setAll