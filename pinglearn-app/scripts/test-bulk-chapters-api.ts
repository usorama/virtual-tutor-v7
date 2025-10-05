/**
 * Manual Test Script for POST /api/textbooks/chapters/bulk
 *
 * Tests the bulk chapter creation endpoint with Class 10 Math data (12 chapters)
 *
 * Usage:
 *   1. Ensure PingLearn app is running on port 3006
 *   2. Create a book first (get bookId)
 *   3. Run: npx tsx scripts/test-bulk-chapters-api.ts <bookId>
 */

interface ChapterInput {
  chapterNumber: number;
  title: string;
  startPage: number;
  endPage: number;
  fileName: string;
}

const CLASS_10_MATH_CHAPTERS: ChapterInput[] = [
  { chapterNumber: 1, title: 'Real Numbers', startPage: 1, endPage: 15, fileName: 'NCERT_Class10_Math_Ch01_Real_Numbers.pdf' },
  { chapterNumber: 2, title: 'Polynomials', startPage: 16, endPage: 30, fileName: 'NCERT_Class10_Math_Ch02_Polynomials.pdf' },
  { chapterNumber: 3, title: 'Linear Equations', startPage: 31, endPage: 45, fileName: 'NCERT_Class10_Math_Ch03_Linear_Equations.pdf' },
  { chapterNumber: 4, title: 'Quadratic Equations', startPage: 46, endPage: 60, fileName: 'NCERT_Class10_Math_Ch04_Quadratic_Equations.pdf' },
  { chapterNumber: 5, title: 'Arithmetic Progressions', startPage: 61, endPage: 75, fileName: 'NCERT_Class10_Math_Ch05_Arithmetic_Progressions.pdf' },
  { chapterNumber: 6, title: 'Triangles', startPage: 76, endPage: 90, fileName: 'NCERT_Class10_Math_Ch06_Triangles.pdf' },
  { chapterNumber: 7, title: 'Coordinate Geometry', startPage: 91, endPage: 105, fileName: 'NCERT_Class10_Math_Ch07_Coordinate_Geometry.pdf' },
  { chapterNumber: 8, title: 'Trigonometry', startPage: 106, endPage: 120, fileName: 'NCERT_Class10_Math_Ch08_Trigonometry.pdf' },
  { chapterNumber: 9, title: 'Applications of Trigonometry', startPage: 121, endPage: 135, fileName: 'NCERT_Class10_Math_Ch09_Applications_Trigonometry.pdf' },
  { chapterNumber: 10, title: 'Circles', startPage: 136, endPage: 150, fileName: 'NCERT_Class10_Math_Ch10_Circles.pdf' },
  { chapterNumber: 11, title: 'Areas Related to Circles', startPage: 151, endPage: 165, fileName: 'NCERT_Class10_Math_Ch11_Areas_Related_Circles.pdf' },
  { chapterNumber: 12, title: 'Surface Areas and Volumes', startPage: 166, endPage: 180, fileName: 'NCERT_Class10_Math_Ch12_Surface_Areas_Volumes.pdf' },
];

async function testBulkChaptersAPI(bookId: string) {
  const API_URL = 'http://localhost:3006/api/textbooks/chapters/bulk';

  console.log('📚 Testing POST /api/textbooks/chapters/bulk');
  console.log(`📖 Book ID: ${bookId}`);
  console.log(`📑 Creating ${CLASS_10_MATH_CHAPTERS.length} chapters...`);
  console.log('');

  const requestBody = {
    bookId,
    chapters: CLASS_10_MATH_CHAPTERS,
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    console.log(`📡 Response Status: ${response.status}`);
    console.log('📦 Response Data:');
    console.log(JSON.stringify(responseData, null, 2));
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS: Chapters created successfully!');
      console.log(`   - Chapters Created: ${responseData.data.chaptersCreated}`);
      console.log(`   - Chapter IDs: ${responseData.data.chapterIds.length} UUIDs`);
      console.log('');
      console.log('First 3 Chapter IDs:');
      responseData.data.chapterIds.slice(0, 3).forEach((id: string, idx: number) => {
        console.log(`   ${idx + 1}. ${id}`);
      });
    } else {
      console.log('❌ FAILED: API returned error');
      console.log(`   Error Code: ${responseData.error?.code}`);
      console.log(`   Error Message: ${responseData.error?.message}`);
    }

    return responseData;
  } catch (error) {
    console.error('💥 NETWORK ERROR:', error);
    throw error;
  }
}

// Test scenarios
async function runTestScenarios() {
  console.log('🧪 Running Test Scenarios for Bulk Chapters API\n');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Invalid Book ID (FK violation)
  console.log('Test 1: Invalid Book ID (FK Violation)');
  console.log('-'.repeat(60));
  try {
    await testBulkChaptersAPI('00000000-0000-0000-0000-000000000000');
  } catch (error) {
    console.log('Expected error occurred:', error);
  }
  console.log('');

  // Test 2: Invalid Chapter Sequence (gap)
  console.log('Test 2: Invalid Chapter Sequence (Gap)');
  console.log('-'.repeat(60));
  const invalidSequence = [
    { chapterNumber: 1, title: 'Ch1', startPage: 1, endPage: 10, fileName: 'ch1.pdf' },
    { chapterNumber: 2, title: 'Ch2', startPage: 11, endPage: 20, fileName: 'ch2.pdf' },
    { chapterNumber: 4, title: 'Ch4', startPage: 31, endPage: 40, fileName: 'ch4.pdf' }, // Missing 3!
  ];

  try {
    const response = await fetch('http://localhost:3006/api/textbooks/chapters/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: '00000000-0000-0000-0000-000000000000', chapters: invalidSequence }),
    });
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Expected error:', error);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('\n✅ Test scenarios completed!');
  console.log('\n📝 To test with a real book:');
  console.log('   npx tsx scripts/test-bulk-chapters-api.ts <your-book-uuid>');
}

// Main execution
const bookIdArg = process.argv[2];

if (bookIdArg) {
  // User provided a book ID
  testBulkChaptersAPI(bookIdArg).catch(console.error);
} else {
  // Run test scenarios
  runTestScenarios().catch(console.error);
}
