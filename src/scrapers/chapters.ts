import * as cheerio from 'cheerio';
import { SELECTORS, ASURA_BASE_URL } from '../config/selectors.js';
import { MangaChapter } from '../types.js';
import { cleanText, ensureAbsoluteUrl, extractChapterId, extractChapterNumber } from '../utils/sanitize.js';
import { fetchWithRetry } from '../utils/http.js';

export function parseChaptersHtml(
  html: string,
  baseUrl: string = ASURA_BASE_URL
): MangaChapter[] {
  const $ = cheerio.load(html);
  const chapters: MangaChapter[] = [];
  const seenUrls = new Set<string>();

  // Chapter links
  const chapterNodes = $('a[href*="/chapter/"]');

  chapterNodes.each((_, el) => {
    const item = $(el);
    const href = item.attr('href');
    if (!href) return;

    const fullUrl = ensureAbsoluteUrl(href, baseUrl);
    if (seenUrls.has(fullUrl)) return;
    seenUrls.add(fullUrl);

    // Chapter title
    let rawTitle = cleanText(item.find('h3, span.chapternum, span.font-medium').first().text());
    if (!rawTitle) {
      rawTitle = cleanText(item.text());
    }

    // Try extracting chapter number from title, fallback to URL
    let chapterNumber = extractChapterNumber(rawTitle);
    if (chapterNumber === 0) {
      const urlNum = extractChapterNumber(href);
      if (urlNum > 0) chapterNumber = urlNum;
    }

    // Clean up title if it's generic "First Chapter"
    let displayTitle = rawTitle;
    if (rawTitle.toLowerCase().includes('first chapter') || !rawTitle) {
      displayTitle = `Chapter ${chapterNumber}`;
    }

    const chapterStr = chapterNumber.toString();

    // Date
    const dateEl = item.find('h3.text-xs, span.chapterdate, span.text-xs, time').first();
    const updatedAt = cleanText(dateEl.text()) || undefined;

    const id = extractChapterId(fullUrl);

    chapters.push({
      id,
      url: fullUrl,
      title: displayTitle,
      chapter: chapterStr,
      chapterNumber,
      updatedAt,
      scanlator: 'Asura Scans',
    });
  });

  // Deduplicate entries that have the same chapterNumber and keep the one with a better title
  const deduplicated = new Map<number, MangaChapter>();
  for (const ch of chapters) {
    const existing = deduplicated.get(ch.chapterNumber);
    if (!existing || (!existing.title.toLowerCase().startsWith('chapter') && ch.title.toLowerCase().startsWith('chapter'))) {
      deduplicated.set(ch.chapterNumber, ch);
    }
  }

  const result = Array.from(deduplicated.values());

  // Sort ascending by chapterNumber (e.g. Ch 1, Ch 1.5, Ch 2...)
  result.sort((a, b) => {
    if (a.chapterNumber !== b.chapterNumber) {
      return a.chapterNumber - b.chapterNumber;
    }
    return a.id.localeCompare(b.id);
  });

  return result;
}

export async function getMangaChapters(
  mangaId: string,
  baseUrl: string = ASURA_BASE_URL
): Promise<MangaChapter[]> {
  const url = mangaId.startsWith('http://') || mangaId.startsWith('https://')
    ? mangaId
    : `${baseUrl}${SELECTORS.endpoints.series}${mangaId}`;

  try {
    const html = await fetchWithRetry(url, { referer: baseUrl });
    return parseChaptersHtml(html, baseUrl);
  } catch (error: any) {
    console.error(`[AsuraScansProvider] Failed to fetch chapters for "${mangaId}":`, error?.message || error);
    return [];
  }
}
