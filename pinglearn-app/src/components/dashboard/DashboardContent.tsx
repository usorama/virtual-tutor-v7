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
import { MetricCardV2 } from './MetricCardV2'
import { QuickActions } from './QuickActions'

interface DashboardContentProps {
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

export function DashboardContent({ user, profile, textbookCount }: DashboardContentProps) {
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
          <QuickActions className="flex-1" />
        </div>
      </div>

      {/* Metric Cards Grid - 4x2 layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCardV2
          title="Study Sessions"
          value={14}
          change={{ value: '12%', trend: 'up', description: '12% from last week' }}
          icon={<Clock className="h-6 w-6" />}
        />

        <MetricCardV2
          title="Topics Mastered"
          value={18}
          change={{ value: '3', trend: 'up', description: '3 new this week' }}
          icon={<BookOpen className="h-6 w-6" />}
        />

        <MetricCardV2
          title="Voice Minutes"
          value={156}
          change={{ value: '28%', trend: 'up', description: '28% increase' }}
          icon={<Mic className="h-6 w-6" />}
        />

        <MetricCardV2
          title="Math Problems"
          value={89}
          change={{ value: '15', trend: 'up', description: '15 solved today' }}
          icon={<Activity className="h-6 w-6" />}
        />

        <MetricCardV2
          title="Textbooks"
          value={textbookCount}
          change={{ value: '2', trend: 'up', description: '2 added recently' }}
          icon={<BookOpen className="h-6 w-6" />}
        />

        <MetricCardV2
          title="Achievements"
          value={7}
          change={{ value: '1', trend: 'up', description: '1 new badge earned' }}
          icon={<Trophy className="h-6 w-6" />}
        />

        <MetricCardV2
          title="Study Streak"
          value="5 days"
          change={{ value: 'ongoing', trend: 'up', description: 'Keep it going!' }}
          icon={<Flame className="h-6 w-6" />}
        />

        {/* Weekly Goal Card - replacing circular progress */}
        <MetricCardV2
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
        <div className="p-6 bg-white-3 rounded-[32px] border border-white-10 relative overflow-hidden"
             style={{
               boxShadow: `
                 inset -4px -4px 12px rgba(128,128,128,0.95),
                 inset 4px 4px 12px rgba(0,0,0,0.1),
                 0 10px 35px -8px rgba(6, 182, 212, 0.08),
                 0 6px 20px -5px rgba(0, 0, 0, 0.15)
               `
             }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: 'rgb(0, 0, 0)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
              <div style={{ color: '#06B6D4' }}>
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-title3 font-bold text-accent">Your Learning Profile</h3>
          </div>
          <p className="text-white-70 mb-4">Your personalized curriculum preferences</p>

          {profile && (
            <div className="space-y-4">
              <div>
                <p className="text-caption1 font-medium text-white-50 mb-2">Grade</p>
                <div className="inline-block px-3 py-1 bg-white-5 border border-white-10 rounded-2xl text-white-100 text-sm">
                  {profile.grade ? GRADE_LABELS[profile.grade] : 'Not set'}
                </div>
              </div>

              <div>
                <p className="text-caption1 font-medium text-white-50 mb-2">Subjects</p>
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_subjects?.map((subject: string) => (
                    <div
                      key={subject}
                      className="px-2 py-1 rounded-xl text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--accent-cyan-subtle)',
                        border: '1px solid var(--accent-cyan-border)',
                        color: 'var(--accent-cyan)'
                      }}
                    >
                      {subject}
                    </div>
                  )) || (
                    <span className="text-caption1 text-white-50">No subjects selected</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-caption1 font-medium text-white-50 mb-1">Total Topics</p>
                <p className="text-title3 font-bold text-white-100">{totalTopics}</p>
              </div>
            </div>
          )}
        </div>

        {/* Study Tips */}
        <div className="p-6 bg-white-3 rounded-[32px] border border-white-10 relative overflow-hidden"
             style={{
               boxShadow: `
                 inset -4px -4px 12px rgba(128,128,128,0.95),
                 inset 4px 4px 12px rgba(0,0,0,0.1),
                 0 12px 40px -10px rgba(34, 197, 94, 0.06),
                 0 8px 25px -6px rgba(0, 0, 0, 0.12)
               `
             }}>
          <h3 className="text-title3 font-bold text-accent mb-4">Study Tips</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--accent-cyan)' }} />
              <p className="text-caption1 text-white-70">
                Take short breaks every 25 minutes for better retention
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--accent-cyan)' }} />
              <p className="text-caption1 text-white-70">
                Review previous topics before starting new ones
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--accent-cyan)' }} />
              <p className="text-caption1 text-white-70">
                Practice voice sessions help improve understanding
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}