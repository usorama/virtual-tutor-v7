/**
 * Script to create/update dentist@dental.com user for NABH testing
 * Note: Using grade 12 since profiles table constraint doesn't allow grade 99
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDentistUser() {
  const email = 'dentist@dental.com';
  const password = 'dental123';

  console.log(`Setting up user: ${email}`);

  // Try to create auth user, but continue if already exists
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already') || authError.code === 'email_exists') {
      console.log('User already exists, updating profile...');
    } else {
      console.error('Error creating auth user:', authError);
      return;
    }
  } else {
    console.log('Created new user');
  }

  // Get user ID (whether newly created or existing)
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('Could not find user');
    return;
  }

  const userId = user.id;
  console.log(`User ID: ${userId}`);

  // Update profile with Grade 12 (constraint limitation) and Healthcare Administration from NABH
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      grade: 12,  // Using grade 12 due to profiles table constraint (NABH is grade 99 in textbooks but not allowed in profiles)
      preferred_subjects: ['Healthcare Administration'],
      selected_topics: ['Standards', 'Compliance', 'Quality Metrics', 'Accreditation'],
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('Error updating profile:', profileError);
    return;
  }

  console.log('✅ Successfully set up dentist user!');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Grade: 12 (profiles constraint - NABH topics from grade 99 textbook)`);
  console.log(`Subject: Healthcare Administration (from NABH Dental Accreditation Standards)`);
  console.log(`Topics: Standards, Compliance, Quality Metrics, Accreditation`);
}

createDentistUser().catch(console.error);
