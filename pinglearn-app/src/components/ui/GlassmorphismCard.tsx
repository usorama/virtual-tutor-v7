/**
 * PingLearn Glassmorphism Card Component
 * Apple 2025 Standards - Plug & Play
 *
 * This is the standardized glassmorphism card component that follows
 * exact specifications from our design system. Use this anywhere you
 * need a glassmorphism container - zero customization required.
 *
 * @example
 * // Basic usage
 * <GlassmorphismCard>
 *   <h3>Your content here</h3>
 * </GlassmorphismCard>
 *
 * // With inner section
 * <GlassmorphismCard>
 *   <h3>Card Title</h3>
 *   <GlassmorphismCard.InnerSection>
 *     <GlassmorphismCard.IconCircle>
 *       <YourIcon />
 *     </GlassmorphismCard.IconCircle>
 *     <p>Inner content</p>
 *   </GlassmorphismCard.InnerSection>
 * </GlassmorphismCard>
 */

'use client'

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  glassmorphismContainer,
  innerSection,
  iconCircle,
  cornerHighlightTopLeft,
  cornerHighlightBottomRight,
  glassmorphismColors,
  type GlassmorphismComponentProps
} from '@/lib/design/glassmorphism'

// ==========================================
// MAIN CARD COMPONENT
// ==========================================

interface GlassmorphismCardProps extends GlassmorphismComponentProps {
  children: ReactNode
  /** Padding for the card content (default: 'p-6') */
  padding?: string
  /** Whether to include corner highlights (default: true) */
  includeHighlights?: boolean
}

export function GlassmorphismCard({
  children,
  className,
  style,
  padding = 'p-6',
  includeHighlights = true,
  ...props
}: GlassmorphismCardProps) {
  return (
    <div
      className={cn('relative overflow-hidden', padding, className)}
      style={{
        ...glassmorphismContainer,
        ...style
      }}
      {...props}
    >
      {/* Pure White Corner Highlights */}
      {includeHighlights && (
        <>
          <div style={cornerHighlightTopLeft} />
          <div style={cornerHighlightBottomRight} />
        </>
      )}

      {/* Content */}
      {children}
    </div>
  )
}

// ==========================================
// INNER SECTION COMPONENT
// ==========================================

interface InnerSectionProps extends GlassmorphismComponentProps {
  children: ReactNode
  /** Border radius for the inner section (default: 'rounded-xl') */
  rounded?: string
  /** Padding for the inner section (default: 'p-4') */
  padding?: string
}

function InnerSection({
  children,
  className,
  style,
  rounded = 'rounded-xl',
  padding = 'p-4',
  ...props
}: InnerSectionProps) {
  return (
    <div
      className={cn(rounded, padding, className)}
      style={{
        ...innerSection,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// ==========================================
// ICON CIRCLE COMPONENT
// ==========================================

interface IconCircleProps extends GlassmorphismComponentProps {
  children: ReactNode
  /** Size of the icon circle in pixels (default: 48) */
  size?: number
}

function IconCircle({
  children,
  className,
  style,
  size = 48,
  ...props
}: IconCircleProps) {
  return (
    <div
      className={cn('flex-shrink-0', className)}
      style={{
        ...iconCircle,
        width: `${size}px`,
        height: `${size}px`,
        ...style
      }}
      {...props}
    >
      <div style={{ color: glassmorphismColors.iconColor }}>
        {children}
      </div>
    </div>
  )
}

// ==========================================
// TEXT COMPONENTS
// ==========================================

interface TextProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

function Title({ children, className, style }: TextProps) {
  return (
    <h3
      className={cn('text-title2 font-bold', className)}
      style={{ color: glassmorphismColors.accent, ...style }}
    >
      {children}
    </h3>
  )
}

function Subtitle({ children, className, style }: TextProps) {
  return (
    <p
      className={cn('text-sm font-medium', className)}
      style={{ color: glassmorphismColors.textWhite50, ...style }}
    >
      {children}
    </p>
  )
}

function Content({ children, className, style }: TextProps) {
  return (
    <div
      className={cn('text-white-100', className)}
      style={style}
    >
      {children}
    </div>
  )
}

// ==========================================
// COMPOUND COMPONENT PATTERN
// ==========================================

GlassmorphismCard.InnerSection = InnerSection
GlassmorphismCard.IconCircle = IconCircle
GlassmorphismCard.Title = Title
GlassmorphismCard.Subtitle = Subtitle
GlassmorphismCard.Content = Content

// ==========================================
// PRESET COMPONENTS
// ==========================================

/**
 * Pre-built metric card following MetricCardV2 pattern
 */
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

export function QuickMetricCard({ title, value, change, icon, className }: MetricCardProps) {
  const getTrendColor = () => {
    if (!change) return ''
    switch (change.trend) {
      case 'up': return 'text-green-500'
      case 'down': return 'text-red-500'
      default: return 'text-yellow-500'
    }
  }

  return (
    <GlassmorphismCard className={className}>
      <GlassmorphismCard.Subtitle>{title}</GlassmorphismCard.Subtitle>

      <p className="mt-2 text-5xl font-bold tracking-tight" style={{ color: glassmorphismColors.accent }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      <GlassmorphismCard.InnerSection className="mt-6">
        <div className="flex items-center justify-between">
          {change ? (
            <div>
              <span className={`text-sm font-semibold ${getTrendColor()}`}>
                {change.value}
              </span>
              <p className="text-xs mt-1" style={{ color: glassmorphismColors.textWhite50 }}>
                {change.description.replace(change.value, '').trim()}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs" style={{ color: glassmorphismColors.textWhite50 }}>
                No change data
              </p>
            </div>
          )}

          <GlassmorphismCard.IconCircle>
            {icon}
          </GlassmorphismCard.IconCircle>
        </div>
      </GlassmorphismCard.InnerSection>
    </GlassmorphismCard>
  )
}

/**
 * Pre-built action card following QuickActions pattern
 */
interface ActionCardProps {
  title: string
  description: string
  icon: ReactNode
  onClick?: () => void
  className?: string
}

export function QuickActionCard({ title, description, icon, onClick, className }: ActionCardProps) {
  return (
    <GlassmorphismCard className={className}>
      <GlassmorphismCard.Title>{title}</GlassmorphismCard.Title>

      <div className="mt-4 space-y-3">
        <button
          onClick={onClick}
          className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group hover:transform hover:translateX(1px)"
          style={{
            backgroundColor: glassmorphismColors.innerBackground60,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <GlassmorphismCard.IconCircle>
            {icon}
          </GlassmorphismCard.IconCircle>

          <div className="flex-1 min-w-0">
            <div className="font-bold text-base" style={{ color: glassmorphismColors.textWhite100 }}>
              {title}
            </div>
            <div className="text-sm mt-0.5" style={{ color: glassmorphismColors.textWhite50 }}>
              {description}
            </div>
          </div>
        </button>
      </div>
    </GlassmorphismCard>
  )
}

export default GlassmorphismCard