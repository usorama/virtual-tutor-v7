import { TopNavigation } from '@/components/layout/TopNavigation';
import { getUser } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';

export async function AuthenticatedLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Use existing auth action instead of direct supabase
  const userResponse = await getUser();

  if (!userResponse.success || !userResponse.data?.user) {
    return <>{children}</>;
  }

  const user = userResponse.data.user;

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