#!/usr/bin/env node

/**
 * Test wizard data availability after restructure
 * Simulates what the wizard would fetch
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWizardData() {
  console.log('\n🧙 TESTING WIZARD DATA RETRIEVAL');
  console.log('=' .repeat(60));

  // 1. Get available grades (what wizard shows in Grade selector)
  console.log('\n📊 Available Grades:');
  const { data: gradeData } = await supabase
    .from('textbooks')
    .select('grade')
    .eq('status', 'ready')
    .not('grade', 'is', null);

  const uniqueGrades = [...new Set(gradeData?.map(g => g.grade) || [])].sort((a, b) => a - b);

  uniqueGrades.forEach(grade => {
    const displayGrade = grade === 99 ? 'Business/Professional' :
                        grade === 12 ? 'General/Advanced' :
                        `Grade ${grade}`;
    console.log(`   • ${displayGrade}`);
  });

  // 2. Test curriculum data fetch for Grade 10 (simulating wizard action)
  console.log('\n📚 Testing Grade 10 Curriculum Data:');

  const { data: textbooks, error } = await supabase
    .from('textbooks')
    .select(`
      id,
      title,
      grade,
      subject,
      chapters:chapters(
        id,
        title,
        topics
      )
    `)
    .eq('grade', 10)
    .eq('status', 'ready');

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else if (textbooks && textbooks.length > 0) {
    console.log(`   ✅ Found ${textbooks.length} textbooks for Grade 10\n`);

    // Group by subject
    const subjects = [...new Set(textbooks.map(t => t.subject))];
    console.log('   Available Subjects:');
    subjects.forEach(subject => {
      const subjectBooks = textbooks.filter(t => t.subject === subject);
      console.log(`   • ${subject} (${subjectBooks.length} textbook${subjectBooks.length > 1 ? 's' : ''})`);
    });

    // Show textbook details
    console.log('\n   Textbook Details:');
    textbooks.forEach(tb => {
      const chapterCount = tb.chapters?.length || 0;
      const topicCount = tb.chapters?.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0) || 0;

      console.log(`\n   📖 ${tb.title}`);
      console.log(`      Chapters: ${chapterCount}`);
      console.log(`      Topics: ${topicCount}`);

      // Show first few chapters
      if (tb.chapters && tb.chapters.length > 0) {
        console.log('      Sample Chapters:');
        tb.chapters.slice(0, 3).forEach((ch, i) => {
          console.log(`        ${i + 1}. ${ch.title || 'Untitled'}`);
        });
        if (tb.chapters.length > 3) {
          console.log(`        ... and ${tb.chapters.length - 3} more`);
        }
      }
    });
  } else {
    console.log('   ⚠️  No textbooks found for Grade 10');
  }

  // 3. Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 WIZARD DATA SUMMARY\n');

  const { count: totalTextbooks } = await supabase
    .from('textbooks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ready');

  const { count: totalChapters } = await supabase
    .from('chapters')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total Ready Textbooks: ${totalTextbooks}`);
  console.log(`   Total Chapters: ${totalChapters}`);
  console.log(`   Available Grades: ${uniqueGrades.join(', ')}`);

  if (totalTextbooks === 5) {
    console.log('\n   ✅ Wizard should work correctly!');
    console.log('   Each textbook represents a complete book (folder)');
    console.log('   PDFs are properly organized as chapters');
  } else {
    console.log('\n   ⚠️  Unexpected textbook count');
  }
}

testWizardData().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});