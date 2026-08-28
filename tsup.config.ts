import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'SeanimeAsuraProvider',
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  splitting: false,
  noExternal: ['cheerio'],
  outDir: 'dist',
});
