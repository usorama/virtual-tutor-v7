const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://thhqeoiubohpxxempfpi.supabase.co';
const supabaseServiceKey = 'sb_secret_RWYvzYLVlgeO5y7K2HJM9Q_JU-DKrsE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPurposeMigration() {
  console.log('🔧 Applying learning_purpose migration...');

  try {
    // Add learning_purpose column if it doesn't exist
    const { data: addColumn, error: addError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.profiles
        ADD COLUMN IF NOT EXISTS learning_purpose TEXT
        CHECK (learning_purpose IN ('new_class', 'revision', 'exam_prep'));
      `
    });

    if (addError && !addError.message.includes('already exists')) {
      console.error('Error adding learning_purpose column:', addError);
    } else {
      console.log('✅ learning_purpose column ensured');
    }

    // Create index for faster queries
    const { data: addIndex, error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_profiles_learning_purpose
        ON public.profiles(learning_purpose);
      `
    });

    if (indexError && !indexError.message.includes('already exists')) {
      console.error('Error adding index:', indexError);
    } else {
      console.log('✅ Index on learning_purpose created');
    }

    // Check existing profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, grade, learning_purpose, preferred_subjects')
      .limit(5);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else {
      console.log('📊 Sample profiles:', profiles);
    }

    // Check if test user exists
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'test@example.com')
      .single();

    if (testError && testError.code !== 'PGRST116') {
      console.error('Error fetching test profile:', testError);
    } else if (testProfile) {
      console.log('🧪 Test user profile:', testProfile);

      // Update test user if purpose is missing
      if (!testProfile.learning_purpose) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ learning_purpose: 'new_class' })
          .eq('email', 'test@example.com');

        if (updateError) {
          console.error('Error updating test profile:', updateError);
        } else {
          console.log('✅ Updated test user with default purpose');
        }
      }
    }

    console.log('🎉 Migration complete!');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the migration
applyPurposeMigration();