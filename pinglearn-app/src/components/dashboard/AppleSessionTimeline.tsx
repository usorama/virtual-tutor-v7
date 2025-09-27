'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

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

interface AppleSessionTimelineProps {
  sessions: Session[]
  onSessionClick?: (sessionId: string) => void
  className?: string
}

const typeEmojis = {
  voice: '🎤',
  practice: '📝',
  review: '📖'
}

export function AppleSessionTimeline({ sessions, onSessionClick, className }: AppleSessionTimelineProps) {
  const [visibleSessions, setVisibleSessions] = useState<string[]>([])
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sessionId = entry.target.getAttribute('data-session-id')
            if (sessionId && !visibleSessions.includes(sessionId)) {
              setVisibleSessions(prev => [...prev, sessionId])
            }
          }
        })
      },
      { threshold: 0.1 }
    )

    const sessionElements = timelineRef.current?.querySelectorAll('[data-session-id]')
    sessionElements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [sessions, visibleSessions])

  const handleSessionClick = (sessionId: string) => {
    onSessionClick?.(sessionId)
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3
          className="text-xl font-semibold"
          style={{ color: '#1D1D1F' }}
        >
          Recent Sessions
        </h3>
        <button
          className="text-sm font-normal transition-all"
          style={{ color: '#0071E3' }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          View All
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-4" ref={timelineRef}>
        {sessions.map((session, index) => (
          <div
            key={session.id}
            data-session-id={session.id}
            className={`opacity-0 transform translate-y-4 transition-all duration-500 ${
              visibleSessions.includes(session.id) ? 'opacity-100 translate-y-0' : ''
            }`}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            <div
              className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: '#F5F5F7',
              }}
              onClick={() => handleSessionClick(session.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E8E8ED'
                e.currentTarget.style.transform = 'translateX(2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F5F5F7'
                e.currentTarget.style.transform = 'translateX(0px)'
              }}
            >
              {/* Session type emoji */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                }}
              >
                {typeEmojis[session.type]}
              </div>

              {/* Session details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className="font-medium text-sm truncate"
                    style={{ color: '#1D1D1F' }}
                  >
                    {session.title}
                  </h4>
                  <span
                    className="text-xs ml-2 flex-shrink-0"
                    style={{ color: '#86868B' }}
                  >
                    {session.time}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Subject - NO COLORS, just gray */}
                    <span
                      className="text-xs px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        color: '#1D1D1F',
                      }}
                    >
                      {session.subject}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: '#86868B' }}
                    >
                      {session.duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs"
                      style={{ color: '#86868B' }}
                    >
                      {session.score}
                    </span>
                    <ArrowRight
                      className="w-3 h-3"
                      style={{ color: '#86868B' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date separator */}
            {index < sessions.length - 1 && sessions[index + 1].date !== session.date && (
              <div className="flex items-center mt-6 mb-2">
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: '#E8E8ED' }}
                />
                <span
                  className="px-3 text-xs"
                  style={{ color: '#86868B' }}
                >
                  {sessions[index + 1].date}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: '#E8E8ED' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View all sessions button */}
      <div className="mt-6 pt-4 border-t" style={{ borderColor: '#E8E8ED' }}>
        <button
          className="w-full p-3 rounded-xl text-sm font-medium transition-all"
          style={{
            backgroundColor: '#F5F5F7',
            color: '#1D1D1F',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E8E8ED'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F5F5F7'
          }}
        >
          View All Sessions
        </button>
      </div>
    </div>
  )
}