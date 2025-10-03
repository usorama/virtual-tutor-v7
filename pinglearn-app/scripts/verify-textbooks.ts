/**
 * Script to verify all textbooks in filesystem are in database
 * Compares PDF files in text-books directory with textbooks table
 */

import { createClient } from '@supabase/supabase-js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Supabase configuration from .env.local
const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';

const supabase = createClient(supabaseUrl, supabaseKey);

interface PDFFile {
  path: string;
  name: string;
  size: number;
  directory: string;
}

/**
 * Recursively find all PDF files in a directory
 */
function findPDFFiles(dir: string, baseDir: string = dir): PDFFile[] {
  const files: PDFFile[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        files.push(...findPDFFiles(fullPath, baseDir));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        const stats = statSync(fullPath);
        const relativePath = fullPath.replace(baseDir + '/', '');
        const directory = relativePath.split('/')[0];

        files.push({
          path: fullPath,
          name: entry.name,
          size: stats.size,
          directory
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

/**
 * Main verification function
 */
async function verifyTextbooks() {
  console.log('='.repeat(80));
  console.log('TEXTBOOK VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log();

  // Step 1: Find all PDF files in filesystem
  console.log('📂 Step 1: Scanning filesystem for PDF files...');
  const textbooksDir = '/Users/umasankrudhya/Projects/pinglearn/text-books';
  const pdfFiles = findPDFFiles(textbooksDir);

  console.log(`   Found ${pdfFiles.length} PDF files in filesystem`);
  console.log();

  // Group by directory
  const filesByDirectory = pdfFiles.reduce((acc, file) => {
    if (!acc[file.directory]) {
      acc[file.directory] = [];
    }
    acc[file.directory].push(file);
    return acc;
  }, {} as Record<string, PDFFile[]>);

  console.log('   PDFs by directory:');
  for (const [dir, files] of Object.entries(filesByDirectory)) {
    console.log(`     - ${dir}: ${files.length} files`);
  }
  console.log();

  // Step 2: Query database for textbooks
  console.log('🗄️  Step 2: Querying database for textbooks...');
  const { data: textbooks, error: textbooksError } = await supabase
    .from('textbooks')
    .select('*');

  if (textbooksError) {
    console.error('   ❌ Error querying textbooks:', textbooksError);
    return;
  }

  console.log(`   Found ${textbooks?.length || 0} textbook records in database`);
  console.log();

  // Step 3: Query database for book_series and books
  console.log('📚 Step 3: Querying hierarchical book structure...');
  const { data: series, error: seriesError } = await supabase
    .from('book_series')
    .select(`
      *,
      books:books(
        *,
        chapters:book_chapters(*)
      )
    `);

  if (seriesError) {
    console.error('   ❌ Error querying book series:', seriesError);
  } else {
    console.log(`   Found ${series?.length || 0} book series`);
    const totalBooks = series?.reduce((sum, s) => sum + (s.books?.length || 0), 0) || 0;
    const totalChapters = series?.reduce((sum, s) =>
      sum + (s.books?.reduce((bSum: number, b: any) =>
        bSum + (b.chapters?.length || 0), 0) || 0), 0) || 0;
    console.log(`   Total books: ${totalBooks}`);
    console.log(`   Total chapters: ${totalChapters}`);
  }
  console.log();

  // Step 4: Compare and identify missing textbooks
  console.log('🔍 Step 4: Comparing filesystem with database...');
  console.log();

  if (!textbooks || textbooks.length === 0) {
    console.log('   ⚠️  WARNING: No textbooks found in database!');
    console.log('   All PDF files need to be processed and added to database.');
    console.log();
    console.log('   Missing textbooks by directory:');
    for (const [dir, files] of Object.entries(filesByDirectory)) {
      console.log(`     ${dir}: ${files.length} unprocessed PDFs`);
    }
  } else {
    console.log('   ✅ Database textbooks:');
    for (const textbook of textbooks) {
      console.log(`     - ${textbook.title} (${textbook.file_name || 'no file'})`);
      console.log(`       Status: ${textbook.status}, Subject: ${textbook.subject || 'N/A'}`);
      console.log(`       Series ID: ${textbook.series_id || 'none'}, User ID: ${textbook.user_id || 'none'}`);
    }
  }
  console.log();

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total PDF files in filesystem: ${pdfFiles.length}`);
  console.log(`Total textbook records in database: ${textbooks?.length || 0}`);
  console.log(`Total book series in database: ${series?.length || 0}`);
  console.log();

  if (textbooks && textbooks.length > 0) {
    console.log('📊 Status breakdown:');
    const statusCounts = textbooks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`   ${status}: ${count}`);
    }
  }
  console.log();

  // Next steps
  console.log('📋 NEXT STEPS:');
  if (!textbooks || textbooks.length === 0) {
    console.log('   1. All PDFs need to be processed');
    console.log('   2. Use the textbook processing wizard or API to add them to database');
    console.log('   3. Process PDFs to extract chapters and content');
  } else if (textbooks.length < pdfFiles.length) {
    console.log(`   1. ${pdfFiles.length - textbooks.length} PDF files are not in database`);
    console.log('   2. Identify which specific files are missing');
    console.log('   3. Process missing PDFs using the processing service');
  } else {
    console.log('   ✅ All expected textbooks appear to be in database');
    console.log('   Verify processing status for each textbook');
  }
  console.log();
  console.log('='.repeat(80));
}

// Run the verification
verifyTextbooks()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
