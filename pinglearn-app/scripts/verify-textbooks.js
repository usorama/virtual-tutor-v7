#!/usr/bin/env node

/**
 * Script to verify textbook synchronization between filesystem and database
 * This script checks:
 * 1. What textbooks are in the filesystem
 * 2. What textbooks are stored in the database
 * 3. Which textbooks have embeddings generated
 * 4. What data is available for the wizard
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Initialize Supabase client using NEW 2025 format
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function scanTextbooksDirectory() {
  log('\n📂 SCANNING FILESYSTEM TEXTBOOKS', 'bright');
  log('=' .repeat(50), 'cyan');

  const textbooksPath = path.join(__dirname, '../../text-books');
  const directories = await fs.readdir(textbooksPath);

  const textbooks = [];

  for (const dir of directories) {
    const dirPath = path.join(textbooksPath, dir);
    const stats = await fs.stat(dirPath);

    if (stats.isDirectory() && !dir.startsWith('.')) {
      // Count PDFs in directory
      const files = await fs.readdir(dirPath);
      const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

      textbooks.push({
        name: dir,
        pdfCount: pdfFiles.length,
        path: dirPath
      });

      log(`  📚 ${dir}`, 'yellow');
      log(`     PDFs: ${pdfFiles.length}`, 'reset');

      // Show first few PDF names
      if (pdfFiles.length > 0) {
        pdfFiles.slice(0, 3).forEach(pdf => {
          log(`       - ${pdf.substring(0, 50)}...`, 'reset');
        });
        if (pdfFiles.length > 3) {
          log(`       ... and ${pdfFiles.length - 3} more`, 'reset');
        }
      }
    }
  }

  return textbooks;
}

async function checkDatabaseTextbooks() {
  log('\n💾 CHECKING DATABASE TEXTBOOKS', 'bright');
  log('=' .repeat(50), 'cyan');

  try {
    // Query textbooks table
    const { data: textbooks, error } = await supabase
      .from('textbooks')
      .select('*');

    if (error) {
      log(`  ❌ Error querying textbooks: ${error.message}`, 'red');
      return [];
    }

    if (!textbooks || textbooks.length === 0) {
      log('  ⚠️  No textbooks found in database', 'yellow');
      return [];
    }

    log(`  📊 Total textbooks in database: ${textbooks.length}`, 'green');

    // Group by status
    const statusGroups = {};
    textbooks.forEach(tb => {
      const status = tb.status || 'unknown';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(tb);
    });

    // Display status summary
    Object.entries(statusGroups).forEach(([status, books]) => {
      log(`\n  Status: ${status.toUpperCase()} (${books.length})`, 'blue');
      books.forEach(book => {
        log(`    📖 ${book.title || book.file_name}`, 'reset');
        log(`       Grade: ${book.grade || 'N/A'} | Subject: ${book.subject || 'N/A'}`, 'reset');
        log(`       Processing: ${book.processing_status || 'N/A'} | Embeddings: ${book.embedding_status || 'N/A'}`, 'reset');
      });
    });

    return textbooks;
  } catch (err) {
    log(`  ❌ Unexpected error: ${err.message}`, 'red');
    return [];
  }
}

async function checkChaptersAndTopics() {
  log('\n📚 CHECKING CHAPTERS AND TOPICS', 'bright');
  log('=' .repeat(50), 'cyan');

  try {
    // Query chapters table
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select(`
        id,
        title,
        textbook_id,
        topics,
        textbooks!inner(
          title,
          grade,
          subject
        )
      `);

    if (error) {
      log(`  ❌ Error querying chapters: ${error.message}`, 'red');
      return;
    }

    if (!chapters || chapters.length === 0) {
      log('  ⚠️  No chapters found in database', 'yellow');
      return;
    }

    log(`  📊 Total chapters in database: ${chapters.length}`, 'green');

    // Group by textbook
    const textbookGroups = {};
    chapters.forEach(ch => {
      const textbookTitle = ch.textbooks?.title || 'Unknown Textbook';
      if (!textbookGroups[textbookTitle]) {
        textbookGroups[textbookTitle] = {
          grade: ch.textbooks?.grade,
          subject: ch.textbooks?.subject,
          chapters: []
        };
      }
      textbookGroups[textbookTitle].chapters.push(ch);
    });

    // Display textbook summaries
    Object.entries(textbookGroups).forEach(([title, data]) => {
      log(`\n  📖 ${title}`, 'blue');
      log(`     Grade: ${data.grade || 'N/A'} | Subject: ${data.subject || 'N/A'}`, 'reset');
      log(`     Chapters: ${data.chapters.length}`, 'reset');

      // Count total topics
      const totalTopics = data.chapters.reduce((sum, ch) => {
        return sum + (ch.topics?.length || 0);
      }, 0);
      log(`     Total Topics: ${totalTopics}`, 'green');
    });

  } catch (err) {
    log(`  ❌ Unexpected error: ${err.message}`, 'red');
  }
}

async function checkWizardAvailability() {
  log('\n🧙 CHECKING WIZARD DATA AVAILABILITY', 'bright');
  log('=' .repeat(50), 'cyan');

  try {
    // Check what grades are available
    const { data: grades, error: gradeError } = await supabase
      .from('textbooks')
      .select('grade')
      .eq('status', 'ready')
      .not('grade', 'is', null);

    if (gradeError) {
      log(`  ❌ Error checking grades: ${gradeError.message}`, 'red');
      return;
    }

    const uniqueGrades = [...new Set(grades?.map(g => g.grade))].sort((a, b) => a - b);
    log(`  📊 Available grades: ${uniqueGrades.length > 0 ? uniqueGrades.join(', ') : 'None'}`, uniqueGrades.length > 0 ? 'green' : 'red');

    // Check curriculum data for each grade
    for (const grade of uniqueGrades) {
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
        .eq('grade', grade)
        .eq('status', 'ready');

      if (error) {
        log(`  ❌ Error fetching grade ${grade} data: ${error.message}`, 'red');
        continue;
      }

      log(`\n  Grade ${grade}:`, 'blue');

      if (textbooks && textbooks.length > 0) {
        const subjects = [...new Set(textbooks.map(t => t.subject))].filter(Boolean);
        log(`    Subjects: ${subjects.join(', ')}`, 'reset');

        textbooks.forEach(tb => {
          const chapterCount = tb.chapters?.length || 0;
          const topicCount = tb.chapters?.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0) || 0;
          log(`    📖 ${tb.title}`, 'reset');
          log(`       Chapters: ${chapterCount} | Topics: ${topicCount}`, 'reset');
        });
      } else {
        log(`    ⚠️  No ready textbooks for this grade`, 'yellow');
      }
    }

    // Check if wizard would work
    log('\n  🔍 Wizard Status:', 'bright');
    if (uniqueGrades.length === 0) {
      log('    ❌ WIZARD WILL NOT WORK - No textbooks with status="ready"', 'red');
      log('    💡 Solution: Process and mark textbooks as ready', 'yellow');
    } else {
      const hasData = uniqueGrades.some(async grade => {
        const { data } = await supabase
          .from('textbooks')
          .select('id')
          .eq('grade', grade)
          .eq('status', 'ready')
          .limit(1);
        return data && data.length > 0;
      });

      if (hasData) {
        log('    ✅ WIZARD SHOULD WORK - Data available for grades', 'green');
      } else {
        log('    ⚠️  WIZARD MAY NOT WORK - No topics found', 'yellow');
      }
    }

  } catch (err) {
    log(`  ❌ Unexpected error: ${err.message}`, 'red');
  }
}

async function checkEmbeddings() {
  log('\n🧮 CHECKING EMBEDDINGS', 'bright');
  log('=' .repeat(50), 'cyan');

  try {
    // Check embeddings table
    const { count: embeddingCount, error } = await supabase
      .from('content_embeddings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      log(`  ❌ Error checking embeddings: ${error.message}`, 'red');
      return;
    }

    log(`  📊 Total embeddings in database: ${embeddingCount || 0}`, embeddingCount > 0 ? 'green' : 'yellow');

    // Sample a few embeddings to check structure
    if (embeddingCount > 0) {
      const { data: samples } = await supabase
        .from('content_embeddings')
        .select('id, textbook_id, chapter_id, content_type')
        .limit(5);

      if (samples && samples.length > 0) {
        log('\n  Sample embeddings:', 'reset');
        samples.forEach(sample => {
          log(`    - Type: ${sample.content_type} | Textbook: ${sample.textbook_id}`, 'reset');
        });
      }
    }

  } catch (err) {
    log(`  ❌ Unexpected error: ${err.message}`, 'red');
  }
}

async function main() {
  log('\n🔍 PINGLEARN TEXTBOOK VERIFICATION REPORT', 'bright');
  log('=' .repeat(60), 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'reset');

  // Step 1: Scan filesystem
  const filesystemTextbooks = await scanTextbooksDirectory();

  // Step 2: Check database
  const databaseTextbooks = await checkDatabaseTextbooks();

  // Step 3: Check chapters and topics
  await checkChaptersAndTopics();

  // Step 4: Check embeddings
  await checkEmbeddings();

  // Step 5: Check wizard availability
  await checkWizardAvailability();

  // Summary
  log('\n📊 SUMMARY', 'bright');
  log('=' .repeat(60), 'cyan');

  const filesystemCount = filesystemTextbooks.reduce((sum, tb) => sum + tb.pdfCount, 0);
  const databaseCount = databaseTextbooks.length;
  const readyCount = databaseTextbooks.filter(tb => tb.status === 'ready').length;

  log(`  Filesystem: ${filesystemCount} PDFs in ${filesystemTextbooks.length} directories`, 'yellow');
  log(`  Database: ${databaseCount} textbooks (${readyCount} ready)`, databaseCount > 0 ? 'green' : 'red');

  if (filesystemCount > 0 && databaseCount === 0) {
    log('\n  ⚠️  ISSUE: Textbooks exist in filesystem but not in database', 'red');
    log('  💡 SOLUTION: Run textbook upload and processing workflow', 'yellow');
  } else if (databaseCount > 0 && readyCount === 0) {
    log('\n  ⚠️  ISSUE: Textbooks in database but none marked as ready', 'red');
    log('  💡 SOLUTION: Complete processing and mark textbooks as ready', 'yellow');
  } else if (readyCount > 0) {
    log('\n  ✅ System appears functional with ${readyCount} ready textbooks', 'green');
  }

  log('\n' + '=' .repeat(60), 'cyan');
}

// Run the script
main().catch(err => {
  log(`\n❌ Fatal error: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});