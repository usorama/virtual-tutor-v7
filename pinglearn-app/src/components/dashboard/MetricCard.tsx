'use client'

import { ReactNode } from 'react'
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
    description: string
  }
  icon: ReactNode
  className?: string
  hasGradient?: boolean
}

export function MetricCard({ title, value, change, icon, className, hasGradient = false }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (change?.trend) {
      case 'up':
        return <ArrowUp className="h-3 w-3" />
      case 'down':
        return <ArrowDown className="h-3 w-3" />
      default:
        return <TrendingUp className="h-3 w-3" />
    }
  }

  const getTrendColor = () => {
    switch (change?.trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-orange-500'
      default:
        return 'text-yellow-500'
    }
  }

  return (
    <div
      className={`relative p-6 hover:transform hover:translateY(-1px) transition-all duration-300 overflow-hidden ${className}`}
      style={{
        backgroundColor: 'rgba(20, 20, 22, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: `
          inset -4px -4px 12px rgba(128, 128, 128, 0.95),
          inset 4px 4px 12px rgba(0, 0, 0, 0.2),
          0 8px 32px -8px rgba(0, 0, 0, 0.3),
          0 4px 20px -4px rgba(6, 182, 212, 0.15),
          0 2px 16px -2px rgba(34, 197, 94, 0.08)
        `,
        borderRadius: '40px',
        minHeight: '160px'
      }}
    >
      {/* Gradient overlay - top left corner */}
      <div
        className="absolute top-0 left-0 w-48 h-48 opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left,
            rgba(34, 197, 94, 0.6) 0%,
            rgba(6, 182, 212, 0.4) 25%,
            rgba(251, 146, 60, 0.3) 50%,
            transparent 70%
          )`,
          filter: 'blur(20px)'
        }}
      />
      {/* Icon positioned top-right with cyan circle */}
      <div className="absolute top-5 right-5 w-10 h-10 rounded-full bg-accent-cyan flex items-center justify-center">
        <div className="text-black-100">
          {icon}
        </div>
      </div>

      {/* Title */}
      <div className="text-sm font-medium text-white-50 mb-2">
        {title}
      </div>

      {/* Value - Large and prominent */}
      <div className="text-5xl font-heavy text-accent-cyan mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {/* Change Indicator */}
      {change && (
        <div className="flex items-center gap-1.5">
          <span className={getTrendColor()}>
            {getTrendIcon()}
          </span>
          <span className={`text-caption1 font-medium ${getTrendColor()}`}>
            {change.value}
          </span>
          <span className="text-caption1 font-medium text-white-50">
            {change.description.replace(change.value, '').trim()}
          </span>
        </div>
      )}
    </div>
  )
}