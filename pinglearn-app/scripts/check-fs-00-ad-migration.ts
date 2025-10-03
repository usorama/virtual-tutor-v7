/**
 * Check if FS-00-AD migration (Agent A1) has been completed
 * Verifies new columns: curriculum_type, target_audience, board
 */

import { createClient } from '@supabase/supabase-js';

// Use service key for full database access
const supabase = createClient(
  'https://thhqeoiubohpxxempfpi.supabase.co',
  'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE'  // Service key needed for read access
);

async function checkMigration() {
  console.log('🔍 Checking FS-00-AD Migration Status\n');
  console.log('='.repeat(70));

  // Get a sample curriculum_data record
  const { data: currDataArray, error: currError } = await supabase
    .from('curriculum_data')
    .select('*')
    .limit(1);

  const currData = currDataArray?.[0];

  if (currError) {
    console.log('❌ Error fetching curriculum_data:', currError.message);
    return;
  }

  console.log(`\nQuery returned ${currDataArray?.length || 0} records`);

  if (!currData) {
    console.log('❌ No curriculum_data records found!');
    console.log('   This is unexpected - database should have at least 1 curriculum');
    return;
  }

  console.log('\n📋 Sample curriculum_data record:');
  console.log(JSON.stringify(currData, null, 2));

  console.log('\n📊 New Column Check (FS-00-AD):');
  console.log('-'.repeat(70));

  const checks = {
    curriculum_type: 'curriculum_type' in currData,
    target_audience: 'target_audience' in currData,
    board: 'board' in currData,
  };

  for (const [column, exists] of Object.entries(checks)) {
    const status = exists ? '✅' : '❌';
    const value = exists ? currData[column as keyof typeof currData] : 'NOT FOUND';
    console.log(`${status} ${column}: ${value}`);
  }

  const allColumnsExist = Object.values(checks).every(v => v);

  console.log('\n' + '='.repeat(70));
  if (allColumnsExist) {
    console.log('✅ Agent A1 Migration COMPLETE - All new columns exist');
  } else {
    console.log('❌ Agent A1 Migration NOT COMPLETE - Missing columns');
    console.log('   Required: curriculum_type, target_audience, board');
  }
  console.log('='.repeat(70));
}

checkMigration().catch(console.error);
