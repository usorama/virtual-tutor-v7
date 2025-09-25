import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function NotesPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Notes</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Notes Collection
              </CardTitle>
              <CardDescription>
                Your saved notes will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No notes yet. Start a learning session to create notes!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}