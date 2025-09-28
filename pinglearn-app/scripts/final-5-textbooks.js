#!/usr/bin/env node

/**
 * FINAL SOLUTION: Create exactly 5 textbooks
 * - Grade cannot be null (use 0 for non-grade books)
 * - Each folder = 1 textbook
 * - PDFs within folders = chapters
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteExisting() {
  console.log('🗑️  Cleaning existing data...');

  // Delete chapters first
  const { data: chapters } = await supabase.from('chapters').select('id');
  for (const ch of chapters || []) {
    await supabase.from('chapters').delete().eq('id', ch.id);
  }

  // Delete textbooks
  const { data: textbooks } = await supabase.from('textbooks').select('id');
  for (const tb of textbooks || []) {
    await supabase.from('textbooks').delete().eq('id', tb.id);
  }

  console.log('✅ Cleaned existing data\n');
}

async function createFiveTextbooks() {
  console.log('📚 Creating exactly 5 textbooks...\n');

  const textbooks = [
    {
      title: 'Class X Mathematics NCERT',
      file_name: 'class-x-mathematics.pdf',
      grade: 10,
      subject: 'Mathematics',
      folder: 'Class X Mathematics',
      expectedPDFs: 18
    },
    {
      title: 'Class X Science NCERT',
      file_name: 'class-x-science.pdf',
      grade: 10,
      subject: 'Science',
      folder: 'Class X Science NCERT',
      expectedPDFs: 30
    },
    {
      title: 'Class X Health and Physical Education',
      file_name: 'class-x-health-pe.pdf',
      grade: 10,
      subject: 'Health and Physical Education',
      folder: 'Class X Health and PE',
      expectedPDFs: 28
    },
    {
      title: 'Objective General English',
      file_name: 'Objective General English_S. P. Bakshi_70MB.pdf',
      grade: 12, // Use 12 for general/advanced English
      subject: 'English Language',
      folder: 'English',
      expectedPDFs: 1
    },
    {
      title: 'NABH Dental Accreditation Standards Manual',
      file_name: 'Dental-Accreditation-Standards NABH MANUAL.pdf',
      grade: 99, // Use 99 for business/professional
      subject: 'Healthcare Administration',
      folder: 'NABH-manual',
      expectedPDFs: 1
    }
  ];

  const createdBooks = [];

  for (const tb of textbooks) {
    const { data, error } = await supabase
      .from('textbooks')
      .insert({
        title: tb.title,
        file_name: tb.file_name,
        grade: tb.grade,
        subject: tb.subject,
        status: 'ready'
      })
      .select()
      .single();

    if (error) {
      console.log(`❌ ${tb.title}: ${error.message}`);
    } else {
      console.log(`✅ ${tb.title}`);
      console.log(`   Grade: ${tb.grade} | Subject: ${tb.subject}`);
      console.log(`   Folder: ${tb.folder} (${tb.expectedPDFs} PDFs)\n`);

      createdBooks.push({ ...data, folder: tb.folder });
    }
  }

  return createdBooks;
}

async function createSampleChapters(textbooks) {
  console.log('📄 Creating sample chapters...\n');

  const textbooksPath = path.join(__dirname, '../../text-books');

  for (const tb of textbooks) {
    const folderPath = path.join(textbooksPath, tb.folder);

    try {
      const files = await fs.readdir(folderPath);
      const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf')).sort();

      console.log(`${tb.title}: ${pdfFiles.length} PDFs`);

      // Create first 3 chapters as samples
      const toCreate = Math.min(3, pdfFiles.length);

      for (let i = 0; i < toCreate; i++) {
        let chapterTitle = pdfFiles[i]
          .replace('.pdf', '')
          .replace(/_/g, ' ')
          .replace(/^\d+-/, '')
          .replace(/Class X \w+ - /, '')
          .replace(/Ch \d+ - /, '')
          .trim();

        const { error } = await supabase
          .from('chapters')
          .insert({
            textbook_id: tb.id,
            title: chapterTitle.substring(0, 50),
            chapter_number: i + 1,
            topics: ['Introduction', 'Concepts', 'Practice'],
            page_start: 0,
            page_end: 50
          });

        if (!error) {
          console.log(`   ✓ Chapter ${i + 1}: ${chapterTitle.substring(0, 40)}...`);
        }
      }
    } catch (err) {
      console.log(`   ⚠️  Could not read folder: ${tb.folder}`);
    }
  }
}

async function verify() {
  console.log('\n✅ FINAL VERIFICATION\n');

  const { data: textbooks } = await supabase
    .from('textbooks')
    .select('title, grade, subject');

  const { count: chapCount } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Database Structure:');
  console.log(`   Textbooks: ${textbooks?.length || 0}/5`);
  console.log(`   Sample Chapters: ${chapCount || 0}\n`);

  if (textbooks) {
    console.log('📚 Textbook Summary:');
    textbooks.forEach((tb, i) => {
      console.log(`${i + 1}. ${tb.title}`);
      console.log(`   Grade: ${tb.grade === 99 ? 'Business' : tb.grade === 12 ? 'General' : tb.grade}`);
      console.log(`   Subject: ${tb.subject}\n`);
    });
  }

  if (textbooks?.length === 5) {
    console.log('✨ SUCCESS! Exactly 5 textbooks created!');
    console.log('\n📝 Grade Mapping:');
    console.log('   • Grade 10 = Class X');
    console.log('   • Grade 12 = General/Advanced English');
    console.log('   • Grade 99 = Business/Professional');
  }
}

async function main() {
  console.log('\n🎯 CREATING CORRECT 5-TEXTBOOK STRUCTURE');
  console.log('=' .repeat(60) + '\n');

  // Step 1: Clean existing data
  await deleteExisting();

  // Step 2: Create 5 textbooks
  const textbooks = await createFiveTextbooks();

  // Step 3: Create sample chapters
  await createSampleChapters(textbooks);

  // Step 4: Verify
  await verify();

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Database restructure complete!');
  console.log('Next: Update processing logic to maintain this structure');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});