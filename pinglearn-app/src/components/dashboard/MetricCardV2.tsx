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
  /** Icon to display in the top-left corner */
  icon: React.ReactNode
  /** Optional additional class names */
  className?: string
}

/**
 * A modern metric card component with glassmorphism effect
 * Inspired by the card-3 component structure but tailored for metrics
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
        'relative w-full rounded-2xl p-6',
        className
      )}
      style={{
        // Glassmorphism effect for main container
        backgroundColor: 'rgba(20, 20, 22, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: `
          inset -2px -2px 8px rgba(255, 255, 255, 0.02),
          inset 2px 2px 8px rgba(0, 0, 0, 0.3),
          0 8px 32px -8px rgba(0, 0, 0, 0.3)
        `,
      }}
    >
      {/* Icon positioned top-left with black background */}
      <div className="absolute top-4 left-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
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

      {/* Title positioned below icon */}
      <div className="mt-14 mb-2">
        <p className="text-sm font-medium text-white-50">
          {title}
        </p>
      </div>

      {/* Main Value Display - Cyan colored */}
      <div className="mb-2">
        <p className="text-5xl font-bold tracking-tight text-accent-cyan">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>

      {/* Trend Indicator */}
      {change && (
        <div className="flex items-center gap-1.5">
          <span className={getTrendColor()}>
            {getTrendIcon()}
          </span>
          <span className={`text-xs font-medium ${getTrendColor()}`}>
            {change.value}
          </span>
          <span className="text-xs font-medium text-white-50">
            {change.description.replace(change.value, '').trim()}
          </span>
        </div>
      )}
    </div>
  )
}