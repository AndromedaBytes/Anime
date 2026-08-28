import {
  MangaChapter,
  MangaDetails,
  MangaSearchResult,
  PageImage,
  ProviderSettings,
  SearchQueryOptions,
  SeanimeMangaProvider,
} from './types.js';
import { ASURA_BASE_URL } from './config/selectors.js';
import { searchManga } from './scrapers/search.js';
import { getMangaDetails } from './scrapers/details.js';
import { getMangaChapters } from './scrapers/chapters.js';
import { getChapterPages } from './scrapers/pages.js';

export * from './types.js';
export * from './config/selectors.js';
export * from './utils/sanitize.js';
export * from './utils/http.js';
export * from './scrapers/search.js';
export * from './scrapers/details.js';
export * from './scrapers/chapters.js';
export * from './scrapers/pages.js';

export class Provider implements SeanimeMangaProvider {
  private baseUrl: string;

  constructor(customBaseUrl?: string) {
    this.baseUrl = customBaseUrl || ASURA_BASE_URL;
  }

  /**
   * Returns provider capabilities
   */
  getSettings(): ProviderSettings {
    return {
      supportsMultiLanguage: false,
      supportsMultiScanlator: false,
    };
  }

  /**
   * Search for manga matching a query title
   */
  async search(opts: SearchQueryOptions | string): Promise<MangaSearchResult[]> {
    return searchManga(opts, this.baseUrl);
  }

  /**
   * Get metadata and details for a specific manga
   */
  async getDetails(mangaId: string): Promise<MangaDetails> {
    return getMangaDetails(mangaId, this.baseUrl);
  }

  /**
   * Seanime standard method: Extract chapters list in ascending order
   */
  async findChapters(mangaId: string): Promise<MangaChapter[]> {
    return getMangaChapters(mangaId, this.baseUrl);
  }

  /**
   * Alias method for findChapters
   */
  async getChapters(mangaId: string): Promise<MangaChapter[]> {
    return this.findChapters(mangaId);
  }

  /**
   * Seanime standard method: Extract chapter reader page images
   */
  async findChapterPages(chapterId: string): Promise<PageImage[]> {
    return getChapterPages(chapterId, this.baseUrl);
  }

  /**
   * Alias method for findChapterPages
   */
  async getChapterPages(chapterId: string): Promise<PageImage[]> {
    return this.findChapterPages(chapterId);
  }
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).Provider = Provider;
}

export default Provider;
