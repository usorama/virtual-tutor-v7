import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { getUserProfile, checkWizardCompletion, getTextbookCount } from '@/lib/wizard/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth/actions'
import { GraduationCap } from 'lucide-react'
import { GRADE_LABELS } from '@/types/wizard'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
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
      {/* Main container with Apple 2025 semantic color system */}
      <div
        className="relative h-screen overflow-hidden bg-white"
        style={{
          // Apple 2025 Semantic Color System
          '--system-background': '#FFFFFF',
          '--system-gray-1': '#F2F2F7',
          '--system-gray-2': '#E5E5EA',
          '--system-gray-3': '#D1D1D6',
          '--system-gray-4': '#C7C7CC',
          '--system-gray-5': '#AEAEB2',
          '--system-gray-6': '#8E8E93',
          '--text-primary': '#000000',
          '--text-secondary': '#374151',
          '--text-muted': '#6b7280',
          '--color-accent-primary': '#155e75',
          '--color-accent-hover': '#0891b2'
        } as React.CSSProperties}
      >

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
                <h1
                  className="text-title1 font-heavy"
                  style={{ color: 'var(--color-accent-primary)' }}
                >
                  Welcome Back!
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <p style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                  {profile?.grade && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                      style={{
                        backgroundColor: 'var(--system-gray-1)',
                        borderColor: 'var(--system-gray-3)',
                        color: 'var(--text-primary)'
                      }}
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
                  className="hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: 'var(--system-gray-1)',
                    borderColor: 'var(--system-gray-3)',
                    color: 'var(--text-primary)'
                  }}
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