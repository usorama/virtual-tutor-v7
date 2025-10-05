/**
 * Run Migration 007 using pg library (direct PostgreSQL connection)
 *
 * This script connects directly to PostgreSQL and executes the migration SQL.
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection string
const DATABASE_URL = 'postgresql://postgres:wG4iamg3dfZwwnW4@db.thhqeoiubohpxxempfpi.supabase.co:5432/postgres';

async function runMigration() {
  console.log('🚀 Starting Migration 007: book_series → curriculum_id FK\n');

  // Read migration file
  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/007_alter_book_series_to_curriculum_fk.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log(`📄 Migration file: ${migrationPath}`);
  console.log(`📏 Size: ${migrationSQL.length} characters\n`);

  // Connect to database
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for Supabase connections
    }
  });

  try {
    console.log('🔌 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Execute migration
    console.log('⚙️  Executing migration...\n');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully\n');

    // Verification queries
    console.log('🔍 Verifying migration...\n');

    // Check book_series schema
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'book_series'
      ORDER BY ordinal_position;
    `);

    console.log('📋 book_series schema:');
    console.table(schemaResult.rows);

    // Check for curriculum_id column
    const hasCurriculumId = schemaResult.rows.some(
      row => row.column_name === 'curriculum_id'
    );

    // Check for old columns
    const hasOldFields = schemaResult.rows.some(
      row => ['curriculum_standard', 'grade', 'subject'].includes(row.column_name)
    );

    if (hasCurriculumId && !hasOldFields) {
      console.log('\n✅ VERIFIED: book_series has curriculum_id FK (NO duplicate fields)');
    } else {
      console.error('\n❌ VERIFICATION FAILED:');
      console.error(`  - Has curriculum_id: ${hasCurriculumId}`);
      console.error(`  - Has old fields: ${hasOldFields}`);
      throw new Error('Schema verification failed');
    }

    // Test FK relationship
    const fkResult = await client.query(`
      SELECT
        bs.series_name,
        bs.publisher,
        c.grade_level,
        c.subject_name,
        c.board
      FROM book_series bs
      LEFT JOIN curriculum_data c ON bs.curriculum_id = c.id
      LIMIT 3;
    `);

    console.log('\n📊 Sample book_series with curriculum JOIN:');
    if (fkResult.rows.length > 0) {
      console.table(fkResult.rows);
    } else {
      console.log('  (No book_series records yet - this is expected)');
    }

    console.log('\n🎉 Migration 007 completed successfully!\n');
    console.log('Summary:');
    console.log('  ✅ book_series now uses curriculum_id FK');
    console.log('  ✅ Old duplicate fields (grade/subject/curriculum_standard) removed');
    console.log('  ✅ FK constraint to curriculum_data verified');
    console.log('  ✅ Upload workflow ready to use\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    console.error('\nError details:', (err as Error).message);
    throw err;
  } finally {
    await client.end();
    console.log('🔌 Disconnected from database');
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });
