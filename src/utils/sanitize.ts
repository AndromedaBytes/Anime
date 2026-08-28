/**
 * Sanitization & Normalization Utilities
 */

/**
 * Extracts a numeric float from chapter titles (e.g. "Chapter 10.5", "Ch. 99", "Episode 1")
 */
export function extractChapterNumber(input: string): number {
  if (!input) return 0;
  
  // Look for chapter patterns like "Chapter 123", "Ch. 123.5", "#123"
  const match = input.match(/(?:chapter|ch\.?|ep\.?|episode|#)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (match && match[1]) {
    const parsed = parseFloat(match[1]);
    if (!isNaN(parsed)) return parsed;
  }

  // Fallback: search for first floating number in string
  const rawNumMatch = input.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (rawNumMatch && rawNumMatch[1]) {
    const parsed = parseFloat(rawNumMatch[1]);
    if (!isNaN(parsed)) return parsed;
  }

  return 0;
}

/**
 * Clean up text content by removing excess whitespace, line breaks, and tabs
 */
export function cleanText(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

/**
 * Ensures a URL is absolute with scheme
 */
export function ensureAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Extract clean manga slug or ID from URL (supports both /comics/ and /series/)
 */
export function extractMangaId(url: string): string {
  if (!url) return '';
  const clean = url.replace(/https?:\/\/[^/]+/i, '');
  const match = clean.match(/\/(?:comics|series)\/([^/?#]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  const segments = clean.split('/').filter(Boolean);
  return segments[segments.length - 1] || url;
}

/**
 * Extract clean chapter ID from URL
 */
export function extractChapterId(url: string): string {
  if (!url) return '';
  const clean = url.replace(/https?:\/\/[^/]+/i, '');
  const match = clean.match(/\/(?:comics|series)\/([^/]+)\/chapter\/([^/?#]+)/i);
  if (match && match[1] && match[2]) {
    return `${match[1]}--chapter--${match[2]}`;
  }
  return clean.replace(/^\/+|\/+$/g, '').replace(/\//g, '--');
}

/**
 * Reconstruct chapter URL from chapter ID
 */
export function reconstructChapterUrl(chapterId: string, baseUrl: string): string {
  if (chapterId.startsWith('http://') || chapterId.startsWith('https://')) {
    return chapterId;
  }
  if (chapterId.includes('--chapter--')) {
    const [series, chapter] = chapterId.split('--chapter--');
    return `${baseUrl}/comics/${series}/chapter/${chapter}`;
  }
  if (chapterId.includes('--')) {
    const path = chapterId.split('--').join('/');
    return `${baseUrl}/${path}`;
  }
  return `${baseUrl}/comics/${chapterId}`;
}
