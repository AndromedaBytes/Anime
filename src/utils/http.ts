import { ASURA_BASE_URL } from '../config/selectors.js';

export interface RequestOptions extends RequestInit {
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
  referer?: string;
}

export const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

/**
 * Robust HTTP request helper with retry and header injection
 */
export async function fetchWithRetry(
  url: string,
  options: RequestOptions = {}
): Promise<string> {
  const {
    retries = 3,
    backoffMs = 800,
    timeoutMs = 15000,
    referer = ASURA_BASE_URL,
    headers = {},
    ...fetchOpts
  } = options;

  const mergedHeaders: Record<string, string> = {
    ...DEFAULT_HEADERS,
    Referer: referer,
    Origin: referer,
    ...(headers as Record<string, string>),
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOpts,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Retry on rate limits (429) or transient server errors (502, 503, 504)
        if ([429, 502, 503, 504].includes(response.status) && attempt < retries) {
          const delay = backoffMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`HTTP error status ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;

      if (attempt < retries) {
        const delay = backoffMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries} retries`);
}
