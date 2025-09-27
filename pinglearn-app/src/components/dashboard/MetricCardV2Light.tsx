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
      {/* Main Card Section - Title and Value */}
      <h2
        className="text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        {title}
      </h2>

      <p
        className="mt-2 text-5xl font-bold tracking-tight"
        style={{ color: 'var(--color-accent-primary)' }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Sub-Card Section - Interactive area with trend and icon */}
      <div
        className="group mt-6 cursor-pointer rounded-xl p-4 transition-all duration-300"
        style={{
          backgroundColor: 'var(--system-gray-1)',
          border: '1px solid var(--system-gray-3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--system-gray-2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--system-gray-1)'
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
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {change.description.replace(change.value, '').trim()}
              </p>
            </div>
          ) : (
            <div>
              <p
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                No change data
              </p>
            </div>
          )}

          {/* Icon in black circle - Apple 2025 standard */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: 'rgba(20, 20, 22, 0.9)',
              border: '1px solid rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ color: 'var(--color-accent-hover)' }}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}