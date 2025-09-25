'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { CSSProperties, ReactNode } from 'react'

export interface Tab {
  id: string | number
  label: string
  badge?: string | number
  disabled?: boolean
}

interface TabbedGlassCardProps {
  tabs: Tab[]
  activeTab: string | number
  onTabChange?: (tabId: string | number) => void
  children: ReactNode
  className?: string
  contentClassName?: string
  borderRadius?: 'normal' | 'large' | 'xlarge'
}

export function TabbedGlassCard({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
  contentClassName,
  borderRadius = 'xlarge'
}: TabbedGlassCardProps) {
  const radiusMap = {
    normal: { tab: '16px', card: '16px' },
    large: { tab: '24px', card: '24px' },
    xlarge: { tab: '40px', card: '40px' }
  }

  const radius = radiusMap[borderRadius]
  const tabWidth = `${100 / tabs.length}%`

  const formatTabLabel = (label: string) => {
    // Smart text splitting - keep '&' with previous word
    const words = label.split(' ')
    const lines = []
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      if (word === '&' && currentLine) {
        currentLine += ` ${word}`
      } else if (currentLine && word !== '&') {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word
      }
    }
    if (currentLine) lines.push(currentLine)
    return lines
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Tab Navigation Row - Full width to match card */}
      <div className="relative flex gap-0 w-full">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab
          const isClickable = !tab.disabled

          return (
            <div
              key={tab.id}
              className="relative flex"
              style={{ width: tabWidth }}
            >
              <button
                type="button"
                onClick={() => {
                  if (isClickable && onTabChange && tab.id !== activeTab) {
                    onTabChange(tab.id)
                  }
                }}
                disabled={!isClickable}
                className={`
                  flex-1 relative h-16 transition-all duration-300
                  ${isActive
                    ? 'bg-transparent z-20'
                    : isClickable
                      ? 'bg-white/5 border border-white/10 border-b-0 opacity-80 hover:opacity-100 hover:bg-white/10 cursor-pointer'
                      : 'bg-white/5 border border-white/10 border-b-0 opacity-40 cursor-not-allowed'
                  }
                `}
                style={isActive ? {
                  border: '1px solid rgba(6, 182, 212, 0.6)',
                  borderBottom: 'none',
                  backgroundColor: 'transparent',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  marginBottom: '-1px',
                  width: '100%',
                  borderTopLeftRadius: index === 0 ? radius.tab : 0,
                  borderTopRightRadius: index === tabs.length - 1 ? radius.tab : 0,
                  boxShadow: '12px 0 24px -4px rgba(6, 182, 212, 0.4)',
                  clipPath: 'inset(-50px -50px -1px -50px)'
                } : {
                  borderTopLeftRadius: index === 0 ? radius.tab : 0,
                  borderTopRightRadius: index === tabs.length - 1 ? radius.tab : 0
                }}
              >
                <div className="flex items-center gap-3 h-full px-4">
                  {/* Badge/Number - Left Aligned */}
                  {tab.badge !== undefined && (
                    <div className={`flex items-center justify-center min-w-[24px] w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                      isActive
                        ? 'bg-accent text-black'
                        : isClickable
                          ? 'bg-white/10 text-white/70'
                          : 'bg-white/5 text-white/30'
                    }`}>
                      {tab.badge}
                    </div>
                  )}

                  {/* Tab Text - Two Lines */}
                  <div className="flex-1 text-right">
                    {formatTabLabel(tab.label).map((line, lineIndex) => (
                      <div
                        key={lineIndex}
                        className={`text-xs font-medium uppercase tracking-wider leading-tight ${
                          isActive
                            ? 'text-accent'
                            : isClickable
                              ? 'text-white/70'
                              : 'text-white/30'
                        }`}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Top border cover - hides the border where active tab connects */}
      <div
        className="absolute top-0 h-[2px] z-15"
        style={{
          left: `${(tabs.findIndex(t => t.id === activeTab) * 100) / tabs.length}%`,
          width: tabWidth,
          marginTop: '-1px',
          backgroundColor: 'transparent'
        }}
      />

      {/* Main Card Content */}
      <Card
        className={cn("p-8 overflow-hidden relative z-10 w-full", contentClassName)}
        style={{
          backgroundColor: 'transparent',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(6, 182, 212, 0.6)',
          borderTop: '1px solid rgba(6, 182, 212, 0.6)',
          borderRadius: `0 0 ${radius.card} ${radius.card}`,
          marginTop: '-1px',
          boxShadow: '12px 0 24px -4px rgba(6, 182, 212, 0.4), 0 12px 24px -4px rgba(6, 182, 212, 0.3)',
          clipPath: 'inset(-1px -50px -50px -50px)'
        }}
      >
        {children}
      </Card>
    </div>
  )
}