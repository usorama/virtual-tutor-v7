"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Mic, Zap, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PingLearnLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  showWordmark?: boolean
  className?: string
  variant?: 'default' | 'white' | 'dark'
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl'
}

const PingLearnLogo: React.FC<PingLearnLogoProps> = ({
  size = 'md',
  animated = true,
  showWordmark = true,
  className,
  variant = 'default'
}) => {
  const iconVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: {
      scale: 1.1,
      rotate: 15
    },
    ping: {
      scale: [1, 1.2, 1]
    }
  }

  const waveVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1
    }
  }

  const getTextColors = () => {
    switch (variant) {
      case 'white':
        return 'from-white to-white/90'
      case 'dark':
        return 'from-gray-900 to-gray-700'
      default:
        return 'from-ping-primary to-ping-accent'
    }
  }

  const getIconColors = () => {
    switch (variant) {
      case 'white':
        return 'text-white'
      case 'dark':
        return 'text-gray-900'
      default:
        return 'text-ping-primary'
    }
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Icon with animated ping effect */}
      <motion.div
        className={cn(
          "relative rounded-xl bg-gradient-to-br from-ping-primary/20 to-ping-accent/10 flex items-center justify-center border border-ping-primary/20",
          sizeClasses[size]
        )}
        variants={iconVariants}
        initial="initial"
        whileHover={animated ? "hover" : undefined}
        animate={animated ? "ping" : undefined}
        transition={{
          duration: animated ? 2 : 0.3,
          repeat: animated ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        {/* Voice/Audio waves background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 24 24"
        >
          <motion.path
            d="M3 12h4l3-3 3 3h4m-6-6v12"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            className={getIconColors()}
            variants={waveVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 2,
              ease: "easeInOut"
            }}
          />
        </svg>

        {/* Main icon - combination of mic and zap for voice AI */}
        <div className="relative">
          <Mic className={cn("w-1/2 h-1/2", getIconColors())} />
          <Zap className={cn("absolute -top-1 -right-1 w-1/3 h-1/3", getIconColors())} />
        </div>
      </motion.div>

      {/* Wordmark */}
      {showWordmark && (
        <motion.div
          className="flex flex-col"
          initial={animated ? { opacity: 0, x: -10 } : undefined}
          animate={animated ? { opacity: 1, x: 0 } : undefined}
          transition={animated ? { delay: 0.2, duration: 0.5 } : undefined}
        >
          <span className={cn(
            "font-bold bg-gradient-to-r bg-clip-text text-transparent leading-tight",
            textSizeClasses[size],
            getTextColors()
          )}>
            PingLearn
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span className="text-xs text-muted-foreground font-medium tracking-wide">
              Voice AI for Education
            </span>
          ) : null}
        </motion.div>
      )}
    </div>
  )
}

export { PingLearnLogo }