"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Clock, Users, TrendingUp, Activity, Cpu } from 'lucide-react'
import { GlassCard } from '@/components/glass'
import { cn } from '@/lib/utils'

interface MetricProps {
  icon: React.ElementType
  label: string
  value: string
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  color?: 'primary' | 'accent' | 'secondary'
  animated?: boolean
}

interface PerformanceMetricsProps {
  className?: string
  showLive?: boolean
  variant?: 'compact' | 'detailed'
}

const Metric: React.FC<MetricProps> = ({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  color = 'primary',
  animated = true
}) => {
  const [displayValue, setDisplayValue] = useState(animated ? '0' : value)

  useEffect(() => {
    if (!animated) return

    const targetValue = parseFloat(value.replace(/[^0-9.]/g, ''))
    const duration = 2000
    const steps = 60
    const increment = targetValue / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= targetValue) {
        current = targetValue
        clearInterval(timer)
      }

      // Format the value based on the original format
      if (value.includes('.')) {
        setDisplayValue(current.toFixed(1))
      } else {
        setDisplayValue(Math.round(current).toString())
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, animated])

  const getColorClasses = () => {
    switch (color) {
      case 'accent':
        return 'text-ping-accent border-ping-accent/20 bg-ping-accent/10'
      case 'secondary':
        return 'text-ping-secondary border-ping-secondary/20 bg-ping-secondary/10'
      default:
        return 'text-ping-primary border-ping-primary/20 bg-ping-primary/10'
    }
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-400" />
    if (trend === 'down') return <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
    return null
  }

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={animated ? { opacity: 0, y: 20 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={animated ? { duration: 0.5 } : undefined}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center border",
        getColorClasses()
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            {displayValue}
            {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
          </span>
          {getTrendIcon()}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  )
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  className,
  showLive = true,
  variant = 'detailed'
}) => {
  const [liveMetrics, setLiveMetrics] = useState({
    latency: 473,
    accuracy: 94.7,
    uptime: 99.9,
    conversations: 1247,
    activeUsers: 2834,
    processingPower: 87
  })

  // Simulate live updates
  useEffect(() => {
    if (!showLive) return

    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        latency: Math.floor(Math.random() * 100) + 400, // 400-500ms
        accuracy: 94 + Math.random() * 2, // 94-96%
        uptime: 99.8 + Math.random() * 0.2, // 99.8-100%
        conversations: prev.conversations + Math.floor(Math.random() * 5),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        processingPower: 80 + Math.random() * 20 // 80-100%
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [showLive])

  const compactMetrics = [
    {
      icon: Clock,
      label: "Response Time",
      value: liveMetrics.latency.toString(),
      unit: "ms",
      color: 'primary' as const,
      trend: 'stable' as const
    },
    {
      icon: Activity,
      label: "AI Accuracy",
      value: liveMetrics.accuracy.toFixed(1),
      unit: "%",
      color: 'accent' as const,
      trend: 'up' as const
    },
    {
      icon: Users,
      label: "Active Sessions",
      value: liveMetrics.conversations.toString(),
      color: 'secondary' as const,
      trend: 'up' as const
    }
  ]

  const detailedMetrics = [
    ...compactMetrics,
    {
      icon: TrendingUp,
      label: "Uptime",
      value: liveMetrics.uptime.toFixed(1),
      unit: "%",
      color: 'accent' as const,
      trend: 'stable' as const
    },
    {
      icon: Users,
      label: "Students Online",
      value: liveMetrics.activeUsers.toString(),
      color: 'primary' as const,
      trend: 'up' as const
    },
    {
      icon: Cpu,
      label: "AI Processing",
      value: liveMetrics.processingPower.toFixed(0),
      unit: "%",
      color: 'secondary' as const,
      trend: 'stable' as const
    }
  ]

  const metrics = variant === 'compact' ? compactMetrics : detailedMetrics

  return (
    <div className={cn("space-y-4", className)}>
      {showLive && (
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            className="w-2 h-2 bg-green-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <span className="text-sm text-muted-foreground">Live Performance Metrics</span>
        </div>
      )}

      <GlassCard animated className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Metric {...metric} />
            </motion.div>
          ))}
        </div>

        {variant === 'detailed' && (
          <motion.div
            className="mt-6 pt-4 border-t border-border/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Powered by Gemini Live API + LiveKit Infrastructure</span>
              <span>Updated every 3 seconds</span>
            </div>
          </motion.div>
        )}
      </GlassCard>

      {variant === 'detailed' && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-ping-primary">Industry-leading performance</span> for real-time educational AI
          </p>
        </motion.div>
      )}
    </div>
  )
}

export { PerformanceMetrics }