/// <reference path="./manga-provider.d.ts" />
/// <reference path="./core.d.ts" />

/**
 * Seanime Comick Manga Provider (comick.io API)
 */
class Provider {
  private readonly baseUrl = 'https://comick.io';
  private readonly apiUrl = 'https://api.comick.fun';

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://comick.io/',
  };

  getSettings(): Settings {
    return {
      supportsMultiLanguage: true,
      supportsMultiScanlator: true,
    };
  }

  async search(opts: QueryOptions): Promise<SearchResult[]> {
    const query = typeof opts === 'string' ? opts : opts?.query || '';
    if (!query || query.trim() === '') return [];

    try {
      const url = `${this.apiUrl}/v1.0/search?q=${encodeURIComponent(query.trim())}&limit=20`;
      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return [];

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        id: item.hid || item.slug,
        title: item.title || item.slug,
        image: item.md_covers && item.md_covers[0]
          ? `https://meo.comick.pictures/${item.md_covers[0].b2key}`
          : undefined,
      }));
    } catch (err) {
      console.error('[Comick] Search error:', err);
      return [];
    }
  }

  async findChapters(mangaId: string): Promise<ChapterDetails[]> {
    if (!mangaId) return [];

    try {
      const url = `${this.apiUrl}/comic/${encodeURIComponent(mangaId)}/chapters?limit=1000&lang=en`;
      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return [];

      const data = await res.json();
      const chaptersList = data.chapters || [];
      const chapters: ChapterDetails[] = [];

      chaptersList.forEach((ch: any, idx: number) => {
        const chapterNum = ch.chap || '0';
        chapters.push({
          id: ch.hid,
          url: `${this.baseUrl}/comic/${mangaId}/${ch.hid}-chapter-${chapterNum}-en`,
          title: ch.title ? `Chapter ${chapterNum} - ${ch.title}` : `Chapter ${chapterNum}`,
          chapter: chapterNum,
          index: idx,
          scanlator: ch.group_name && ch.group_name[0] ? ch.group_name[0] : 'Comick',
          updatedAt: ch.updated_at || ch.created_at,
        });
      });

      // Sort ascending
      chapters.sort((a, b) => {
        const numA = parseFloat(a.chapter) || 0;
        const numB = parseFloat(b.chapter) || 0;
        return numA - numB;
      });

      chapters.forEach((ch, idx) => {
        ch.index = idx;
      });

      return chapters;
    } catch (err) {
      console.error('[Comick] findChapters error:', err);
      return [];
    }
  }

  async findChapterPages(chapterId: string): Promise<ChapterPage[]> {
    if (!chapterId) return [];

    try {
      const url = `${this.apiUrl}/chapter/${encodeURIComponent(chapterId)}`;
      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return [];

      const data = await res.json();
      const images = data.chapter?.md_images || [];

      return images.map((img: any, idx: number) => ({
        index: idx,
        url: `https://meo.comick.pictures/${img.b2key}`,
        headers: {
          Referer: 'https://comick.io/',
          'User-Agent': this.headers['User-Agent'],
        },
      }));
    } catch (err) {
      console.error('[Comick] findChapterPages error:', err);
      return [];
    }
  }
}
