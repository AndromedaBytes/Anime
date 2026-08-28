import * as cheerio from 'cheerio';
import { SELECTORS, ASURA_BASE_URL } from '../config/selectors.js';
import { MangaSearchResult, SearchQueryOptions } from '../types.js';
import { cleanText, ensureAbsoluteUrl, extractMangaId } from '../utils/sanitize.js';
import { fetchWithRetry } from '../utils/http.js';

export async function parseSearchHtml(html: string, baseUrl: string = ASURA_BASE_URL): Promise<MangaSearchResult[]> {
  const $ = cheerio.load(html);
  const results: MangaSearchResult[] = [];
  const seenIds = new Set<string>();

  // Iterate over matching cards
  $(SELECTORS.search.card).each((_, element) => {
    const el = $(element);
    
    // Find link
    let link = el.is('a') ? el.attr('href') : el.find(SELECTORS.search.link).first().attr('href') || el.find('a').first().attr('href');
    if (!link) return;

    const fullUrl = ensureAbsoluteUrl(link, baseUrl);
    const id = extractMangaId(fullUrl);

    if (!id || seenIds.has(id)) return;
    seenIds.add(id);

    // Title
    const titleEl = el.find(SELECTORS.search.title).first();
    const title = cleanText(titleEl.text()) || cleanText(el.find('h2, h3, h4, span.font-bold').first().text()) || id;

    // Image / Cover
    const imgEl = el.find(SELECTORS.search.image).first();
    let img = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('srcset') || '';
    if (img && img.includes(' ')) {
      img = img.split(' ')[0];
    }
    const fullImage = ensureAbsoluteUrl(img, baseUrl);

    // Rating (if present)
    const ratingEl = el.find(SELECTORS.search.rating || 'div.rating').first();
    const rating = cleanText(ratingEl.text()) || undefined;

    // Latest chapter
    const latestChapterEl = el.find(SELECTORS.search.latestChapter || 'span.text-muted-foreground').first();
    const latestChapter = cleanText(latestChapterEl.text()) || undefined;

    results.push({
      id,
      title,
      url: fullUrl,
      image: fullImage,
      rating,
      latestChapter,
    });
  });

  return results;
}

export async function searchManga(
  opts: SearchQueryOptions | string,
  baseUrl: string = ASURA_BASE_URL
): Promise<MangaSearchResult[]> {
  const query = typeof opts === 'string' ? opts : opts.query;
  if (!query || query.trim() === '') {
    return [];
  }

  const searchUrl = `${baseUrl}${SELECTORS.endpoints.search}${encodeURIComponent(query.trim())}`;
  
  try {
    const html = await fetchWithRetry(searchUrl, { referer: baseUrl });
    return await parseSearchHtml(html, baseUrl);
  } catch (error: any) {
    console.error(`[AsuraScansProvider] Search failed for "${query}":`, error?.message || error);
    return [];
  }
}
