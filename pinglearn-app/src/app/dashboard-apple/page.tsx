import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { getUserProfile, checkWizardCompletion, getTextbookCount } from '@/lib/wizard/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth/actions'
import { GraduationCap, Clock, BookOpen, Trophy, Mic, Activity, Target, Flame, ChevronRight, Sparkles } from 'lucide-react'
import { GRADE_LABELS } from '@/types/wizard'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { AppleLightGlassCard, AppleLightGlassContainer } from '@/components/dashboard/AppleLightGlass'
import { AppleButton } from '@/components/dashboard/AppleButtons'
import { AppleChartSection } from '@/components/dashboard/AppleChartSection'
import { AppleSessionSection } from '@/components/dashboard/AppleSessionSection'
import { AppleQuickActions } from '@/components/dashboard/AppleQuickActions'

export default async function DashboardApplePage() {
  const user = await getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const { needsWizard } = await checkWizardCompletion()
  const { data: profile } = await getUserProfile()
  const { data: textbookCount } = await getTextbookCount()

  if (needsWizard) {
    redirect('/wizard')
  }

  return (
    <AuthenticatedLayout>
      {/* Off-white background (95% white) for better depth perception */}
      <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="container mx-auto px-4 py-8 max-w-7xl">

          {/* Header - Black text, no colors */}
          <header className="mb-10">
            <div className="flex justify-between items-start">
              <div>
                {/* Black heading, not colored */}
                <h1 className="text-5xl font-semibold text-[#1D1D1F] tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-[#86868B] mt-2">
                  {user.email}
                </p>
                {profile?.grade && (
                  <div className="mt-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: '#F5F5F7',
                        color: '#1D1D1F',
                      }}
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      {GRADE_LABELS[profile.grade]}
                    </span>
                  </div>
                )}
              </div>

              {/* Sign out - secondary button style */}
              <form action={signOut}>
                <AppleButton variant="secondary" type="submit">
                  Sign Out
                </AppleButton>
              </form>
            </div>
          </header>

          {/* Main Chart Section with Quick Actions */}
          <div className="grid lg:grid-cols-7 gap-6 items-stretch mb-10">
            {/* Combo Chart - 5 columns */}
            <div className="lg:col-span-5">
              <AppleChartSection />
            </div>

            {/* Quick Actions - 2 columns */}
            <div className="lg:col-span-2">
              <AppleLightGlassContainer className="h-full">
                <AppleQuickActions />
              </AppleLightGlassContainer>
            </div>
          </div>

          {/* Quick Actions - Only primary CTA gets blue */}
          <div className="mb-10">
            <div className="flex gap-3">
              {/* Primary CTA - Blue */}
              <AppleButton variant="primary">
                <span className="flex items-center gap-2">
                  Start New Session
                  <ChevronRight className="w-4 h-4" />
                </span>
              </AppleButton>

              {/* Secondary actions - Gray */}
              <AppleButton variant="secondary">
                Review Progress
              </AppleButton>

              <AppleButton variant="secondary">
                Browse Textbooks
              </AppleButton>
            </div>
          </div>

          {/* Metrics Grid - Consistent Glass Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <AppleLightGlassCard
              title="Study Sessions"
              value={14}
              change={{ value: "12%", trend: "up", description: "from last week" }}
              icon={<Clock />}
            />

            <AppleLightGlassCard
              title="Topics Mastered"
              value={18}
              change={{ value: "3", trend: "up", description: "new this week" }}
              icon={<BookOpen />}
            />

            <AppleLightGlassCard
              title="Voice Minutes"
              value={156}
              change={{ value: "28%", trend: "up", description: "increase" }}
              icon={<Mic />}
            />

            <AppleLightGlassCard
              title="Math Problems"
              value={89}
              change={{ value: "15", trend: "up", description: "solved today" }}
              icon={<Activity />}
            />

            <AppleLightGlassCard
              title="Textbooks"
              value={textbookCount || 0}
              change={{ value: "2", trend: "up", description: "added recently" }}
              icon={<BookOpen />}
            />

            <AppleLightGlassCard
              title="Achievements"
              value={7}
              change={{ value: "1", trend: "up", description: "new badge" }}
              icon={<Trophy />}
            />

            <AppleLightGlassCard
              title="Study Streak"
              value="5 days"
              change={{ value: "ongoing", trend: "up", description: "" }}
              icon={<Flame />}
            />

            <AppleLightGlassCard
              title="Weekly Goal"
              value="87%"
              change={{ value: "28/32", trend: "up", description: "topics" }}
              icon={<Target />}
            />
          </div>

          {/* Recent Sessions Timeline */}
          <div className="mb-10">
            <AppleSessionSection />
          </div>

          {/* Content Cards - Using glass containers */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Learning Profile Card */}
            <AppleLightGlassContainer>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: '#1D1D1F' }} />
                </div>
                <h3 className="text-xl font-semibold text-[#1D1D1F]">
                  Your Learning Profile
                </h3>
              </div>
              <p className="text-[#86868B] text-sm mb-6">
                Personalized curriculum preferences
              </p>

              {profile && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#86868B] mb-2">Grade</p>
                    <span
                      className="inline-block px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: '#F5F5F7',
                        color: '#1D1D1F',
                      }}
                    >
                      {profile.grade ? GRADE_LABELS[profile.grade] : 'Not set'}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-[#86868B] mb-2">Subjects</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.preferred_subjects?.map((subject: string) => (
                        <span
                          key={subject}
                          className="px-2 py-1 rounded-lg text-xs"
                          style={{
                            backgroundColor: '#F5F5F7',
                            color: '#1D1D1F',
                          }}
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-[#86868B] mb-1">Total Topics</p>
                    <p className="text-2xl font-semibold text-[#1D1D1F]">
                      {profile.selected_topics
                        ? Object.values(profile.selected_topics as Record<string, string[]>)
                            .reduce((sum, topics) => sum + topics.length, 0)
                        : 0}
                    </p>
                  </div>
                </div>
              )}
            </AppleLightGlassContainer>

            {/* Study Tips Card */}
            <AppleLightGlassContainer>
              <h3 className="text-xl font-semibold text-[#1D1D1F] mb-4">
                Study Tips
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: '#1D1D1F' }}
                  />
                  <p className="text-sm" style={{ color: '#1D1D1F' }}>
                    Take short breaks every 25 minutes for better retention
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: '#1D1D1F' }}
                  />
                  <p className="text-sm" style={{ color: '#1D1D1F' }}>
                    Review previous topics before starting new ones
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: '#1D1D1F' }}
                  />
                  <p className="text-sm" style={{ color: '#1D1D1F' }}>
                    Practice voice sessions help improve understanding
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: '#1D1D1F' }}
                  />
                  <p className="text-sm" style={{ color: '#1D1D1F' }}>
                    Use visual aids and diagrams for complex concepts
                  </p>
                </div>
              </div>
            </AppleLightGlassContainer>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}