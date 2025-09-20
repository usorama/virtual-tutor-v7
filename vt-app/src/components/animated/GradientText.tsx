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
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.6,
      ease: [0.25, 0.25, 0, 1]
    }
  })
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
              custom={wordIndex * 10 + letterIndex}
              variants={letterVariants}
              initial="hidden"
              animate="visible"
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
              custom={wordIndex * 10 + word.length}
              variants={letterVariants}
              initial="hidden"
              animate="visible"
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