'use client'

import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'

interface ComboChartProps {
  data: {
    studySessions: number[]
    topicsMastered: number[]
    labels: string[]
  }
  period: 'daily' | 'weekly' | 'monthly'
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void
}

export function ComboChart({ data, period, onPeriodChange }: ComboChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Animate chart on mount
    if (chartRef.current) {
      const bars = chartRef.current.querySelectorAll('.chart-bar')
      const line = chartRef.current.querySelector('.chart-line')
      const lineArea = chartRef.current.querySelector('.chart-line-area')
      const dots = chartRef.current.querySelectorAll('.chart-dot-line')

      // Animate bars with staggered timing
      bars.forEach((bar, index) => {
        const element = bar as HTMLElement
        element.style.transform = 'scaleY(0)'
        element.style.transformOrigin = 'bottom'
        element.style.animation = `growBar 0.8s ease-out ${index * 0.1}s forwards`
      })

      // Animate line
      if (line) {
        const lineElement = line as SVGPathElement
        lineElement.style.strokeDasharray = '1000'
        lineElement.style.strokeDashoffset = '1000'
        lineElement.style.animation = 'drawLine 2s ease-out 0.5s forwards'
      }

      // Animate line area
      if (lineArea) {
        const areaElement = lineArea as SVGPathElement
        areaElement.style.opacity = '0'
        areaElement.style.animation = 'fadeInArea 2s ease-out 1s forwards'
      }

      // Animate dots with staggered timing
      dots.forEach((dot, index) => {
        const element = dot as HTMLElement
        element.style.transform = 'scale(0)'
        element.style.animation = `popIn 0.3s ease-out ${1.5 + index * 0.1}s forwards`
      })
    }
  }, [data])

  return (
    <Card
      className="p-6 overflow-hidden"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'inset -4px -4px 12px rgba(128,128,128,0.95), inset 4px 4px 12px rgba(0,0,0,0.1)',
        borderRadius: '32px'
      }}
    >
      {/* Chart Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-title1 font-heavy text-white-100">Your Study Progress</h3>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                period === p
                  ? 'bg-accent-cyan text-black-100'
                  : 'text-white-70 hover:text-white-100 hover:bg-white-5'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Combo Chart */}
      <div ref={chartRef} className="relative h-80 mb-6">
        <svg viewBox="0 0 800 280" className="w-full h-full">
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'rgba(160, 160, 160, 0.4)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(80, 80, 80, 0.6)', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {/* Grid Lines Removed */}

          {/* Study Sessions Bars */}
          {data.studySessions.map((value, index) => (
            <rect
              key={`bar-${index}`}
              className="chart-bar"
              x={50 + index * 100}
              y={240 - (value * 60)} // Scale bars based on value
              width="40"
              height={value * 60}
              fill="url(#barGradient)"
              rx="4"
            />
          ))}

          {/* Topics Mastered Line Area */}
          <path
            className="chart-line-area"
            d={`M70,${240 - data.topicsMastered[0] * 4} ${data.topicsMastered.map((value, index) =>
              `L${70 + index * 100},${240 - value * 4}`
            ).join(' ')} L${70 + (data.topicsMastered.length - 1) * 100},240 L70,240 Z`}
            fill="url(#lineGradient)"
            opacity="0.3"
          />

          {/* Topics Mastered Line */}
          <path
            className="chart-line"
            d={`M70,${240 - data.topicsMastered[0] * 4} ${data.topicsMastered.map((value, index) =>
              `L${70 + index * 100},${240 - value * 4}`
            ).join(' ')}`}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="3"
            filter="drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))"
          />

          {/* Data Points on Line */}
          {data.topicsMastered.map((value, index) => (
            <circle
              key={`dot-${index}`}
              className="chart-dot-line"
              cx={70 + index * 100}
              cy={240 - value * 4}
              r="4"
              fill="#06B6D4"
              stroke="#000"
              strokeWidth="2"
              filter="drop-shadow(0 0 6px rgba(6, 182, 212, 0.6))"
            />
          ))}
        </svg>
      </div>

      {/* Chart Labels */}
      <div className="flex justify-between px-12 mb-6">
        {data.labels.map((label, index) => (
          <span key={index} className="text-caption1 text-white-50 font-medium">
            {label}
          </span>
        ))}
      </div>

      {/* Chart Legend */}
      <div className="flex justify-center gap-6 p-3 bg-white-2 rounded-2xl border border-white-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-2 bg-gradient-to-b from-white-15 to-white-5 border border-white-20 rounded-sm" />
          <span className="text-caption1 text-white-70 font-medium">Study Sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-accent-cyan rounded-sm relative">
            <div className="absolute -right-1 -top-1 w-2 h-2 bg-accent-cyan border-2 border-black-100 rounded-full" />
          </div>
          <span className="text-caption1 text-white-70 font-medium">Topics Mastered</span>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes growBar {
          to { transform: scaleY(1); }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeInArea {
          to { opacity: 0.2; }
        }
        @keyframes popIn {
          to { transform: scale(1); }
        }
      `}</style>
    </Card>
  )
}