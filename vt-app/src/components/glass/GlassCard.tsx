import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'subtle'
  animated?: boolean
  hover?: boolean
}

const variants = {
  default: 'glass-card',
  elevated: 'glass-card shadow-2xl backdrop-blur-2xl',
  subtle: 'backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg'
}

const hoverAnimation = {
  scale: 1.02,
  y: -4,
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 25
  }
}

const GlassCard = React.forwardRef<
  HTMLDivElement,
  GlassCardProps
>(({ children, className, variant = 'default', animated = false, hover = false, ...props }, ref) => {
  const Component = animated ? motion.div : 'div'

  return (
    <Component
      ref={ref}
      className={cn(
        variants[variant],
        "relative overflow-hidden",
        className
      )}
      {...(animated && {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: "easeOut" }
      })}
      {...(hover && animated && {
        whileHover: hoverAnimation
      })}
      {...props}
    >
      {/* Subtle inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  )
})

GlassCard.displayName = "GlassCard"

export { GlassCard }