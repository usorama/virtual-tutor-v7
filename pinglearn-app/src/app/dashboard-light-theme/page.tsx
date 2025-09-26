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
import { DashboardContentLight } from '@/components/dashboard/DashboardContentLight'

export default async function DashboardLightPage() {
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
      {/* Main container with light ethereal background */}
      <div className="relative h-screen overflow-hidden bg-white">
        {/* Ethereal shadow background with very subtle colors */}
        <EtheralShadow
          color="rgba(240, 240, 245, 0.3)"
          animation={{ scale: 50, speed: 80 }}
          noise={{ opacity: 15, scale: 0.5 }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0
          }}
        />

        {/* Additional color gradients for depth - very subtle for light theme */}
        {/* Cyan gradient - top center - VERY SUBTLE */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '35%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0.03) 30%, transparent 60%)',
            filter: 'blur(50px)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Green gradient - left side - SUBTLE */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '-5%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, rgba(34, 197, 94, 0.02) 40%, transparent 65%)',
            filter: 'blur(60px)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Yellow gradient - bottom right - WARM ACCENT */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(234, 179, 8, 0.05) 0%, rgba(234, 179, 8, 0.02) 35%, transparent 60%)',
            filter: 'blur(70px)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Cyan accent - bottom left - SUBTLE */}
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            left: '10%',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 55%)',
            filter: 'blur(55px)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Orange gradient - right side - VERY SUBTLE */}
        <div
          style={{
            position: 'absolute',
            top: '45%',
            right: '15%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(251, 146, 60, 0.04) 0%, transparent 55%)',
            filter: 'blur(60px)',
            transform: 'translateY(-50%)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />

        {/* Content layer */}
        <div className="relative z-10 h-full overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-title1 font-heavy text-cyan-600">Welcome Back!</h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-600">{user.email}</p>
                  {profile?.grade && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 bg-gray-100 border-gray-200 text-gray-600"
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
                  className="bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                >
                  Sign Out
                </Button>
              </form>
            </header>

            {/* Dashboard Content */}
            <DashboardContentLight
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