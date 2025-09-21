#!/usr/bin/env tsx
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

if (!supabaseUrl) {
  console.error('Missing Supabase URL')
  process.exit(1)
}

// Parse connection string from Supabase URL
// Format: https://[project-ref].supabase.co -> postgres://postgres.[project-ref]:password@aws-0-[region].pooler.supabase.com:6543/postgres
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!projectRef) {
  console.error('Invalid Supabase URL format')
  process.exit(1)
}

// Get the database password from service role key (contains database password)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// For direct database connection, we need the connection string
// Let's use the Supabase client library method instead
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
})

async function runMigration() {
  console.log('🚀 Running migration...')
  
  try {
    // Since we can't execute raw SQL directly, let's create the tables using Supabase client
    // First, check if curriculum_data table exists
    const { data: tables } = await supabase
      .from('curriculum_data')
      .select('id')
      .limit(1)

    if (tables) {
      console.log('✅ Tables already exist, skipping migration')
      return
    }
  } catch {
    // Table doesn't exist, proceed with creation
    console.log('📋 Tables do not exist, proceeding with migration...')
  }

  console.log('ℹ️ Note: Please run the migration SQL directly in your Supabase dashboard:')
  console.log('1. Go to https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
  console.log('2. Copy and paste the migration from: supabase/migrations/002_profiles_and_curriculum.sql')
  console.log('3. Click "Run" to execute the migration')
  console.log('')
  console.log('Alternatively, you can use the Supabase CLI with remote database connection.')
}

runMigration()