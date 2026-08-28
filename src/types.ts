/**
 * Seanime Manga Provider Types & Contract Definitions
 */

export interface ProviderSettings {
  supportsMultiLanguage: boolean;
  supportsMultiScanlator: boolean;
}

export interface SearchQueryOptions {
  query: string;
  dub?: boolean;
  year?: number;
}

export interface MangaSearchResult {
  id: string;
  title: string;
  url: string;
  image: string;
  rating?: string;
  latestChapter?: string;
  synopsis?: string;
}

export interface MangaDetails {
  id: string;
  title: string;
  altTitles?: string[];
  url: string;
  image: string;
  synopsis: string;
  status: 'Ongoing' | 'Completed' | 'Hiatus' | 'Dropped' | 'Unknown';
  authors?: string[];
  artists?: string[];
  genres: string[];
  rating?: string;
  releasedYear?: string;
  type?: string;
}

export interface MangaChapter {
  id: string;
  url: string;
  title: string;
  chapter: string;
  chapterNumber: number;
  rating?: string;
  updatedAt?: string;
  scanlator?: string;
}

export interface PageImage {
  index: number;
  url: string;
  headers?: Record<string, string>;
  alt?: string;
}

/**
 * Standard Seanime Manga Provider Class Interface
 */
export interface SeanimeMangaProvider {
  getSettings(): ProviderSettings;
  search(opts: SearchQueryOptions | string): Promise<MangaSearchResult[]>;
  getDetails?(mangaId: string): Promise<MangaDetails>;
  findChapters(mangaId: string): Promise<MangaChapter[]>;
  getChapters?(mangaId: string): Promise<MangaChapter[]>;
  findChapterPages(chapterId: string): Promise<PageImage[]>;
  getChapterPages?(chapterId: string): Promise<PageImage[]>;
}

/**
 * Marketplace Manifest Item Schema
 */
export interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  type: 'manga-provider' | 'anime-torrent-provider' | 'onlinestream-provider' | 'plugin';
  author: string;
  description: string;
  icon: string;
  repository: string;
  manifestURI?: string;
  payloadURI?: string;
  entrypoint?: string;
  language?: 'typescript' | 'javascript';
  settings?: ProviderSettings;
}

export interface MarketplaceManifest {
  name: string;
  description: string;
  manifestVersion: string;
  plugins: MarketplacePlugin[];
}

/**
 * Selectors Configuration Map for resilient DOM extraction
 */
export interface SelectorConfig {
  baseUrl: string;
  endpoints: {
    search: string;
    series: string;
  };
  search: {
    container: string;
    card: string;
    title: string;
    link: string;
    image: string;
    rating?: string;
    latestChapter?: string;
  };
  details: {
    title: string;
    image: string;
    synopsis: string;
    status: string;
    genres: string;
    author?: string;
    artist?: string;
    rating?: string;
    type?: string;
  };
  chapters: {
    container: string;
    item: string;
    title: string;
    link: string;
    releaseDate: string;
  };
  reader: {
    container: string;
    images: string;
    adPatterns: RegExp[];
  };
}
