/**
 * Create Test User Script
 * Creates a test user profile for development and testing
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseKey = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE'; // Use SECRET key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('👤 Creating Test User Profile\n');
  console.log('='.repeat(70));

  const testEmail = 'deethya@gmail.com';
  const testPassword = 'TestPassword123!';

  // Check if user already exists
  console.log('\n1. Checking if user already exists...');
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', testEmail)
    .single();

  if (existingProfile) {
    console.log('⚠️  User already exists:');
    console.log(JSON.stringify(existingProfile, null, 2));
    console.log('\nTo recreate, first delete the existing user.');
    return;
  }

  // Create auth user
  console.log('\n2. Creating auth user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true, // Auto-confirm email for testing
    user_metadata: {
      first_name: 'Deethya',
    },
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError.message);
    return;
  }

  console.log('✅ Auth user created');
  console.log(`   User ID: ${authData.user.id}`);
  console.log(`   Email: ${authData.user.email}`);

  // Create profile
  console.log('\n3. Creating user profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: testEmail,
      first_name: 'Deethya',
      last_name: 'Test',
      grade: 12,
      preferred_subjects: ['English', 'Mathematics'],
      learning_purpose: 'new_class',
      selected_topics: [],
    })
    .select()
    .single();

  if (profileError) {
    console.error('❌ Error creating profile:', profileError.message);
    console.log('\nNote: Profile might have been auto-created by trigger.');
    console.log('Trying to update instead...');

    // Try updating instead
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: 'Deethya',
        last_name: 'Test',
        grade: 12,
        preferred_subjects: ['English', 'Mathematics'],
        learning_purpose: 'new_class',
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
      return;
    }

    console.log('✅ Profile updated');
    console.log(JSON.stringify(updatedProfile, null, 2));
  } else {
    console.log('✅ Profile created');
    console.log(JSON.stringify(profile, null, 2));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('✅ TEST USER READY\n');
  console.log('Login Credentials:');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  console.log('\nProfile:');
  console.log(`   Grade: 12`);
  console.log(`   Subjects: English, Mathematics`);
  console.log(`   Learning Purpose: New Class`);
  console.log('\nYou can now:');
  console.log('1. Login with these credentials');
  console.log('2. Test preference saving/loading');
  console.log('3. Test topic selection workflow');
  console.log('='.repeat(70));
}

createTestUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Failed to create test user:', error);
    process.exit(1);
  });
