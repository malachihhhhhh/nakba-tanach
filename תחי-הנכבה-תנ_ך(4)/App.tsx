
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BOOKS } from './constants.ts';
import { TanakhBook, ChapterContent, Verse, SearchResult } from './types.ts';
import { fetchChapterContent, searchTanakh, explainVerse } from './services/geminiService.ts';
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
  LayoutGrid,
  Sparkles,
  Loader2
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

const App: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<TanakhBook>(BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterContent, setChapterContent] = useState<ChapterContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isChapterPickerOpen, setIsChapterPickerOpen] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'books' | 'search' | 'bookmarks'>('books');
  const [verseExplanation, setVerseExplanation] = useState<{ id: string, text: string } | null>(null);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tanakh_bookmarks_v3');
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('tanakh_bookmarks_v3', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadChapter = useCallback(async (bookName: string, chapterNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const content = await fetchChapterContent(bookName, chapterNum);
      setChapterContent(content);
    } catch (err: any) {
      setError(err.message || "שגיאה בטעינת הפרק.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChapter(selectedBook.name, selectedChapter);
  }, [selectedBook, selectedChapter, loadChapter]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSidebarTab('search');
    setIsSidebarOpen(true);
    try {
      const results = await searchTanakh(searchQuery);
      setSearchResults(results);
    } catch (err) {
      showToast("שגיאה בחיפוש");
    } finally {
      setIsSearching(false);
    }
  };

  const handleExplain = async (v: Verse) => {
    const id = `${selectedBook.id}-${selectedChapter}-${v.number}`;
    if (explainingId === id) { setVerseExplanation(null); setExplainingId(null); return; }
    setExplainingId(id);
    try {
      const exp = await explainVerse(selectedBook.name, selectedChapter, v.number, v.text);
      setVerseExplanation({ id, text: exp });
    } catch {
      showToast("שגיאה בהסבר הפסוק");
    } finally {
      setExplainingId(null);
    }
  };

  const toggleBookmark = (v: Verse) => {
    const id = `${selectedBook.id}-${selectedChapter}-${v.number}`;
    const exists = bookmarks.find(b => b.id === id);
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
      showToast("הוסר מהסימניות");
    } else {
      setBookmarks(prev => [...prev, { id, book: selectedBook.name, chapter: selectedChapter, verse: v.number, text: v.text }]);
      showToast("נוסף לסימניות");
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#fdfbf7] text-[#1a1c1e]">
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] glass px-6 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 border border-white/50">
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      {/* Chapter Picker Modal */}
      {isChapterPickerOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsChapterPickerOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95">
            <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-black flex items-center gap-2">
                <LayoutGrid size={18} className="text-gray-400" />
                בחירת פרק - {selectedBook.name}
              </h3>
              <button onClick={() => setIsChapterPickerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-4 sm:grid-cols-5 gap-3 scroll-hide">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                <button
                  key={ch}
                  onClick={() => { setSelectedChapter(ch); setIsChapterPickerOpen(false); }}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border
                    ${selectedChapter === ch ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50 border-gray-100'}`}
                >
                  <span className="text-lg font-black">{toGematria(ch)}</span>
                  <span className="text-[9px] opacity-40 font-bold">{ch}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 lg:hidden text-gray-400"><Menu /></button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-xl shadow-gray-200">
              <BookMarked size={20} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black leading-tight">תחי הנכבה תנ"ך</h1>
              <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400">חוכמת הדורות בבינה מודרנית</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 group relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="חפש מילה, מושג או שאל שאלה את ה-AI..."
            className="w-full pr-11 pl-4 py-3 bg-gray-100/50 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="hidden md:flex gap-2">
           <button className="p-3 bg-black text-white rounded-xl shadow-lg hover:scale-105 transition-all">
             <Sparkles size={18} />
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-0 z-[60] lg:relative lg:translate-x-0 lg:w-80 bg-white border-l border-gray-100 transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            <div className="p-4 flex border-b bg-gray-50/30">
              {['books', 'search', 'bookmarks'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab as any)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === tab ? 'text-black border-b-2 border-black' : 'text-gray-300 hover:text-gray-500'}`}
                >
                  {tab === 'books' ? 'ספרים' : tab === 'search' ? 'חיפוש' : 'שמורים'}
                </button>
              ))}
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2"><X size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scroll-hide">
              {sidebarTab === 'books' ? (
                <div className="space-y-6">
                  {['Torah', 'Neviim', 'Ketuvim'].map(cat => (
                    <div key={cat}>
                      <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 pr-2">
                        {cat === 'Torah' ? 'תורה' : cat === 'Neviim' ? 'נביאים' : 'כתובים'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {BOOKS.filter(b => b.category === cat).map(book => (
                          <button
                            key={book.id}
                            onClick={() => { setSelectedBook(book); setSelectedChapter(1); setIsSidebarOpen(false); }}
                            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${selectedBook.id === book.id ? 'bg-black text-white shadow-lg' : 'hover:bg-gray-50 text-gray-500'}`}
                          >
                            {book.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : sidebarTab === 'search' ? (
                <div className="space-y-4">
                  {isSearching ? (
                    <div className="flex flex-col items-center py-20 gap-4">
                      <Loader2 className="animate-spin text-gray-300" />
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">מחפש במקורות...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-20 text-gray-300 text-xs italic">הקלד בחיפוש למעלה...</div>
                  ) : (
                    searchResults.map((res, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          const book = BOOKS.find(b => b.name === res.bookName);
                          if(book) { setSelectedBook(book); setSelectedChapter(res.chapter); setIsSidebarOpen(false); }
                        }}
                        className="p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-black/5 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-wide">{res.bookName} {toGematria(res.chapter)}:{toGematria(res.verseNum)}</p>
                          <ArrowRight size={10} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="bible-font text-sm leading-relaxed text-gray-700 line-clamp-3">{res.text}</p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {bookmarks.length === 0 && <p className="text-center py-20 text-gray-300 text-xs italic">אין פסוקים שמורים</p>}
                  {bookmarks.map(b => (
                    <div key={b.id} className="p-4 bg-gray-50/50 rounded-2xl group relative">
                      <button onClick={() => setBookmarks(p => p.filter(x => x.id !== b.id))} className="absolute top-2 left-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                      <p className="text-[10px] font-black mb-1 opacity-40">{b.book} {toGematria(b.chapter)}:{toGematria(b.verse)}</p>
                      <p className="bible-font text-sm leading-relaxed line-clamp-2">{b.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-[#fdfbf7]">
          <div className="max-w-4xl mx-auto py-12 px-6 sm:px-12">
            
            {/* Nav Bar */}
            <div className="flex items-center justify-between mb-16 h-20 bg-white/40 backdrop-blur-md rounded-3xl px-8 border border-white/50 sticky top-4 z-10">
              <button onClick={() => setSelectedChapter(c => Math.max(1, c-1))} className="p-3 hover:bg-white rounded-2xl transition-all text-gray-400 hover:text-black"><ChevronRight size={24}/></button>
              
              <button onClick={() => setIsChapterPickerOpen(true)} className="flex flex-col items-center group">
                <h1 className="text-4xl md:text-5xl font-black bible-font tracking-tighter group-hover:scale-105 transition-transform">{selectedBook.name}</h1>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mt-1">פרק {toGematria(selectedChapter)}</span>
              </button>

              <button onClick={() => setSelectedChapter(c => Math.min(selectedBook.chapters, c+1))} className="p-3 hover:bg-white rounded-2xl transition-all text-gray-400 hover:text-black"><ChevronLeft size={24}/></button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center py-40 gap-6">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                <span className="text-[10px] font-black tracking-[0.3em] text-gray-300 uppercase">טוען את המגילות...</span>
              </div>
            ) : error ? (
              <div className="text-center py-40 space-y-6 bg-white rounded-3xl p-8 border border-red-50">
                <AlertCircle className="mx-auto text-red-200" size={48} />
                <p className="text-gray-500 font-bold">{error}</p>
                <button onClick={() => loadChapter(selectedBook.name, selectedChapter)} className="bg-black text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-xl">נסה שוב</button>
              </div>
            ) : (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-10 leading-[1.8]">
                  {chapterContent?.verses.map((v) => {
                    const id = `${selectedBook.id}-${selectedChapter}-${v.number}`;
                    const isExplaining = explainingId === id;
                    const explanation = verseExplanation?.id === id ? verseExplanation.text : null;

                    return (
                      <div key={v.number} className="w-full relative group">
                        <div className="flex flex-wrap items-baseline gap-4 md:gap-6 justify-center md:justify-start">
                          <span className="text-[11px] font-black text-gray-200 select-none min-w-[20px]">{toGematria(v.number)}</span>
                          <p className={`bible-font text-3xl md:text-5xl tracking-wide transition-all ${verseExplanation?.id === id ? 'text-black font-bold' : 'text-gray-800'}`}>
                            {v.text}
                          </p>
                          
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => toggleBookmark(v)} className={`p-2 bg-white border border-gray-100 rounded-lg shadow-sm hover:scale-110 transition-all ${bookmarks.some(b => b.id === id) ? 'text-blue-500 bg-blue-50' : ''}`}><BookmarkPlus size={14}/></button>
                            <button onClick={() => handleExplain(v)} className={`p-2 bg-white border border-gray-100 rounded-lg shadow-sm hover:scale-110 transition-all ${isExplaining ? 'animate-pulse bg-blue-50' : ''}`}><Sparkles size={14} className="text-blue-500"/></button>
                          </div>
                        </div>

                        {explanation && (
                          <div className="mt-6 p-6 bg-blue-50/40 rounded-3xl border border-blue-100/50 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles size={14} className="text-blue-500" />
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">תובנת AI</span>
                            </div>
                            <p className="text-sm text-blue-900 leading-relaxed font-medium">{explanation}</p>
                            <button onClick={() => setVerseExplanation(null)} className="mt-4 text-[10px] font-bold text-blue-400 hover:text-blue-600">סגור הסבר</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
