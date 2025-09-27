'use client'

import Link from 'next/link'
import { Mic, Upload, PenTool, Compass, Settings } from 'lucide-react'
import { useState } from 'react'

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  href: string
  primary?: boolean
}

const quickActions: QuickAction[] = [
  {
    id: 'voice-session',
    label: 'Start Session',
    description: 'Voice Learning',
    icon: <Mic className="h-5 w-5" />,
    href: '/classroom',
    primary: true
  },
  {
    id: 'practice',
    label: 'Practice',
    description: 'Take Test',
    icon: <PenTool className="h-5 w-5" />,
    href: '/practice'
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Settings & Profile',
    icon: <Settings className="h-5 w-5" />,
    href: '/wizard'
  },
  {
    id: 'explore',
    label: 'Explore',
    description: 'Browse Topics',
    icon: <Compass className="h-5 w-5" />,
    href: '/explore'
  },
  {
    id: 'upload',
    label: 'Upload',
    description: 'Add Textbook',
    icon: <Upload className="h-5 w-5" />,
    href: '/textbooks'
  }
]

export function AppleQuickActions({ className }: { className?: string }) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  return (
    <div className={`p-6 flex flex-col h-full ${className}`}>
      <h3
        className="text-xl font-semibold mb-6"
        style={{ color: '#1D1D1F' }}
      >
        Quick Actions
      </h3>

      <div className="flex-1 flex flex-col justify-between space-y-3">
        {quickActions.map((action) => (
          <Link key={action.id} href={action.href}>
            <button
              className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left"
              style={{
                backgroundColor: hoveredAction === action.id ? '#E8E8ED' : '#F5F5F7',
              }}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
            >
              {/* Icon with light gray circle - Apple style */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: action.primary ? '#0071E3' : 'rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ color: action.primary ? '#FFFFFF' : '#1D1D1F' }}>
                  {action.icon}
                </div>
              </div>

              {/* Action details */}
              <div className="flex-1">
                <h4
                  className="font-medium text-sm"
                  style={{ color: '#1D1D1F' }}
                >
                  {action.label}
                </h4>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: '#86868B' }}
                >
                  {action.description}
                </p>
              </div>
            </button>
          </Link>
        ))}
      </div>
    </div>
  )
}