"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { GlassButton } from './GlassButton'

interface NavigationItem {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'glass' | 'glass-primary' | 'glass-secondary'
  size?: 'default' | 'sm' | 'lg'
}

interface GlassNavigationProps {
  logo?: React.ReactNode
  items?: NavigationItem[]
  className?: string
  fixed?: boolean
  transparent?: boolean
}

const GlassNavigation: React.FC<GlassNavigationProps> = ({
  logo,
  items = [],
  className,
  fixed = false,
  transparent = false
}) => {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={cn(
        "w-full z-50 transition-all duration-300",
        fixed && "fixed top-0 left-0 right-0",
        transparent ? "bg-transparent" : "glass-nav",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          {logo && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center"
            >
              {logo}
            </motion.div>
          )}

          {/* Navigation Items */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center gap-2 md:gap-4"
          >
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.6 + index * 0.1,
                  duration: 0.4
                }}
              >
                {item.href ? (
                  <a href={item.href}>
                    <GlassButton
                      variant={item.variant || 'glass'}
                      size={item.size || 'default'}
                      glow={item.variant === 'glass-primary'}
                    >
                      {item.label}
                    </GlassButton>
                  </a>
                ) : (
                  <GlassButton
                    variant={item.variant || 'glass'}
                    size={item.size || 'default'}
                    onClick={item.onClick}
                    glow={item.variant === 'glass-primary'}
                  >
                    {item.label}
                  </GlassButton>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom border with gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </motion.nav>
  )
}

export { GlassNavigation }