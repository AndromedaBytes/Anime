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
  console.log('🔍 Starting Manifest & Multi-Provider Consistency Validation...\n');

  if (!fs.existsSync(packageJsonPath) || !fs.existsSync(manifestJsonPath) || !fs.existsSync(pluginsJsonPath)) {
    console.error('❌ Root configuration files missing!');
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const plugins = JSON.parse(fs.readFileSync(pluginsJsonPath, 'utf-8'));

  if (!Array.isArray(plugins)) {
    console.error('❌ plugins.json must be a top-level JSON array.');
    process.exit(1);
  }

  console.log(`📦 Validating ${plugins.length} registered providers in plugins.json...\n`);

  let totalErrors = 0;

  plugins.forEach((plugin: any) => {
    const res: ValidationResult = { file: `plugins.json -> [${plugin.id}]`, errors: [], warnings: [] };

    if (!plugin.id) res.errors.push('Missing "id"');
    if (!plugin.name) res.errors.push('Missing "name"');
    if (!plugin.type) res.errors.push('Missing "type"');
    if (!plugin.manifestURI) res.errors.push('Missing "manifestURI"');

    // Check if manifestURI is a local repo path and exists
    if (plugin.manifestURI.includes('AndromedaBytes/Anime/main/')) {
      const relPath = plugin.manifestURI.split('AndromedaBytes/Anime/main/')[1];
      const localPath = path.join(rootDir, relPath);
      if (!fs.existsSync(localPath)) {
        res.errors.push(`Referenced local manifest does not exist at: ${relPath}`);
      } else {
        const localManifest = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
        if (localManifest.id !== plugin.id) {
          res.errors.push(`Local manifest ID mismatch: expected "${plugin.id}", got "${localManifest.id}"`);
        }
        if (localManifest.payloadURI && localManifest.payloadURI.includes('AndromedaBytes/Anime/main/')) {
          const payloadRelPath = localManifest.payloadURI.split('AndromedaBytes/Anime/main/')[1];
          const payloadLocalPath = path.join(rootDir, payloadRelPath);
          if (!fs.existsSync(payloadLocalPath)) {
            res.errors.push(`Referenced payload does not exist at: ${payloadRelPath}`);
          }
        }
      }
    }

    if (res.errors.length > 0) {
      console.log(`❌ ${res.file}:`);
      res.errors.forEach((e) => console.log(`   Error: ${e}`));
      totalErrors++;
    } else {
      console.log(`✅ ${res.file} (${plugin.name} - ${plugin.type}) verified.`);
    }
  });

  if (totalErrors > 0) {
    console.error(`\n❌ Validation failed with ${totalErrors} errors.`);
    process.exit(1);
  } else {
    console.log('\n✨ All multi-provider manifests & payload files verified successfully.\n');
  }
}

validateManifests();
