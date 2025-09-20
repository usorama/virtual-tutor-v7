"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { cn } from '@/lib/utils'
import { GradientText } from './GradientText'

interface AnimatedHeroProps {
  title: string
  subtitle?: string
  description?: string
  className?: string
  children?: React.ReactNode
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 1,
      staggerChildren: 0.3,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const
    }
  }
}

const floatingAnimation = {
  y: [-10, 10, -10],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
}

const AnimatedHero: React.FC<AnimatedHeroProps> = ({
  title,
  subtitle,
  description,
  className,
  children
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  return (
    <section
      ref={ref}
      className={cn(
        "relative min-h-screen flex items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-background via-background/95 to-background/90",
        className
      )}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating glass orbs */}
        <motion.div
          animate={floatingAnimation}
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full liquid-glass opacity-30"
        />
        <motion.div
          animate={{
            y: [10, -10, 10],
            x: [-5, 5, -5],
            transition: {
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut" as const
            }
          }}
          className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full liquid-glass opacity-20"
        />
        <motion.div
          animate={{
            y: [-15, 15, -15],
            transition: {
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut" as const
            }
          }}
          className="absolute bottom-1/4 left-1/3 w-40 h-40 rounded-full liquid-glass opacity-10"
        />
      </div>

      {/* Gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      </div>

      {/* Content */}
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="relative z-10 text-center max-w-4xl mx-auto px-4"
      >
        {subtitle && (
          <motion.div
            variants={itemVariants}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 rounded-full liquid-glass text-sm font-medium text-muted-foreground">
              {subtitle}
            </span>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <GradientText
            text={title}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            gradient="from-foreground to-foreground/80"
          />
        </motion.div>

        {description && (
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            {description}
          </motion.p>
        )}

        {children && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {children}
          </motion.div>
        )}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{
            y: [0, 10, 0],
            transition: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut" as const
            }
          }}
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{
              y: [0, 12, 0],
              opacity: [0, 1, 0],
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" as const
              }
            }}
            className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}

export { AnimatedHero }