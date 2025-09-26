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
        // Glassmorphism effect for main container
        backgroundColor: 'rgba(20, 20, 22, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: `
          inset -2px -2px 8px rgba(255, 255, 255, 0.02),
          inset 2px 2px 8px rgba(0, 0, 0, 0.3),
          0 8px 32px -8px rgba(0, 0, 0, 0.3)
        `,
      }}
    >
      {/* Main Card Section - Title and Value */}
      <h2 className="text-sm font-medium text-white-50">{title}</h2>

      <p className="mt-2 text-5xl font-bold tracking-tight text-accent-cyan">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Sub-Card Section - Interactive area with trend and icon */}
      <div
        className="group mt-6 cursor-pointer rounded-xl p-4 transition-all duration-300"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
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

          {/* Icon in black circle */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: 'rgb(0, 0, 0)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="text-accent-cyan">
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}