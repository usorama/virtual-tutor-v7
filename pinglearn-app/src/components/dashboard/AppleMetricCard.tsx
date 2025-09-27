'use client'

import * as React from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppleMetricCardProps {
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

/**
 * Authentic Apple-style metric card - black text on white
 * Following Apple's actual design philosophy
 */
export function AppleMetricCard({
  title,
  value,
  change,
  icon,
  className,
}: AppleMetricCardProps) {

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl p-5 transition-all duration-200',
        className
      )}
      style={{
        border: '1px solid #D2D2D7',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
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

        {/* Icon - Light gray background, no colors */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#F5F5F7' }}
        >
          <div style={{ color: '#1D1D1F' }}>
            {React.isValidElement(icon)
              ? React.cloneElement(icon, { className: 'w-4 h-4' } as any)
              : icon
            }
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
 * Apple-style glass card variant with subtle blur
 */
export function AppleGlassCard({
  title,
  value,
  change,
  icon,
  className,
}: AppleMetricCardProps) {

  return (
    <div
      className={cn(
        'relative rounded-2xl p-5 transition-all duration-200',
        className
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
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

        {/* Icon - Even lighter background for glass */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(245, 245, 247, 0.6)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div style={{ color: '#1D1D1F' }}>
            {React.isValidElement(icon)
              ? React.cloneElement(icon, { className: 'w-4 h-4' } as any)
              : icon
            }
          </div>
        </div>
      </div>

      {/* Value - BLACK, not colored */}
      <p
        className="text-3xl font-semibold tracking-tight"
        style={{ color: '#1D1D1F' }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Change indicator */}
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