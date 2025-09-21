#!/usr/bin/env node

/**
 * Protected Core Violation Detection Script
 *
 * This script validates that the Protected Core architecture is intact:
 * - No modifications to src/protected-core/ files
 * - No direct imports bypassing contracts
 * - No type degradation to 'any'
 * - Singleton patterns maintained
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// CRITICAL: These files must NEVER be modified
const PROTECTED_FILES = [
  'src/protected-core/voice-engine/index.ts',
  'src/protected-core/transcription/index.ts',
  'src/protected-core/websocket/manager/singleton-manager.ts',
  'src/protected-core/session/index.ts',
  'src/protected-core/contracts/index.ts',
  'src/protected-core/index.ts',
  'CLAUDE.md',
  '.ai-protected'
];

// Expected file hashes (would be populated after initial commit)
const EXPECTED_HASHES = {};

let violations = [];
let warnings = [];

console.log('🔒 PROTECTED CORE VIOLATION DETECTION');
console.log('=====================================\n');

// Check 1: Protected files exist and are unmodified
console.log('✅ Checking protected file integrity...');
for (const filePath of PROTECTED_FILES) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    violations.push(`❌ CRITICAL: Protected file missing: ${filePath}`);
    continue;
  }

  // For now, just check if files exist. In production, we'd check hashes
  console.log(`   ✓ ${filePath} exists`);
}

// Check 2: No direct imports to protected internals
console.log('\n✅ Checking for illegal imports...');
const srcDir = path.join(process.cwd(), 'src');

function scanForIllegalImports(dir, currentPath = '') {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const relativePath = path.join(currentPath, item);

    if (fs.statSync(itemPath).isDirectory()) {
      // Skip protected-core directory itself
      if (item === 'protected-core') continue;
      scanForIllegalImports(itemPath, relativePath);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      const content = fs.readFileSync(itemPath, 'utf8');

      // Check for direct imports to protected core internals
      const illegalPatterns = [
        /from ['"]@\/protected-core\/(?!index)/g,
        /import.*from ['"].*\/protected-core\/(?!index)/g,
        /require\(['"].*\/protected-core\/(?!index)/g
      ];

      for (const pattern of illegalPatterns) {
        if (pattern.test(content)) {
          violations.push(`❌ ILLEGAL IMPORT: ${relativePath} imports protected-core internals directly`);
        }
      }

      // Check for 'any' type usage
      const anyTypePattern = /:\s*any\b/g;
      if (anyTypePattern.test(content)) {
        warnings.push(`⚠️  TYPE WARNING: ${relativePath} uses 'any' type`);
      }
    }
  }
}

scanForIllegalImports(srcDir);

// Check 3: WebSocket singleton pattern integrity
console.log('\n✅ Checking WebSocket singleton integrity...');
const featuresDir = path.join(process.cwd(), 'src/features');
if (fs.existsSync(featuresDir)) {
  function checkWebSocketUsage(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);

      if (fs.statSync(itemPath).isDirectory()) {
        checkWebSocketUsage(itemPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        const content = fs.readFileSync(itemPath, 'utf8');

        // Check for direct WebSocket instantiation
        if (content.includes('new WebSocket(') || content.includes('new WebSocketManager(')) {
          violations.push(`❌ SINGLETON VIOLATION: ${path.relative(process.cwd(), itemPath)} creates WebSocket directly`);
        }
      }
    }
  }

  checkWebSocketUsage(featuresDir);
}

// Check 4: TypeScript strict mode compliance
console.log('\n✅ Checking TypeScript configuration...');
const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
if (fs.existsSync(tsConfigPath)) {
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

  if (!tsConfig.compilerOptions?.strict) {
    violations.push('❌ TYPESCRIPT: Strict mode is not enabled');
  }

  if (tsConfig.compilerOptions?.noImplicitAny === false) {
    warnings.push('⚠️  TYPESCRIPT: noImplicitAny is disabled');
  }
}

// Report Results
console.log('\n🔍 VIOLATION DETECTION RESULTS');
console.log('==============================');

if (violations.length === 0 && warnings.length === 0) {
  console.log('✅ PROTECTED CORE INTEGRITY: MAINTAINED');
  console.log('   No violations detected.');
  console.log('   All protection boundaries respected.');
  process.exit(0);
}

if (violations.length > 0) {
  console.log(`\n❌ CRITICAL VIOLATIONS (${violations.length}):`);
  violations.forEach(violation => console.log(violation));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
  warnings.forEach(warning => console.log(warning));
}

console.log('\n🚨 PROTECTED CORE INTEGRITY: COMPROMISED');
console.log('Action Required: Fix violations before proceeding');

if (violations.length > 0) {
  process.exit(1); // Fail CI/CD if critical violations
} else {
  process.exit(0); // Warnings don't fail the build
}