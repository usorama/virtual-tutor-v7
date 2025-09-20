"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, TrendingUp, Users, Zap, Globe, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  unit?: string
  trend?: number
  color: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  unit,
  trend,
  color
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative group"
    >
      <div className={cn(
        "relative p-6 rounded-2xl backdrop-blur-xl",
        "bg-gradient-to-br from-background/40 to-background/20",
        "border border-white/10",
        "hover:border-white/20 transition-all duration-300",
        "overflow-hidden"
      )}>
        {/* Gradient Background */}
        <div
          className={cn(
            "absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity",
            color
          )}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={cn("p-2 rounded-lg", color, "bg-opacity-20")}>
              {icon}
            </div>
            {trend !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                <TrendingUp className="w-3 h-3" />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>

        {/* Animated Border Gradient */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(45deg, transparent, ${color.replace('bg-', 'rgb(')}0.2), transparent)`,
            opacity: 0
          }}
          animate={{
            opacity: [0, 0.5, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    </motion.div>
  )
}

interface PerformanceMetricsProProps {
  className?: string
}

const PerformanceMetricsPro: React.FC<PerformanceMetricsProProps> = ({ className }) => {
  const [metrics, setMetrics] = useState({
    latency: 187,
    accuracy: 98.2,
    sessions: 12453,
    uptime: 99.99,
    regions: 14,
    concurrent: 3247
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        latency: Math.max(150, Math.min(250, prev.latency + (Math.random() - 0.5) * 20)),
        accuracy: Math.max(97, Math.min(99.9, prev.accuracy + (Math.random() - 0.5) * 0.5)),
        sessions: prev.sessions + Math.floor(Math.random() * 10),
        uptime: 99.99, // Always stable
        regions: 14, // Static
        concurrent: Math.max(2000, Math.min(5000, prev.concurrent + Math.floor((Math.random() - 0.5) * 100)))
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          icon={<Zap className="w-5 h-5 text-ping-accent" />}
          label="Response Latency"
          value={Math.round(metrics.latency)}
          unit="ms"
          trend={-5}
          color="bg-ping-accent"
        />

        <MetricCard
          icon={<Activity className="w-5 h-5 text-ping-primary" />}
          label="AI Accuracy"
          value={metrics.accuracy.toFixed(1)}
          unit="%"
          trend={2}
          color="bg-ping-primary"
        />

        <MetricCard
          icon={<Users className="w-5 h-5 text-ping-secondary" />}
          label="Active Sessions"
          value={metrics.concurrent.toLocaleString()}
          trend={12}
          color="bg-ping-secondary"
        />

        <MetricCard
          icon={<Shield className="w-5 h-5 text-green-500" />}
          label="System Uptime"
          value={metrics.uptime}
          unit="%"
          color="bg-green-500"
        />

        <MetricCard
          icon={<Globe className="w-5 h-5 text-blue-500" />}
          label="Global Regions"
          value={metrics.regions}
          unit="locations"
          color="bg-blue-500"
        />

        <MetricCard
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          label="Total Sessions"
          value={(metrics.sessions / 1000).toFixed(1)}
          unit="K today"
          trend={18}
          color="bg-purple-500"
        />
      </div>
    </div>
  )
}

export { PerformanceMetricsPro }