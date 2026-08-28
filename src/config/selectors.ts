import { SelectorConfig } from '../types.js';

export const ASURA_BASE_URL = 'https://asurascans.com';
export const ASURA_FALLBACK_URL = 'https://asuracomic.net';

export const SELECTORS: SelectorConfig = {
  baseUrl: ASURA_BASE_URL,
  endpoints: {
    search: '/browse?search=',
    series: '/comics/',
  },
  search: {
    container: 'div.grid, div.listupd, main',
    card: 'a[href*="/comics/"], a[href*="/series/"], div.grid > div, div.bsx',
    title: 'h3, h4, span.font-bold, div.font-bold, div.text-base',
    link: 'a[href*="/comics/"], a[href*="/series/"]',
    image: 'img',
    rating: 'span.text-xs, div.rating, div.numscore',
    latestChapter: 'span.text-xs.text-muted-foreground, div.epxs, span.text-blue-500',
  },
  details: {
    title: 'h1, h2.font-bold, div.text-center h3, div.bigcontent h1',
    image: 'img[src*="asura-images"], img[src*="cover"], img[src*="banners"], img[alt*="cover"], img.rounded-md, div.thumb img',
    synopsis: 'p.text-muted-foreground, p.text-sm, span.font-medium.text-sm, div.entry-content, div.synopsis',
    status: 'div:contains("Status"), span:contains("Status"), div.imptdt:contains("Status")',
    genres: 'div.flex.flex-wrap button, span.mgen a, a[href*="/genres/"], a[href*="/genre/"], div.genres-content a',
    author: 'div:contains("Author"), span:contains("Author"), div.imptdt:contains("Author")',
    artist: 'div:contains("Artist"), span:contains("Artist"), div.imptdt:contains("Artist")',
    rating: 'div.text-xl.font-bold, div.num, span[itemprop="ratingValue"]',
    type: 'div:contains("Type"), span:contains("Type")',
  },
  chapters: {
    container: 'div.flex.flex-col, div.bxcl ul, div#chapterlist ul, div.divide-y',
    item: 'a[href*="/chapter/"], div.flex.justify-between.items-center, li[data-num], div.eph-num',
    title: 'h3.text-sm.font-bold, span.chapternum, span.font-medium, a[href*="/chapter/"]',
    link: 'a[href*="/chapter/"]',
    releaseDate: 'h3.text-xs, span.chapterdate, span.text-xs, time',
  },
  reader: {
    container: 'div.flex.flex-col, div#readerarea, div.rdcontainer, main',
    images: 'img[src*="chapters"], img[alt*="Page"], img[alt*="Chapter"], img[loading="lazy"], div#readerarea img',
    adPatterns: [
      /discord/i,
      /banner/i,
      /promo/i,
      /watermark/i,
      /patreon/i,
      /donation/i,
      /credit/i,
      /end_card/i,
      /asura_logo/i,
      /asura_ad/i,
      /covers/i, // Skip the title cover image if inside reader page header
    ],
  },
};
