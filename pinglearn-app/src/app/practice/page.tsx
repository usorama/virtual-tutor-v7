import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Brain, Target, Trophy, Clock, ChevronRight } from 'lucide-react'

export default async function PracticePage() {
  const user = await getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const practiceCategories = [
    {
      id: 'math-problems',
      title: 'Mathematics',
      description: 'Practice algebra, geometry, and calculus problems',
      icon: <Brain className="h-6 w-6" />,
      difficulty: 'Medium',
      questionsAvailable: 150,
      color: 'from-cyan-500/20 to-cyan-600/10'
    },
    {
      id: 'physics',
      title: 'Physics',
      description: 'Test your understanding of mechanics and thermodynamics',
      icon: <Target className="h-6 w-6" />,
      difficulty: 'Hard',
      questionsAvailable: 85,
      color: 'from-green-500/20 to-green-600/10'
    },
    {
      id: 'chemistry',
      title: 'Chemistry',
      description: 'Chemical reactions, organic chemistry, and more',
      icon: <BookOpen className="h-6 w-6" />,
      difficulty: 'Medium',
      questionsAvailable: 120,
      color: 'from-purple-500/20 to-purple-600/10'
    },
    {
      id: 'biology',
      title: 'Biology',
      description: 'Cell biology, genetics, and ecology questions',
      icon: <Trophy className="h-6 w-6" />,
      difficulty: 'Easy',
      questionsAvailable: 95,
      color: 'from-orange-500/20 to-orange-600/10'
    }
  ]

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heavy text-accent-cyan mb-2">Practice Tests</h1>
            <p className="text-white-70">Test your knowledge with interactive practice questions</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6 bg-white-3 border-white-10"
                  style={{
                    borderRadius: '32px',
                    boxShadow: 'inset -4px -4px 12px rgba(128,128,128,0.95), inset 4px 4px 12px rgba(0,0,0,0.2)'
                  }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent-cyan flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-black-100" />
                </div>
                <div>
                  <p className="text-caption1 text-white-50">Tests Completed</p>
                  <p className="text-2xl font-heavy text-accent-cyan">24</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white-3 border-white-10"
                  style={{
                    borderRadius: '32px',
                    boxShadow: 'inset -4px -4px 12px rgba(128,128,128,0.95), inset 4px 4px 12px rgba(0,0,0,0.2)'
                  }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent-cyan flex items-center justify-center">
                  <Target className="h-6 w-6 text-black-100" />
                </div>
                <div>
                  <p className="text-caption1 text-white-50">Average Score</p>
                  <p className="text-2xl font-heavy text-accent-cyan">85%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white-3 border-white-10"
                  style={{
                    borderRadius: '32px',
                    boxShadow: 'inset -4px -4px 12px rgba(128,128,128,0.95), inset 4px 4px 12px rgba(0,0,0,0.2)'
                  }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent-cyan flex items-center justify-center">
                  <Clock className="h-6 w-6 text-black-100" />
                </div>
                <div>
                  <p className="text-caption1 text-white-50">Time Practiced</p>
                  <p className="text-2xl font-heavy text-accent-cyan">12h</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Practice Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {practiceCategories.map((category) => (
              <Card
                key={category.id}
                className="p-6 bg-white-3 border-white-10 hover:transform hover:translateY(-2px) transition-all duration-300 cursor-pointer"
                style={{
                  borderRadius: '32px',
                  boxShadow: 'inset -4px -4px 12px rgba(128,128,128,0.95), inset 4px 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                <div className={`absolute inset-0 opacity-20 rounded-[32px] bg-gradient-to-br ${category.color}`} />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-accent-cyan flex items-center justify-center">
                      {category.icon}
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white-10 text-white-70">
                      {category.difficulty}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white-100 mb-2">{category.title}</h3>
                  <p className="text-white-50 text-sm mb-4">{category.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-caption1 text-white-70">
                      {category.questionsAvailable} questions available
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-accent-cyan hover:bg-white-10 rounded-2xl"
                    >
                      Start Practice
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}