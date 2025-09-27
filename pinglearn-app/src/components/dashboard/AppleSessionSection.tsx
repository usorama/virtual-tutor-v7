'use client'

import { SessionTimeline } from './SessionTimeline'
import { AppleLightGlassContainer } from './AppleLightGlass'

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
    title: 'Quadratic Equations',
    subject: 'Mathematics' as const,
    type: 'review' as const,
    time: '11:45',
    duration: '25 min',
    score: 'Chapter 4 completed',
    date: 'Yesterday'
  },
  {
    id: 'session-4',
    title: 'Motion & Velocity',
    subject: 'Physics' as const,
    type: 'voice' as const,
    time: '16:20',
    duration: '38 min',
    score: '85% completion',
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

export function AppleSessionSection() {
  const handleSessionClick = (sessionId: string) => {
    console.log('Opening session:', sessionId)
  }

  return (
    <AppleLightGlassContainer>
      <SessionTimeline
        sessions={mockSessions}
        onSessionClick={handleSessionClick}
      />
    </AppleLightGlassContainer>
  )
}