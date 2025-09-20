"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FloatingElementProps {
  className?: string
  children?: React.ReactNode
  delay?: number
  duration?: number
  distance?: number
  style?: React.CSSProperties
}

const FloatingElement: React.FC<FloatingElementProps> = ({
  className,
  children,
  delay = 0,
  duration = 6,
  distance = 20
}) => {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{
        y: [-distance, distance, -distance],
        transition: {
          duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay
        }
      }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  )
}

interface FloatingCardProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  opacity?: number
  blur?: boolean
  style?: React.CSSProperties
}

const FloatingCard: React.FC<FloatingCardProps> = ({
  className,
  size = 'md',
  opacity = 0.1,
  blur = true
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  }

  return (
    <FloatingElement
      delay={Math.random() * 2}
      duration={4 + Math.random() * 4}
      distance={10 + Math.random() * 20}
      className={cn(
        "absolute rounded-full liquid-glass",
        sizeClasses[size],
        blur && "backdrop-blur-xl",
        className
      )}
      style={{ opacity }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-full" />
    </FloatingElement>
  )
}

interface FloatingElementsBackgroundProps {
  density?: 'low' | 'medium' | 'high'
  className?: string
}

const FloatingElementsBackground: React.FC<FloatingElementsBackgroundProps> = ({
  density = 'medium',
  className
}) => {
  const elementCounts = {
    low: 3,
    medium: 6,
    high: 9
  }

  const count = elementCounts[density]

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <FloatingCard
          key={index}
          size={Math.random() > 0.5 ? 'md' : 'lg'}
          opacity={0.05 + Math.random() * 0.15}
          className={cn(
            // Random positioning
            index % 3 === 0 && "top-1/4 left-1/4",
            index % 3 === 1 && "top-1/3 right-1/4",
            index % 3 === 2 && "bottom-1/4 left-1/3",
          )}
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
          }}
        />
      ))}
    </div>
  )
}

export { FloatingElement, FloatingCard, FloatingElementsBackground }