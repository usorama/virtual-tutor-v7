'use client'

import * as React from 'react'
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardV2LightProps {
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
  /** Enable liquid glass white shadow effect (bottom-right corner) */
  liquidGlass?: boolean
}

/**
 * A modern metric card component with glassmorphism effect - Light Theme Version
 * Following the card-3 component two-section structure
 */
export function MetricCardV2Light({
  title,
  value,
  change,
  icon,
  className,
  liquidGlass = false,
}: MetricCardV2LightProps) {

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
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-amber-600'
    }
  }

  return (
    <div
      className={cn(
        'w-full p-6 text-card-foreground relative',
        className
      )}
      style={{
        // Light theme glassmorphism effect - using dark overlay with low opacity
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
      {/* Main Card Section - Title and Value */}
      <h2 className="text-sm font-medium text-gray-500">{title}</h2>

      <p className="mt-2 text-5xl font-bold tracking-tight text-cyan-600">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Sub-Card Section - Interactive area with trend and icon */}
      <div
        className="group mt-6 cursor-pointer rounded-xl p-4 transition-all duration-300 hover:bg-gray-50"
        style={{
          backgroundColor: 'rgba(240, 240, 245, 0.6)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
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
              <p className="text-xs text-gray-500 mt-1">
                {change.description.replace(change.value, '').trim()}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500">No change data</p>
            </div>
          )}

          {/* Icon in light circle - matching Quick Actions light theme */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: 'rgba(240, 240, 245, 0.8)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ color: '#0891b2' }}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}