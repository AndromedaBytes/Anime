import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
}

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, 'package.json');
const manifestJsonPath = path.join(rootDir, 'manifest.json');
const pluginsJsonPath = path.join(rootDir, 'plugins.json');

function validateManifests(): void {
  console.log('🔍 Starting Manifest & URL Consistency Validation...\n');

  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found!');
    process.exit(1);
  }
  if (!fs.existsSync(manifestJsonPath)) {
    console.error('❌ manifest.json not found!');
    process.exit(1);
  }
  if (!fs.existsSync(pluginsJsonPath)) {
    console.error('❌ plugins.json not found!');
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf-8'));
  const plugins = JSON.parse(fs.readFileSync(pluginsJsonPath, 'utf-8'));

  const results: ValidationResult[] = [
    { file: 'manifest.json', errors: [], warnings: [] },
    { file: 'plugins.json', errors: [], warnings: [] },
  ];

  // 1. Version Sync Verification
  const expectedVersion = pkg.version;
  console.log(`📦 Base Package Version: ${expectedVersion}`);

  if (manifest.version !== expectedVersion) {
    results[0].errors.push(
      `Version mismatch: manifest.json has "${manifest.version}", expected "${expectedVersion}"`
    );
  }

  const pluginEntry = plugins.plugins?.find((p: any) => p.id === manifest.id);
  if (!pluginEntry) {
    results[1].errors.push(`plugins.json does not contain matching plugin entry for id: "${manifest.id}"`);
  } else if (pluginEntry.version !== expectedVersion) {
    results[1].errors.push(
      `Version mismatch: plugins.json entry "${pluginEntry.id}" has version "${pluginEntry.version}", expected "${expectedVersion}"`
    );
  }

  // 2. URL Format and Placeholders Verification
  const checkUrl = (url: string, fieldName: string, res: ValidationResult) => {
    if (!url) {
      res.errors.push(`Missing required field: ${fieldName}`);
      return;
    }
    if (url.includes('username/seanime-asura-provider')) {
      res.warnings.push(
        `${fieldName} still contains placeholder repository path: "${url}" (remember to update with actual GitHub owner/repo).`
      );
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        res.errors.push(`${fieldName} must use HTTP/HTTPS protocol: "${url}"`);
      }
    } catch {
      res.errors.push(`${fieldName} is not a valid URL: "${url}"`);
    }
  };

  // Check manifest.json URLs
  checkUrl(manifest.manifestURI, 'manifestURI', results[0]);
  checkUrl(manifest.payloadURI, 'payloadURI', results[0]);
  if (manifest.icon) checkUrl(manifest.icon, 'icon', results[0]);
  if (manifest.repository) checkUrl(manifest.repository, 'repository', results[0]);

  // Check plugins.json URLs
  if (pluginEntry) {
    checkUrl(pluginEntry.manifestURI, 'plugins[].manifestURI', results[1]);
    checkUrl(pluginEntry.payloadURI, 'plugins[].payloadURI', results[1]);
    checkUrl(pluginEntry.icon, 'plugins[].icon', results[1]);
    checkUrl(pluginEntry.repository, 'plugins[].repository', results[1]);
  }

  // 3. Local Asset Verification
  const iconSvg = path.join(rootDir, 'assets', 'icon.svg');
  if (!fs.existsSync(iconSvg)) {
    results[0].warnings.push('assets/icon.svg not found on local disk.');
  }

  // Print Summary
  let hasErrors = false;
  results.forEach((r) => {
    console.log(`📄 Checking ${r.file}:`);
    if (r.errors.length === 0 && r.warnings.length === 0) {
      console.log('   ✅ All checks passed.');
    }
    r.warnings.forEach((w) => console.log(`   ⚠️  Warning: ${w}`));
    r.errors.forEach((e) => {
      console.log(`   ❌ Error: ${e}`);
      hasErrors = true;
    });
    console.log('');
  });

  if (hasErrors) {
    console.error('❌ Validation failed with errors.');
    process.exit(1);
  } else {
    console.log('✨ All manifest schemas & URL constraints validated successfully.\n');
  }
}

validateManifests();
