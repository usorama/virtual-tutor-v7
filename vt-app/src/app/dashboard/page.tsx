import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/auth/actions'
import { getUserProfile, checkWizardCompletion, getTextbookCount } from '@/lib/wizard/actions'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { signOut } from '@/lib/auth/actions'
import { BookOpen, Brain, Trophy, Clock, GraduationCap, CheckCircle2, Mic } from 'lucide-react'
import { GRADE_LABELS } from '@/types/wizard'
import { SessionHistory } from '@/components/session/SessionHistory'
import { QuickStart } from '@/components/session/QuickStart'

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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome Back!</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">{user.email}</p>
              {profile?.grade && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {GRADE_LABELS[profile.grade]}
                </Badge>
              )}
            </div>
          </div>
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Sign Out
            </Button>
          </form>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Study Sessions
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Total sessions completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Topics Learned
              </CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Across all subjects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Achievements
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Milestones reached
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Textbooks
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{textbookCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Available for study
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Start Section */}
          <div className="lg:col-span-1">
            <QuickStart
              currentChapter="1"
              chapterTitle="NCERT Mathematics - Class 10"
              lastSessionDate={undefined}
              suggestedTopics={['Quadratic Equations', 'Triangles', 'Probability']}
              masteryLevel={45}
            />
          </div>
          
          {/* Session History */}
          <div className="lg:col-span-2">
            <SessionHistory 
              studentId={user.id}
              limit={5}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Learning Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Your Learning Profile
              </CardTitle>
              <CardDescription>
                Your personalized curriculum preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Grade</p>
                    <Badge variant="outline" className="text-base">
                      {profile.grade ? GRADE_LABELS[profile.grade] : 'Not set'}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Subjects</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.preferred_subjects?.map((subject: string) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      )) || <span className="text-sm text-muted-foreground">No subjects selected</span>}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Topics</p>
                    <p className="text-2xl font-bold">
                      {profile.selected_topics 
                        ? Object.values(profile.selected_topics as Record<string, string[]>)
                            .reduce((sum, topics) => sum + topics.length, 0)
                        : 0}
                    </p>
                  </div>
                </>
              )}
              
              <div className="pt-4">
                <Link href="/wizard">
                  <Button variant="outline" className="w-full">
                    Update Preferences
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump into your learning activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/classroom" className="block">
                <Button className="w-full justify-start" size="lg">
                  <Mic className="h-4 w-4 mr-2" />
                  Start Voice Session
                </Button>
              </Link>
              
              <Link href="/textbooks" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Upload Textbook
                </Button>
              </Link>
              
              <Link href="/profile" className="block">
                <Button className="w-full justify-start" variant="outline">
                  <Trophy className="h-4 w-4 mr-2" />
                  View Progress
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}