/// <reference path="./manga-provider.d.ts" />
/// <reference path="./core.d.ts" />

/**
 * Seanime Asura Scans Manga Provider
 * Supports search, series metadata, ascending chapter list, and reader page extraction.
 */
class Provider {
  private readonly baseUrl = 'https://asurascans.com';
  private readonly fallbackUrl = 'https://asuracomic.net';

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://asurascans.com/',
  };

  /**
   * Extension Capabilities
   */
  getSettings(): Settings {
    return {
      supportsMultiLanguage: false,
      supportsMultiScanlator: false,
    };
  }

  // ============================================================
  // Helpers
  // ============================================================

  private async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        ...this.headers,
        Referer: this.baseUrl + '/',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${url} (status: ${res.status})`);
    }

    return await res.text();
  }

  private cleanText(str?: string | null): string {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractChapterNumber(str: string): number {
    if (!str) return 0;
    const match = str.match(/(?:chapter|ch\.?|ep\.?|episode|#)\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed)) return parsed;
    }
    const fallback = str.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (fallback && fallback[1]) {
      const parsed = parseFloat(fallback[1]);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  }

  private extractMangaId(url: string): string {
    if (!url) return '';
    const clean = url.replace(/https?:\/\/[^/]+/i, '');
    const match = clean.match(/\/(?:comics|series)\/([^/?#]+)/i);
    if (match && match[1]) {
      return match[1];
    }
    const parts = clean.split('/').filter(Boolean);
    return parts[parts.length - 1] || url;
  }

  // ============================================================
  // Provider Methods
  // ============================================================

  /**
   * Search for manga matching query title
   */
  async search(opts: QueryOptions): Promise<SearchResult[]> {
    const query = typeof opts === 'string' ? opts : opts?.query || '';
    if (!query || query.trim() === '') return [];

    const encoded = encodeURIComponent(query.trim());
    const searchUrls = [
      `${this.baseUrl}/browse?search=${encoded}`,
      `${this.baseUrl}/browse/comics?search=${encoded}`,
      `${this.fallbackUrl}/browse?search=${encoded}`,
    ];

    for (const searchUrl of searchUrls) {
      try {
        const html = await this.fetchHtml(searchUrl);
        const results: SearchResult[] = [];
        const seenIds = new Set<string>();

        // Match comic link blocks in Astro browse page
        const comicRegex = /<a[^>]+href="(\/(?:comics|series)\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;

        while ((match = comicRegex.exec(html)) !== null) {
          const href = match[1];
          if (href.includes('/chapter/')) continue;

          const mangaId = this.extractMangaId(href);
          if (!mangaId || seenIds.has(mangaId)) continue;

          const blockHtml = match[2];

          // Extract image
          const imgMatch = blockHtml.match(/<img[^>]+(?:src|data-src)="([^">]+)"/i);
          let image = imgMatch ? imgMatch[1] : '';
          if (image.startsWith('/')) image = `${this.baseUrl}${image}`;

          // Extract title (h3, span or fallback)
          let title = '';
          const titleMatch = blockHtml.match(/<(?:h[234]|span|div)[^>]*class="[^"]*(?:font-bold|title)[^"]*"[^>]*>([\s\S]*?)<\/(?:h[234]|span|div)>/i);
          if (titleMatch) {
            title = this.cleanText(titleMatch[1].replace(/<[^>]+>/g, ''));
          } else {
            const raw = this.cleanText(blockHtml.replace(/<[^>]+>/g, ''));
            title = raw.replace(/^[0-9]\.[0-9]\s*/, '').trim();
          }

          if (!title) {
            title = mangaId.replace(/-[a-z0-9]+$/, '').replace(/-/g, ' ');
          }

          seenIds.add(mangaId);

          results.push({
            id: mangaId,
            title: title,
            image: image || undefined,
          });
        }

        if (results.length > 0) {
          return results;
        }
      } catch (err) {
        console.error(`[AsuraScans] Search error on ${searchUrl}:`, err);
      }
    }

    return [];
  }

  /**
   * Retrieve all chapters in ascending order (Ch 1 -> Ch 68)
   */
  async findChapters(mangaId: string): Promise<ChapterDetails[]> {
    if (!mangaId) return [];

    const url = mangaId.startsWith('http')
      ? mangaId
      : `${this.baseUrl}/comics/${mangaId}`;

    try {
      const html = await this.fetchHtml(url);
      const chapters: ChapterDetails[] = [];
      const seenUrls = new Set<string>();

      // Extract all chapter links
      const linkRegex = /<a[^>]+href="(\/(?:comics|series)\/[^/]+\/chapter\/([^"#?]+))"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;

      while ((match = linkRegex.exec(html)) !== null) {
        const path = match[1];
        const chapterSlug = match[2];
        const blockHtml = match[3];

        const fullUrl = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
        if (seenUrls.has(fullUrl)) continue;
        seenUrls.add(fullUrl);

        const rawText = this.cleanText(blockHtml.replace(/<[^>]+>/g, ''));
        
        let chapterNum = this.extractChapterNumber(rawText);
        if (chapterNum === 0) {
          chapterNum = this.extractChapterNumber(chapterSlug);
        }

        let title = rawText;
        if (rawText.toLowerCase().includes('first chapter') || !rawText) {
          title = `Chapter ${chapterNum}`;
        }

        const dateMatch = blockHtml.match(/<(?:span|time|h3)[^>]*class="[^"]*(?:date|text-xs|muted)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|time|h3)>/i);
        const updatedAt = dateMatch ? this.cleanText(dateMatch[1].replace(/<[^>]+>/g, '')) : undefined;

        chapters.push({
          id: `${mangaId}--chapter--${chapterSlug}`,
          url: fullUrl,
          title: title,
          chapter: chapterNum.toString(),
          index: 0,
          updatedAt: updatedAt,
          scanlator: 'Asura Scans',
        });
      }

      // Deduplicate by chapter number
      const deduplicated = new Map<string, ChapterDetails>();
      for (const ch of chapters) {
        const existing = deduplicated.get(ch.chapter);
        if (!existing || (!existing.title.toLowerCase().startsWith('chapter') && ch.title.toLowerCase().startsWith('chapter'))) {
          deduplicated.set(ch.chapter, ch);
        }
      }

      const sorted = Array.from(deduplicated.values());

      // Sort ascending (e.g. Ch 1, Ch 2, Ch 10.5, Ch 68)
      sorted.sort((a, b) => {
        const numA = parseFloat(a.chapter) || 0;
        const numB = parseFloat(b.chapter) || 0;
        return numA - numB;
      });

      // Set sequential index
      sorted.forEach((ch, idx) => {
        ch.index = idx;
      });

      return sorted;
    } catch (err) {
      console.error(`[AsuraScans] findChapters error for ${mangaId}:`, err);
      return [];
    }
  }

  /**
   * Extract reader image stream with anti-hotlinking headers
   */
  async findChapterPages(chapterId: string): Promise<ChapterPage[]> {
    if (!chapterId) return [];

    let chapterUrl = chapterId;
    if (!chapterUrl.startsWith('http')) {
      if (chapterId.includes('--chapter--')) {
        const [manga, ch] = chapterId.split('--chapter--');
        chapterUrl = `${this.baseUrl}/comics/${manga}/chapter/${ch}`;
      } else {
        chapterUrl = `${this.baseUrl}/comics/${chapterId}`;
      }
    }

    try {
      const html = await this.fetchHtml(chapterUrl);
      const pages: ChapterPage[] = [];
      const seenUrls = new Set<string>();

      const imgRegex = /<img[^>]+(?:src|data-src)="([^">]+)"[^>]*>/gi;
      let match;
      let pageIndex = 0;

      while ((match = imgRegex.exec(html)) !== null) {
        const imgTag = match[0];
        let src = match[1];

        if (!src) continue;
        if (src.includes(' ')) src = src.split(' ')[0];

        if (src.startsWith('/')) {
          src = `${this.baseUrl}${src}`;
        }

        if (seenUrls.has(src)) continue;

        // Ad and banner filter patterns
        if (/discord|banner|promo|watermark|patreon|donation|credit|asura_logo|asura_ad|covers/i.test(src)) {
          continue;
        }
        if (/discord|banner|promo|watermark|patreon|donation|credit|covers/i.test(imgTag)) {
          continue;
        }

        // Only include chapter page images
        if (!src.includes('chapters') && !imgTag.includes('Page') && !imgTag.includes('Chapter')) {
          continue;
        }

        seenUrls.add(src);

        pages.push({
          index: pageIndex++,
          url: src,
          headers: {
            Referer: 'https://asurascans.com/',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          },
        });
      }

      return pages;
    } catch (err) {
      console.error(`[AsuraScans] findChapterPages error for ${chapterId}:`, err);
      return [];
    }
  }
}
