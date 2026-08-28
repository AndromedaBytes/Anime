# Release & Deployment Guide

This guide describes how to version, publish, and rollback releases for the **Seanime Asura Scans Manga Provider & Custom Marketplace Repository**.

---

## 🚀 Standard Release Workflow

The repository is equipped with an automated GitHub Actions CI/CD pipeline ([`.github/workflows/release.yml`](.github/workflows/release.yml)).

### Step 1: Pre-flight Verification & Tests

Run all local validation checks before tagging a release:

```bash
# 1. Validate manifest schemas, version parity, and URLs
npm run validate

# 2. Strict TypeScript type check
npm run typecheck

# 3. Vitest unit and scraper parser tests
npm test

# 4. Production build test
npm run build
```

---

### Step 2: Versioning & Publishing a New Release

To publish a new version (e.g. `v1.0.1`):

```bash
# 1. Synchronize version across package.json, manifest.json, and plugins.json
npm run version:sync 1.0.1

# 2. Commit the synchronized version files
git add package.json manifest.json plugins.json
git commit -m "chore(release): bump version to 1.0.1"

# 3. Create an annotated git tag
git tag -a v1.0.1 -m "Release v1.0.1: [Summary of changes]"

# 4. Push branch and tag to GitHub
git push origin main
git push origin v1.0.1
```

Once pushed, the GitHub Actions workflow will:
1. Validate manifests, execute type checks and tests.
2. Compile and package `dist/index.js` (<150KB bundle).
3. Create a GitHub Release titled `Release v1.0.1` with bundled assets attached.
4. Auto-update the `dist/` directory on `main` for users consuming raw URLs.

---

## 🔄 Emergency Rollback Procedure

If Asura Scans makes upstream DOM changes that break the live provider:

### Option A: Fast Hot-Patch (Recommended)

1. Modify the selectors in [`src/config/selectors.ts`](src/config/selectors.ts) or test fixtures in [`test/fixtures/mockHtml.ts`](test/fixtures/mockHtml.ts).
2. Verify with `npm test`.
3. Bump patch version and push tag:
   ```bash
   npm run version:sync 1.0.2
   git commit -am "fix(scraper): patch broken selector for reader pages"
   git tag -a v1.0.2 -m "Hotfix v1.0.2: update upstream selectors"
   git push origin main --tags
   ```

### Option B: Quick Git Revert & Re-tag

If a hot-patch is not immediately available, revert to the last stable release:

```bash
# 1. Revert breaking commit(s)
git revert HEAD --no-edit

# 2. Bump patch version so client caches refresh
npm run version:sync 1.0.2
git commit -am "chore(rollback): revert to stable v1.0.0 implementation"

# 3. Tag and push
git tag -a v1.0.2 -m "Rollback release v1.0.2 to stable code"
git push origin main --tags
```
