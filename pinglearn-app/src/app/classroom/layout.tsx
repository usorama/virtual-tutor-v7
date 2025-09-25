import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';

export default function ClassroomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  );
}