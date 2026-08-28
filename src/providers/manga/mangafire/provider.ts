/// <reference path="./manga-provider.d.ts" />
/// <reference path="./core.d.ts" />

/**
 * Seanime MangaFire Manga Provider (mangafire.to)
 */
class Provider {
  private readonly baseUrl = 'https://mangafire.to';

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Referer': 'https://mangafire.to/',
  };

  getSettings(): Settings {
    return {
      supportsMultiLanguage: false,
      supportsMultiScanlator: false,
    };
  }

  private async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.text();
  }

  private cleanText(str?: string | null): string {
    if (!str) return '';
    return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  async search(opts: QueryOptions): Promise<SearchResult[]> {
    const query = typeof opts === 'string' ? opts : opts?.query || '';
    if (!query || query.trim() === '') return [];

    try {
      const url = `${this.baseUrl}/filter?keyword=${encodeURIComponent(query.trim())}`;
      const html = await this.fetchHtml(url);
      const results: SearchResult[] = [];
      const seenIds = new Set<string>();

      const cardRegex = /<a[^>]+href="(\/manga\/([^"#?]+))"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;

      while ((match = cardRegex.exec(html)) !== null) {
        const path = match[1];
        const id = match[2];
        const blockHtml = match[3];

        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const imgMatch = blockHtml.match(/<img[^>]+(?:src|data-src)="([^">]+)"/i);
        let image = imgMatch ? imgMatch[1] : undefined;

        const titleMatch = blockHtml.match(/<(?:h[234]|span|div)[^>]*class="[^"]*(?:name|title)[^"]*"[^>]*>([\s\S]*?)<\/(?:h[234]|span|div)>/i);
        const title = titleMatch ? this.cleanText(titleMatch[1]) : id.replace(/-/g, ' ');

        results.push({
          id,
          title,
          image,
        });
      }

      return results;
    } catch (err) {
      console.error('[MangaFire] Search error:', err);
      return [];
    }
  }

  async findChapters(mangaId: string): Promise<ChapterDetails[]> {
    if (!mangaId) return [];

    try {
      const url = `${this.baseUrl}/manga/${encodeURIComponent(mangaId)}`;
      const html = await this.fetchHtml(url);
      const chapters: ChapterDetails[] = [];
      const seenUrls = new Set<string>();

      const linkRegex = /<a[^>]+href="(\/read\/[^/]+\/en\/chapter-([^"#?]+))"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;

      while ((match = linkRegex.exec(html)) !== null) {
        const path = match[1];
        const chapterNum = match[2];
        const blockHtml = match[3];

        const fullUrl = `${this.baseUrl}${path}`;
        if (seenUrls.has(fullUrl)) continue;
        seenUrls.add(fullUrl);

        const rawText = this.cleanText(blockHtml);

        chapters.push({
          id: `${mangaId}--chapter--${chapterNum}`,
          url: fullUrl,
          title: rawText || `Chapter ${chapterNum}`,
          chapter: chapterNum,
          index: 0,
          scanlator: 'MangaFire',
        });
      }

      chapters.sort((a, b) => (parseFloat(a.chapter) || 0) - (parseFloat(b.chapter) || 0));
      chapters.forEach((ch, idx) => {
        ch.index = idx;
      });

      return chapters;
    } catch (err) {
      console.error('[MangaFire] findChapters error:', err);
      return [];
    }
  }

  async findChapterPages(chapterId: string): Promise<ChapterPage[]> {
    if (!chapterId) return [];

    let chapterUrl = chapterId;
    if (!chapterUrl.startsWith('http')) {
      if (chapterId.includes('--chapter--')) {
        const [manga, ch] = chapterId.split('--chapter--');
        chapterUrl = `${this.baseUrl}/read/${manga}/en/chapter-${ch}`;
      } else {
        chapterUrl = `${this.baseUrl}/read/${chapterId}`;
      }
    }

    try {
      const html = await this.fetchHtml(chapterUrl);
      const pages: ChapterPage[] = [];
      const seenUrls = new Set<string>();

      const imgRegex = /<img[^>]+(?:src|data-src|data-url)="([^">]+)"[^>]*>/gi;
      let match;
      let pageIndex = 0;

      while ((match = imgRegex.exec(html)) !== null) {
        let src = match[1];
        if (!src || src.includes('logo') || src.includes('banner')) continue;

        if (seenUrls.has(src)) continue;
        seenUrls.add(src);

        pages.push({
          index: pageIndex++,
          url: src,
          headers: {
            Referer: `${this.baseUrl}/`,
            'User-Agent': this.headers['User-Agent'],
          },
        });
      }

      return pages;
    } catch (err) {
      console.error('[MangaFire] findChapterPages error:', err);
      return [];
    }
  }
}
