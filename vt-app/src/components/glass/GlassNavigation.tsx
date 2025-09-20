"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GlassButton } from './GlassButton'

interface NavigationItem {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'liquid-glass' | 'liquid-primary' | 'liquid-secondary'
  size?: 'default' | 'sm' | 'lg'
}

interface LiquidGlassNavigationProps {
  logo?: React.ReactNode
  items?: NavigationItem[]
  className?: string
  fixed?: boolean
  transparent?: boolean
  depth?: 'floating' | 'elevated' | 'surface'
}

const LiquidGlassNavigation: React.FC<LiquidGlassNavigationProps> = ({
  logo,
  items = [],
  className,
  fixed = false,
  transparent = false,
  depth = 'elevated'
}) => {
  const depthStyles = {
    floating: 'liquid-glass-nav shadow-2xl transform: translateZ(30px)',
    elevated: 'liquid-glass-nav shadow-xl transform: translateZ(20px)',
    surface: 'liquid-glass-nav shadow-lg transform: translateZ(10px)'
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{
        duration: 1,
        ease: [0.4, 0, 0.2, 1],
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      className={cn(
        "w-full z-50 transition-all duration-500 transform-gpu",
        fixed && "fixed top-0 left-0 right-0",
        transparent ? "bg-transparent" : depthStyles[depth],
        className
      )}
      style={{
        transform: `translateZ(${depth === 'floating' ? '30px' : depth === 'elevated' ? '20px' : '10px'})`
      }}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo with enhanced animation */}
          {logo && (
            <motion.div
              initial={{ opacity: 0, x: -30, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="flex items-center transform-gpu"
            >
              {logo}
            </motion.div>
          )}

          {/* Navigation Items with staggered animation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.5,
              duration: 0.8,
              type: "spring",
              stiffness: 150
            }}
            className="flex items-center gap-2 md:gap-3 lg:gap-4"
          >
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.7 + index * 0.1,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                className="transform-gpu"
              >
                {item.href ? (
                  <a href={item.href}>
                    <GlassButton
                      variant={item.variant || 'liquid-glass'}
                      size={item.size || 'default'}
                      glow={item.variant === 'liquid-primary'}
                      depth="medium"
                      animated={true}
                    >
                      {item.label}
                    </GlassButton>
                  </a>
                ) : (
                  <GlassButton
                    variant={item.variant || 'liquid-glass'}
                    size={item.size || 'default'}
                    onClick={item.onClick}
                    glow={item.variant === 'liquid-primary'}
                    depth="medium"
                    animated={true}
                  >
                    {item.label}
                  </GlassButton>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Enhanced bottom border with liquid glass effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm" />
      </div>

      {/* Subtle top glow for floating effect */}
      {depth === 'floating' && (
        <div className="absolute -top-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm" />
      )}
    </motion.nav>
  )
}

// Maintain backward compatibility
export { LiquidGlassNavigation as GlassNavigation }