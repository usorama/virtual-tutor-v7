'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { CSSProperties, ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  variant?: 'default' | 'elevated'
  borderRadius?: 'normal' | 'large' | 'xlarge'
}

export function GlassCard({
  children,
  className,
  style,
  variant = 'default',
  borderRadius = 'xlarge'
}: GlassCardProps) {
  const radiusMap = {
    normal: '16px',
    large: '24px',
    xlarge: '40px'
  }

  const baseStyles: CSSProperties = {
    backgroundColor: 'transparent',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(6, 182, 212, 0.6)',
    borderRadius: radiusMap[borderRadius],
    ...style
  }

  const variantStyles: CSSProperties = variant === 'elevated' ? {
    boxShadow: '12px 0 24px -4px rgba(6, 182, 212, 0.4), 0 12px 24px -4px rgba(6, 182, 212, 0.3)',
    clipPath: 'inset(-1px -50px -50px -50px)'
  } : {}

  return (
    <Card
      className={cn("overflow-hidden", className)}
      style={{ ...baseStyles, ...variantStyles }}
    >
      {children}
    </Card>
  )
}