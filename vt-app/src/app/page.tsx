import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { BookOpen, Brain, Users, Trophy } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Virtual Tutor
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience personalized AI-powered tutoring for Class 9-12 CBSE curriculum. 
            Learn at your own pace with one-on-one guidance.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>CBSE Curriculum</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Complete coverage of Class 9-12 CBSE textbooks with chapter-wise learning
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced AI that adapts to your learning style and pace
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>1-on-1 Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Personalized attention with voice-enabled interactive learning
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Trophy className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Track Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor your learning journey with detailed progress reports
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <div className="inline-flex gap-4">
            <Link href="/login">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Phase 0: Foundation Setup Complete</p>
          <p>Ready for Phase 1: Authentication & User Management</p>
        </div>
      </div>
    </div>
  );
}
