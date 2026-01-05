
export interface TanakhBook {
  id: string;
  name: string;
  category: 'Torah' | 'Neviim' | 'Ketuvim';
  chapters: number;
}

export interface Verse {
  number: number;
  text: string;
}

export interface ChapterContent {
  book: string;
  chapter: number;
  verses: Verse[];
}

export interface SearchResult {
  bookName: string;
  chapter: number;
  verseNum: number;
  text: string;
}
