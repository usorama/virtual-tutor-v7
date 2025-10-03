import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function checkAndResetPassword() {
  const email = 'dentist@dental.com';
  const newPassword = 'dental123';
  
  console.log('🔍 Checking auth.users for:', email);
  
  // List all users to find this one
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  
  if (!user) {
    console.log('❌ User not found in auth.users!');
    return;
  }
  
  console.log('✅ User found:');
  console.log('  - ID:', user.id);
  console.log('  - Email:', user.email);
  console.log('  - Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
  console.log('  - Created at:', user.created_at);
  console.log('  - Last sign in:', user.last_sign_in_at || 'Never');
  
  // Reset password to ensure it's correct
  console.log('\n🔄 Resetting password to:', newPassword);
  
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { 
      password: newPassword,
      email_confirm: true
    }
  );
  
  if (updateError) {
    console.error('❌ Error resetting password:', updateError);
    return;
  }
  
  console.log('✅ Password reset successfully!');
  console.log('\nLogin credentials:');
  console.log('  Email:', email);
  console.log('  Password:', newPassword);
}

checkAndResetPassword();
