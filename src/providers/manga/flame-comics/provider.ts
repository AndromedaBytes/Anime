/// <reference path="./manga-provider.d.ts" />
/// <reference path="./core.d.ts" />

/**
 * Seanime Flame Comics Manga Provider (flamecomics.xyz)
 */
class Provider {
  private readonly baseUrl = 'https://flamecomics.xyz';

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Referer': 'https://flamecomics.xyz/',
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

  private extractChapterNumber(str: string): number {
    const match = str.match(/(?:chapter|ch\.?|ep\.?)\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (match && match[1]) return parseFloat(match[1]);
    const num = str.match(/([0-9]+(?:\.[0-9]+)?)/);
    return num && num[1] ? parseFloat(num[1]) : 0;
  }

  async search(opts: QueryOptions): Promise<SearchResult[]> {
    const query = typeof opts === 'string' ? opts : opts?.query || '';
    if (!query || query.trim() === '') return [];

    try {
      const url = `${this.baseUrl}/series?search=${encodeURIComponent(query.trim())}`;
      const html = await this.fetchHtml(url);
      const results: SearchResult[] = [];
      const seenIds = new Set<string>();

      const cardRegex = /<a[^>]+href="(\/series\/([^"#?]+))"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;

      while ((match = cardRegex.exec(html)) !== null) {
        const path = match[1];
        const id = match[2];
        const blockHtml = match[3];

        if (id.includes('/chapter/') || seenIds.has(id)) continue;
        seenIds.add(id);

        const imgMatch = blockHtml.match(/<img[^>]+(?:src|data-src)="([^">]+)"/i);
        let image = imgMatch ? imgMatch[1] : undefined;
        if (image && image.startsWith('/')) image = `${this.baseUrl}${image}`;

        const titleMatch = blockHtml.match(/<(?:h[234]|span|div)[^>]*class="[^"]*(?:title|font-bold)[^"]*"[^>]*>([\s\S]*?)<\/(?:h[234]|span|div)>/i);
        const title = titleMatch ? this.cleanText(titleMatch[1]) : id.replace(/-/g, ' ');

        results.push({
          id,
          title,
          image,
        });
      }

      return results;
    } catch (err) {
      console.error('[FlameComics] Search error:', err);
      return [];
    }
  }

  async findChapters(mangaId: string): Promise<ChapterDetails[]> {
    if (!mangaId) return [];

    try {
      const url = `${this.baseUrl}/series/${encodeURIComponent(mangaId)}`;
      const html = await this.fetchHtml(url);
      const chapters: ChapterDetails[] = [];
      const seenUrls = new Set<string>();

      const linkRegex = /<a[^>]+href="(\/series\/[^/]+\/chapter\/([^"#?]+))"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;

      while ((match = linkRegex.exec(html)) !== null) {
        const path = match[1];
        const chapterSlug = match[2];
        const blockHtml = match[3];

        const fullUrl = `${this.baseUrl}${path}`;
        if (seenUrls.has(fullUrl)) continue;
        seenUrls.add(fullUrl);

        const rawText = this.cleanText(blockHtml);
        const chapterNum = this.extractChapterNumber(rawText || chapterSlug);

        chapters.push({
          id: `${mangaId}--chapter--${chapterSlug}`,
          url: fullUrl,
          title: rawText || `Chapter ${chapterNum}`,
          chapter: chapterNum.toString(),
          index: 0,
          scanlator: 'Flame Comics',
        });
      }

      chapters.sort((a, b) => (parseFloat(a.chapter) || 0) - (parseFloat(b.chapter) || 0));
      chapters.forEach((ch, idx) => {
        ch.index = idx;
      });

      return chapters;
    } catch (err) {
      console.error('[FlameComics] findChapters error:', err);
      return [];
    }
  }

  async findChapterPages(chapterId: string): Promise<ChapterPage[]> {
    if (!chapterId) return [];

    let chapterUrl = chapterId;
    if (!chapterUrl.startsWith('http')) {
      if (chapterId.includes('--chapter--')) {
        const [manga, ch] = chapterId.split('--chapter--');
        chapterUrl = `${this.baseUrl}/series/${manga}/chapter/${ch}`;
      } else {
        chapterUrl = `${this.baseUrl}/series/${chapterId}`;
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
        let src = match[1];
        if (!src || src.includes('discord') || src.includes('banner') || src.includes('credit')) continue;
        if (src.startsWith('/')) src = `${this.baseUrl}${src}`;

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
      console.error('[FlameComics] findChapterPages error:', err);
      return [];
    }
  }
}
