'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Brain, Sparkles, Clock, Zap } from 'lucide-react'

export function PracticeComingSoon() {
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Go Back Button */}
        <div className="mb-6">
          <Button
            onClick={handleGoBack}
            variant="ghost"
            className="text-white-70 hover:text-accent-cyan hover:bg-white-10 rounded-2xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Main Coming Soon Card */}
        <div className="flex items-center justify-center min-h-[70vh]">
          <Card
            className="p-12 bg-white-3 border-white-10 text-center max-w-2xl"
            style={{
              borderRadius: '32px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: `
                inset -4px -4px 12px rgba(128,128,128,0.95),
                inset 4px 4px 12px rgba(0,0,0,0.1),
                0 10px 36px -6px rgba(34, 197, 94, 0.06),
                0 6px 24px -4px rgba(0, 0, 0, 0.15)
              `
            }}
          >
            {/* Animated Brain Icon */}
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-accent-cyan to-green-400 flex items-center justify-center animate-pulse">
                <Brain className="h-12 w-12 text-black-100" />
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center animate-bounce">
                  <Sparkles className="h-4 w-4 text-black-100" />
                </div>
              </div>
            </div>

            {/* Main Message */}
            <h1 className="text-4xl font-heavy text-accent-cyan mb-4">
              Something Amazing is Coming!
            </h1>

            <p className="text-xl text-white-70 mb-6">
              We&apos;re cooking up some seriously cool assessment features that will make learning even more awesome! 🧠✨
            </p>

            <p className="text-white-50 mb-8">
              Instead of fake practice tests, we&apos;re building something that actually helps you learn better.
              Think <span className="text-accent-cyan font-semibold">voice-powered quick checks</span> after your sessions and
              <span className="text-accent-cyan font-semibold"> intelligent practice problems</span> that adapt to your learning style.
            </p>

            {/* Feature Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-2xl bg-white-5 border border-white-10">
                <Zap className="h-6 w-6 text-accent-cyan mx-auto mb-2" />
                <p className="text-sm text-white-70">Quick Voice Checks</p>
              </div>
              <div className="p-4 rounded-2xl bg-white-5 border border-white-10">
                <Brain className="h-6 w-6 text-accent-cyan mx-auto mb-2" />
                <p className="text-sm text-white-70">Smart Problems</p>
              </div>
              <div className="p-4 rounded-2xl bg-white-5 border border-white-10">
                <Clock className="h-6 w-6 text-accent-cyan mx-auto mb-2" />
                <p className="text-sm text-white-70">Real Progress</p>
              </div>
            </div>

            {/* Fun Message */}
            <div className="text-2xl mb-6">🚀</div>
            <p className="text-white-40 text-sm">
              In the meantime, keep learning with your AI tutor in the{' '}
              <button
                onClick={() => router.push('/classroom')}
                className="text-accent-cyan hover:underline font-medium"
              >
                Classroom
              </button>
              !
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}