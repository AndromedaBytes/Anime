/// <reference path="./onlinestream-provider.d.ts" />
/// <reference path="./core.d.ts" />

/**
 * Seanime Gogoanime Online Streaming Provider
 */
class Provider {
  private readonly baseUrl = 'https://anitaku.to';
  private readonly fallbackUrl = 'https://gogoanime3.co';

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Referer': 'https://anitaku.to/',
  };

  getSettings(): Settings {
    return {
      supportsDub: true,
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

  async search(opts: AnimeSearchOptions): Promise<AnimeSearchResult[]> {
    const query = typeof opts === 'string' ? opts : opts?.query || '';
    if (!query.trim()) return [];

    try {
      const url = `${this.baseUrl}/search.html?keyword=${encodeURIComponent(query.trim())}`;
      const html = await this.fetchHtml(url);
      const results: AnimeSearchResult[] = [];

      const cardRegex = /<li[^>]*>[\s\S]*?<div class="img">[\s\S]*?<a href="\/category\/([^"]+)"[^>]*title="([^"]+)"[\s\S]*?<img src="([^"]+)"[\s\S]*?<\/li>/gi;
      let match;

      while ((match = cardRegex.exec(html)) !== null) {
        const id = match[1];
        const title = this.cleanText(match[2]);
        const image = match[3];

        results.push({
          id,
          title,
          image,
          url: `${this.baseUrl}/category/${id}`,
        });
      }

      return results;
    } catch (err) {
      console.error('[Gogoanime] Search error:', err);
      return [];
    }
  }

  async findEpisodes(animeId: string): Promise<EpisodeDetails[]> {
    if (!animeId) return [];

    try {
      const url = `${this.baseUrl}/category/${encodeURIComponent(animeId)}`;
      const html = await this.fetchHtml(url);
      const episodes: EpisodeDetails[] = [];

      const movieMatch = html.match(/id="movie_id" value="([^"]+)"/i);
      const defaultEpMatch = html.match(/id="default_ep" value="([^"]+)"/i);
      const aliasMatch = html.match(/id="alias_anime" value="([^"]+)"/i);

      if (!movieMatch) return [];

      const epListUrl = `https://ajax.gogocdn.net/ajax/load-list-episode?ep_start=0&ep_end=9999&id=${movieMatch[1]}&default_ep=${defaultEpMatch ? defaultEpMatch[1] : '0'}&alias=${aliasMatch ? aliasMatch[1] : animeId}`;
      const epHtml = await this.fetchHtml(epListUrl);

      const epRegex = /<a href="\/([^"]+)"[\s\S]*?<div class="name">[\s\S]*?EP\s*([0-9.]+)/gi;
      let match;

      while ((match = epRegex.exec(epHtml)) !== null) {
        const path = match[1].trim();
        const epNum = parseFloat(match[2]) || 1;

        episodes.push({
          id: path,
          number: epNum,
          title: `Episode ${epNum}`,
          url: `${this.baseUrl}/${path}`,
        });
      }

      episodes.sort((a, b) => a.number - b.number);
      return episodes;
    } catch (err) {
      console.error('[Gogoanime] findEpisodes error:', err);
      return [];
    }
  }

  async findEpisodeServer(episodeId: string): Promise<VideoSource[]> {
    if (!episodeId) return [];

    try {
      const url = `${this.baseUrl}/${encodeURIComponent(episodeId)}`;
      const html = await this.fetchHtml(url);

      const iframeMatch = html.match(/<iframe[^>]+src="([^"]+)"/i);
      if (!iframeMatch) return [];

      let iframeUrl = iframeMatch[1];
      if (iframeUrl.startsWith('//')) iframeUrl = `https:${iframeUrl}`;

      return [
        {
          url: iframeUrl,
          type: 'iframe',
          quality: 'auto',
          headers: {
            Referer: this.baseUrl,
          },
        },
      ];
    } catch (err) {
      console.error('[Gogoanime] findEpisodeServer error:', err);
      return [];
    }
  }
}
