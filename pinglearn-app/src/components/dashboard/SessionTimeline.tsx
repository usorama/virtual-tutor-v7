'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Session {
  id: string
  title: string
  subject: 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology'
  type: 'voice' | 'practice' | 'review'
  time: string
  duration: string
  score: string
  date: string
}

interface SessionTimelineProps {
  sessions: Session[]
  onSessionClick?: (sessionId: string) => void
  className?: string
}

const subjectColors = {
  Mathematics: {
    bg: 'rgba(6, 182, 212, 0.15)',
    color: '#06B6D4',
    border: 'rgba(6, 182, 212, 0.3)'
  },
  Physics: {
    bg: 'rgba(34, 197, 94, 0.15)',
    color: '#22C55E',
    border: 'rgba(34, 197, 94, 0.3)'
  },
  Chemistry: {
    bg: 'rgba(168, 85, 247, 0.15)',
    color: '#A855F7',
    border: 'rgba(168, 85, 247, 0.3)'
  },
  Biology: {
    bg: 'rgba(251, 146, 60, 0.15)',
    color: '#FB9F3C',
    border: 'rgba(251, 146, 60, 0.3)'
  }
}

const typeEmojis = {
  voice: '🎤',
  practice: '📝',
  review: '📖'
}

export function SessionTimeline({ sessions, onSessionClick, className }: SessionTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [loadingSession, setLoadingSession] = useState<string | null>(null)

  useEffect(() => {
    // Animate timeline items on mount
    if (timelineRef.current) {
      const items = timelineRef.current.querySelectorAll('.timeline-item')
      items.forEach((item, index) => {
        const element = item as HTMLElement
        element.style.opacity = '0'
        element.style.transform = 'translateX(-20px)'
        element.style.animation = `slideInTimeline 0.5s ease-out ${2 + index * 0.1}s forwards`
      })
    }
  }, [sessions])

  const handleSessionClick = async (sessionId: string, sessionTitle: string) => {
    if (!onSessionClick) return

    setLoadingSession(sessionId)

    // Show loading state
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate navigation - in real app this would be handled by onSessionClick
    alert(`🎬 Opening ${sessionId} recording...\n\nThis would navigate to the session playback page with:\n• Full audio/video recording\n• Synchronized transcript\n• Interactive notes and highlights\n• Progress tracking`)

    setLoadingSession(null)
    onSessionClick(sessionId)
  }

  return (
    <Card
      className={`p-6 overflow-hidden ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'inset -4px -4px 12px rgba(128,128,128,0.95), inset 4px 4px 12px rgba(0,0,0,0.1)',
        borderRadius: '32px'
      }}
    >
      <h3 className="text-title2 font-bold text-white-100 mb-6">Recent Sessions</h3>

      {/* Timeline Container */}
      <div ref={timelineRef} className="relative pl-14">
        {/* Timeline Line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white-30 via-white-10 to-transparent rounded-full" />

        {/* Session Items */}
        {sessions.map((session, index) => (
          <div
            key={session.id}
            className={`timeline-item relative pb-6 cursor-pointer transition-all duration-300 hover:bg-white-3 hover:transform hover:translate-x-2 rounded-2xl -ml-4 pl-4 pr-4 py-3 ${
              loadingSession === session.id ? 'bg-white-10 transform translate-x-3 scale-105' : ''
            }`}
            onClick={() => handleSessionClick(session.id, session.title)}
          >
            {/* Time */}
            <div className="absolute -left-11 top-4 text-caption1 font-medium text-white-70 text-right w-10">
              {session.time}
            </div>

            {/* Timeline Dot */}
            <div className="absolute -left-7 top-5 w-2 h-2 bg-white-70 border-2 border-black-100 rounded-full shadow-lg shadow-white/30" />

            {/* Content */}
            <div className="ml-2">
              {/* Subject Badge */}
              <div
                className="inline-block px-2 py-1 rounded-xl text-caption2 font-semibold mb-1.5 border"
                style={{
                  backgroundColor: subjectColors[session.subject].bg,
                  color: subjectColors[session.subject].color,
                  borderColor: subjectColors[session.subject].border
                }}
              >
                {loadingSession === session.id ? '▶ Loading...' : session.subject}
              </div>

              {/* Session Title */}
              <div className="text-body font-semibold text-white-100 mb-1.5">
                {session.title}
              </div>

              {/* Session Details */}
              <div className="flex flex-wrap gap-3 text-caption1 text-white-50">
                <span className="font-medium">
                  {typeEmojis[session.type]} {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
                </span>
                <span className="font-medium">{session.duration}</span>
                <span className="font-medium">{session.score}</span>
              </div>
            </div>

            {/* Date */}
            <div className="absolute right-0 top-4 text-caption1 text-white-50 font-medium">
              {session.date}
            </div>
          </div>
        ))}
      </div>

      {/* View All Sessions Button */}
      <div className="text-center mt-6">
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-white-5 border border-white-10 rounded-2xl text-body font-medium text-white-70 hover:bg-white-10 hover:text-white-100 hover:border-white-20 transition-all duration-300">
          <span>View All Sessions</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideInTimeline {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </Card>
  )
}