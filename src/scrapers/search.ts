import * as cheerio from 'cheerio';
import { SELECTORS, ASURA_BASE_URL, ASURA_FALLBACK_URL } from '../config/selectors.js';
import { MangaSearchResult, SearchQueryOptions } from '../types.js';
import { cleanText, ensureAbsoluteUrl, extractMangaId } from '../utils/sanitize.js';
import { fetchWithRetry } from '../utils/http.js';

export async function parseSearchHtml(html: string, baseUrl: string = ASURA_BASE_URL): Promise<MangaSearchResult[]> {
  const $ = cheerio.load(html);
  const results: MangaSearchResult[] = [];
  const seenIds = new Set<string>();

  // Look for cards or comic links
  $('a[href*="/comics/"], a[href*="/series/"]').each((_, element) => {
    const el = $(element);
    const href = el.attr('href');
    if (!href || href.includes('/chapter/')) return;

    const fullUrl = ensureAbsoluteUrl(href, baseUrl);
    const id = extractMangaId(fullUrl);

    if (!id || seenIds.has(id)) return;

    // Title extraction
    // In Astro card, title may be in child span, h3, or text without rating
    let title = cleanText(el.find('h3, h4, span.font-bold, div.font-bold').first().text());
    if (!title) {
      const rawText = cleanText(el.text());
      // Strip leading score (e.g. "9.8Solo Leveling" -> "Solo Leveling")
      title = rawText.replace(/^[0-9]\.[0-9]\s*/, '').trim();
    }
    if (!title) {
      title = id.replace(/-[a-z0-9]+$/, '').replace(/-/g, ' ');
    }

    // Cover image
    const imgEl = el.find('img').first();
    let img = imgEl.attr('src') || imgEl.attr('data-src') || '';
    if (img && img.includes(' ')) {
      img = img.split(' ')[0];
    }
    const fullImage = ensureAbsoluteUrl(img, baseUrl);

    // Rating
    const ratingEl = el.find('span.text-xs, div.rating').first();
    let rating = cleanText(ratingEl.text());
    if (!rating) {
      const scoreMatch = el.text().match(/([0-9]\.[0-9])/);
      if (scoreMatch) rating = scoreMatch[1];
    }

    seenIds.add(id);

    results.push({
      id,
      title,
      url: fullUrl,
      image: fullImage,
      rating: rating || undefined,
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

  const encoded = encodeURIComponent(query.trim());
  const searchUrls = [
    `${baseUrl}${SELECTORS.endpoints.search}${encoded}`,
    `${baseUrl}/browse/comics?search=${encoded}`,
    `${ASURA_FALLBACK_URL}/browse?search=${encoded}`,
  ];

  for (const searchUrl of searchUrls) {
    try {
      const html = await fetchWithRetry(searchUrl, { referer: baseUrl });
      const results = await parseSearchHtml(html, baseUrl);
      if (results.length > 0) {
        return results;
      }
    } catch (error: any) {
      console.debug(`[AsuraScansProvider] Search attempt failed on "${searchUrl}":`, error?.message || error);
    }
  }

  return [];
}
