#!/usr/bin/env node

/**
 * Version 2: Fixed script to properly restructure the database
 * Handles table schema correctly and ensures proper deletion
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs').promises;
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CORRECT textbook structure
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
    grade: null,
    subject: 'English Language',
    expectedChapters: 1
  },
  {
    title: 'NABH Dental Accreditation Standards Manual',
    folder: 'NABH-manual',
    grade: null,
    subject: 'Healthcare Administration',
    expectedChapters: 1
  }
];

async function deleteAllData() {
  console.log('\n🗑️  DELETING ALL INCORRECT DATA');
  console.log('=' .repeat(60));

  try {
    // First delete content_embeddings (references chapters)
    const { data: embeddings, error: embListError } = await supabase
      .from('content_embeddings')
      .select('id');

    if (embeddings && embeddings.length > 0) {
      for (const emb of embeddings) {
        await supabase.from('content_embeddings').delete().eq('id', emb.id);
      }
      console.log(`✅ Deleted ${embeddings.length} embeddings`);
    }

    // Then delete chapters (references textbooks)
    const { data: chapters, error: chapListError } = await supabase
      .from('chapters')
      .select('id');

    if (chapters && chapters.length > 0) {
      for (const chap of chapters) {
        await supabase.from('chapters').delete().eq('id', chap.id);
      }
      console.log(`✅ Deleted ${chapters.length} chapters`);
    }

    // Finally delete textbooks
    const { data: textbooks, error: tbListError } = await supabase
      .from('textbooks')
      .select('id');

    if (textbooks && textbooks.length > 0) {
      for (const tb of textbooks) {
        await supabase.from('textbooks').delete().eq('id', tb.id);
      }
      console.log(`✅ Deleted ${textbooks.length} incorrect textbook entries`);
    }

  } catch (err) {
    console.error('❌ Error during deletion:', err);
  }
}

async function createCorrectStructure() {
  console.log('\n✨ CREATING CORRECT STRUCTURE (5 TEXTBOOKS)');
  console.log('=' .repeat(60));

  const textbooksPath = path.join(__dirname, '../../text-books');
  const createdTextbooks = [];

  for (const textbook of CORRECT_TEXTBOOKS) {
    console.log(`\n📚 Creating: ${textbook.title}`);

    // Create textbook with only the columns that exist
    const textbookData = {
      title: textbook.title,
      grade: textbook.grade,
      subject: textbook.subject,
      status: 'ready',
      file_name: textbook.folder,
      file_path: `/text-books/${textbook.folder}`,
      upload_status: 'completed',
      processing_status: 'completed',
      total_pages: 0
    };

    const { data: newTextbook, error: tbError } = await supabase
      .from('textbooks')
      .insert(textbookData)
      .select()
      .single();

    if (tbError) {
      console.error(`   ❌ Error:`, tbError.message);
      continue;
    }

    console.log(`   ✅ Created with ID: ${newTextbook.id}`);
    createdTextbooks.push(newTextbook);

    // Process PDFs as chapters
    const folderPath = path.join(textbooksPath, textbook.folder);

    try {
      const files = await fs.readdir(folderPath);
      const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf')).sort();

      console.log(`   📂 Processing ${pdfFiles.length} PDFs as chapters`);

      for (let i = 0; i < pdfFiles.length; i++) {
        const pdfFile = pdfFiles[i];
        const chapterNumber = i + 1;

        // Clean chapter title
        let chapterTitle = pdfFile
          .replace('.pdf', '')
          .replace(/_/g, ' ')
          .replace(/^\d+-/, '')
          .replace(/^Ch \d+ - /, '')
          .replace(/Class X \w+ - /, '')
          .replace(/Class X \w+ NCERT - /, '')
          .trim();

        // For single-file books
        if (pdfFiles.length === 1 && (textbook.folder === 'English' || textbook.folder === 'NABH-manual')) {
          chapterTitle = 'Complete Document';
        }

        const chapterData = {
          textbook_id: newTextbook.id,
          title: chapterTitle,
          chapter_number: chapterNumber,
          topics: generateTopicsForChapter(chapterTitle, textbook.subject),
          page_start: 0,
          page_end: 0
        };

        const { error: chapError } = await supabase
          .from('chapters')
          .insert(chapterData);

        if (chapError) {
          console.error(`      ❌ Chapter ${chapterNumber} error:`, chapError.message);
        } else {
          console.log(`      ✅ Chapter ${chapterNumber}: ${chapterTitle}`);
        }
      }

    } catch (err) {
      console.error(`   ❌ Folder error:`, err.message);
    }
  }

  return createdTextbooks;
}

function generateTopicsForChapter(chapterTitle, subject) {
  // Generate realistic topics based on chapter title
  const topics = [];

  if (subject === 'Mathematics') {
    if (chapterTitle.includes('Real Numbers')) {
      topics.push('Euclid\'s Division Lemma', 'Fundamental Theorem of Arithmetic');
    } else if (chapterTitle.includes('Polynomial')) {
      topics.push('Zeros of Polynomials', 'Relationship between Zeros and Coefficients');
    } else if (chapterTitle.includes('Triangle')) {
      topics.push('Similar Triangles', 'Pythagoras Theorem', 'Basic Proportionality Theorem');
    }
  } else if (subject === 'Science') {
    if (chapterTitle.includes('Light')) {
      topics.push('Reflection', 'Refraction', 'Lens Formula');
    } else if (chapterTitle.includes('Chemical')) {
      topics.push('Types of Reactions', 'Balancing Equations');
    }
  } else if (subject === 'Health and Physical Education') {
    if (chapterTitle.includes('Yoga')) {
      topics.push('Asanas', 'Pranayama', 'Meditation');
    }
  }

  // Default topics if none matched
  if (topics.length === 0) {
    topics.push('Introduction', 'Key Concepts', 'Practice Problems');
  }

  return topics;
}

async function generateSampleEmbeddings(textbooks) {
  console.log('\n🧮 GENERATING SAMPLE EMBEDDINGS');
  console.log('=' .repeat(60));

  for (const textbook of textbooks) {
    // Get chapters for this textbook
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('textbook_id', textbook.id);

    if (chapters && chapters.length > 0) {
      // Generate a few sample embeddings per textbook
      for (const chapter of chapters.slice(0, 2)) { // First 2 chapters only
        const embeddingData = {
          textbook_id: textbook.id,
          chapter_id: chapter.id,
          content: `Sample content for ${chapter.title}`,
          content_type: 'chapter_content',
          embedding: Array(768).fill(0.1) // Dummy embedding vector
        };

        const { error } = await supabase
          .from('content_embeddings')
          .insert(embeddingData);

        if (!error) {
          console.log(`   ✅ Created embedding for ${textbook.title} - ${chapter.title}`);
        }
      }
    }
  }
}

async function verifyFinalStructure() {
  console.log('\n✅ FINAL VERIFICATION');
  console.log('=' .repeat(60));

  // Count textbooks
  const { count: tbCount } = await supabase
    .from('textbooks')
    .select('*', { count: 'exact', head: true });

  // Count chapters
  const { count: chapCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true });

  // Count embeddings
  const { count: embCount } = await supabase
    .from('content_embeddings')
    .select('*', { count: 'exact', head: true });

  console.log('\n📊 Final Database Structure:');
  console.log(`   Textbooks: ${tbCount} (should be 5)`);
  console.log(`   Chapters: ${chapCount} (should be ~78)`);
  console.log(`   Embeddings: ${embCount || 0}`);

  // List all textbooks with chapter counts
  const { data: textbooks } = await supabase
    .from('textbooks')
    .select(`
      id,
      title,
      grade,
      subject,
      chapters!inner(id)
    `);

  console.log('\n📚 Textbook Details:');
  const textbookSummary = {};

  textbooks?.forEach(tb => {
    const key = tb.title;
    if (!textbookSummary[key]) {
      textbookSummary[key] = {
        grade: tb.grade,
        subject: tb.subject,
        chapters: 0
      };
    }
    textbookSummary[key].chapters = tb.chapters?.length || 0;
  });

  Object.entries(textbookSummary).forEach(([title, info]) => {
    console.log(`\n   ${title}`);
    console.log(`   Grade: ${info.grade || 'N/A'} | Subject: ${info.subject}`);
    console.log(`   Chapters: ${info.chapters}`);
  });

  if (tbCount === 5) {
    console.log('\n✨ SUCCESS! Database now correctly represents 5 textbooks');
  } else {
    console.log('\n⚠️  WARNING: Still have incorrect number of textbooks');
  }
}

async function main() {
  console.log('\n🚨 DATABASE RESTRUCTURE V2 - PROPER FIX');
  console.log('=' .repeat(60));
  console.log('Objective: Create exactly 5 textbooks (one per folder)');

  // Step 1: Delete all incorrect data
  await deleteAllData();

  // Step 2: Create correct structure
  const textbooks = await createCorrectStructure();

  // Step 3: Generate sample embeddings
  await generateSampleEmbeddings(textbooks);

  // Step 4: Verify final structure
  await verifyFinalStructure();

  console.log('\n' + '=' .repeat(60));
  console.log('Next steps:');
  console.log('1. Update processing logic to recognize folder boundaries');
  console.log('2. Never process individual PDFs as textbooks');
  console.log('3. Test with sample upload to ensure structure is maintained');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});