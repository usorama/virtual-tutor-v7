import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface LiquidGlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'floating'
  animated?: boolean
  hover?: boolean
  depth?: 'shallow' | 'medium' | 'deep'
}

const variants = {
  default: 'liquid-glass-card',
  elevated: 'liquid-glass-card shadow-2xl',
  floating: 'liquid-glass-card shadow-xl transform-gpu'
}

const depthStyles = {
  shallow: 'transform: translateZ(5px)',
  medium: 'transform: translateZ(10px)',
  deep: 'transform: translateZ(20px)'
}

const hoverAnimation = {
  scale: 1.02,
  y: -6,
  rotateX: 2,
  rotateY: 2,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25
  }
}

const LiquidGlassCard = React.forwardRef<
  HTMLDivElement,
  LiquidGlassCardProps
>(({ children, className, variant = 'default', animated = false, hover = false, depth = 'medium', ...props }, ref) => {
  const Component = animated ? motion.div : 'div'

  return (
    <Component
      ref={ref}
      className={cn(
        variants[variant],
        "relative overflow-hidden transform-gpu",
        className
      )}
      style={{
        transform: `translateZ(${depth === 'shallow' ? '5px' : depth === 'deep' ? '20px' : '10px'})`
      }}
      {...(animated && {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: {
          duration: 0.8,
          ease: "easeOut" as const,
          delay: 0.1
        }
      })}
      {...(hover && animated && {
        whileHover: hoverAnimation
      })}
      {...props}
    >
      {/* Apple Liquid Glass auto-handles all glass effects via CSS */}

      {/* Content with proper z-index */}
      <div className="relative z-10 transform-gpu">
        {children}
      </div>
    </Component>
  )
})

LiquidGlassCard.displayName = "LiquidGlassCard"

// Maintain backward compatibility
export { LiquidGlassCard as GlassCard }