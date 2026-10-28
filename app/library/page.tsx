// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Book {
  id: string;
  title: string;
  author: string;
  category: 'novel' | 'essay' | 'encyclopedia';
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
}

const CATEGORIES = {
  novel: '小説',
  essay: '随筆',
  encyclopedia: '図鑑',
};

export default function LibraryPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'shelf' | 'publish' | 'censor'>('shelf');
  
  const [books, setBooks] = useState<Book[]>([]);
  
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [category, setCategory] = useState<'novel' | 'essay' | 'encyclopedia'>('novel');
  const [content, setContent] = useState<string>('');

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isOpeningBook, setIsOpeningBook] = useState<boolean>(false);

  const [rejectReason, setRejectReason] = useState<string>('');
  const [censorTargetId, setCensorTargetId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('butler_library_books');
    if (saved) {
      try {
        setBooks(JSON.parse(saved));
      } catch (e) {
        console.error('蔵書データの読み込みエラー:', e);
      }
    } else {
      const initialBooks: Book[] = [
        {
          id: '1',
          title: '深夜の医学生録',
          author: '伯爵 万柚子',
          category: 'essay',
          content: '静まり返った自習室、ルイボスティーの香りと共に記憶の定着を図る夜。医学への扉は、日々の地道な積み重ねの先にある。',
          status: 'approved',
        },
      ];
      setBooks(initialBooks);
      localStorage.setItem('butler_library_books', JSON.stringify(initialBooks));
    }
  }, []);

  const saveBooks = (nextBooks: Book[]) => {
    setBooks(nextBooks);
    localStorage.setItem('butler_library_books', JSON.stringify(nextBooks));
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !author.trim()) return;

    const newBook: Book = {
      id: Date.now().toString(),
      title: title.trim(),
      author: author.trim(),
      category,
      content: content.trim(),
      status: 'pending',
    };

    saveBooks([...books, newBook]);
    setTitle('');
    setContent('');
    alert('👤 「出版の申請を受け付けました。主様（検閲官）による審査ののち、本棚に並びます。」');
    setActiveTab('shelf');
  };

  const handleApprove = (id: string) => {
    const next = books.map((b) => (b.id === id ? { ...b, status: 'approved' as const } : b));
    saveBooks(next);
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) {
      alert('却下の理由をご入力ください。');
      return;
    }
    const next = books.map((b) =>
      b.id === id ? { ...b, status: 'rejected' as const, rejectReason: rejectReason.trim() } : b
    );
    saveBooks(next);
    setCensorTargetId(null);
    setRejectReason('');
  };

  const handleOpenBook = (book: Book) => {
    setIsOpeningBook(true);
    setTimeout(() => {
      setSelectedBook(book);
      setIsOpeningBook(false);
    }, 400);
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700;800&family=Cinzel:wght@400;600;700&display=swap');
        body, button, select, input, textarea, p, span, h1, div {
          font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }
        .gothic-btn {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease-in-out;
        }
        .gothic-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .gothic-btn:active { transform: translateY(1px); }
      `}</style>

      <div className="min-h-screen flex flex-col items-center p-6 bg-[#1A070B] text-[#F3ECD8] relative bg-cover bg-center" style={{ backgroundImage: "url('/485142.jpg')" }}>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-4xl flex justify-between items-center mb-6">
          <button onClick={() => router.push('/')} type="button" className="text-xs text-[#BB8632] hover:underline bg-[#561B24]/80 px-3 py-1.5 rounded-lg border border-[#BB8632]/50 cursor-pointer">
            ← エントランスへ戻る
          </button>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('shelf')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'shelf' ? 'bg-[#BB8632] text-[#1A070B]' : 'bg-[#3B1218] text-[#F3ECD8] border border-[#BB8632]/50'}`}>
              🏛️ 大図書館の本棚
            </button>
            <button onClick={() => setActiveTab('publish')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'publish' ? 'bg-[#BB8632] text-[#1A070B]' : 'bg-[#3B1218] text-[#F3ECD8] border border-[#BB8632]/50'}`}>
              ✒️ 本を執筆する
            </button>
            <button onClick={() => setActiveTab('censor')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'censor' ? 'bg-[#BB8632] text-[#1A070B]' : 'bg-[#3B1218] text-[#F3ECD8] border border-[#BB8632]/50'}`}>
              ⚖️ 検閲官ルーム ({books.filter(b => b.status === 'pending').length})
            </button>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-4xl bg-[#2B0C12]/90 border border-[#BB8632] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          
          {activeTab === 'shelf' && (
            <div>
              <h1 className="text-2xl font-bold tracking-widest mb-2 text-center text-[#BB8632]">THE GRAND LIBRARY</h1>
              <p className="text-xs text-center text-[#F3ECD8]/70 mb-6">主様の厳正な審査を通過した、気高き知の蔵書が並ぶ棚です。</p>

              {(['novel', 'essay', 'encyclopedia'] as const).map((cat) => {
                const shelfBooks = books.filter((b) => b.category === cat && b.status === 'approved');
                return (
                  <div key={cat} className="mb-8 border-b border-[#BB8632]/30 pb-6">
                    <h2 className="text-base font-bold text-[#BB8632] mb-3 tracking-wider border-l-4 border-[#BB8632] pl-2">
                      📚 {CATEGORIES[cat]} 棚
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {shelfBooks.length > 0 ? (
                        shelfBooks.map((book) => (
                          <div
                            key={book.id}
                            onClick={() => handleOpenBook(book)}
                            className="bg-[#3B1218] border border-[#BB8632]/60 rounded-xl p-4 cursor-pointer hover:brightness-110 transition shadow-lg flex flex-col justify-between"
                          >
                            <div>
                              <span className="text-[10px] bg-[#BB8632] text-[#1A070B] px-2 py-0.5 rounded font-bold">{CATEGORIES[book.category]}</span>
                              <h3 className="text-base font-bold mt-2 text-[#F3ECD8] line-clamp-1">{book.title}</h3>
                              <p className="text-xs text-[#F3ECD8]/70 mt-1">著者: {book.author}</p>
                            </div>
                            <span className="text-[10px] text-[#BB8632] text-right mt-4 tracking-wider underline">古文書を開く →</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#F3ECD8]/40 italic py-2">この棚にはまだ蔵書がありません。</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'publish' && (
            <div className="max-w-xl mx-auto">
              <h1 className="text-2xl font-bold tracking-widest mb-2 text-center text-[#BB8632]">AUTHOR'S DESK</h1>
              <p className="text-xs text-center text-[#F3ECD8]/70 mb-6">新しい書物を記し、大図書館への上覧（出版申請）を行います。</p>

              <form onSubmit={handlePublish} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#BB8632] block mb-1">書名（タイトル）</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#3B1218] border border-[#BB8632]/50 rounded-xl px-3 py-2 text-xs text-[#F3ECD8] outline-none" placeholder="例: 月夜の化学考察" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#BB8632] block mb-1">著者名（または爵位名）</label>
                    <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full bg-[#3B1218] border border-[#BB8632]/50 rounded-xl px-3 py-2 text-xs text-[#F3ECD8] outline-none" placeholder="例: 伯爵 万柚子" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#BB8632] block mb-1">棚（カテゴリー）</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full bg-[#3B1218] border border-[#BB8632]/50 rounded-xl px-3 py-2 text-xs text-[#F3ECD8] outline-none cursor-pointer">
                      <option value="novel">小説</option>
                      <option value="essay">随筆</option>
                      <option value="encyclopedia">図鑑</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#BB8632] block mb-1">本文</label>
                  <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} className="w-full bg-[#3B1218] border border-[#BB8632]/50 rounded-xl px-3 py-2 text-xs text-[#F3ECD8] outline-none resize-none" placeholder="書物の内容をここに綴ってください..." required />
                </div>
                <button type="submit" className="gothic-btn w-full py-3 bg-gradient-to-b from-[#A46D37] to-[#8A5A2D] text-[#F3ECD8] font-bold text-sm rounded-xl border border-[#BB8632] cursor-pointer">
                  主様へ出版を上覧する（申請）
                </button>
              </form>
            </div>
          )}

          {activeTab === 'censor' && (
            <div>
              <h1 className="text-2xl font-bold tracking-widest mb-2 text-center text-[#BB8632]">CENSOR'S OFFICE</h1>
              <p className="text-xs text-center text-[#F3ECD8]/70 mb-6">主様（検閲官）専用室。申請された書物を審査・管理いたします。</p>

              <div className="space-y-4">
                <h2 className="text-sm font-bold text-[#BB8632] border-b border-[#BB8632]/40 pb-1">⏳ 審査待ちの書物</h2>
                {books.filter((b) => b.status === 'pending').length > 0 ? (
                  books.filter((b) => b.status === 'pending').map((book) => (
                    <div key={book.id} className="bg-[#3B1218] border border-[#BB8632]/50 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] bg-[#BB8632] text-[#1A070B] px-2 py-0.5 rounded font-bold">{CATEGORIES[book.category]}</span>
                          <h3 className="text-base font-bold text-[#F3ECD8] mt-1">{book.title}</h3>
                          <p className="text-xs text-[#F3ECD8]/70">著者: {book.author}</p>
                        </div>
                      </div>
                      <div className="bg-[#2B0C12] p-3 rounded-lg border border-[#BB8632]/30 text-xs text-[#F3ECD8] max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {book.content}
                      </div>

                      {censorTargetId === book.id ? (
                        <div className="flex flex-col gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="却下理由を入力してください（例：表現に不適切な箇所があります）"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="bg-[#2B0C12] border border-red-400/50 rounded-lg px-3 py-1.5 text-xs text-[#F3ECD8] outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setCensorTargetId(null)} className="px-3 py-1 bg-gray-700 text-xs rounded">キャンセル</button>
                            <button onClick={() => handleReject(book.id)} className="px-3 py-1 bg-red-900 text-red-200 border border-red-500 font-bold text-xs rounded cursor-pointer">却下を確定する</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2 mt-1">
                          <button onClick={() => handleApprove(book.id)} className="px-4 py-1.5 bg-[#BB8632] text-[#1A070B] font-bold text-xs rounded hover:brightness-110 transition cursor-pointer">
                            ✓ 許可する（本棚へ追加）
                          </button>
                          <button onClick={() => setCensorTargetId(book.id)} className="px-4 py-1.5 bg-red-950 text-red-300 border border-red-500/60 font-bold text-xs rounded hover:bg-red-900 transition cursor-pointer">
                            ✕ 却下する
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#F3ECD8]/40 italic py-4 text-center">現在、審査待ちの書物はありません。</p>
                )}
              </div>
            </div>
          )}

        </div>

        {(selectedBook || isOpeningBook) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className={`w-full max-w-2xl bg-[#F3ECD8] text-[#2B0C12] rounded-2xl p-8 shadow-2xl border-4 border-[#8A5A2D] transition-all duration-400 transform ${isOpeningBook ? 'scale-75 opacity-0 rotate-3' : 'scale-100 opacity-100 rotate-0'}`}>
              {selectedBook && (
                <>
                  <div className="flex justify-between items-center border-b-2 border-[#8A5A2D]/40 pb-3 mb-4">
                    <div>
                      <span className="text-[10px] bg-[#8A5A2D] text-[#F3ECD8] px-2 py-0.5 rounded font-bold">{CATEGORIES[selectedBook.category]}</span>
                      <h2 className="text-xl font-extrabold tracking-wide mt-1">{selectedBook.title}</h2>
                      <p className="text-xs text-[#8A5A2D] font-bold">著者: {selectedBook.author}</p>
                    </div>
                    <button onClick={() => setSelectedBook(null)} className="text-xs bg-[#2B0C12] text-[#F3ECD8] px-3 py-1.5 rounded-lg font-bold hover:bg-[#8A5A2D] transition cursor-pointer">
                      閉じる ✕
                    </button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto pr-2 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                    {selectedBook.content}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}