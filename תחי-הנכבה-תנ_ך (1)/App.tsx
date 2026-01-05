
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BOOKS } from './constants';
import { TanakhBook, ChapterContent, Verse } from './types';
import { fetchChapterContent } from './services/geminiService';
import { LOCAL_TANAKH_DATA } from './data/tanakhData';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Menu,
  X,
  Copy,
  CheckCircle2,
  ArrowRight,
  BookMarked,
  Trash2,
  BookmarkPlus,
  AlertCircle,
  RefreshCcw,
  LayoutGrid
} from 'lucide-react';

const toGematria = (num: number): string => {
  const letters: Record<number, string> = {
    1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
    10: 'י', 20: 'כ', 30: 'ל', 40: 'מ', 50: 'נ', 60: 'ס', 70: 'ע', 80: 'פ', 90: 'צ',
    100: 'ק', 200: 'ר', 300: 'ש', 400: 'ת'
  };
  if (num === 15) return 'טו';
  if (num === 16) return 'טז';
  let res = '';
  const keys = Object.keys(letters).map(Number).sort((a, b) => b - a);
  keys.forEach(v => {
    while (num >= v) {
      res += letters[v];
      num -= v;
    }
  });
  return res;
};

interface Bookmark {
  id: string;
  book: string;
  chapter: number;
  verseNum: number;
  text: string;
}

