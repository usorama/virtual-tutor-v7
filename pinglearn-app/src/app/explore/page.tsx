import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/actions'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, BookOpen, TrendingUp, Star, Clock, Users, ChevronRight } from 'lucide-react'

export default async function ExplorePage() {
  const user = await getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const trendingTopics = [
    {
      id: 'calculus',
      title: 'Calculus Fundamentals',
      subject: 'Mathematics',
      description: 'Master derivatives, integrals, and limits',
      difficulty: 'Advanced',
      learners: 1250,
      rating: 4.8,
      duration: '12 hours',
      trending: true
    },
    {
      id: 'organic-chemistry',
      title: 'Organic Chemistry',
      subject: 'Chemistry',
      description: 'Understand carbon compounds and reactions',
      difficulty: 'Intermediate',
      learners: 890,
      rating: 4.6,
      duration: '15 hours',
      trending: true
    },
    {
      id: 'mechanics',
      title: 'Classical Mechanics',
      subject: 'Physics',
      description: 'Newton\'s laws, energy, and momentum',
      difficulty: 'Intermediate',
      learners: 1100,
      rating: 4.9,
      duration: '10 hours',
      trending: false
    },
    {
      id: 'genetics',
      title: 'Genetics & DNA',
      subject: 'Biology',
      description: 'Heredity, genes, and molecular biology',
      difficulty: 'Beginner',
      learners: 750,
      rating: 4.7,
      duration: '8 hours',
      trending: false
    },
    {
      id: 'trigonometry',
      title: 'Trigonometry',
      subject: 'Mathematics',
      description: 'Sine, cosine, and trigonometric identities',
      difficulty: 'Intermediate',
      learners: 980,
      rating: 4.5,
      duration: '9 hours',
      trending: true
    },
    {
      id: 'thermodynamics',
      title: 'Thermodynamics',
      subject: 'Physics',
      description: 'Heat, work, and energy transformations',
      difficulty: 'Advanced',
      learners: 620,
      rating: 4.4,
      duration: '11 hours',
      trending: false
    }
  ]

  const subjectColors: Record<string, string> = {
    'Mathematics': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Physics': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Chemistry': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Biology': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  }

  const difficultyColors: Record<string, string> = {
    'Beginner': 'text-green-400',
    'Intermediate': 'text-yellow-400',
    'Advanced': 'text-red-400'
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-heavy text-accent-cyan mb-2">Explore Topics</h1>
            <p className="text-white-70">Discover new subjects and expand your knowledge</p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white-50" />
              <input
                type="text"
                placeholder="Search topics..."
                className="w-full pl-12 pr-4 py-3 bg-white-5 border border-white-10 rounded-2xl text-white-100 placeholder-white-50 focus:outline-none focus:border-accent-cyan"
              />
            </div>
            <Button
              variant="outline"
              className="bg-white-5 border-white-10 text-white-70 hover:bg-white-10 hover:text-white-100 rounded-2xl"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-3 mb-8 flex-wrap">
            <Badge variant="secondary" className="px-4 py-2 bg-accent-cyan text-black-100 border-0 rounded-2xl cursor-pointer">
              All Topics
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 bg-white-5 border-white-10 text-white-70 rounded-2xl cursor-pointer hover:bg-white-10">
              Mathematics
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 bg-white-5 border-white-10 text-white-70 rounded-2xl cursor-pointer hover:bg-white-10">
              Physics
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 bg-white-5 border-white-10 text-white-70 rounded-2xl cursor-pointer hover:bg-white-10">
              Chemistry
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 bg-white-5 border-white-10 text-white-70 rounded-2xl cursor-pointer hover:bg-white-10">
              Biology
            </Badge>
          </div>

          {/* Trending Section */}
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent-cyan" />
            <h2 className="text-xl font-bold text-white-100">Popular Topics</h2>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingTopics.map((topic) => (
              <Card
                key={topic.id}
                className="p-6 bg-white-3 border-white-10 hover:transform hover:translateY(-2px) transition-all duration-300 cursor-pointer"
                style={{
                  borderRadius: '32px',
                  boxShadow: 'inset -4px -4px 12px rgba(128,128,128,0.95), inset 4px 4px 12px rgba(0,0,0,0.2)',
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <Badge
                    variant="secondary"
                    className={`px-2 py-1 text-xs rounded-xl ${subjectColors[topic.subject]}`}
                  >
                    {topic.subject}
                  </Badge>
                  {topic.trending && (
                    <Badge variant="secondary" className="px-2 py-1 text-xs bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border-orange-500/30 rounded-xl">
                      🔥 Trending
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white-100 mb-2">{topic.title}</h3>
                <p className="text-white-50 text-sm mb-4">{topic.description}</p>

                <div className="flex items-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-white-70">{topic.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-white-50" />
                    <span className="text-white-70">{topic.learners.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-white-50" />
                    <span className="text-white-70">{topic.duration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${difficultyColors[topic.difficulty]}`}>
                    {topic.difficulty}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-accent-cyan hover:bg-white-10 rounded-2xl"
                  >
                    Start Learning
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              className="bg-white-5 border-white-10 text-white-70 hover:bg-white-10 hover:text-white-100 rounded-2xl px-8"
            >
              Load More Topics
            </Button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}