/**
 * Seanime Manga Provider Types & Contract Definitions
 */
interface ProviderSettings {
    supportsMultiLanguage: boolean;
    supportsMultiScanlator: boolean;
}
interface SearchQueryOptions {
    query: string;
    dub?: boolean;
    year?: number;
}
interface MangaSearchResult {
    id: string;
    title: string;
    url: string;
    image: string;
    rating?: string;
    latestChapter?: string;
    synopsis?: string;
}
interface MangaDetails {
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
interface MangaChapter {
    id: string;
    url: string;
    title: string;
    chapter: string;
    chapterNumber: number;
    rating?: string;
    updatedAt?: string;
    scanlator?: string;
}
interface PageImage {
    index: number;
    url: string;
    headers?: Record<string, string>;
    alt?: string;
}
/**
 * Standard Seanime Manga Provider Class Interface
 */
interface SeanimeMangaProvider {
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
interface MarketplacePlugin {
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
interface MarketplaceManifest {
    name: string;
    description: string;
    manifestVersion: string;
    plugins: MarketplacePlugin[];
}
/**
 * Selectors Configuration Map for resilient DOM extraction
 */
interface SelectorConfig {
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

declare const ASURA_BASE_URL = "https://asurascans.com";
declare const ASURA_FALLBACK_URL = "https://asuracomic.net";
declare const SELECTORS: SelectorConfig;

/**
 * Sanitization & Normalization Utilities
 */
/**
 * Extracts a numeric float from chapter titles (e.g. "Chapter 10.5", "Ch. 99", "Episode 1")
 */
declare function extractChapterNumber(input: string): number;
/**
 * Clean up text content by removing excess whitespace, line breaks, and tabs
 */
declare function cleanText(text?: string | null): string;
/**
 * Ensures a URL is absolute with scheme
 */
declare function ensureAbsoluteUrl(url: string, baseUrl: string): string;
/**
 * Extract clean manga slug or ID from URL (supports both /comics/ and /series/)
 */
declare function extractMangaId(url: string): string;
/**
 * Extract clean chapter ID from URL
 */
declare function extractChapterId(url: string): string;
/**
 * Reconstruct chapter URL from chapter ID
 */
declare function reconstructChapterUrl(chapterId: string, baseUrl: string): string;

interface RequestOptions extends RequestInit {
    retries?: number;
    backoffMs?: number;
    timeoutMs?: number;
    referer?: string;
}
declare const DEFAULT_HEADERS: Record<string, string>;
/**
 * Robust HTTP request helper with retry and header injection
 */
declare function fetchWithRetry(url: string, options?: RequestOptions): Promise<string>;

declare function parseSearchHtml(html: string, baseUrl?: string): Promise<MangaSearchResult[]>;
declare function searchManga(opts: SearchQueryOptions | string, baseUrl?: string): Promise<MangaSearchResult[]>;

declare function parseDetailsHtml(html: string, mangaId: string, url: string, baseUrl?: string): MangaDetails;
declare function getMangaDetails(mangaId: string, baseUrl?: string): Promise<MangaDetails>;

declare function parseChaptersHtml(html: string, baseUrl?: string): MangaChapter[];
declare function getMangaChapters(mangaId: string, baseUrl?: string): Promise<MangaChapter[]>;

declare function parseReaderHtml(html: string, baseUrl?: string): PageImage[];
declare function getChapterPages(chapterId: string, baseUrl?: string): Promise<PageImage[]>;

declare class Provider implements SeanimeMangaProvider {
    private baseUrl;
    constructor(customBaseUrl?: string);
    /**
     * Returns provider capabilities
     */
    getSettings(): ProviderSettings;
    /**
     * Search for manga matching a query title
     */
    search(opts: SearchQueryOptions | string): Promise<MangaSearchResult[]>;
    /**
     * Get metadata and details for a specific manga
     */
    getDetails(mangaId: string): Promise<MangaDetails>;
    /**
     * Seanime standard method: Extract chapters list in ascending order
     */
    findChapters(mangaId: string): Promise<MangaChapter[]>;
    /**
     * Alias method for findChapters
     */
    getChapters(mangaId: string): Promise<MangaChapter[]>;
    /**
     * Seanime standard method: Extract chapter reader page images
     */
    findChapterPages(chapterId: string): Promise<PageImage[]>;
    /**
     * Alias method for findChapterPages
     */
    getChapterPages(chapterId: string): Promise<PageImage[]>;
}

export { ASURA_BASE_URL, ASURA_FALLBACK_URL, DEFAULT_HEADERS, type MangaChapter, type MangaDetails, type MangaSearchResult, type MarketplaceManifest, type MarketplacePlugin, type PageImage, Provider, type ProviderSettings, type RequestOptions, SELECTORS, type SeanimeMangaProvider, type SearchQueryOptions, type SelectorConfig, cleanText, Provider as default, ensureAbsoluteUrl, extractChapterId, extractChapterNumber, extractMangaId, fetchWithRetry, getChapterPages, getMangaChapters, getMangaDetails, parseChaptersHtml, parseDetailsHtml, parseReaderHtml, parseSearchHtml, reconstructChapterUrl, searchManga };
