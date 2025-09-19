#!/usr/bin/env tsx

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data, error } = await supabase
    .from('content_chunks')
    .select('*')
    .limit(5)

  console.log('Content chunks check:', { 
    count: data?.length || 0, 
    sample: data?.slice(0, 2) 
  })
  
  if (error) {
    console.error('Error:', error)
  }

  // Check if chunks exist with different query
  const { count } = await supabase
    .from('content_chunks')
    .select('*', { count: 'exact', head: true })
  
  console.log('Total content chunks:', count)
}

main().catch(console.error)