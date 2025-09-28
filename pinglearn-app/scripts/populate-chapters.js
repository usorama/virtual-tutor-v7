#!/usr/bin/env node

/**
 * Populate chapters for the 5 textbooks based on actual PDFs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEXTBOOK_FOLDERS = [
  { title: 'Class X Mathematics NCERT', folder: 'Class X Mathematics' },
  { title: 'Class X Science NCERT', folder: 'Class X Science NCERT' },
  { title: 'Class X Health and Physical Education', folder: 'Class X Health and PE' },
  { title: 'Objective General English', folder: 'English' },
  { title: 'NABH Dental Accreditation Standards Manual', folder: 'NABH-manual' }
];

async function populateChapters() {
  console.log('\n📚 POPULATING CHAPTERS FOR TEXTBOOKS');
  console.log('=' .repeat(60));

  for (const textbookInfo of TEXTBOOK_FOLDERS) {
    console.log(`\n📖 ${textbookInfo.title}`);

    // Get textbook from database
    const { data: textbook, error: tbError } = await supabase
      .from('textbooks')
      .select('id')
      .eq('title', textbookInfo.title)
      .single();

    if (tbError || !textbook) {
      console.log(`   ❌ Textbook not found in database`);
      continue;
    }

    // Get PDFs from folder
    const folderPath = path.join(__dirname, '../../text-books', textbookInfo.folder);

    try {
      const files = await fs.readdir(folderPath);
      const pdfFiles = files
        .filter(f => f.toLowerCase().endsWith('.pdf'))
        .sort();

      console.log(`   📂 Found ${pdfFiles.length} PDFs`);

      // Create chapters from PDFs
      const chapters = pdfFiles.map((pdf, index) => {
        // Clean chapter title from filename
        let chapterTitle = pdf
          .replace('.pdf', '')
          .replace(/_/g, ' ')
          .replace(/^\d+-/, '')
          .replace(/^0+/, '')
          .replace(/^Ch \d+ - /, '')
          .replace(/Class X \w+ - /, '')
          .replace(/Class X \w+ NCERT - /, '')
          .trim();

        // Special handling for single-file books
        if (pdfFiles.length === 1) {
          chapterTitle = 'Complete Document';
        }

        return {
          textbook_id: textbook.id,
          title: chapterTitle,
          chapter_number: index + 1,
          topics: generateTopics(chapterTitle, textbookInfo.title)
        };
      });

      // Insert chapters
      const { data: createdChapters, error: chapError } = await supabase
        .from('chapters')
        .insert(chapters)
        .select();

      if (chapError) {
        console.log(`   ❌ Error creating chapters:`, chapError.message);
      } else {
        console.log(`   ✅ Created ${createdChapters.length} chapters`);

        // Show first few chapters
        chapters.slice(0, 3).forEach((ch, i) => {
          console.log(`      ${ch.chapter_number}. ${ch.title.substring(0, 50)}...`);
        });
        if (chapters.length > 3) {
          console.log(`      ... and ${chapters.length - 3} more`);
        }
      }

    } catch (err) {
      console.log(`   ❌ Error reading folder:`, err.message);
    }
  }

  // Verify final state
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FINAL VERIFICATION\n');

  const { count: chapCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total Chapters Created: ${chapCount}`);

  // Show chapters per textbook
  for (const textbookInfo of TEXTBOOK_FOLDERS) {
    const { data: textbook } = await supabase
      .from('textbooks')
      .select('id')
      .eq('title', textbookInfo.title)
      .single();

    if (textbook) {
      const { count } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('textbook_id', textbook.id);

      console.log(`   ${textbookInfo.title}: ${count} chapters`);
    }
  }

  console.log('\n✅ Chapters populated successfully!');
  console.log('The wizard should now show complete data with chapters and topics.');
}

function generateTopics(chapterTitle, textbookTitle) {
  const topics = [];

  if (textbookTitle.includes('Mathematics')) {
    if (chapterTitle.toLowerCase().includes('real number')) {
      topics.push('Euclid\'s Division Lemma', 'Fundamental Theorem of Arithmetic', 'Irrational Numbers');
    } else if (chapterTitle.toLowerCase().includes('polynomial')) {
      topics.push('Zeros of Polynomials', 'Division Algorithm', 'Factorization');
    } else if (chapterTitle.toLowerCase().includes('triangle')) {
      topics.push('Similar Triangles', 'Pythagoras Theorem', 'Basic Proportionality Theorem');
    } else if (chapterTitle.toLowerCase().includes('probability')) {
      topics.push('Classical Probability', 'Experimental Probability', 'Sample Space');
    } else {
      topics.push('Introduction', 'Key Concepts', 'Practice Problems');
    }
  } else if (textbookTitle.includes('Science')) {
    if (chapterTitle.toLowerCase().includes('light')) {
      topics.push('Reflection', 'Refraction', 'Lenses and Mirrors');
    } else if (chapterTitle.toLowerCase().includes('chemical')) {
      topics.push('Types of Reactions', 'Balancing Equations', 'pH Scale');
    } else if (chapterTitle.toLowerCase().includes('life')) {
      topics.push('Nutrition', 'Respiration', 'Transportation');
    } else if (chapterTitle.toLowerCase().includes('environment')) {
      topics.push('Ecosystem', 'Food Chains', 'Conservation');
    } else {
      topics.push('Introduction', 'Core Concepts', 'Experiments');
    }
  } else if (textbookTitle.includes('Health')) {
    if (chapterTitle.toLowerCase().includes('yoga')) {
      topics.push('Asanas', 'Pranayama', 'Meditation');
    } else if (chapterTitle.toLowerCase().includes('diet')) {
      topics.push('Nutrition', 'Balanced Diet', 'Food Groups');
    } else if (chapterTitle.toLowerCase().includes('sports')) {
      topics.push('Techniques', 'Rules', 'Fitness');
    } else {
      topics.push('Theory', 'Practice', 'Benefits');
    }
  } else if (textbookTitle.includes('English')) {
    topics.push('Grammar', 'Vocabulary', 'Comprehension', 'Writing Skills');
  } else if (textbookTitle.includes('NABH')) {
    topics.push('Standards', 'Compliance', 'Quality Metrics', 'Accreditation');
  } else {
    topics.push('Overview', 'Key Points', 'Summary');
  }

  return topics;
}

populateChapters().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});