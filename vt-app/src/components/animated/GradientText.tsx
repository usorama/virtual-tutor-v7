"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GradientTextProps {
  text: string
  className?: string
  gradient?: string
  animated?: boolean
}

const letterVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 }
}

const GradientText: React.FC<GradientTextProps> = ({
  text,
  className,
  gradient = "from-primary via-primary to-primary/80",
  animated = true
}) => {
  const words = text.split(' ')

  if (!animated) {
    return (
      <span className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        gradient,
        className
      )}>
        {text}
      </span>
    )
  }

  return (
    <motion.h1 className={cn("inline-block", className)}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block">
          {word.split('').map((letter, letterIndex) => (
            <motion.span
              key={letterIndex}
              variants={letterVariants}
              initial="hidden"
              animate="visible"
              transition={{
                delay: (wordIndex * 10 + letterIndex) * 0.05,
                duration: 0.6,
                ease: "easeOut"
              }}
              className={cn(
                "inline-block bg-gradient-to-r bg-clip-text text-transparent",
                gradient
              )}
            >
              {letter}
            </motion.span>
          ))}
          {wordIndex < words.length - 1 && (
            <motion.span
              variants={letterVariants}
              initial="hidden"
              animate="visible"
              transition={{
                delay: (wordIndex * 10 + word.length) * 0.05,
                duration: 0.6,
                ease: "easeOut"
              }}
              className="inline-block"
            >
              &nbsp;
            </motion.span>
          )}
        </span>
      ))}
    </motion.h1>
  )
}

export { GradientText }