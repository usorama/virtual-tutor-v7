'use client'

import { ReactNode } from 'react'
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

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
}

export function MetricCard({ title, value, change, icon, className }: MetricCardProps) {
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
        return 'text-indicator-success'
      case 'down':
        return 'text-indicator-error'
      default:
        return 'text-accent-cyan'
    }
  }

  return (
    <Card
      className={`p-4 hover:transform hover:translateY(-1px) transition-all duration-300 overflow-hidden ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'inset -4px -4px 12px rgba(128,128,128,0.95), inset 4px 4px 12px rgba(0,0,0,0.1)',
        borderRadius: '32px'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-caption1 font-semibold text-white-70">{title}</div>
        <div className="text-white-50">{icon}</div>
      </div>

      {/* Value */}
      <div className="text-title3 font-heavy text-white-100 mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {/* Change Indicator */}
      {change && (
        <div className={`flex items-center gap-1.5 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-caption1 font-medium">
            {change.description}
          </span>
        </div>
      )}
    </Card>
  )
}