import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/actions';
import { SessionHistory } from '@/components/session/SessionHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SessionsPage() {
  const userResponse = await getUser();

  if (!userResponse.success || !userResponse.data?.user) {
    redirect('/login');
  }

  const user = userResponse.data.user;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">Past Learning Sessions</h1>

        <Card>
          <CardHeader>
            <CardTitle>Your Learning History</CardTitle>
            <CardDescription>
              Review your past sessions and track your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionHistory
              studentId={user.id}
              limit={20}
            />
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}