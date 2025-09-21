#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

console.log('🚀 Preparing to run migrations directly on Supabase...')
console.log('🔗 Supabase URL:', supabaseUrl)

// Read migration files
const migration1 = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/001_initial_schema.sql'), 
  'utf-8'
)
const migration2 = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/002_profiles_and_curriculum.sql'), 
  'utf-8'
)

console.log(`
📝 Migration SQL to run:

1. Create initial schema (profiles, textbooks, chapters, content_chunks tables)
2. Add curriculum data for grades 9-12

⚠️  IMPORTANT: Please run these migrations manually in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the following SQL:

===== START OF SQL =====
`)

console.log(migration1)
console.log('\n-- Second migration --\n')
console.log(migration2)

console.log(`
===== END OF SQL =====

5. Click "Run" to execute the migrations
6. You should see success messages for table creations

✅ Once done, your database will be ready with:
- profiles table
- textbooks/chapters/content_chunks tables
- curriculum_data table with CBSE data for grades 9-12
- All necessary RLS policies and indexes
`)