const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function exploreDatabase() {
  console.log('🔍 Exploring database structure...\n')

  // Check what tables exist by trying common ones
  const tablesToCheck = [
    'textbooks',
    'chapters',
    'content_chunks',
    'curriculum_data',
    'profiles',
    'user_profiles',
    'learning_sessions',
    'ai_sessions'
  ]

  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count} rows`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }

  // Check textbooks data specifically
  console.log('\n📚 Checking textbooks data...')
  try {
    const { data: textbooks, error } = await supabase
      .from('textbooks')
      .select('*')
      .limit(5)

    if (error) {
      console.log('❌ Textbooks error:', error.message)
    } else {
      console.log('📖 Textbooks found:', textbooks?.length || 0)
      if (textbooks && textbooks.length > 0) {
        console.log('Sample textbook:', JSON.stringify(textbooks[0], null, 2))
      }
    }
  } catch (err) {
    console.log('❌ Textbooks error:', err.message)
  }

  // Check content chunks
  console.log('\n📝 Checking content chunks...')
  try {
    const { data: chunks, error } = await supabase
      .from('content_chunks')
      .select('*')
      .limit(3)

    if (error) {
      console.log('❌ Content chunks error:', error.message)
    } else {
      console.log('📄 Content chunks found:', chunks?.length || 0)
      if (chunks && chunks.length > 0) {
        console.log('Sample chunk:', JSON.stringify(chunks[0], null, 2))
      }
    }
  } catch (err) {
    console.log('❌ Content chunks error:', err.message)
  }
}

exploreDatabase().catch(console.error)