#!/usr/bin/env tsx
/**
 * Test Embedding Generation System
 * Agent 7B - BMAD Developer
 *
 * Tests:
 * 1. Can embedding generator initialize?
 * 2. Are there content chunks to embed?
 * 3. Does embedding generation work?
 * 4. Does it handle errors properly?
 */

// Load environment variables FIRST
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { EmbeddingGenerator } from '../src/lib/embeddings/generator';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://thhqeoiubohpxxempfpi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Ensure Google API key is set
if (!process.env.GOOGLE_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  console.log('\n⚠️  WARNING: No Google API key found in environment\n');
  console.log('   Setting fallback API key for testing...\n');
  process.env.GOOGLE_API_KEY = 'AIzaSyAdkzyMQTYBbf5dPkW7UOxXHb9rnTLxWoY';
}

async function testEmbeddingGeneration() {
  console.log('\n🧪 PHASE 2: EMBEDDING GENERATION TESTING\n');
  console.log('=' .repeat(60));

  const testResults: any[] = [];

  // Test 1: Can we initialize the generator?
  console.log('\n📦 Test 1: Initialize Embedding Generator\n');
  try {
    const generator = new EmbeddingGenerator();
    console.log('  ✅ Generator initialized successfully');
    testResults.push({
      test: 'Initialize Generator',
      status: 'PASS',
      details: 'Generator created without errors'
    });
  } catch (error: any) {
    console.log(`  ❌ Generator initialization failed: ${error.message}`);
    testResults.push({
      test: 'Initialize Generator',
      status: 'FAIL',
      details: error.message
    });
    console.log('\n❌ Cannot proceed with embedding tests - generator failed to initialize\n');
    return testResults;
  }

  // Test 2: Check for textbooks to process
  console.log('\n📚 Test 2: Check Available Textbooks\n');
  const { data: textbooks, error: textbooksError } = await supabase
    .from('textbooks')
    .select('id, title, status, has_embeddings')
    .limit(5);

  if (textbooksError || !textbooks || textbooks.length === 0) {
    console.log('  ❌ No textbooks found for embedding generation');
    testResults.push({
      test: 'Available Textbooks',
      status: 'FAIL',
      details: 'No textbooks in database'
    });
  } else {
    console.log(`  ✅ Found ${textbooks.length} textbooks:`);
    textbooks.forEach((tb: any) => {
      console.log(`     - ${tb.title} (${tb.status}, embeddings: ${tb.has_embeddings || 'none'})`);
    });
    testResults.push({
      test: 'Available Textbooks',
      status: 'PASS',
      details: `${textbooks.length} textbooks found`,
      evidence: textbooks
    });
  }

  // Test 3: Check for content chunks
  console.log('\n📝 Test 3: Check Content Chunks for First Textbook\n');
  if (textbooks && textbooks.length > 0) {
    const firstTextbook = textbooks[0];
    const { data: chunks, error: chunksError } = await supabase
      .from('content_chunks')
      .select('id, content, textbook_id, has_embedding')
      .eq('textbook_id', firstTextbook.id)
      .limit(5);

    if (chunksError || !chunks || chunks.length === 0) {
      console.log(`  ❌ No content chunks found for textbook: ${firstTextbook.title}`);
      console.log('     This explains why embeddings cannot be generated!');
      testResults.push({
        test: 'Content Chunks Available',
        status: 'FAIL',
        details: 'No content chunks to embed',
        textbook: firstTextbook.title
      });
    } else {
      console.log(`  ✅ Found ${chunks.length} content chunks`);
      console.log(`     Sample chunk: "${chunks[0].content.substring(0, 100)}..."`);
      testResults.push({
        test: 'Content Chunks Available',
        status: 'PASS',
        details: `${chunks.length} chunks found`,
        evidence: chunks[0]
      });
    }
  }

  // Test 4: Try to generate a single embedding
  console.log('\n🔬 Test 4: Generate Single Test Embedding\n');
  try {
    const generator = new EmbeddingGenerator();
    const testText = "The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a";
    console.log(`  Testing with: "${testText}"`);

    const embedding = await generator.generateEmbedding(testText);

    if (embedding && embedding.length > 0) {
      console.log(`  ✅ Successfully generated embedding`);
      console.log(`     - Dimensions: ${embedding.length}`);
      console.log(`     - Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      testResults.push({
        test: 'Generate Single Embedding',
        status: 'PASS',
        details: `Embedding generated with ${embedding.length} dimensions`
      });
    } else {
      console.log('  ❌ Embedding generation returned empty result');
      testResults.push({
        test: 'Generate Single Embedding',
        status: 'FAIL',
        details: 'Empty embedding returned'
      });
    }
  } catch (error: any) {
    console.log(`  ❌ Embedding generation failed: ${error.message}`);
    testResults.push({
      test: 'Generate Single Embedding',
      status: 'FAIL',
      details: error.message,
      error: error.stack
    });
  }

  // Test 5: Try the full textbook embedding process
  console.log('\n🎯 Test 5: Full Textbook Embedding Process\n');
  if (textbooks && textbooks.length > 0) {
    const firstTextbook = textbooks[0];
    console.log(`  Attempting to generate embeddings for: ${firstTextbook.title}`);

    try {
      const generator = new EmbeddingGenerator();
      // This will likely fail because there are no content chunks
      const result = await generator.generateTextbookEmbeddings(firstTextbook.id);

      if (result.success) {
        console.log('  ✅ Textbook embedding process completed successfully');
        console.log(`     - Total chunks: ${result.data?.totalChunks}`);
        console.log(`     - Successful: ${result.data?.successfulEmbeddings}`);
        console.log(`     - Failed: ${result.data?.failedEmbeddings}`);
        console.log(`     - Success rate: ${result.data?.successRate.toFixed(1)}%`);
        testResults.push({
          test: 'Full Textbook Embedding',
          status: 'PASS',
          details: 'Process completed without errors',
          evidence: result.data
        });
      } else {
        console.log(`  ⚠️ Textbook embedding process completed with errors`);
        console.log(`     - Error: ${result.error}`);
        console.log(`     - Success rate: ${result.data?.successRate.toFixed(1)}%`);
        console.log(`     - Failed chunks: ${result.data?.failedChunkIds.join(', ')}`);
        testResults.push({
          test: 'Full Textbook Embedding',
          status: 'FAIL',
          details: result.error || 'Partial failure',
          evidence: result.data,
          failedItems: result.failedItems
        });
      }
    } catch (error: any) {
      console.log(`  ❌ Textbook embedding process failed with exception: ${error.message}`);
      testResults.push({
        test: 'Full Textbook Embedding',
        status: 'FAIL',
        details: error.message,
        textbook: firstTextbook.title
      });
    }
  } else {
    console.log('  ⏭️  Skipping - no textbooks available');
    testResults.push({
      test: 'Full Textbook Embedding',
      status: 'SKIPPED',
      details: 'No textbooks to test with'
    });
  }

  // Print summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 EMBEDDING TEST SUMMARY\n');

  const passCount = testResults.filter((r: any) => r.status === 'PASS').length;
  const failCount = testResults.filter((r: any) => r.status === 'FAIL').length;
  const skipCount = testResults.filter((r: any) => r.status === 'SKIPPED').length;

  console.log(`  ✅ PASS: ${passCount}`);
  console.log(`  ❌ FAIL: ${failCount}`);
  console.log(`  ⏭️  SKIPPED: ${skipCount}`);
  console.log(`  📋 TOTAL: ${testResults.length}`);

  // Key findings
  console.log('\n\n🔍 KEY FINDINGS:\n');

  const criticalFailures = testResults.filter((r: any) => r.status === 'FAIL');
  if (criticalFailures.length > 0) {
    criticalFailures.forEach((failure: any) => {
      console.log(`  ❌ ${failure.test}: ${failure.details}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Save results
  const fs = require('fs');
  const reportPath = './docs/evidence/embedding-generation-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    agent: 'Agent 7B - BMAD Developer',
    totalTests: testResults.length,
    passed: passCount,
    failed: failCount,
    skipped: skipCount,
    results: testResults
  }, null, 2));

  console.log(`\n📄 Full report saved to: ${reportPath}\n`);

  return testResults;
}

// Run tests
testEmbeddingGeneration()
  .then(() => {
    console.log('\n✅ Embedding generation tests complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Tests failed with error:', error);
    process.exit(1);
  });
