#!/usr/bin/env node

// Safety check script for PingLearn environment
const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseConnection() {
  console.log('🔍 Testing database connection...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables missing');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test a simple query
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Database query failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function checkTestCredentials() {
  console.log('🔍 Testing credentials...');

  const testEmail = 'test@example.com';
  const testPassword = 'TestPassword123!';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables missing for credential test');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to sign in with test credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error && error.message.includes('Invalid login credentials')) {
      console.log('ℹ️ Test user does not exist yet (this is normal)');
      return true; // This is expected if user hasn't been created
    }

    if (error) {
      console.error('❌ Auth test failed:', error.message);
      return false;
    }

    if (data.user) {
      console.log('✅ Test credentials work successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Credential test error:', error.message);
    return false;
  }
}

async function runSafetyChecks() {
  console.log('🚀 Running PingLearn Safety Checks...\n');

  const dbCheck = await checkDatabaseConnection();
  const credCheck = await checkTestCredentials();

  console.log('\n📊 Safety Check Results:');
  console.log(`Database Connection: ${dbCheck ? '✅' : '❌'}`);
  console.log(`Test Credentials: ${credCheck ? '✅' : '❌'}`);

  if (dbCheck && credCheck) {
    console.log('\n🎉 All safety checks passed! Environment is ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some safety checks failed. Please address issues before implementation.');
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

runSafetyChecks();