import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Manifest Schema Validation', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('validates plugins.json structure as JSON array for Seanime marketplace compatibility', () => {
    const pluginsPath = path.join(rootDir, 'plugins.json');
    expect(fs.existsSync(pluginsPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(pluginsPath, 'utf-8'));
    expect(Array.isArray(content)).toBe(true);
    expect(content.length).toBeGreaterThan(0);

    const plugin = content.find((p: any) => p.id === 'asura-scans');
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('Asura Scans');
    expect(plugin.type).toBe('manga-provider');
    expect(plugin.manifestURI).toBeDefined();
  });

  it('validates manifest.json structure for standalone extension installation', () => {
    const manifestPath = path.join(rootDir, 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(manifest.id).toBe('asura-scans');
    expect(manifest.name).toBe('Asura Scans');
    expect(manifest.type).toBe('manga-provider');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.manifestURI).toBeDefined();
    expect(manifest.payloadURI).toBeDefined();
    expect(manifest.website).toBeDefined();
  });
});
