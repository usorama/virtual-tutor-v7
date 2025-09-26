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
        // Light theme glassmorphism
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        backdropFilter: 'blur(10px) saturate(180%)',
        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: `
          inset -2px -2px 7px rgba(0,0,0,0.02),
          inset 2px 2px 7px rgba(255,255,255,0.8),
          0 10px 36px -6px rgba(34, 197, 94, 0.02),
          0 6px 24px -4px rgba(0, 0, 0, 0.05)
        `,
        borderRadius: '32px',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Dark Corner Highlights - Internal shadow effect for light theme */}
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
      <h3 className="text-title2 font-bold text-cyan-700 mb-6">Quick Actions</h3>

      <div className="flex-1 flex flex-col justify-between space-y-3">
        {quickActions.map((action) => (
          <Link key={action.id} href={action.href}>
            <button
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group ${
                action.primary
                  ? 'text-gray-800 hover:transform hover:scale-102'
                  : 'text-gray-800 hover:transform hover:translateX(1px)'
              }`}
              style={{
                backgroundColor: 'rgba(240, 240, 245, 0.6)',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              {/* Icon with light circle */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(240, 240, 245, 0.8)',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ color: '#0891b2' }}>
                  {action.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-base text-gray-800">
                  {action.label}
                </div>
                <div className="text-sm text-gray-600 mt-0.5">
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