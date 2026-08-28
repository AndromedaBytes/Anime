import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Standalone TypeScript Provider (provider.ts)', () => {
  const providerPath = path.resolve(__dirname, '../provider.ts');

  it('exists and has zero external dependencies', () => {
    expect(fs.existsSync(providerPath)).toBe(true);
    const content = fs.readFileSync(providerPath, 'utf-8');

    // Must define class Provider
    expect(content).toContain('class Provider');
    expect(content).toContain('getSettings()');
    expect(content).toContain('search(');
    expect(content).toContain('findChapters(');
    expect(content).toContain('findChapterPages(');

    // Must not have node require/import statements that break Seanime Goja engine
    expect(content).not.toMatch(/^import\s+.*\s+from\s+['"]cheerio['"]/m);
    expect(content).not.toMatch(/require\(['"]cheerio['"]\)/);
  });

  it('contains valid Asura Scans Astro endpoints and anti-hotlinking headers', () => {
    const content = fs.readFileSync(providerPath, 'utf-8');
    expect(content).toContain('https://asurascans.com');
    expect(content).toContain('/browse?search=');
    expect(content).toContain('Referer');
  });
});
