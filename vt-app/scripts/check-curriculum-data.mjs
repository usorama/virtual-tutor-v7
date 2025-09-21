#!/usr/bin/env node

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function checkCurriculumData() {
  try {
    console.log('🔍 Checking curriculum_data table...')

    // Check if table exists and get some data
    const { data, error } = await supabase
      .from('curriculum_data')
      .select('grade, subject, topics')
      .limit(10)

    if (error) {
      console.error('❌ Error querying curriculum_data:', error.message)

      // Check if table exists
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'curriculum_data')

      if (tablesError || !tables || tables.length === 0) {
        console.log('❌ curriculum_data table does not exist!')
        return
      }

      return
    }

    if (!data || data.length === 0) {
      console.log('⚠️  curriculum_data table is empty!')
      console.log('🔧 Need to populate curriculum data')
      return
    }

    console.log(`✅ Found ${data.length} curriculum records`)

    // Get unique grades
    const grades = [...new Set(data.map(item => item.grade))].sort()
    console.log('📚 Available grades:', grades)

    // Show breakdown by grade and subject
    for (const grade of grades) {
      const gradeData = data.filter(item => item.grade === grade)
      const subjects = [...new Set(gradeData.map(item => item.subject))]

      console.log(`\nGrade ${grade}:`)
      for (const subject of subjects) {
        const subjectData = gradeData.filter(item => item.subject === subject)
        const topicCount = subjectData.reduce((acc, item) => acc + (item.topics?.length || 0), 0)
        console.log(`  - ${subject}: ${topicCount} topics`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkCurriculumData()