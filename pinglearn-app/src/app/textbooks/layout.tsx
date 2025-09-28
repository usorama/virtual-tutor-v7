import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/actions';
import { getUserProfile } from '@/lib/wizard/actions';
import { TopNavigation } from '@/components/layout/TopNavigation';

export default async function TextbooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  // Get user profile for navigation
  const { data: profile } = await getUserProfile();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <TopNavigation
        user={{
          email: user.email || '',
          name: user.email || 'User'
        }}
      />
      {children}
    </div>
  );
}