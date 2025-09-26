import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { getUserProfile, checkWizardCompletion, getTextbookCount } from '@/lib/wizard/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth/actions'
import { GraduationCap } from 'lucide-react'
import { GRADE_LABELS } from '@/types/wizard'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { Component as EtheralShadow } from '@/components/ui/etheral-shadow'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Check wizard completion and get profile
  const { needsWizard } = await checkWizardCompletion()
  const { data: profile } = await getUserProfile()
  const { data: textbookCount } = await getTextbookCount()

  if (needsWizard) {
    redirect('/wizard')
  }

  return (
    <AuthenticatedLayout>
      {/* Main container with ethereal background */}
      <div className="relative h-screen overflow-hidden bg-black">
        {/* Ethereal shadow background */}
        <EtheralShadow
          color="rgba(60, 60, 70, 0.8)"
          animation={{ scale: 50, speed: 80 }}
          noise={{ opacity: 30, scale: 0.5 }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0
          }}
        />

        {/* Content layer */}
        <div className="relative z-10 h-full overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-title1 font-heavy text-accent">Welcome Back!</h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-white-70">{user.email}</p>
                  {profile?.grade && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 bg-white-5 border-white-10 text-white-70"
                    >
                      <GraduationCap className="h-3 w-3" />
                      {GRADE_LABELS[profile.grade]}
                    </Badge>
                  )}
                </div>
              </div>
              <form action={signOut}>
                <Button
                  variant="outline"
                  type="submit"
                  className="bg-white-5 border-white-10 text-white-70 hover:bg-white-10 hover:text-white-100"
                >
                  Sign Out
                </Button>
              </form>
            </header>

            {/* Dashboard Content */}
            <DashboardContent
              user={user}
              profile={profile}
              textbookCount={textbookCount || 0}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}