'use client'

import Link from 'next/link'
import { Mic, Upload, PenTool, Compass } from 'lucide-react'
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
    icon: <Mic className="h-4 w-4" />,
    href: '/classroom',
    primary: true
  },
  {
    id: 'upload',
    label: 'Upload',
    description: 'Add Textbook',
    icon: <Upload className="h-4 w-4" />,
    href: '/textbooks'
  },
  {
    id: 'practice',
    label: 'Practice',
    description: 'Take Test',
    icon: <PenTool className="h-4 w-4" />,
    href: '/practice'
  },
  {
    id: 'explore',
    label: 'Explore',
    description: 'Browse Topics',
    icon: <Compass className="h-4 w-4" />,
    href: '/explore'
  }
]

export function QuickActions({ className }: { className?: string }) {
  return (
    <Card
      className={`p-6 overflow-hidden ${className}`}
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
      <h3 className="text-title1 font-heavy text-white-100 mb-6">Quick Actions</h3>

      <div className="space-y-3">
        {quickActions.map((action) => (
          <Link key={action.id} href={action.href}>
            <button
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 text-left group ${
                action.primary
                  ? 'bg-white-20 text-white-100 hover:bg-white-25 hover:transform hover:scale-105'
                  : 'bg-white-5 text-white-100 hover:bg-white-10 hover:transform hover:translateX(2px)'
              }`}
              style={{
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: 'inset -2px -2px 6px rgba(128,128,128,0.95)'
              }}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 ${action.primary ? 'text-white-100' : 'text-white-70 group-hover:text-white-100'}`}>
                {action.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${action.primary ? 'text-white-100' : 'text-white-100'}`}>
                  {action.label}
                </div>
                <div className={`text-xs ${action.primary ? 'text-white-85' : 'text-white-50'}`}>
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