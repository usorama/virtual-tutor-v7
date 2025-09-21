#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkDatabase() {
  console.log('🔍 Checking database tables...\n')
  
  const tables = [
    'profiles',
    'textbooks', 
    'chapters',
    'content_chunks',
    'curriculum_data'
  ]
  
  let allTablesExist = true
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table '${table}' - NOT FOUND`)
        allTablesExist = false
      } else {
        console.log(`✅ Table '${table}' - EXISTS`)
      }
    } catch (err) {
      console.log(`❌ Table '${table}' - ERROR: ${err}`)
      allTablesExist = false
    }
  }
  
  console.log('\n' + '='.repeat(50))
  
  if (allTablesExist) {
    console.log('✅ All required tables exist! Database is ready.')
  } else {
    console.log(`
❌ Some tables are missing. Please run the migrations:

1. Go to: https://supabase.com/dashboard/project/${supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]}/sql/new
2. Run the migration SQL from: scripts/run-all-migrations.ts
3. After running migrations, test again with: pnpm tsx scripts/check-database.ts
`)
  }
}

checkDatabase()