#!/usr/bin/env tsx
/**
 * RAG Infrastructure Validation Script
 * Agent 7B - BMAD Developer
 *
 * Validates:
 * 1. Database tables and schema
 * 2. Embedding columns and pgvector extension
 * 3. Content data availability
 * 4. Notes generation infrastructure
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thhqeoiubohpxxempfpi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface ValidationResult {
  category: string;
  check: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  evidence?: any;
}

const results: ValidationResult[] = [];

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(0);
    return !error;
  } catch {
    return false;
  }
}

async function checkTableRowCount(tableName: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) return -1;
    return count || 0;
  } catch {
    return -1;
  }
}

async function checkPgvectorExtension(): Promise<boolean> {
  try {
    // Try to execute a query that would only work if pgvector is installed
    const { data, error } = await supabase.rpc('get_extensions');
    if (error) {
      // Fallback: check if we can create a vector type (will fail if no pgvector)
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}

async function validateDatabase() {
  console.log('\n🔍 PHASE 1: DATABASE CONTENT VALIDATION\n');
  console.log('=' .repeat(60));

  // 1. Check critical tables existence
  console.log('\n📋 Checking Table Existence...\n');

  const tables = [
    'textbooks',
    'books',
    'book_series',
    'book_chapters',
    'content_chunks',
    'enhanced_content_chunks',
    'content_sections',
    'curriculum_data',
    'session_analytics'
  ];

  for (const table of tables) {
    const exists = await checkTableExists(table);
    const rowCount = exists ? await checkTableRowCount(table) : -1;

    results.push({
      category: 'Database Schema',
      check: `Table: ${table}`,
      status: exists ? (rowCount > 0 ? 'PASS' : 'WARNING') : 'FAIL',
      details: exists
        ? `${rowCount} rows`
        : 'Table does not exist',
      evidence: { exists, rowCount }
    });

    console.log(`  ${exists ? (rowCount > 0 ? '✅' : '⚠️') : '❌'} ${table}: ${exists ? `${rowCount} rows` : 'NOT FOUND'}`);
  }

  // 2. Check embedding infrastructure
  console.log('\n\n🧩 Checking Embedding Infrastructure...\n');

  // Check for embedding column in content_chunks
  const contentChunksHasEmbedding = await checkColumnExists('content_chunks', 'embedding');
  results.push({
    category: 'Embedding Infrastructure',
    check: 'content_chunks.embedding column',
    status: contentChunksHasEmbedding ? 'PASS' : 'FAIL',
    details: contentChunksHasEmbedding ? 'Column exists' : 'Column missing',
    evidence: { exists: contentChunksHasEmbedding }
  });
  console.log(`  ${contentChunksHasEmbedding ? '✅' : '❌'} content_chunks.embedding: ${contentChunksHasEmbedding ? 'EXISTS' : 'MISSING'}`);

  // Check for embedding column in enhanced_content_chunks
  const enhancedChunksHasEmbedding = await checkColumnExists('enhanced_content_chunks', 'embedding');
  results.push({
    category: 'Embedding Infrastructure',
    check: 'enhanced_content_chunks.embedding column',
    status: enhancedChunksHasEmbedding ? 'PASS' : 'WARNING',
    details: enhancedChunksHasEmbedding ? 'Column exists' : 'Column missing (expected)',
    evidence: { exists: enhancedChunksHasEmbedding }
  });
  console.log(`  ${enhancedChunksHasEmbedding ? '✅' : '⚠️'} enhanced_content_chunks.embedding: ${enhancedChunksHasEmbedding ? 'EXISTS' : 'MISSING'}`);

  // Check for pgvector extension
  console.log(`  ⏳ pgvector extension: CHECKING...`);
  const hasPgvector = await checkPgvectorExtension();
  results.push({
    category: 'Embedding Infrastructure',
    check: 'pgvector extension',
    status: hasPgvector ? 'PASS' : 'FAIL',
    details: hasPgvector ? 'Extension installed' : 'Extension not found',
    evidence: { installed: hasPgvector }
  });
  console.log(`  ${hasPgvector ? '✅' : '❌'} pgvector extension: ${hasPgvector ? 'INSTALLED' : 'NOT FOUND'}`);

  // 3. Check content availability for RAG
  console.log('\n\n📚 Checking Content Availability...\n');

  // Check textbooks
  const textbooksCount = await checkTableRowCount('textbooks');
  results.push({
    category: 'Content Availability',
    check: 'Textbooks available',
    status: textbooksCount > 0 ? 'PASS' : 'FAIL',
    details: `${textbooksCount} textbooks`,
    evidence: { count: textbooksCount }
  });
  console.log(`  ${textbooksCount > 0 ? '✅' : '❌'} Textbooks: ${textbooksCount}`);

  // Check book_series
  const bookSeriesCount = await checkTableRowCount('book_series');
  results.push({
    category: 'Content Availability',
    check: 'Book series available',
    status: bookSeriesCount > 0 ? 'PASS' : 'FAIL',
    details: `${bookSeriesCount} book series`,
    evidence: { count: bookSeriesCount }
  });
  console.log(`  ${bookSeriesCount > 0 ? '✅' : '❌'} Book Series: ${bookSeriesCount}`);

  // Check content chunks
  const contentChunksCount = await checkTableRowCount('content_chunks');
  results.push({
    category: 'Content Availability',
    check: 'Content chunks available',
    status: contentChunksCount > 0 ? 'PASS' : 'FAIL',
    details: `${contentChunksCount} chunks`,
    evidence: { count: contentChunksCount }
  });
  console.log(`  ${contentChunksCount > 0 ? '✅' : '❌'} Content Chunks: ${contentChunksCount}`);

  // Check enhanced content chunks
  const enhancedChunksCount = await checkTableRowCount('enhanced_content_chunks');
  results.push({
    category: 'Content Availability',
    check: 'Enhanced content chunks available',
    status: enhancedChunksCount > 0 ? 'PASS' : 'WARNING',
    details: `${enhancedChunksCount} enhanced chunks`,
    evidence: { count: enhancedChunksCount }
  });
  console.log(`  ${enhancedChunksCount > 0 ? '✅' : '⚠️'} Enhanced Content Chunks: ${enhancedChunksCount}`);

  // 4. Check sample data from content_chunks if it exists
  if (contentChunksCount > 0) {
    console.log('\n\n🔬 Inspecting Sample Content Chunk...\n');
    const { data: sampleChunk, error } = await supabase
      .from('content_chunks')
      .select('*')
      .limit(1)
      .single();

    if (!error && sampleChunk) {
      console.log('  Sample chunk structure:');
      console.log(`    - ID: ${sampleChunk.id}`);
      console.log(`    - Has embedding: ${sampleChunk.embedding ? 'YES' : 'NO'}`);
      console.log(`    - Has has_embedding flag: ${sampleChunk.has_embedding !== undefined ? 'YES' : 'NO'}`);
      console.log(`    - Content length: ${sampleChunk.content?.length || 0} chars`);
      console.log(`    - Fields: ${Object.keys(sampleChunk).join(', ')}`);

      results.push({
        category: 'Content Structure',
        check: 'Sample content chunk inspection',
        status: 'PASS',
        details: 'Successfully retrieved sample chunk',
        evidence: {
          fields: Object.keys(sampleChunk),
          hasEmbedding: !!sampleChunk.embedding,
          hasEmbeddingFlag: sampleChunk.has_embedding !== undefined
        }
      });
    }
  }

  // 5. Check curriculum data
  console.log('\n\n🎓 Checking Curriculum Data...\n');

  const curriculumCount = await checkTableRowCount('curriculum_data');
  results.push({
    category: 'Curriculum Data',
    check: 'Curriculum data populated',
    status: curriculumCount > 0 ? 'PASS' : 'FAIL',
    details: `${curriculumCount} curriculum entries`,
    evidence: { count: curriculumCount }
  });
  console.log(`  ${curriculumCount > 0 ? '✅' : '❌'} Curriculum Data: ${curriculumCount} entries`);

  // Print summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY\n');

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;

  console.log(`  ✅ PASS: ${passCount}`);
  console.log(`  ❌ FAIL: ${failCount}`);
  console.log(`  ⚠️  WARNING: ${warningCount}`);
  console.log(`  📋 TOTAL: ${results.length}`);

  // Critical failures
  const criticalFailures = results.filter(r =>
    r.status === 'FAIL' &&
    (r.check.includes('embedding') || r.check.includes('chunks') || r.check.includes('pgvector'))
  );

  if (criticalFailures.length > 0) {
    console.log('\n\n🚨 CRITICAL FAILURES DETECTED:\n');
    criticalFailures.forEach(failure => {
      console.log(`  ❌ ${failure.check}: ${failure.details}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Save results to file
  const fs = require('fs');
  const reportPath = './docs/evidence/database-validation-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    agent: 'Agent 7B - BMAD Developer',
    totalChecks: results.length,
    passed: passCount,
    failed: failCount,
    warnings: warningCount,
    results: results
  }, null, 2));

  console.log(`\n📄 Full report saved to: ${reportPath}\n`);

  return results;
}

// Run validation
validateDatabase()
  .then(() => {
    console.log('\n✅ Validation complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Validation failed with error:', error);
    process.exit(1);
  });
