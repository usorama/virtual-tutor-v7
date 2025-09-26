'use client'

import * as React from 'react'
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardV2Props {
  /** The title/label of the metric */
  title: string
  /** The main value to display (number or string) */
  value: string | number
  /** Optional change indicator */
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
    description: string
  }
  /** Icon to display */
  icon: React.ReactNode
  /** Optional additional class names */
  className?: string
}

/**
 * A modern metric card component with glassmorphism effect
 * Following the card-3 component two-section structure
 */
export function MetricCardV2({
  title,
  value,
  change,
  icon,
  className,
}: MetricCardV2Props) {

  const getTrendIcon = () => {
    if (!change) return null

    switch (change.trend) {
      case 'up':
        return <ArrowUp className="h-3 w-3" />
      case 'down':
        return <ArrowDown className="h-3 w-3" />
      default:
        return <TrendingUp className="h-3 w-3" />
    }
  }

  const getTrendColor = () => {
    if (!change) return ''

    switch (change.trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-yellow-500'
    }
  }

  return (
    <div
      className={cn(
        'w-full rounded-2xl p-6 text-card-foreground',
        className
      )}
      style={{
        // Glassmorphism effect for main container - matching other cards
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
      }}
    >
      {/* Main Card Section - Title and Value */}
      <h2 className="text-sm font-medium text-white-50">{title}</h2>

      <p className="mt-2 text-5xl font-bold tracking-tight" style={{ color: '#06B6D4' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Sub-Card Section - Interactive area with trend and icon */}
      <div
        className="group mt-6 cursor-pointer rounded-xl p-4 transition-all duration-300 hover:bg-muted/80"
        style={{
          backgroundColor: 'rgba(20, 20, 22, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Trend Information */}
          {change ? (
            <div>
              <div className="flex items-center gap-1.5">
                <span className={getTrendColor()}>
                  {getTrendIcon()}
                </span>
                <span className={`text-sm font-semibold ${getTrendColor()}`}>
                  {change.value}
                </span>
              </div>
              <p className="text-xs text-white-50 mt-1">
                {change.description.replace(change.value, '').trim()}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-white-50">No change data</p>
            </div>
          )}

          {/* Icon in black circle - matching Quick Actions */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: 'rgb(0, 0, 0)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ color: '#06B6D4' }}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}