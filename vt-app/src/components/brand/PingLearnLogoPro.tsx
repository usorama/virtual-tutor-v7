"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PingLearnLogoProProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  showWordmark?: boolean
  className?: string
  variant?: 'default' | 'mono' | 'gradient'
}

const PingLearnLogoPro: React.FC<PingLearnLogoProProps> = ({
  size = 'md',
  animated = true,
  showWordmark = true,
  className,
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  const waveVariants = {
    initial: {
      pathLength: 0,
      opacity: 0
    },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2, ease: "easeInOut" as const },
        opacity: { duration: 0.5 }
      }
    }
  }

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  }

  const getLogoColors = () => {
    switch (variant) {
      case 'mono':
        return {
          primary: '#ffffff',
          secondary: '#ffffff',
          accent: '#ffffff'
        }
      case 'gradient':
        return {
          primary: 'url(#pingGradient)',
          secondary: 'url(#pingGradient)',
          accent: '#00d4aa'
        }
      default:
        return {
          primary: '#0066ff',
          secondary: '#ff6b35',
          accent: '#00d4aa'
        }
    }
  }

  const colors = getLogoColors()

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <motion.div
        className={cn("relative", sizeClasses[size])}
        initial="initial"
        animate={animated ? "animate" : "initial"}
        variants={pulseVariants}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {variant === 'gradient' && (
            <defs>
              <linearGradient id="pingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0066ff" />
                <stop offset="50%" stopColor="#00d4aa" />
                <stop offset="100%" stopColor="#ff6b35" />
              </linearGradient>
            </defs>
          )}

          {/* Outer Circle - Voice Range */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Middle Circle - AI Core */}
          <motion.circle
            cx="50"
            cy="50"
            r="35"
            stroke={colors.accent}
            strokeWidth="3"
            fill="none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />

          {/* Inner Circle - Education Focus */}
          <motion.circle
            cx="50"
            cy="50"
            r="25"
            fill={colors.primary}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />

          {/* Voice Wave Pattern */}
          {animated && (
            <>
              <motion.path
                d="M 30 50 Q 40 40, 50 50 T 70 50"
                stroke={colors.accent}
                strokeWidth="2"
                fill="none"
                variants={waveVariants}
                initial="initial"
                animate="animate"
              />
              <motion.path
                d="M 30 50 Q 40 60, 50 50 T 70 50"
                stroke={colors.secondary}
                strokeWidth="2"
                fill="none"
                variants={waveVariants}
                initial="initial"
                animate="animate"
                style={{ animationDelay: '0.5s' }}
              />
            </>
          )}

          {/* Center P Letter */}
          <motion.text
            x="50"
            y="58"
            textAnchor="middle"
            fill="white"
            fontSize="24"
            fontWeight="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            P
          </motion.text>
        </svg>

        {/* Animated Rings for Active State */}
        {animated && (
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-ping-accent/20"
                initial={{ scale: 1, opacity: 0 }}
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.5, 0.3, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {showWordmark && (
        <div className="flex flex-col">
          <motion.h1
            className={cn(
              textSizes[size],
              "font-bold tracking-tight",
              variant === 'gradient'
                ? "bg-gradient-to-r from-ping-primary via-ping-accent to-ping-secondary bg-clip-text text-transparent"
                : variant === 'mono'
                ? "text-white"
                : "text-foreground"
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            PingLearn
          </motion.h1>
          <motion.p
            className="text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Voice AI for Education
          </motion.p>
        </div>
      )}
    </div>
  )
}

export { PingLearnLogoPro }