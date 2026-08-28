import * as cheerio from 'cheerio';
import { SELECTORS, ASURA_BASE_URL } from '../config/selectors.js';
import { MangaDetails } from '../types.js';
import { cleanText, ensureAbsoluteUrl, extractMangaId } from '../utils/sanitize.js';
import { fetchWithRetry } from '../utils/http.js';

export function parseDetailsHtml(
  html: string,
  mangaId: string,
  url: string,
  baseUrl: string = ASURA_BASE_URL
): MangaDetails {
  const $ = cheerio.load(html);

  // Title
  const title =
    cleanText($('div.text-center h3, h1, h2.font-bold').first().text()) ||
    mangaId.replace(/-/g, ' ');

  // Cover image
  const imgEl = $('img[alt*="poster"], img[alt*="cover"], img.rounded-md, div.thumb img').first();
  let image = imgEl.attr('src') || imgEl.attr('data-src') || '';
  if (image && image.includes(' ')) {
    image = image.split(' ')[0];
  }
  const fullImage = ensureAbsoluteUrl(image, baseUrl);

  // Synopsis
  const synopsisEl = $('span.font-medium.text-sm, div.entry-content, div.synopsis, p.text-sm').first();
  const synopsis = cleanText(synopsisEl.text());

  // Status
  let status: MangaDetails['status'] = 'Unknown';
  const statusText = $('div:contains("Status"), span:contains("Status"), div.imptdt:contains("Status")')
    .text()
    .toLowerCase();

  if (statusText.includes('ongoing')) {
    status = 'Ongoing';
  } else if (statusText.includes('completed')) {
    status = 'Completed';
  } else if (statusText.includes('hiatus')) {
    status = 'Hiatus';
  } else if (statusText.includes('dropped')) {
    status = 'Dropped';
  }

  // Genres
  const genres: string[] = [];
  $('div.flex.flex-wrap.gap-1 button, span.mgen a, a[href*="/genres/"], div.genres-content a').each(
    (_, el) => {
      const g = cleanText($(el).text());
      if (g && !genres.includes(g)) {
        genres.push(g);
      }
    }
  );

  // Rating
  const ratingEl = $('div.text-xl.font-bold, div.num, span[itemprop="ratingValue"]').first();
  const rating = cleanText(ratingEl.text()) || undefined;

  // Type (Manhwa, Manga, Manhua)
  const typeText = $('div:contains("Type"), span:contains("Type")').text();
  const typeMatch = typeText.match(/Type\s*:\s*([A-Za-z]+)/i);
  const type = typeMatch ? typeMatch[1].trim() : undefined;

  return {
    id: mangaId,
    title,
    url,
    image: fullImage,
    synopsis,
    status,
    genres,
    rating,
    type,
  };
}

export async function getMangaDetails(
  mangaId: string,
  baseUrl: string = ASURA_BASE_URL
): Promise<MangaDetails> {
  const url = mangaId.startsWith('http://') || mangaId.startsWith('https://')
    ? mangaId
    : `${baseUrl}${SELECTORS.endpoints.series}${mangaId}`;

  const cleanId = extractMangaId(url) || mangaId;

  try {
    const html = await fetchWithRetry(url, { referer: baseUrl });
    return parseDetailsHtml(html, cleanId, url, baseUrl);
  } catch (error: any) {
    console.error(`[AsuraScansProvider] Failed to fetch details for "${mangaId}":`, error?.message || error);
    return {
      id: cleanId,
      title: cleanId.replace(/-/g, ' '),
      url,
      image: '',
      synopsis: '',
      status: 'Unknown',
      genres: [],
    };
  }
}
