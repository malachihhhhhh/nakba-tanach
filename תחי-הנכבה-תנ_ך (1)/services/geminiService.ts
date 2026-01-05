
import { ChapterContent, Verse } from "../types";
import { LOCAL_TANAKH_DATA } from "../data/tanakhData";
import { BOOKS } from "../constants";

/**
 * Cleans Hebrew text thoroughly but safely.
 */
function cleanHebrewText(text: string): string {
  if (!text || typeof text !== 'string') return "";
  
  return text
    // 1. Remove HTML tags
    .replace(/<[^>]*>/g, '') 
    // 2. Handle HTML entities
    .replace(/&(thinsp|nbsp|zwnj|zwj|#8201|#160);/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, '')
    // 3. Remove Ta'amim (Cantillation marks): U+0591 to U+05AF
    .replace(/[\u0591-\u05AF\u05C0\u05C6]/g, '')
    // 4. Replace Biblical Maqaf (־) with standard hyphen (-)
    .replace(/\u05BE/g, '-')
    // 5. Remove Sof-Pasuq (׃)
    .replace(/\u05C3/g, '')
    // 6. Remove Sefaria specific markers
    .replace(/\{[פסק]\}/g, '')
    .replace(/\([^\)]*\)/g, '')
    // 7. Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetches chapter content from Sefaria API.
 */
export async function fetchChapterContent(bookName: string, chapter: number): Promise<ChapterContent> {
  // Check local data first, but only use if it looks "complete" (arbitrary check for first 3 chapters of Genesis)
  // or if we're explicitly using local data for performance on known sets.
  const localBook = LOCAL_TANAKH_DATA[bookName];
  if (localBook && localBook[chapter] && localBook[chapter].length > 10) {
    return {
      book: bookName,
      chapter,
      verses: localBook[chapter].map(v => ({
        ...v,
        text: cleanHebrewText(v.text)
      }))
    };
  }

  const book = BOOKS.find(b => b.name === bookName);
  const identifier = book ? book.slug : bookName;

  try {
    const response = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(identifier)}.${chapter}?context=0&commentary=0`);
    
    if (!response.ok) {
      throw new Error(`שגיאה בגישה לשרת: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.he) {
      // Sefaria sometimes returns nested arrays (arrays of arrays of strings).
      // We need a robust flat operation.
      const rawHebrew = Array.isArray(data.he) ? data.he : [data.he];
      
      // Recursive flatten to handle any depth of nesting from Sefaria's structure
      const flattenData = (arr: any[]): string[] => {
        return arr.reduce((acc, val) => 
          Array.isArray(val) ? acc.concat(flattenData(val)) : acc.concat(val), 
        []);
      };

      const flattenedHebrew = flattenData(rawHebrew);
      
      const verses: Verse[] = flattenedHebrew.map((text: string, index: number) => {
        const cleaned = cleanHebrewText(text);
        return {
          number: index + 1,
          text: cleaned || "..." 
        };
      });

      if (verses.length === 0) throw new Error("לא נמצאו פסוקים בפרק זה.");

      return {
        book: bookName,
        chapter,
        verses
      };
    }
    
    throw new Error("לא נמצא תוכן לפרק זה.");
  } catch (error: any) {
    console.error("Fetch error:", error);
    throw error;
  }
}
