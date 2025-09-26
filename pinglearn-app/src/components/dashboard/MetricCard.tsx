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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px) saturate(180%)',
        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: `
          inset -2px -2px 7px rgba(255, 255, 255, 0.95),
          inset 2px 2px 7px rgba(0, 0, 0, 0.1),
          0 10px 36px -6px rgba(34, 197, 94, 0.06),
          0 6px 24px -4px rgba(0, 0, 0, 0.15)
        `,
        borderRadius: '32px',
        minHeight: '160px',
        overflow: 'hidden'
      }}
    >
      {/* Pure White Corner Highlights - Internal glow effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50px',
          height: '50px',
          background: 'radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 15%, rgba(255, 255, 255, 0.7) 25%, rgba(255, 255, 255, 0.3) 35%, rgba(255, 255, 255, 0.05) 45%, rgba(0, 0, 0, 0) 55%)',
          pointerEvents: 'none',
          opacity: 1,
          mixBlendMode: 'screen',
          filter: 'blur(3px)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '60px',
          height: '55px',
          background: 'radial-gradient(ellipse at 100% 100%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 15%, rgba(255, 255, 255, 0.7) 25%, rgba(255, 255, 255, 0.3) 35%, rgba(255, 255, 255, 0.05) 45%, rgba(0, 0, 0, 0) 55%)',
          pointerEvents: 'none',
          opacity: 1,
          mixBlendMode: 'screen',
          filter: 'blur(3px)'
        }}
      />
      {/* Icon positioned top-right with standard dark circle */}
      <div
        className="absolute top-5 right-5 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(20, 20, 22, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ color: '#06B6D4' }}>
          {icon}
        </div>
      </div>

      {/* Title */}
      <div className="text-sm font-medium text-white-50 mb-2">
        {title}
      </div>

      {/* Value - Large and prominent */}
      <div className="text-5xl font-heavy text-accent mb-2">
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