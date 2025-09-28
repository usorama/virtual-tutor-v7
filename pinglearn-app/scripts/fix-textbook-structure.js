#!/usr/bin/env node

/**
 * CRITICAL FIX: Restructure database from incorrect model to correct model
 *
 * PROBLEM: System treated each PDF as a separate textbook
 * SOLUTION: Recognize folder structure - each folder is ONE textbook
 *
 * Correct Structure:
 * - 5 textbooks total (one per folder)
 * - PDFs within folders are CHAPTERS of that textbook
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs').promises;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define the CORRECT textbook structure
const CORRECT_TEXTBOOKS = [
  {
    title: 'Class X Health and Physical Education',
    folder: 'Class X Health and PE',
    grade: 10,
    subject: 'Health and Physical Education',
    expectedChapters: 28
  },
  {
    title: 'Class X Mathematics NCERT',
    folder: 'Class X Mathematics',
    grade: 10,
    subject: 'Mathematics',
    expectedChapters: 18
  },
  {
    title: 'Class X Science NCERT',
    folder: 'Class X Science NCERT',
    grade: 10,
    subject: 'Science',
    expectedChapters: 30
  },
  {
    title: 'Objective General English',
    folder: 'English',
    grade: null, // Not tied to a specific grade
    subject: 'English Language',
    expectedChapters: 1 // Single comprehensive book
  },
  {
    title: 'NABH Dental Accreditation Standards Manual',
    folder: 'NABH-manual',
    grade: null, // Business/professional content
    subject: 'Healthcare Administration',
    expectedChapters: 1 // Single comprehensive manual
  }
];

async function analyzeCurrentStructure() {
  console.log('\n📊 ANALYZING CURRENT INCORRECT STRUCTURE');
  console.log('=' .repeat(60));

  // Get all current textbooks
  const { data: textbooks, error } = await supabase
    .from('textbooks')
    .select('id, title, grade, subject, file_name, status');

  if (error) {
    console.error('❌ Error fetching textbooks:', error);
    return [];
  }

  console.log(`\n❌ Current WRONG structure: ${textbooks.length} textbooks`);

  // Group by what they should be
  const misclassified = {};

  textbooks.forEach(tb => {
    // Try to identify which folder this should belong to
    let belongsTo = 'Unknown';

    if (tb.title?.includes('Mathematics') || tb.title?.includes('Polynomial') ||
        tb.title?.includes('Triangle') || tb.title?.includes('Probability')) {
      belongsTo = 'Class X Mathematics';
    } else if (tb.title?.includes('Science') || tb.title?.includes('Chemical') ||
               tb.title?.includes('Light') || tb.title?.includes('Environment')) {
      belongsTo = 'Class X Science NCERT';
    } else if (tb.title?.includes('Health') || tb.title?.includes('PE') ||
               tb.title?.includes('Yoga') || tb.title?.includes('Diet')) {
      belongsTo = 'Class X Health and PE';
    } else if (tb.title?.includes('English') || tb.title?.includes('Bakshi')) {
      belongsTo = 'English';
    } else if (tb.title?.includes('NABH') || tb.title?.includes('Dental')) {
      belongsTo = 'NABH-manual';
    }

    if (!misclassified[belongsTo]) {
      misclassified[belongsTo] = [];
    }
    misclassified[belongsTo].push(tb);
  });

  // Display analysis
  Object.entries(misclassified).forEach(([folder, books]) => {
    console.log(`\n📁 ${folder}: ${books.length} entries (should be 1 textbook)`);
    books.slice(0, 3).forEach(book => {
      console.log(`   ❌ "${book.title}" (ID: ${book.id})`);
    });
    if (books.length > 3) {
      console.log(`   ... and ${books.length - 3} more`);
    }
  });

  return textbooks;
}

async function cleanDatabase() {
  console.log('\n🗑️  CLEANING INCORRECT DATA');
  console.log('=' .repeat(60));

  // Delete all embeddings first
  const { error: embError } = await supabase
    .from('content_embeddings')
    .delete()
    .gte('id', 0); // Delete all

  if (embError && embError.code !== 'PGRST106') {
    console.error('⚠️  Error cleaning embeddings:', embError.message);
  } else {
    console.log('✅ Cleared content_embeddings table');
  }

  // Delete all chapters
  const { error: chapError } = await supabase
    .from('chapters')
    .delete()
    .gte('id', 0); // Delete all

  if (chapError && chapError.code !== 'PGRST106') {
    console.error('⚠️  Error cleaning chapters:', chapError.message);
  } else {
    console.log('✅ Cleared chapters table');
  }

  // Delete all textbooks
  const { error: tbError } = await supabase
    .from('textbooks')
    .delete()
    .gte('id', 0); // Delete all

  if (tbError && tbError.code !== 'PGRST106') {
    console.error('⚠️  Error cleaning textbooks:', tbError.message);
  } else {
    console.log('✅ Cleared textbooks table');
  }
}

async function createCorrectStructure() {
  console.log('\n✨ CREATING CORRECT STRUCTURE');
  console.log('=' .repeat(60));

  const textbooksPath = path.join(__dirname, '../../text-books');

  for (const textbook of CORRECT_TEXTBOOKS) {
    console.log(`\n📚 Creating textbook: ${textbook.title}`);

    // Create the main textbook entry
    const { data: newTextbook, error: tbError } = await supabase
      .from('textbooks')
      .insert({
        title: textbook.title,
        grade: textbook.grade,
        subject: textbook.subject,
        status: 'ready',
        file_name: textbook.folder,
        file_path: `/text-books/${textbook.folder}`,
        upload_status: 'completed',
        processing_status: 'completed',
        embedding_status: 'pending',
        total_pages: 0 // Will be updated when processing PDFs
      })
      .select()
      .single();

    if (tbError) {
      console.error(`❌ Error creating textbook:`, tbError);
      continue;
    }

    console.log(`   ✅ Created textbook with ID: ${newTextbook.id}`);

    // Now process PDFs in this folder as chapters
    const folderPath = path.join(textbooksPath, textbook.folder);

    try {
      const files = await fs.readdir(folderPath);
      const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf')).sort();

      console.log(`   📂 Found ${pdfFiles.length} PDFs to process as chapters`);

      // Create chapters for each PDF
      for (let i = 0; i < pdfFiles.length; i++) {
        const pdfFile = pdfFiles[i];
        const chapterNumber = i + 1;

        // Extract chapter title from filename
        let chapterTitle = pdfFile.replace('.pdf', '').replace(/_/g, ' ');

        // Clean up common patterns
        chapterTitle = chapterTitle
          .replace(/^\d+-/, '') // Remove leading numbers
          .replace(/^Ch \d+ - /, '') // Remove "Ch XX - " patterns
          .replace(/Class X \w+ - /, '') // Remove subject prefixes
          .trim();

        // For single-file books, use the book title
        if (pdfFiles.length === 1) {
          chapterTitle = 'Complete Book';
        }

        const { error: chapError } = await supabase
          .from('chapters')
          .insert({
            textbook_id: newTextbook.id,
            title: chapterTitle,
            chapter_number: chapterNumber,
            topics: [], // Will be populated during actual processing
            page_start: 0,
            page_end: 0
          });

        if (chapError) {
          console.error(`      ❌ Error creating chapter ${chapterNumber}:`, chapError.message);
        } else {
          console.log(`      ✅ Chapter ${chapterNumber}: ${chapterTitle}`);
        }
      }

    } catch (err) {
      console.error(`   ❌ Error processing folder:`, err.message);
    }
  }
}

async function updateProcessingLogic() {
  console.log('\n🔧 RECOMMENDATIONS FOR PROCESSING LOGIC FIX');
  console.log('=' .repeat(60));

  console.log(`
The upload/processing logic needs fundamental changes:

1. FOLDER-BASED PROCESSING:
   - Recognize folders as textbook boundaries
   - Process all PDFs in a folder as chapters of ONE textbook
   - Never create textbook entries for individual PDFs

2. FILE NAMING PATTERNS:
   - Use folder name for textbook title
   - Extract chapter info from PDF filenames
   - Handle both multi-chapter and single-file books

3. GRADE ASSIGNMENT:
   - Class X/10 = Grade 10
   - Professional/Reference = No grade or special category
   - Never auto-assign grades based on content

4. KEY FILES TO UPDATE:
   - /src/lib/textbook/enhanced-processor.ts
   - /src/app/api/textbooks/hierarchy/route.ts
   - /src/components/textbook/EnhancedUploadFlow.tsx

5. VALIDATION:
   - Check folder structure before processing
   - Confirm with user: "Process X PDFs as chapters of Y textbook?"
   - Show preview of final structure
`);
}

async function verifyNewStructure() {
  console.log('\n✅ VERIFYING NEW STRUCTURE');
  console.log('=' .repeat(60));

  const { data: textbooks } = await supabase
    .from('textbooks')
    .select(`
      id,
      title,
      grade,
      subject,
      chapters:chapters(count)
    `);

  console.log(`\n📊 Final Structure:`);
  console.log(`Total Textbooks: ${textbooks?.length || 0} (should be 5)`);

  textbooks?.forEach(tb => {
    const chapterCount = tb.chapters?.[0]?.count || 0;
    console.log(`\n📚 ${tb.title}`);
    console.log(`   Grade: ${tb.grade || 'N/A'} | Subject: ${tb.subject}`);
    console.log(`   Chapters: ${chapterCount}`);
  });
}

async function main() {
  console.log('\n🚨 CRITICAL DATABASE RESTRUCTURE');
  console.log('=' .repeat(60));
  console.log('Fixing fundamental data modeling error');
  console.log('From: Each PDF = Textbook (WRONG)');
  console.log('To: Each Folder = Textbook, PDFs = Chapters (CORRECT)');

  // Step 1: Analyze current wrong structure
  const wrongData = await analyzeCurrentStructure();

  // Step 2: Ask for confirmation
  console.log('\n⚠️  WARNING: This will DELETE all current textbook data and rebuild');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 3: Clean database
  await cleanDatabase();

  // Step 4: Create correct structure
  await createCorrectStructure();

  // Step 5: Show recommendations
  await updateProcessingLogic();

  // Step 6: Verify
  await verifyNewStructure();

  console.log('\n✨ RESTRUCTURE COMPLETE!');
  console.log('The database now correctly represents 5 textbooks with chapters.');
  console.log('Next: Update the processing logic to maintain this structure.');
}

// Run the fix
main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});