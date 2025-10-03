import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function resetPassword() {
  const email = 'deethya@gmail.com';
  const newPassword = 'TestPassword123!';

  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error('❌ User not found:', email);
    return;
  }

  console.log('✅ User found:', user.id);

  // Reset password
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      password: newPassword,
      email_confirm: true
    }
  );

  if (updateError) {
    console.error('❌ Error updating password:', updateError);
    return;
  }

  console.log('✅ Password reset successfully for:', email);
  console.log('New password:', newPassword);
}

resetPassword();
