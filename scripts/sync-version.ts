import * as fs from 'fs';
import * as path from 'path';

const rootDir = process.cwd();
const targetVersion = process.argv[2]?.replace(/^v/, '');

if (!targetVersion) {
  console.error('❌ Usage: npx tsx scripts/sync-version.ts <version>');
  process.exit(1);
}

const packageJsonPath = path.join(rootDir, 'package.json');
const manifestJsonPath = path.join(rootDir, 'manifest.json');
const pluginsJsonPath = path.join(rootDir, 'plugins.json');

// 1. Update package.json
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
pkg.version = targetVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✅ Updated package.json version to ${targetVersion}`);

// 2. Update manifest.json
const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf-8'));
manifest.version = targetVersion;
fs.writeFileSync(manifestJsonPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✅ Updated manifest.json version to ${targetVersion}`);

// 3. Update plugins.json
const plugins = JSON.parse(fs.readFileSync(pluginsJsonPath, 'utf-8'));
if (Array.isArray(plugins.plugins)) {
  plugins.plugins = plugins.plugins.map((p: any) => {
    if (p.id === manifest.id) {
      return { ...p, version: targetVersion };
    }
    return p;
  });
}
fs.writeFileSync(pluginsJsonPath, JSON.stringify(plugins, null, 2) + '\n');
console.log(`✅ Updated plugins.json plugin version to ${targetVersion}`);
