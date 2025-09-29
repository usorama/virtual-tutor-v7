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
  const userResponse = await getUser()

  if (!userResponse.success || !userResponse.data?.user) {
    redirect('/auth/signin')
  }

  const user = userResponse.data.user

  // Check wizard completion and get profile
  const { needsWizard } = await checkWizardCompletion()
  const { data: profile } = await getUserProfile()
  const { data: textbookCount } = await getTextbookCount()

  if (needsWizard) {
    redirect('/wizard')
  }

  return (
    <AuthenticatedLayout>
      {/* Main container with ethereal background - Fixed height minus nav */}
      <div className="relative min-h-[calc(100vh-4rem)] bg-black overflow-auto">
        {/* Ethereal shadow background with subtle vibrant colors */}
        <EtheralShadow
          color="rgba(60, 60, 70, 0.5)"
          animation={{ scale: 50, speed: 80 }}
          noise={{ opacity: 30, scale: 0.5 }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0
          }}
        />

        {/* Additional color gradients for depth - more visible and distinct */}
        {/* Cyan gradient - top center - STRONGER */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '35%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(6, 182, 212, 0.15) 30%, transparent 60%)',
            filter: 'blur(40px)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Green gradient - left side - VISIBLE */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '-5%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 40%, transparent 65%)',
            filter: 'blur(50px)',
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
            background: 'radial-gradient(circle, rgba(234, 179, 8, 0.25) 0%, rgba(234, 179, 8, 0.1) 35%, transparent 60%)',
            filter: 'blur(60px)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Cyan accent - bottom left - VISIBLE */}
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            left: '10%',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.28) 0%, transparent 55%)',
            filter: 'blur(45px)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        {/* Orange gradient - right side - SUBTLE but VISIBLE */}
        <div
          style={{
            position: 'absolute',
            top: '45%',
            right: '15%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, transparent 55%)',
            filter: 'blur(50px)',
            transform: 'translateY(-50%)',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />

        {/* Content layer - Let the body handle scrolling */}
        <div className="relative z-10">
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