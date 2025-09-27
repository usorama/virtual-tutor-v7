'use client'

import { useState } from 'react'
import {
  Clock,
  BookOpen,
  Trophy,
  Mic,
  Activity,
  Target,
  Flame,
  Sparkles
} from 'lucide-react'
import { GRADE_LABELS } from '@/types/wizard'
import { ComboChart } from './ComboChart'
import { SessionTimeline } from './SessionTimeline'
import { MetricCardV2Light } from './MetricCardV2Light'
import { QuickActionsLight } from './QuickActionsLight'

interface DashboardContentLightProps {
  user: any
  profile: any
  textbookCount: number
}

// Mock data for the charts and components
const mockChartData = {
  studySessions: [2, 1, 3, 2, 1, 2, 3],
  topicsMastered: [12, 14, 18, 21, 23, 26, 30],
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
}

const mockSessions = [
  {
    id: 'session-1',
    title: 'Triangles & Similarity',
    subject: 'Mathematics' as const,
    type: 'voice' as const,
    time: '14:30',
    duration: '45 min',
    score: '92% accuracy',
    date: 'Today'
  },
  {
    id: 'session-2',
    title: 'Statistics Overview',
    subject: 'Mathematics' as const,
    type: 'practice' as const,
    time: '09:15',
    duration: '30 min',
    score: '15 problems solved',
    date: 'Today'
  },
  {
    id: 'session-3',
    title: 'Motion & Velocity',
    subject: 'Physics' as const,
    type: 'voice' as const,
    time: '16:20',
    duration: '38 min',
    score: '85% completion',
    date: 'Yesterday'
  },
  {
    id: 'session-4',
    title: 'Quadratic Equations',
    subject: 'Mathematics' as const,
    type: 'review' as const,
    time: '11:45',
    duration: '25 min',
    score: 'Chapter 4 completed',
    date: 'Yesterday'
  },
  {
    id: 'session-5',
    title: 'Chemical Reactions',
    subject: 'Chemistry' as const,
    type: 'voice' as const,
    time: '14:10',
    duration: '42 min',
    score: '18 concepts learned',
    date: '2 days ago'
  }
]

