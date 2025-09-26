'use client'

import { useEffect, useRef } from 'react'
import { Target, Zap } from 'lucide-react'

interface CircularProgressProps {
  value: number // Percentage (0-100)
  current: number
  total: number
  label: string
  className?: string
}

export function CircularProgress({
  value,
  current,
  total,
  label,
  className
}: CircularProgressProps) {
  const progressRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    // Animate circular progress on mount
    if (progressRef.current) {
      const circumference = 2 * Math.PI * 50 // radius = 50
      const offset = circumference - (value / 100) * circumference

      progressRef.current.style.strokeDasharray = `${circumference}`
      progressRef.current.style.strokeDashoffset = `${circumference}` // Start from 0%

      // Animate to target value after a delay
      setTimeout(() => {
        if (progressRef.current) {
          progressRef.current.style.strokeDashoffset = `${offset}`
        }
      }, 1000)
    }
  }, [value])

  return (
    <div
      className={`relative p-6 text-center overflow-hidden ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px) saturate(180%)',
        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: `
          inset -2px -2px 7px rgba(255, 255, 255, 0.95),
          inset 2px 2px 7px rgba(0, 0, 0, 0.1),
          0 10px 36px -6px rgba(34, 197, 94, 0.06),
          0 6px 24px -4px rgba(0, 0, 0, 0.15)
        `,
        borderRadius: '32px',
        minHeight: '160px',
        overflow: 'hidden'
      }}
    >
      {/* Pure White Corner Highlights - Internal glow effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50px',
          height: '50px',
          background: 'radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 15%, rgba(255, 255, 255, 0.7) 25%, rgba(255, 255, 255, 0.3) 35%, rgba(255, 255, 255, 0.05) 45%, rgba(0, 0, 0, 0) 55%)',
          pointerEvents: 'none',
          opacity: 1,
          mixBlendMode: 'screen',
          filter: 'blur(3px)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '60px',
          height: '55px',
          background: 'radial-gradient(ellipse at 100% 100%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 15%, rgba(255, 255, 255, 0.7) 25%, rgba(255, 255, 255, 0.3) 35%, rgba(255, 255, 255, 0.05) 45%, rgba(0, 0, 0, 0) 55%)',
          pointerEvents: 'none',
          opacity: 1,
          mixBlendMode: 'screen',
          filter: 'blur(3px)'
        }}
      />
      {/* Icon positioned top-right */}
      <div className="absolute top-6 right-6 text-white-30 opacity-60">
        <Target className="h-4 w-4" />
      </div>

      {/* Title */}
      <div className="text-caption1 font-medium text-white-50 mb-4 text-left">Weekly Goal</div>

      {/* Circular Progress Chart */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#0891B2', stopOpacity: 1 }} />
              </linearGradient>
            </defs>

            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />

            {/* Progress circle */}
            <circle
              ref={progressRef}
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              className="transition-all duration-2000 ease-out"
              filter="drop-shadow(0 4px 12px rgba(6, 182, 212, 0.3))"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-body font-heavy text-white-100">
              {value}%
            </span>
          </div>
        </div>

        {/* Progress label */}
        <div className="text-caption1 text-white-70 font-medium mt-2">
          {current}/{total} {label}
        </div>
      </div>

      {/* Change indicator */}
      <div className="flex items-center justify-center gap-2 text-accent-cyan">
        <Zap className="h-3 w-3" />
        <span className="text-caption1 font-medium">
          {total - current} topics to go!
        </span>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        .transition-all {
          transition: stroke-dashoffset 2s ease-out;
        }
      `}</style>
    </div>
  )
}