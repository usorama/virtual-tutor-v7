import { TopNavigation } from '@/components/layout/TopNavigation';
import { getUser } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';

export async function AuthenticatedLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Use existing auth action instead of direct supabase
  const user = await getUser();

  if (!user) {
    return <>{children}</>;
  }

  // Get profile for display name using existing pattern
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  const userData = {
    email: user.email || undefined,
    name: profile?.name || undefined
  };

  return (
    <>
      <TopNavigation user={userData} />
      {children}
    </>
  );
}