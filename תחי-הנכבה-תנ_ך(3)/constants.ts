
import { TanakhBook } from './types';

export interface TanakhBookWithSlug extends TanakhBook {
  slug: string;
}

export const BOOKS: TanakhBookWithSlug[] = [
  // Torah
  { id: 'bereshit', name: 'בראשית', slug: 'Genesis', category: 'Torah', chapters: 50 },
  { id: 'shemot', name: 'שמות', slug: 'Exodus', category: 'Torah', chapters: 40 },
  { id: 'vayikra', name: 'ויקרא', slug: 'Leviticus', category: 'Torah', chapters: 27 },
  { id: 'bamidbar', name: 'במדבר', slug: 'Numbers', category: 'Torah', chapters: 36 },
  { id: 'devarim', name: 'דברים', slug: 'Deuteronomy', category: 'Torah', chapters: 34 },
  
  // Nevi'im
  { id: 'yehoshua', name: 'יהושע', slug: 'Joshua', category: 'Torah', chapters: 24 },
  { id: 'shoftim', name: 'שופטים', slug: 'Judges', category: 'Neviim', chapters: 21 },
  { id: 'shmuel_a', name: 'שמואל א', slug: 'I Samuel', category: 'Neviim', chapters: 31 },
  { id: 'shmuel_b', name: 'שמואל ב', slug: 'II Samuel', category: 'Neviim', chapters: 24 },
  { id: 'melachim_a', name: 'מלכים א', slug: 'I Kings', category: 'Neviim', chapters: 22 },
  { id: 'melachim_b', name: 'מלכים ב', slug: 'II Kings', category: 'Neviim', chapters: 25 },
  { id: 'yeshayahu', name: 'ישעיהו', slug: 'Isaiah', category: 'Neviim', chapters: 66 },
  { id: 'yirmiyahu', name: 'ירמיהו', slug: 'Jeremiah', category: 'Neviim', chapters: 52 },
  { id: 'yechezkel', name: 'יחזקאל', slug: 'Ezekiel', category: 'Neviim', chapters: 48 },
  { id: 'hoshea', name: 'הושע', slug: 'Hosea', category: 'Neviim', chapters: 14 },
  { id: 'yoel', name: 'יואל', slug: 'Joel', category: 'Neviim', chapters: 4 },
  { id: 'amos', name: 'עמוס', slug: 'Amos', category: 'Neviim', chapters: 9 },
  { id: 'ovadya', name: 'עובדיה', slug: 'Obadiah', category: 'Neviim', chapters: 1 },
  { id: 'yona', name: 'יונה', slug: 'Jonah', category: 'Neviim', chapters: 4 },
  { id: 'micha', name: 'מיכה', slug: 'Micah', category: 'Neviim', chapters: 7 },
  { id: 'nachum', name: 'נחום', slug: 'Nahum', category: 'Neviim', chapters: 3 },
  { id: 'chavakuk', name: 'חבקוק', slug: 'Habakkuk', category: 'Neviim', chapters: 3 },
  { id: 'tzefanya', name: 'צפניה', slug: 'Zephaniah', category: 'Neviim', chapters: 3 },
  { id: 'chagai', name: 'חגי', slug: 'Haggai', category: 'Neviim', chapters: 2 },
  { id: 'zecharya', name: 'זכריה', slug: 'Zechariah', category: 'Neviim', chapters: 14 },
  { id: 'malachi', name: 'מלאכי', slug: 'Malachi', category: 'Neviim', chapters: 3 },
  
  // Ketuvim
  { id: 'tehillim', name: 'תהלים', slug: 'Psalms', category: 'Ketuvim', chapters: 150 },
  { id: 'mishlei', name: 'משלי', slug: 'Proverbs', category: 'Ketuvim', chapters: 31 },
  { id: 'iyov', name: 'איוב', slug: 'Job', category: 'Ketuvim', chapters: 42 },
  { id: 'shir_hashirim', name: 'שיר השירים', slug: 'Song of Songs', category: 'Ketuvim', chapters: 8 },
  { id: 'rut', name: 'רות', slug: 'Ruth', category: 'Ketuvim', chapters: 4 },
  { id: 'eicha', name: 'איכה', slug: 'Lamentations', category: 'Ketuvim', chapters: 5 },
  { id: 'kohelet', name: 'קהלת', slug: 'Ecclesiastes', category: 'Ketuvim', chapters: 12 },
  { id: 'ester', name: 'אסתר', slug: 'Esther', category: 'Ketuvim', chapters: 10 },
  { id: 'daniel', name: 'דניאל', slug: 'Daniel', category: 'Ketuvim', chapters: 12 },
  { id: 'ezra', name: 'עזרא', slug: 'Ezra', category: 'Ketuvim', chapters: 10 },
  { id: 'nechemya', name: 'נחמיה', slug: 'Nehemiah', category: 'Ketuvim', chapters: 13 },
  { id: 'divrei_hayamim_a', name: 'דברי הימים א', slug: 'I Chronicles', category: 'Ketuvim', chapters: 29 },
  { id: 'divrei_hayamim_b', name: 'דברי הימים ב', slug: 'II Chronicles', category: 'Ketuvim', chapters: 36 }
];
