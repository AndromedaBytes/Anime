/// <reference path="./anime-torrent-provider.d.ts" />
/// <reference path="./core.d.ts" />

/**
 * Seanime Nyaa Anime Torrent Provider (nyaa.si RSS & Search)
 */
class Provider {
  private readonly baseUrl = 'https://nyaa.si';

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept': 'application/xml, text/xml, */*',
  };

  getSettings(): Settings {
    return {
      canSearch: true,
    };
  }

  private cleanText(str?: string | null): string {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  async search(opts: AnimeTorrentQueryOptions): Promise<AnimeTorrentSearchResult[]> {
    const query = opts.query || '';
    if (!query.trim()) return [];

    try {
      const url = `${this.baseUrl}/?page=rss&q=${encodeURIComponent(query.trim())}&c=1_2&f=0`;
      const res = await fetch(url, { headers: this.headers });
      if (!res.ok) return [];

      const xml = await res.text();
      const results: AnimeTorrentSearchResult[] = [];

      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;

      while ((match = itemRegex.exec(xml)) !== null) {
        const itemBlock = match[1];

        const titleMatch = itemBlock.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = itemBlock.match(/<link>([\s\S]*?)<\/link>/i);
        const guidMatch = itemBlock.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
        const seedersMatch = itemBlock.match(/<nyaa:seeders>([0-9]+)<\/nyaa:seeders>/i);
        const leechersMatch = itemBlock.match(/<nyaa:leechers>([0-9]+)<\/nyaa:leechers>/i);
        const downloadsMatch = itemBlock.match(/<nyaa:downloads>([0-9]+)<\/nyaa:downloads>/i);
        const sizeMatch = itemBlock.match(/<nyaa:size>([\s\S]*?)<\/nyaa:size>/i);
        const dateMatch = itemBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

        if (!titleMatch) continue;

        const title = this.cleanText(titleMatch[1]);
        const link = linkMatch ? this.cleanText(linkMatch[1]) : '';
        const guid = guidMatch ? this.cleanText(guidMatch[1]) : link;
        const seeders = seedersMatch ? parseInt(seedersMatch[1], 10) : 0;
        const leechers = leechersMatch ? parseInt(leechersMatch[1], 10) : 0;
        const downloads = downloadsMatch ? parseInt(downloadsMatch[1], 10) : 0;
        const size = sizeMatch ? this.cleanText(sizeMatch[1]) : '';
        const formattedDate = dateMatch ? this.cleanText(dateMatch[1]) : '';

        results.push({
          id: guid || link,
          name: title,
          link: link,
          seeders: seeders,
          leechers: leechers,
          downloads: downloads,
          size: size,
          date: formattedDate,
        });
      }

      return results;
    } catch (err) {
      console.error('[Nyaa] Search error:', err);
      return [];
    }
  }

  async getTorrentInfo(torrentId: string): Promise<AnimeTorrentDetails> {
    return {
      id: torrentId,
      link: torrentId,
    };
  }
}
