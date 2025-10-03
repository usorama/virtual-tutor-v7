import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function checkProfile() {
  const userId = '8b050722-b1b1-4e93-a706-345917fd0a16';
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('❌ Error fetching profile:', error);
    return;
  }
  
  console.log('✅ Profile found:');
  console.log(JSON.stringify(profile, null, 2));
}

checkProfile();
