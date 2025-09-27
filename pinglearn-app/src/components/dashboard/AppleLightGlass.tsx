'use client'

import * as React from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Apple Light Theme Glassmorphism
 * Based on Apple's 2025 Liquid Glass design for light mode
 *
 * Key principles:
 * - High opacity white (0.8-0.9) for readability
 * - Minimal blur (2-4px max)
 * - No borders, just subtle shadows
 * - Adapts to ensure text remains readable
 */

interface AppleLightGlassCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
    description: string
  }
  icon: React.ReactNode
  className?: string
}

export function AppleLightGlassCard({
  title,
  value,
  change,
  icon,
  className,
}: AppleLightGlassCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-5 transition-all duration-200',
        className
      )}
      style={{
        // Apple's light theme glass: high opacity white with subtle blur
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        // No border - just subtle shadow for depth
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header with icon */}
      <div className="flex items-start justify-between mb-3">
        {/* Title - Gray, small */}
        <h3
          className="text-sm font-normal"
          style={{ color: '#86868B' }}
        >
          {title}
        </h3>

        {/* Icon - Ultra light background for glass effect */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ color: '#1D1D1F' }}>
            {React.cloneElement(icon as React.ReactElement, {
              className: 'w-4 h-4'
            })}
          </div>
        </div>
      </div>

      {/* Value - BLACK, large, bold */}
      <p
        className="text-3xl font-semibold tracking-tight"
        style={{ color: '#1D1D1F' }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Change indicator - Subtle gray */}
      {change && (
        <div className="flex items-center gap-1.5 mt-2">
          {change.trend === 'up' ? (
            <ArrowUp className="w-3 h-3" style={{ color: '#86868B' }} />
          ) : change.trend === 'down' ? (
            <ArrowDown className="w-3 h-3" style={{ color: '#86868B' }} />
          ) : null}

          <span className="text-xs" style={{ color: '#86868B' }}>
            {change.value} {change.description}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Apple Light Glass Container
 * For larger content areas like profile cards
 */
interface AppleLightGlassContainerProps {
  children: React.ReactNode
  className?: string
}

export function AppleLightGlassContainer({
  children,
  className,
}: AppleLightGlassContainerProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-200',
        className
      )}
      style={{
        // Slightly stronger glass effect for containers
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.05)',
      }}
    >
      {children}
    </div>
  )
}