import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { PracticeComingSoon } from '@/components/practice/PracticeComingSoon'

export default async function PracticePage() {
  const user = await getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <AuthenticatedLayout>
      <PracticeComingSoon />
    </AuthenticatedLayout>
  )
}