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

export function QuickActions({ className }: { className?: string }) {
  return (
    <Card
      className={`p-6 overflow-hidden flex flex-col h-full ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: `
          inset -4px -4px 12px rgba(128,128,128,0.95),
          inset 4px 4px 12px rgba(0,0,0,0.1),
          0 10px 36px -6px rgba(34, 197, 94, 0.06),
          0 6px 24px -4px rgba(0, 0, 0, 0.15)
        `,
        borderRadius: '32px'
      }}
    >
      <h3 className="text-title2 font-bold text-accent mb-6">Quick Actions</h3>

      <div className="flex-1 flex flex-col justify-between space-y-3">
        {quickActions.map((action) => (
          <Link key={action.id} href={action.href}>
            <button
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group ${
                action.primary
                  ? 'text-white-100 hover:transform hover:scale-102'
                  : 'text-white-100 hover:transform hover:translateX(1px)'
              }`}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(1px)',
                WebkitBackdropFilter: 'blur(1px)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              {/* Icon with black circle */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgb(0, 0, 0)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="text-accent-cyan">
                  {action.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base text-white-100">
                  {action.label}
                </div>
                <div className="text-sm text-white-50 mt-0.5">
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