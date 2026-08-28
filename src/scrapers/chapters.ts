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

  // Asura Scans chapter listing containers
  // Modern asuracomic.net has chapters in list or flex container
  const chapterNodes = $(
    'div.flex.justify-between.items-center, div.eph-num, li[data-num], div.bxcl ul li, a[href*="/chapter/"]'
  );

  chapterNodes.each((_, el) => {
    const item = $(el);
    let link = item.is('a') ? item.attr('href') : item.find('a[href*="/chapter/"]').first().attr('href') || item.find('a').first().attr('href');
    
    if (!link) return;
    const fullUrl = ensureAbsoluteUrl(link, baseUrl);

    if (seenUrls.has(fullUrl)) return;
    seenUrls.add(fullUrl);

    const titleEl = item.find('h3.text-sm.font-bold, span.chapternum, span.font-medium, a').first();
    const rawTitle = cleanText(titleEl.text()) || cleanText(item.text());
    
    const chapterNumber = extractChapterNumber(rawTitle);
    const chapterStr = chapterNumber.toString();

    const dateEl = item.find('h3.text-xs, span.chapterdate, span.text-xs').first();
    const updatedAt = cleanText(dateEl.text()) || undefined;

    const id = extractChapterId(fullUrl);

    chapters.push({
      id,
      url: fullUrl,
      title: rawTitle || `Chapter ${chapterStr}`,
      chapter: chapterStr,
      chapterNumber,
      updatedAt,
      scanlator: 'Asura Scans',
    });
  });

  // Sort ascending by chapterNumber (e.g. Ch 1, Ch 1.5, Ch 2, etc.)
  chapters.sort((a, b) => {
    if (a.chapterNumber !== b.chapterNumber) {
      return a.chapterNumber - b.chapterNumber;
    }
    return a.id.localeCompare(b.id);
  });

  return chapters;
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
