# Seanime Asura Scans Manga Provider & Custom Marketplace

A custom manga source extension and marketplace registry that integrates **Asura Scans** (`asuracomic.net`) directly into the [Seanime](https://github.com/5rahim/seanime) desktop media manager.

---

## Features

- 🔍 **Title Search & Auto-Matching:** Multi-word search matching with cover thumbnails, status, and scores.
- 📖 **Sequential Chapter Reader:** Full chapter extraction preserving decimal/half chapters (e.g. Chapter `10.5`) in proper ascending sequence.
- 🛡️ **Ad & Banner Filtering:** Automatically excludes promo end-cards, Discord banners, and watermarks from the reader stream.
- ⚡ **Anti-Hotlinking Referrer Support:** Appends required `Referer: https://asuracomic.net/` headers to bypass CDN image restrictions.
- 🔄 **Exponential Backoff:** Retries on transient 502/503/429 upstream gateway responses.
- 📦 **Dual Installation Modes:** Support for Marketplace repository subscription (`plugins.json`) and direct extension installation (`manifest.json`).

---

## Installation Guide

### Method 1: Add Custom Extension Repository (Recommended)

1. Open your **Seanime** client.
2. Go to **Extensions** > **Marketplace**.
3. In the top-right corner, click **Change repository** (or repository settings).
4. Paste the URL of your hosted `plugins.json`:
   ```
   https://raw.githubusercontent.com/<YOUR_GITHUB_USERNAME>/<REPO_NAME>/main/plugins.json
   ```
5. Click **Save / Refresh**.
6. Find **Asura Scans** in the **Manga** or **All Types** category and click **Install**.

---

### Method 2: Direct Manifest Installation

1. Open **Seanime**.
2. Navigate to **Extensions** > **Add extensions** (or **Custom Sources**).
3. Paste the raw URL to `manifest.json`:
   ```
   https://raw.githubusercontent.com/<YOUR_GITHUB_USERNAME>/<REPO_NAME>/main/manifest.json
   ```
4. Click **Install**. Seanime will download the manifest and link the compiled `dist/index.js` payload.

---

## Local Development & Testing

```bash
# Clone the repository
git clone https://github.com/<YOUR_GITHUB_USERNAME>/seanime-asura-provider.git
cd seanime-asura-provider

# Install dependencies
npm install

# Run unit tests & schema validation
npm test

# Run TypeScript typecheck
npm run typecheck

# Build standalone distribution bundles
npm run build
```

---

## Project Structure

```
├── manifest.json         # Standalone Seanime Extension descriptor
├── plugins.json          # Seanime Marketplace Catalog descriptor
├── package.json          # Build scripts & dependencies
├── tsconfig.json         # Strict TypeScript compiler options
├── tsup.config.ts        # Bundler configuration
├── vitest.config.ts      # Test harness configuration
├── assets/
│   └── icon.svg          # 128x128 Asura Scans provider icon
├── src/
│   ├── index.ts          # Provider class entrypoint
│   ├── types.ts          # Seanime Provider interfaces & types
│   ├── config/
│   │   └── selectors.ts  # Isolated CSS/DOM selector configuration
│   ├── scrapers/
│   │   ├── search.ts     # Search endpoint parsing
│   │   ├── details.ts    # Manga metadata & synopsis extraction
│   │   ├── chapters.ts   # Chapter listing & sorting (ascending)
│   │   └── pages.ts      # Reader page image extraction & ad filtering
│   └── utils/
│       ├── http.ts       # Resilient fetch client with retry backoff
│       └── sanitize.ts   # Text cleaning & chapter number extraction
└── test/
    ├── fixtures/         # Mock HTML snapshots
    ├── manifest.test.ts  # Schema validation tests
    └── parser.test.ts    # Scraper & utility unit tests
```

---

## License

MIT License. Created for the Seanime Community.