export function DashboardContentLight({ user, profile, textbookCount }: DashboardContentLightProps) {
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  const handleSessionClick = (sessionId: string) => {
    // In a real app, this would navigate to the session recording page
    console.log('Opening session:', sessionId)
  }

  // Calculate total topics from profile
  const totalTopics = profile?.selected_topics
    ? Object.values(profile.selected_topics as Record<string, string[]>)
        .reduce((sum, topics) => sum + topics.length, 0)
    : 0

  return (
    <div className="space-y-10">
      {/* Main Chart Section with Quick Actions */}
      <div className="grid lg:grid-cols-7 gap-6 items-stretch">
        {/* Combo Chart - 5 columns, stretched horizontally */}
        <div className="lg:col-span-5 flex">
          <ComboChart
            data={mockChartData}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
            className="flex-1"
          />
        </div>

        {/* Quick Actions - 2 columns */}
        <div className="lg:col-span-2 flex">
          <QuickActionsLight className="flex-1" />
        </div>
      </div>

      {/* Metric Cards Grid - 4x2 layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCardV2Light
          title="Study Sessions"
          value={14}
          change={{ value: '12%', trend: 'up', description: '12% from last week' }}
          icon={<Clock className="h-6 w-6" />}
        />

        <MetricCardV2Light
          title="Topics Mastered"
          value={18}
          change={{ value: '3', trend: 'up', description: '3 new this week' }}
          icon={<BookOpen className="h-6 w-6" />}
        />

        <MetricCardV2Light
          title="Voice Minutes"
          value={156}
          change={{ value: '28%', trend: 'up', description: '28% increase' }}
          icon={<Mic className="h-6 w-6" />}
        />

        <MetricCardV2Light
          title="Math Problems"
          value={89}
          change={{ value: '15', trend: 'up', description: '15 solved today' }}
          icon={<Activity className="h-6 w-6" />}
        />

        <MetricCardV2Light
          title="Textbooks"
          value={textbookCount}
          change={{ value: '2', trend: 'up', description: '2 added recently' }}
          icon={<BookOpen className="h-6 w-6" />}
        />

        <MetricCardV2Light
          title="Achievements"
          value={7}
          change={{ value: '1', trend: 'up', description: '1 new badge earned' }}
          icon={<Trophy className="h-6 w-6" />}
        />

        <MetricCardV2Light
          title="Study Streak"
          value="5 days"
          change={{ value: 'ongoing', trend: 'up', description: 'Keep it going!' }}
          icon={<Flame className="h-6 w-6" />}
        />

        {/* Weekly Goal Card - replacing circular progress */}
        <MetricCardV2Light
          title="Weekly Goal"
          value="87%"
          change={{ value: '28/32', trend: 'up', description: '4 topics to go!' }}
          icon={<Target className="h-6 w-6" />}
        />
      </div>

      {/* Recent Sessions Timeline */}
      <div className="grid lg:grid-cols-1">
        <SessionTimeline
          sessions={mockSessions}
          onSessionClick={handleSessionClick}
        />
      </div>

      {/* Learning Profile and Additional Info */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Learning Profile */}
        <div className="p-6 rounded-[32px] border relative overflow-hidden"
             style={{
               backgroundColor: 'rgba(0, 0, 0, 0.03)',
               backdropFilter: 'blur(10px) saturate(180%)',
               WebkitBackdropFilter: 'blur(10px) saturate(180%)',
               border: '1px solid rgba(0, 0, 0, 0.08)',
               boxShadow: `
                 inset -2px -2px 7px rgba(0,0,0,0.02),
                 inset 2px 2px 7px rgba(255,255,255,0.8),
                 0 10px 36px -6px rgba(34, 197, 94, 0.02),
                 0 6px 24px -4px rgba(0, 0, 0, 0.05)
               `
             }}>
          {/* Subtle Dark Corner Highlights - Internal shadow effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50px',
              height: '50px',
              background: 'radial-gradient(circle at 0% 0%, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.04) 15%, rgba(0, 0, 0, 0.02) 25%, rgba(0, 0, 0, 0.01) 35%, rgba(0, 0, 0, 0.005) 45%, rgba(0, 0, 0, 0) 55%)',
              pointerEvents: 'none',
              opacity: 1,
              filter: 'blur(2px)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '60px',
              height: '55px',
              background: 'radial-gradient(ellipse at 100% 100%, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.04) 15%, rgba(0, 0, 0, 0.02) 25%, rgba(0, 0, 0, 0.01) 35%, rgba(0, 0, 0, 0.005) 45%, rgba(0, 0, 0, 0) 55%)',
              pointerEvents: 'none',
              opacity: 1,
              filter: 'blur(2px)'
            }}
          />
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: 'rgba(240, 240, 245, 0.8)',
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}>
              <div style={{ color: 'var(--color-accent-hover)' }}>
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
            <h3
              className="text-title3 font-bold"
              style={{ color: 'var(--color-accent-primary)' }}
            >
              Your Learning Profile
            </h3>
          </div>
          <p
            className="mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Your personalized curriculum preferences
          </p>

          {profile && (
            <div className="space-y-4">
              <div>
                <p
                  className="text-caption1 font-medium mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Grade
                </p>
                <div
                  className="inline-block px-3 py-1 rounded-2xl text-sm"
                  style={{
                    backgroundColor: 'var(--system-gray-1)',
                    border: '1px solid var(--system-gray-3)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {profile.grade ? GRADE_LABELS[profile.grade] : 'Not set'}
                </div>
              </div>

              <div>
                <p
                  className="text-caption1 font-medium mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Subjects
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_subjects?.map((subject: string) => (
                    <div
                      key={subject}
                      className="px-2 py-1 rounded-xl text-xs font-medium"
                      style={{
                        backgroundColor: '#cffafe',
                        border: '1px solid var(--system-gray-3)',
                        color: 'var(--color-accent-primary)'
                      }}
                    >
                      {subject}
                    </div>
                  )) || (
                    <span
                      className="text-caption1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      No subjects selected
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p
                  className="text-caption1 font-medium mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Total Topics
                </p>
                <p
                  className="text-title3 font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {totalTopics}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Study Tips */}
        <div className="p-6 rounded-[32px] border relative overflow-hidden"
             style={{
               backgroundColor: 'rgba(0, 0, 0, 0.03)',
               backdropFilter: 'blur(10px) saturate(180%)',
               WebkitBackdropFilter: 'blur(10px) saturate(180%)',
               border: '1px solid rgba(0, 0, 0, 0.08)',
               boxShadow: `
                 inset -2px -2px 7px rgba(0,0,0,0.02),
                 inset 2px 2px 7px rgba(255,255,255,0.8),
                 0 10px 36px -6px rgba(34, 197, 94, 0.02),
                 0 6px 24px -4px rgba(0, 0, 0, 0.05)
               `
             }}>
          {/* Subtle Dark Corner Highlights - Internal shadow effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50px',
              height: '50px',
              background: 'radial-gradient(circle at 0% 0%, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.04) 15%, rgba(0, 0, 0, 0.02) 25%, rgba(0, 0, 0, 0.01) 35%, rgba(0, 0, 0, 0.005) 45%, rgba(0, 0, 0, 0) 55%)',
              pointerEvents: 'none',
              opacity: 1,
              filter: 'blur(2px)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '60px',
              height: '55px',
              background: 'radial-gradient(ellipse at 100% 100%, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.04) 15%, rgba(0, 0, 0, 0.02) 25%, rgba(0, 0, 0, 0.01) 35%, rgba(0, 0, 0, 0.005) 45%, rgba(0, 0, 0, 0) 55%)',
              pointerEvents: 'none',
              opacity: 1,
              filter: 'blur(2px)'
            }}
          />
          <h3
            className="text-title3 font-bold mb-4"
            style={{ color: 'var(--color-accent-primary)' }}
          >
            Study Tips
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: 'var(--color-accent-primary)' }}
              />
              <p
                className="text-caption1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Take short breaks every 25 minutes for better retention
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: 'var(--color-accent-primary)' }}
              />
              <p
                className="text-caption1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Review previous topics before starting new ones
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: 'var(--color-accent-primary)' }}
              />
              <p
                className="text-caption1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Practice voice sessions help improve understanding
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}