import * as cheerio from 'cheerio';
import { SELECTORS, ASURA_BASE_URL } from '../config/selectors.js';
import { PageImage } from '../types.js';
import { ensureAbsoluteUrl, reconstructChapterUrl } from '../utils/sanitize.js';
import { fetchWithRetry } from '../utils/http.js';

export function parseReaderHtml(
  html: string,
  baseUrl: string = ASURA_BASE_URL
): PageImage[] {
  const $ = cheerio.load(html);
  const pages: PageImage[] = [];
  const seenUrls = new Set<string>();

  // Look for chapter reader image elements
  const imgElements = $(
    'div.flex.flex-col.items-center img, div#readerarea img, div.rdcontainer img, img[alt*="chapter"], div.w-full img'
  );

  let pageIndex = 0;

  imgElements.each((_, el) => {
    const item = $(el);
    let src =
      item.attr('src') ||
      item.attr('data-src') ||
      item.attr('data-lazy-src') ||
      item.attr('data-original') ||
      '';

    if (!src) return;

    // Filter srcset if multiple resolutions are present
    if (src.includes(' ')) {
      src = src.split(' ')[0];
    }

    const fullUrl = ensureAbsoluteUrl(src, baseUrl);

    // Skip duplicate images
    if (seenUrls.has(fullUrl)) return;

    // Filter out ads and promotional graphics
    const isAd = SELECTORS.reader.adPatterns.some((pattern) => pattern.test(fullUrl));
    const altText = item.attr('alt') || '';
    const isAdAlt = SELECTORS.reader.adPatterns.some((pattern) => pattern.test(altText));

    if (isAd || isAdAlt) {
      return;
    }

    seenUrls.add(fullUrl);

    pages.push({
      index: pageIndex++,
      url: fullUrl,
      alt: `Page ${pageIndex}`,
      headers: {
        Referer: `${baseUrl}/`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
    });
  });

  return pages;
}

export async function getChapterPages(
  chapterId: string,
  baseUrl: string = ASURA_BASE_URL
): Promise<PageImage[]> {
  const chapterUrl = reconstructChapterUrl(chapterId, baseUrl);

  try {
    const html = await fetchWithRetry(chapterUrl, { referer: baseUrl });
    return parseReaderHtml(html, baseUrl);
  } catch (error: any) {
    console.error(`[AsuraScansProvider] Failed to fetch pages for "${chapterId}":`, error?.message || error);
    return [];
  }
}
