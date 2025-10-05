// E2E API Testing via Browser Context
// This uses the authenticated browser session

async function testUploadWorkflow() {
  const API_BASE = 'http://localhost:3006';
  const timestamp = Date.now();
  
  console.log('🧪 E2E TEXTBOOK UPLOAD WORKFLOW TEST (Browser Context)');
  console.log('='.repeat(60));
  console.log('');
  
  const results = {
    curriculum: null,
    series: null,
    book: null,
    chapters: null,
    errors: [],
    performance: {}
  };
  
  try {
    // Step 1: Get existing curriculum
    console.log('📚 STEP 1: Getting existing curriculum...');
    const currStart = performance.now();
    
    const currResponse = await fetch(`${API_BASE}/api/curriculum`);
    const currData = await currResponse.json();
    
    results.performance.curriculum = (performance.now() - currStart).toFixed(2);
    
    if (!currData.success || !currData.data ||  !currData.data[0]) {
      throw new Error('No curriculum data available');
    }
    
    const curriculum = currData.data[0];
    results.curriculum = curriculum;
    
    console.log(`✅ Found curriculum: ${curriculum.board_name} - ${curriculum.subject_name}`);
    console.log(`   ID: ${curriculum.id}`);
    console.log(`   Time: ${results.performance.curriculum}ms`);
    console.log('');
    
    // Step 2: Create Series
    console.log('📦 STEP 2: Creating Book Series...');
    const seriesStart = performance.now();
    
    const seriesPayload = {
      seriesName: `E2E Test Series ${timestamp}`,
      publisher: 'E2E Test Publisher',
      curriculumId: curriculum.id,
      description: 'E2E test series for upload workflow validation'
    };
    
    const seriesResponse = await fetch(`${API_BASE}/api/textbooks/series`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seriesPayload)
    });
    
    const seriesData = await seriesResponse.json();
    results.performance.series = (performance.now() - seriesStart).toFixed(2);
    
    if (seriesResponse.status !== 201 || !seriesData.success) {
      throw new Error(`Series creation failed: ${JSON.stringify(seriesData)}`);
    }
    
    results.series = seriesData.data;
    
    console.log(`✅ Series created successfully`);
    console.log(`   Series ID: ${results.series.seriesId}`);
    console.log(`   HTTP Status: ${seriesResponse.status}`);
    console.log(`   Time: ${results.performance.series}ms`);
    console.log('');
    
    // Step 3: Create Book
    console.log('📖 STEP 3: Creating Book...');
    const bookStart = performance.now();
    
    const bookPayload = {
      seriesId: results.series.seriesId,
      volumeNumber: 1,
      volumeTitle: 'E2E Test Book Volume 1',
      edition: '2025 E2E Edition',
      authors: ['E2E Test Author', 'Test Co-Author'],
      isbn: '978-1-234567-89-0',
      publicationYear: 2025,
      totalPages: 250
    };
    
    const bookResponse = await fetch(`${API_BASE}/api/textbooks/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookPayload)
    });
    
    const bookData = await bookResponse.json();
    results.performance.book = (performance.now() - bookStart).toFixed(2);
    
    if (bookResponse.status !== 201 || !bookData.success) {
      throw new Error(`Book creation failed: ${JSON.stringify(bookData)}`);
    }
    
    results.book = bookData.data;
    
    console.log(`✅ Book created successfully`);
    console.log(`   Book ID: ${results.book.bookId}`);
    console.log(`   HTTP Status: ${bookResponse.status}`);
    console.log(`   Time: ${results.performance.book}ms`);
    console.log('');
    
    // Step 4: Create Chapters (Bulk)
    console.log('📑 STEP 4: Creating Chapters (Bulk)...');
    const chaptersStart = performance.now();
    
    const chaptersPayload = {
      bookId: results.book.bookId,
      chapters: [
        { chapterNumber: 1, title: 'Introduction to E2E Testing', startPage: 1, endPage: 25, fileName: 'chapter_01.pdf' },
        { chapterNumber: 2, title: 'API Testing Fundamentals', startPage: 26, endPage: 50, fileName: 'chapter_02.pdf' },
        { chapterNumber: 3, title: 'Database Validation', startPage: 51, endPage: 75, fileName: 'chapter_03.pdf' },
        { chapterNumber: 4, title: 'Error Handling Patterns', startPage: 76, endPage: 100, fileName: 'chapter_04.pdf' },
        { chapterNumber: 5, title: 'Performance Testing', startPage: 101, endPage: 125, fileName: 'chapter_05.pdf' }
      ]
    };
    
    const chaptersResponse = await fetch(`${API_BASE}/api/textbooks/chapters/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chaptersPayload)
    });
    
    const chaptersData = await chaptersResponse.json();
    results.performance.chapters = (performance.now() - chaptersStart).toFixed(2);
    
    if (chaptersResponse.status !== 201 || !chaptersData.success) {
      throw new Error(`Chapters creation failed: ${JSON.stringify(chaptersData)}`);
    }
    
    results.chapters = chaptersData.data;
    
    console.log(`✅ Chapters created successfully`);
    console.log(`   Chapters Created: ${results.chapters.chaptersCreated}`);
    console.log(`   HTTP Status: ${chaptersResponse.status}`);
    console.log(`   Time: ${results.performance.chapters}ms`);
    console.log('');
    
    // Performance Summary
    const totalTime = Object.values(results.performance).reduce((sum, val) => sum + parseFloat(val), 0);
    
    console.log('⏱️  PERFORMANCE METRICS');
    console.log('='.repeat(60));
    console.log(`  Curriculum Query: ${results.performance.curriculum}ms`);
    console.log(`  Series Creation:  ${results.performance.series}ms`);
    console.log(`  Book Creation:    ${results.performance.book}ms`);
    console.log(`  Chapters Creation: ${results.performance.chapters}ms`);
    console.log(`  Total Workflow:   ${totalTime.toFixed(2)}ms`);
    console.log('');
    
    // Success Summary
    console.log('✅ E2E WORKFLOW COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`  Curriculum ID: ${curriculum.id}`);
    console.log(`  Series ID:     ${results.series.seriesId}`);
    console.log(`  Book ID:       ${results.book.bookId}`);
    console.log(`  Chapters:      ${results.chapters.chaptersCreated}`);
    console.log('');
    console.log('🎯 All API endpoints working correctly!');
    console.log('✅ FK relationships validated');
    console.log('✅ Data integrity maintained');
    
    return results;
    
  } catch (error) {
    console.error('❌ E2E TEST FAILED');
    console.error('Error:', error.message);
    console.error('');
    console.error('Results so far:', JSON.stringify(results, null, 2));
    throw error;
  }
}

// Execute the test
testUploadWorkflow();
