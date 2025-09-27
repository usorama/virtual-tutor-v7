'use client'

import Link from 'next/link'
import { Mic, Upload, PenTool, Compass, Settings } from 'lucide-react'
import { Card } from '@/components/ui/card'

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
    icon: <Mic className="h-6 w-6" />,
    href: '/classroom',
    primary: true
  },
  {
    id: 'practice',
    label: 'Practice',
    description: 'Take Test',
    icon: <PenTool className="h-6 w-6" />,
    href: '/practice'
  },
  {
    id: 'preferences',
    label: 'Preferences',
    description: 'Settings & Profile',
    icon: <Settings className="h-6 w-6" />,
    href: '/wizard'
  },
  {
    id: 'explore',
    label: 'Explore',
    description: 'Browse Topics',
    icon: <Compass className="h-6 w-6" />,
    href: '/explore'
  },
  {
    id: 'upload',
    label: 'Upload',
    description: 'Add Textbook',
    icon: <Upload className="h-6 w-6" />,
    href: '/textbooks'
  }
]

export function QuickActionsLight({ className }: { className?: string }) {
  return (
    <Card
      className={`p-6 overflow-hidden flex flex-col h-full relative ${className}`}
      style={{
        // Apple 2025 Liquid Glass Light Theme
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        backdropFilter: 'blur(4px) saturate(180%)',
        WebkitBackdropFilter: 'blur(4px) saturate(180%)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        borderRadius: '32px',
        overflow: 'hidden'
      }}
    >
      <h3
        className="text-title2 font-bold mb-6"
        style={{ color: 'var(--color-accent-primary)' }}
      >
        Quick Actions
      </h3>

      <div className="flex-1 flex flex-col justify-between space-y-3">
        {quickActions.map((action) => (
          <Link key={action.id} href={action.href}>
            <button
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group ${
                action.primary
                  ? 'hover:transform hover:scale-102'
                  : 'hover:transform hover:translateX(1px)'
              }`}
              style={{
                backgroundColor: 'var(--system-gray-1)',
                border: '1px solid var(--system-gray-3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--system-gray-2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--system-gray-1)'
              }}
            >
              {/* Icon with black circle - Apple 2025 standard */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(20, 20, 22, 0.9)',
                  border: '1px solid rgba(0, 0, 0, 0.2)'
                }}
              >
                <div style={{ color: 'var(--color-accent-hover)' }}>
                  {action.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div
                  className="font-bold text-base"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {action.label}
                </div>
                <div
                  className="text-sm mt-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {action.description}
                </div>
              </div>
            </button>
          </Link>
        ))}
      </div>
    </Card>
  )
}