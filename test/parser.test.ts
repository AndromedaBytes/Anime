import { describe, it, expect } from 'vitest';
import { parseSearchHtml } from '../src/scrapers/search.js';
import { parseDetailsHtml } from '../src/scrapers/details.js';
import { parseChaptersHtml } from '../src/scrapers/chapters.js';
import { parseReaderHtml } from '../src/scrapers/pages.js';
import { extractChapterNumber, extractChapterId, extractMangaId } from '../src/utils/sanitize.js';
import { mockSearchHtml, mockDetailsHtml, mockChaptersHtml, mockReaderHtml } from './fixtures/mockHtml.js';
import Provider from '../src/index.js';

describe('Sanitization Utilities', () => {
  it('extracts integer and decimal chapter numbers accurately', () => {
    expect(extractChapterNumber('Chapter 10')).toBe(10);
    expect(extractChapterNumber('Chapter 10.5')).toBe(10.5);
    expect(extractChapterNumber('Ch. 99.2 Extra')).toBe(99.2);
    expect(extractChapterNumber('Episode 12')).toBe(12);
    expect(extractChapterNumber('#42')).toBe(42);
  });

  it('extracts manga and chapter IDs correctly', () => {
    expect(extractMangaId('https://asuracomic.net/series/solo-leveling-ragnarok-12345')).toBe('solo-leveling-ragnarok-12345');
    expect(extractChapterId('https://asuracomic.net/series/solo-leveling-ragnarok-12345/chapter/10.5')).toBe(
      'solo-leveling-ragnarok-12345--chapter--10.5'
    );
  });
});

describe('Scrapers & Parsers', () => {
  it('parses search results with titles, images, and URLs', async () => {
    const results = await parseSearchHtml(mockSearchHtml);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('solo-leveling-ragnarok-12345');
    expect(results[0].title).toBe('Solo Leveling: Ragnarok');
    expect(results[0].image).toBe('https://asuracomic.net/storage/media/123/cover.webp');
    expect(results[1].title).toBe('The Greatest Estate Developer');
  });

  it('parses manga details and metadata', () => {
    const details = parseDetailsHtml(mockDetailsHtml, 'solo-leveling-ragnarok-12345', 'https://asuracomic.net/series/solo-leveling-ragnarok-12345');
    expect(details.title).toBe('Solo Leveling: Ragnarok');
    expect(details.status).toBe('Ongoing');
    expect(details.type).toBe('Manhwa');
    expect(details.genres).toContain('Action');
    expect(details.genres).toContain('Fantasy');
    expect(details.synopsis).toContain('Earth\'s existence is threatened');
  });

  it('extracts and sorts chapters in ascending order (including 10.5)', () => {
    const chapters = parseChaptersHtml(mockChaptersHtml);
    expect(chapters).toHaveLength(4);
    // Ascending order: Ch 1, Ch 2, Ch 10.5, Ch 11
    expect(chapters[0].chapterNumber).toBe(1);
    expect(chapters[1].chapterNumber).toBe(2);
    expect(chapters[2].chapterNumber).toBe(10.5);
    expect(chapters[3].chapterNumber).toBe(11);
  });

  it('filters out ad/promo banners and extracts clean reader pages with headers', () => {
    const pages = parseReaderHtml(mockReaderHtml, 'https://asurascans.com');
    expect(pages).toHaveLength(3);
    expect(pages[0].url).toBe('https://asuracomic.net/storage/media/123/01.webp');
    expect(pages[0].index).toBe(0);
    expect(pages[0].headers?.Referer).toBe('https://asurascans.com/');
    expect(pages[1].url).toBe('https://asuracomic.net/storage/media/123/02.webp');
    expect(pages[2].url).toBe('https://asuracomic.net/storage/media/123/03.webp');
  });
});

describe('Provider Class', () => {
  it('instantiates and implements SeanimeMangaProvider interface', () => {
    const provider = new Provider();
    const settings = provider.getSettings();
    expect(settings.supportsMultiLanguage).toBe(false);
    expect(settings.supportsMultiScanlator).toBe(false);
    expect(typeof provider.search).toBe('function');
    expect(typeof provider.findChapters).toBe('function');
    expect(typeof provider.findChapterPages).toBe('function');
    expect(typeof provider.getDetails).toBe('function');
  });
});