const App: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<TanakhBook>(BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterContent, setChapterContent] = useState<ChapterContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isChapterPickerOpen, setIsChapterPickerOpen] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'books' | 'bookmarks'>('books');
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [chapterCache, setChapterCache] = useState<Record<string, ChapterContent>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tanakh_bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('tanakh_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("הועתק ללוח");
    } catch (err) {
      showToast("שגיאה בהעתקה");
    }
  };

  const handleVerseDoubleClick = (v: Verse) => {
    if (v.text === "...") return;
    const source = `${selectedBook.name} ${toGematria(selectedChapter)}:${v.number}`;
    copyToClipboard(`${source}\n${v.text}`);
  };

  const toggleBookmark = (v: Verse) => {
    if (v.text === "...") return;
    const id = `${selectedBook.id}-${selectedChapter}-${v.number}`;
    const exists = bookmarks.find(b => b.id === id);
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
      showToast("הוסר מהסימניות");
    } else {
      setBookmarks(prev => [...prev, {
        id,
        book: selectedBook.name,
        chapter: selectedChapter,
        verseNum: v.number,
        text: v.text
      }]);
      showToast("נוסף לסימניות");
    }
  };

  const loadChapter = useCallback(async (bookName: string, chapterNum: number) => {
    const cacheKey = `${bookName}-${chapterNum}`;
    setError(null);
    
    if (chapterCache[cacheKey]) {
      setChapterContent(chapterCache[cacheKey]);
      setSelectedVerse(null);
      return;
    }
    
    setIsLoading(true);
    try {
      const content = await fetchChapterContent(bookName, chapterNum);
      setChapterContent(content);
      setChapterCache(prev => ({ ...prev, [cacheKey]: content }));
      setSelectedVerse(null);
    } catch (err: any) {
      setError(err.message || "שגיאה בטעינת הפרק. וודא שאתה מחובר לאינטרנט.");
    } finally {
      setIsLoading(false);
    }
  }, [chapterCache]);

  useEffect(() => {
    loadChapter(selectedBook.name, selectedChapter);
  }, [selectedBook, selectedChapter, loadChapter]);

  const handleQuickNavigation = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    const foundBook = BOOKS.find(b => query.includes(b.name));
    if (foundBook) {
      setSelectedBook(foundBook);
      const match = query.match(/\d+/);
      if (match) {
        const ch = parseInt(match[0]);
        if (ch > 0 && ch <= foundBook.chapters) {
          setSelectedChapter(ch);
        } else {
          setSelectedChapter(1);
        }
      } else {
        setSelectedChapter(1);
      }
      setSearchQuery('');
      showToast(`עובר אל ${foundBook.name}`);
    } else {
      showToast("ספר לא נמצא");
    }
  };

  const nextChapter = () => {
    if (selectedChapter < selectedBook.chapters) {
      setSelectedChapter(prev => prev + 1);
    } else {
      const bookIdx = BOOKS.findIndex(b => b.id === selectedBook.id);
      if (bookIdx < BOOKS.length - 1) {
        setSelectedBook(BOOKS[bookIdx + 1]);
        setSelectedChapter(1);
      }
    }
  };

  const prevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
    } else {
      const bookIdx = BOOKS.findIndex(b => b.id === selectedBook.id);
      if (bookIdx > 0) {
        const prevBook = BOOKS[bookIdx - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(prevBook.chapters);
      }
    }
  };

  const groupedBooks = useMemo(() => ({
    Torah: BOOKS.filter(b => b.category === 'Torah'),
    Neviim: BOOKS.filter(b => b.category === 'Neviim'),
    Ketuvim: BOOKS.filter(b => b.category === 'Ketuvim'),
  }), []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fdfbf7]">
      {toastMessage && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] glass px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 border border-white/50">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-800 tracking-tight">{toastMessage}</span>
        </div>
      )}

      {/* Chapter Picker Modal */}
      {isChapterPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsChapterPickerOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-black flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-gray-400" />
                בחירת פרק - {selectedBook.name}
              </h3>
              <button onClick={() => setIsChapterPickerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 scroll-hide">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                <button
                  key={ch}
                  onClick={() => { setSelectedChapter(ch); setIsChapterPickerOpen(false); }}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border
                    ${selectedChapter === ch 
                      ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-105' 
                      : 'bg-white text-gray-700 border-gray-100 hover:border-gray-900 hover:bg-gray-50'}`}
                >
                  <span className="text-lg font-black">{toGematria(ch)}</span>
                  <span className="text-[10px] opacity-40 font-bold">{ch}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="h-20 flex items-center justify-between px-8 border-b border-gray-100 bg-white/60 backdrop-blur-xl z-30 sticky top-0">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-500">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-200">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">תחי הנכבה תנ"ך</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">קריאה וחיפוש מהיר</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleQuickNavigation} className="flex-1 max-w-xl mx-12 relative hidden md:block">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="נווט מהר: הקלד שם ספר ופרק (למשל: בראשית א)..."
              className="w-full pr-12 pl-6 py-3 bg-gray-100/50 border-transparent rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => {
               if (chapterContent && Array.isArray(chapterContent.verses)) {
                 copyToClipboard(chapterContent.verses.filter(v => v.text !== "...").map((v: Verse) => v.text).join('\n'));
               }
             }}
             className="px-5 py-2.5 text-xs font-bold text-gray-700 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
           >
             <Copy className="w-3.5 h-3.5" />
             העתק פרק
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`
          fixed inset-0 z-40 lg:relative lg:block lg:w-80 bg-white border-l border-gray-100 transform transition-transform duration-500 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            <div className="flex border-b">
              <button 
                onClick={() => setSidebarTab('books')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${sidebarTab === 'books' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-300'}`}
              >
                ספרים
              </button>
              <button 
                onClick={() => setSidebarTab('bookmarks')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${sidebarTab === 'bookmarks' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-300'} flex items-center justify-center gap-2`}
              >
                סימניות
                {bookmarks.length > 0 && <span className="bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded-full">{bookmarks.length}</span>}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scroll-hide">
              {sidebarTab === 'books' ? (
                (Object.entries(groupedBooks) as [string, TanakhBook[]][]).map(([category, books]) => (
                  <div key={category}>
                    <p className="text-[11px] font-bold text-gray-300 mb-4 pr-2">
                      {category === 'Torah' ? 'תורה' : category === 'Neviim' ? 'נביאים' : 'כתובים'}
                    </p>
                    <div className="space-y-1">
                      {books.map(book => (
                        <button
                          key={book.id}
                          onClick={() => { setSelectedBook(book); setSelectedChapter(1); setIsSidebarOpen(false); }}
                          className={`w-full text-right px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group ${selectedBook.id === book.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          {book.name}
                          {selectedBook.id === book.id && <ArrowRight className="w-3 h-3 text-white/50" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  {bookmarks.length === 0 ? (
                    <div className="py-20 text-center text-gray-300 italic text-xs">אין סימניות</div>
                  ) : (
                    bookmarks.map(b => (
                      <div 
                        key={b.id} 
                        className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 transition-all cursor-pointer relative group"
                        onClick={() => {
                          const book = BOOKS.find(bk => bk.name === b.book);
                          if (book) {
                            setSelectedBook(book);
                            setSelectedChapter(b.chapter);
                            setIsSidebarOpen(false);
                          }
                        }}
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); setBookmarks(prev => prev.filter(bm => bm.id !== b.id)); }}
                          className="absolute left-2 top-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <p className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">{b.book} {toGematria(b.chapter)}:{b.verseNum}</p>
                        <p className="bible-font text-sm text-gray-700 truncate">{b.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col relative bg-[#fdfbf7] overflow-hidden">
          {/* Enhanced Navigation Bar */}
          <div className="h-20 flex items-center justify-between px-8 border-b border-gray-100 bg-white/40 sticky top-0 z-10 backdrop-blur-md">
            <button onClick={prevChapter} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setIsChapterPickerOpen(true)}
              className="flex flex-col items-center group transition-all"
            >
              <div className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-2xl shadow-xl shadow-gray-200 group-hover:bg-gray-800 transition-all">
                <span className="text-lg font-black">{toGematria(selectedChapter)}</span>
                <ChevronLeft className="w-4 h-4 opacity-50 rotate-90" />
              </div>
              <span className="text-[9px] font-black text-gray-400 mt-1 uppercase tracking-widest">לחץ להחלפת פרק</span>
            </button>

            <button onClick={nextChapter} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pt-12 pb-32 px-6 md:px-24">
            <div className="max-w-5xl mx-auto">
              <div className="mb-12 text-center">
                <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 bible-font">{selectedBook.name}</h2>
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-600">
                  <span>פרק {toGematria(selectedChapter)}</span>
                </div>
                <p className="mt-6 text-[11px] text-gray-300 font-bold uppercase tracking-[0.2em]">לחיצה כפולה להעתקת פסוק • לחיצה בודדת לסימון</p>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
                  <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">טוען את המקורות...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white/50 rounded-3xl border border-gray-100 shadow-sm max-w-lg mx-auto">
                  <AlertCircle className="w-12 h-12 text-red-300 mb-4" />
                  <p className="text-gray-700 font-bold mb-6 text-lg">{error}</p>
                  <button 
                    onClick={() => loadChapter(selectedBook.name, selectedChapter)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    נסה שוב
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-center md:text-right animate-in fade-in duration-1000">
                  <div className="flex flex-wrap justify-center md:justify-start gap-x-3 gap-y-6">
                    {chapterContent && Array.isArray(chapterContent.verses) && chapterContent.verses.map((v: Verse) => (
                      <div 
                        key={v.number}
                        onClick={() => setSelectedVerse(v)}
                        onDoubleClick={() => handleVerseDoubleClick(v)}
                        className={`inline-block transition-all duration-300 px-2 py-1 rounded-2xl relative group cursor-pointer
                          ${selectedVerse?.number === v.number ? 'bg-blue-50/80 ring-1 ring-blue-100' : 'hover:bg-gray-100/50'}`}
                      >
                        <span className="bible-font text-3xl md:text-4xl font-normal text-gray-800 leading-[1.8] block tracking-wide">
                          <sup className="text-[11px] font-black text-gray-300 ml-2 select-none group-hover:text-blue-400 transition-colors">{v.number}</sup>
                          {v.text === "..." ? <span className="text-gray-200">...</span> : v.text}
                        </span>
                        
                        {v.text !== "..." && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(v); }}
                            className={`absolute -top-4 -right-2 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 
                              ${bookmarks.some(b => b.id === `${selectedBook.id}-${selectedChapter}-${v.number}`) ? 'text-blue-500' : 'text-gray-300 hover:text-blue-400'}`}
                          >
                            <BookmarkPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
