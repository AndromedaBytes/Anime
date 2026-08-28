import { SelectorConfig } from '../types.js';

export const ASURA_BASE_URL = 'https://asuracomic.net';

export const SELECTORS: SelectorConfig = {
  baseUrl: ASURA_BASE_URL,
  endpoints: {
    search: '/series?name=',
    series: '/series/',
  },
  search: {
    container: 'div.grid.grid-cols-2, div.grid, div.listupd',
    card: 'div.grid.grid-cols-2 > div, div.grid > div.relative, div.bsx, a[href*="/series/"]',
    title: 'span.font-bold, h3, div.text-base.font-bold, div.tt, a.font-bold',
    link: 'a[href*="/series/"]',
    image: 'img',
    rating: 'span.text-xs, div.rating, div.numscore',
    latestChapter: 'span.text-xs.text-muted-foreground, div.epxs, span.text-blue-500',
  },
  details: {
    title: 'h1, h2.font-bold, div.text-center h3, div.bigcontent h1',
    image: 'img[alt*="cover"], img.rounded-md, div.thumb img, div.bigcontent img',
    synopsis: 'span.font-medium.text-sm, div.entry-content, p.text-sm.text-muted-foreground, div.synopsis',
    status: 'div.text-sm:contains("Status"), span:contains("Status"), div.imptdt:contains("Status")',
    genres: 'div.flex.flex-wrap.gap-1 button, span.mgen a, a[href*="/genres/"], div.genres-content a',
    author: 'div.text-sm:contains("Author"), span:contains("Author"), div.imptdt:contains("Author")',
    artist: 'div.text-sm:contains("Artist"), span:contains("Artist"), div.imptdt:contains("Artist")',
    rating: 'div.text-xl.font-bold, div.num, span[itemprop="ratingValue"]',
    type: 'div.text-sm:contains("Type"), span:contains("Type")',
  },
  chapters: {
    container: 'div.flex.flex-col.gap-2, div.bxcl ul, div#chapterlist ul, div.divide-y',
    item: 'div.flex.justify-between.items-center, li[data-num], div.eph-num, a[href*="/chapter/"]',
    title: 'h3.text-sm.font-bold, span.chapternum, span.font-medium, a[href*="/chapter/"]',
    link: 'a[href*="/chapter/"]',
    releaseDate: 'h3.text-xs.text-muted-foreground, span.chapterdate, span.text-xs',
  },
  reader: {
    container: 'div.flex.flex-col.items-center, div#readerarea, div.rdcontainer, div.w-full.flex.flex-col',
    images: 'img[alt*="chapter"], img[loading="lazy"], div#readerarea img, div.flex.flex-col.items-center img',
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
    ],
  },
};
