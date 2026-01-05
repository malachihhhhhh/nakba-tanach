
import { GoogleGenAI } from "@google/genai";
import { ChapterContent, Verse, SearchResult } from "../types.ts";
import { LOCAL_TANAKH_DATA } from "../data/tanakhData.ts";
import { BOOKS } from "../constants.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Cleans Hebrew text from vowels (Niqqud) and cantillation marks (Ta'amim).
 */
function cleanHebrewText(text: string): string {
  if (!text || typeof text !== 'string') return "";
  return text
    .replace(/<[^>]*>/g, '') 
    .replace(/&(thinsp|nbsp|zwnj|zwj|#8201|#160);/g, ' ')
    .replace(/[\u0591-\u05AF\u05C0\u05C3\u05C6]/g, '') // Remove Niqqud/Taamim/SofPasuq
    .replace(/\u05BE/g, '-') // Normalize Maqaf
    .replace(/\{[פסק]\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * AI-powered explanation for a specific verse using Gemini
 */
export async function explainVerse(book: string, chapter: number, verse: number, text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `הסבר בקצרה ובשפה מודרנית את הפסוק הבא מהתנ"ך (${book} פרק ${chapter} פסוק ${verse}): "${text}". התמקד בתוכן וביופי של הפסוק.`,
    });
    return response.text || "לא ניתן היה להפיק הסבר כעת.";
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    return "חלה שגיאה בטעינת ההסבר מהבינה המלאכותית.";
  }
}

/**
 * Semantic search using Gemini to find verses by concept or theme
 */
export async function semanticSearch(query: string): Promise<SearchResult[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `מצא עד 5 פסוקים מהתנ"ך שקשורים באופן מובהק לנושא: "${query}". 
      החזר תוצאה בפורמט JSON בלבד כרשימה של אובייקטים: [{"book": "שם הספר", "chapter": מספר, "verse": מספר, "text": "טקסט הפסוק"}].`,
      config: { responseMimeType: "application/json" }
    });
    
    const results = JSON.parse(response.text || "[]");
    return results.map((r: any) => ({
      bookName: r.book,
      chapter: r.chapter,
      verseNum: r.verse,
      text: cleanHebrewText(r.text)
    }));
  } catch (error) {
    console.error("Semantic Search Error:", error);
    return [];
  }
}

/**
 * Standard text search in Sefaria API with Fallback to Semantic AI search
 */
export async function searchTanakh(query: string): Promise<SearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.sefaria.org/api/v2/search/text?q=${encodedQuery}&type=text&field=hebrew&index=Tanakh&size=20`;

    const response = await fetch(url);
    if (!response.ok) return await semanticSearch(query);

    const data = await response.json();
    const hits = data.hits?.hits || [];

    if (hits.length === 0) return await semanticSearch(query);

    return hits.map((hit: any) => {
      const source = hit._source || hit;
      const ref = source.ref; 
      const match = ref.match(/(.+)\s(\d+)(?::(\d+))?/);
      if (!match) return null;

      const [_, bookSlug, chapter, verse] = match;
      const book = BOOKS.find(b => b.slug.toLowerCase() === bookSlug.toLowerCase());
      
      return {
        bookName: book ? book.name : bookSlug,
        chapter: parseInt(chapter),
        verseNum: verse ? parseInt(verse) : 1,
        text: cleanHebrewText(source.he || source.text || "")
      };
    }).filter((r: any) => r !== null);
  } catch (error) {
    return await semanticSearch(query);
  }
}

export async function fetchChapterContent(bookName: string, chapter: number): Promise<ChapterContent> {
  const localBook = LOCAL_TANAKH_DATA[bookName];
  if (localBook && localBook[chapter]) {
    return { book: bookName, chapter, verses: localBook[chapter].map(v => ({ ...v, text: cleanHebrewText(v.text) })) };
  }

  const book = BOOKS.find(b => b.name === bookName);
  const identifier = book ? book.slug : bookName;

  try {
    const response = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(identifier)}.${chapter}?context=0&commentary=0`);
    if (!response.ok) throw new Error("API call failed");

    const data = await response.json();
    if (data && data.he) {
      const rawHebrew = Array.isArray(data.he) ? data.he : [data.he];
      const flatten = (arr: any[]): string[] => arr.reduce((a, b) => Array.isArray(b) ? a.concat(flatten(b)) : a.concat(b), []);
      const verses = flatten(rawHebrew).map((text: string, index: number) => ({
        number: index + 1,
        text: cleanHebrewText(text) || "..." 
      }));
      return { book: bookName, chapter, verses };
    }
    throw new Error("No content found");
  } catch (error) {
    throw new Error("שגיאה בטעינת הפרק מהשרת.");
  }
}
