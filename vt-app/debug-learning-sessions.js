const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function exploreLearningSessionsTable() {
  console.log('🔍 Checking learning_sessions table structure...\n')

  try {
    const { data: sessions, error } = await supabase
      .from('learning_sessions')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ Error:', error.message)
    } else {
      console.log('✅ learning_sessions table exists')
      console.log('📊 Sample session:', JSON.stringify(sessions[0], null, 2))

      if (sessions && sessions.length > 0) {
        const session = sessions[0]
        console.log('\n📋 Available columns:')
        Object.keys(session).forEach(key => {
          console.log(`  - ${key}: ${typeof session[key]}`)
        })
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message)
  }
}

exploreLearningSessionsTable().catch(console.error)