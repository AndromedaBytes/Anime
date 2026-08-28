import Provider from '../src/index.js';

async function runLiveTest() {
  const query = process.argv[2] || 'Solo Leveling';
  console.log(`🌐 [Live Test] Initializing live test against Asura Scans with query: "${query}"...\n`);

  const provider = new Provider();

  try {
    // 1. Settings check
    console.log('⚙️ Provider settings:', provider.getSettings());

    // 2. Search test
    console.log(`\n🔍 Searching for "${query}"...`);
    const searchResults = await provider.search(query);
    console.log(`Found ${searchResults.length} search results.`);

    if (searchResults.length === 0) {
      console.warn('⚠️ No search results returned from live endpoint.');
      return;
    }

    const firstManga = searchResults[0];
    console.log(`\n📌 Target Series: "${firstManga.title}" (ID: ${firstManga.id})`);
    console.log(`   URL: ${firstManga.url}`);
    console.log(`   Image: ${firstManga.image}`);

    // 3. Details test
    console.log(`\n📖 Fetching details for "${firstManga.id}"...`);
    const details = await provider.getDetails(firstManga.id);
    console.log(`   Title: ${details.title}`);
    console.log(`   Status: ${details.status}`);
    console.log(`   Genres: ${details.genres.join(', ') || 'N/A'}`);
    console.log(`   Synopsis: ${details.synopsis.slice(0, 100)}...`);

    // 4. Chapters test
    console.log(`\n📑 Fetching chapters for "${firstManga.id}"...`);
    const chapters = await provider.findChapters(firstManga.id);
    console.log(`Extracted ${chapters.length} chapters.`);

    if (chapters.length === 0) {
      console.warn('⚠️ No chapters found for series.');
      return;
    }

    console.log(`   First chapter (Ascending): ${chapters[0].title} (No: ${chapters[0].chapterNumber})`);
    console.log(`   Latest chapter (Ascending): ${chapters[chapters.length - 1].title} (No: ${chapters[chapters.length - 1].chapterNumber})`);

    // 5. Reader pages test
    const targetChapter = chapters[0];
    console.log(`\n🖼️ Fetching pages for chapter "${targetChapter.title}" (ID: ${targetChapter.id})...`);
    const pages = await provider.findChapterPages(targetChapter.id);
    console.log(`Extracted ${pages.length} clean reader pages.`);

    if (pages.length > 0) {
      console.log(`   Sample page 1 URL: ${pages[0].url}`);
      console.log(`   Headers:`, pages[0].headers);
    }

    console.log('\n✅ [Live Test] All endpoints verified successfully against live Asura Scans!');
  } catch (error: any) {
    console.error('❌ [Live Test] Failed:', error?.message || error);
  }
}

runLiveTest();
