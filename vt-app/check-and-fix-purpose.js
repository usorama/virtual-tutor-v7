const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseServiceKey = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixPurpose() {
  console.log('🔍 Checking profiles table structure and data...\n');

  try {
    // 1. Fetch all profiles to see structure
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      console.error('Error details:', JSON.stringify(profilesError, null, 2));
      return;
    }

    console.log('📊 Sample profiles (first 3):');
    profiles.forEach((profile, index) => {
      console.log(`\nProfile ${index + 1}:`);
      console.log('  Email:', profile.email);
      console.log('  Grade:', profile.grade);
      console.log('  Purpose:', profile.learning_purpose || '❌ MISSING');
      console.log('  Subjects:', profile.preferred_subjects);
      console.log('  Topics:', profile.selected_topics ? 'Present' : 'Empty');
    });

    // 2. Check specifically for test user
    console.log('\n🧪 Checking test user...');
    const { data: testUser, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'test@example.com')
      .single();

    if (testError) {
      if (testError.code === 'PGRST116') {
        console.log('⚠️  Test user profile not found - will be created on first login');
      } else {
        console.error('❌ Error fetching test user:', testError);
      }
    } else {
      console.log('Test user found:');
      console.log('  ID:', testUser.id);
      console.log('  Grade:', testUser.grade);
      console.log('  Purpose:', testUser.learning_purpose || '❌ MISSING');
      console.log('  Subjects:', testUser.preferred_subjects);

      // Fix missing purpose for test user
      if (!testUser.learning_purpose && testUser.grade) {
        console.log('\n🔧 Fixing missing purpose for test user...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            learning_purpose: 'new_class',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'test@example.com');

        if (updateError) {
          console.error('❌ Error updating test user:', updateError);
        } else {
          console.log('✅ Test user purpose set to "new_class"');
        }
      }
    }

    // 3. Count profiles with and without purpose
    console.log('\n📈 Profile statistics:');
    const { count: totalCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: withPurposeCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('learning_purpose', 'is', null);

    console.log('  Total profiles:', totalCount);
    console.log('  With purpose:', withPurposeCount);
    console.log('  Missing purpose:', totalCount - withPurposeCount);

    // 4. Fix all profiles missing purpose but have grade
    if (totalCount - withPurposeCount > 0) {
      console.log('\n🔧 Fixing profiles with grade but no purpose...');
      const { data: profilesToFix, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, grade')
        .is('learning_purpose', null)
        .not('grade', 'is', null);

      if (!fetchError && profilesToFix && profilesToFix.length > 0) {
        console.log(`Found ${profilesToFix.length} profiles to fix`);

        for (const profile of profilesToFix) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              learning_purpose: 'new_class',
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);

          if (updateError) {
            console.error(`❌ Failed to update ${profile.email}:`, updateError.message);
          } else {
            console.log(`✅ Fixed ${profile.email}`);
          }
        }
      }
    }

    console.log('\n✨ Check complete!');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the check
checkAndFixPurpose();