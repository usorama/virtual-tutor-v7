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
  className?: string
}

export function ComboChart({ data, period, onPeriodChange, className }: ComboChartProps) {
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
      className={`p-6 overflow-hidden flex flex-col h-full ${className || ''}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px) saturate(180%)',
        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: `
          inset -2px -2px 7px rgba(255,255,255,0.95),
          inset 2px 2px 7px rgba(0,0,0,0.1),
          0 10px 36px -6px rgba(34, 197, 94, 0.06),
          0 6px 24px -4px rgba(0, 0, 0, 0.15)
        `,
        borderRadius: '32px',
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
      {/* Chart Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-title1 font-heavy text-accent">Your Study Progress</h3>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                period === p
                  ? 'text-black-100'
                  : 'text-white-70 hover:text-white-100 hover:bg-white-5'
              }`}
              style={period === p ? { backgroundColor: 'var(--accent-cyan)' } : {}}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Combo Chart */}
      <div ref={chartRef} className="relative h-80">
        <svg viewBox="0 0 800 340" className="w-full h-full">
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'rgba(160, 160, 160, 0.4)', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'rgba(0, 0, 0, 0.95)', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#06B6D4', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#06B6D4', stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          {/* Grid Lines Removed */}

          {/* Study Sessions Bars */}
          {data.studySessions.map((value, index) => {
            // Calculate x position to center under labels
            const spacing = 700 / (data.studySessions.length - 1)  // Total width divided by gaps
            const barX = 50 + index * spacing  // Start at 50, spread evenly
            return (
              <rect
                key={`bar-${index}`}
                className="chart-bar"
                x={barX - 20}  // Center the bar (width is 40, so subtract half)
                y={280 - (value * 70)} // Scale bars based on value
                width="40"
                height={value * 70}
                fill="url(#barGradient)"
                rx="4"
              />
            )
          })}

          {/* Topics Mastered Line Area */}
          <path
            className="chart-line-area"
            d={`M50,${280 - data.topicsMastered[0] * 5} ${data.topicsMastered.map((value, index) => {
              const spacing = 700 / (data.topicsMastered.length - 1)
              return `L${50 + index * spacing},${280 - value * 5}`
            }).join(' ')} L${50 + (data.topicsMastered.length - 1) * 700 / (data.topicsMastered.length - 1)},280 L50,280 Z`}
            fill="url(#lineGradient)"
            opacity="0.3"
          />

          {/* Topics Mastered Line */}
          <path
            className="chart-line"
            d={`M50,${280 - data.topicsMastered[0] * 5} ${data.topicsMastered.map((value, index) => {
              const spacing = 700 / (data.topicsMastered.length - 1)
              return `L${50 + index * spacing},${280 - value * 5}`
            }).join(' ')}`}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="3"
            filter="drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))"
          />

          {/* Data Points on Line */}
          {data.topicsMastered.map((value, index) => {
            const spacing = 700 / (data.topicsMastered.length - 1)
            return (
              <circle
                key={`dot-${index}`}
                className="chart-dot-line"
                cx={50 + index * spacing}
                cy={280 - value * 5}
                r="4"
                fill="#06B6D4"
                stroke="#000"
                strokeWidth="2"
                filter="drop-shadow(0 0 6px rgba(6, 182, 212, 0.6))"
              />
            )
          })}

          {/* X-Axis Labels - Inside SVG for perfect alignment */}
          {data.labels.map((label, index) => {
            const spacing = 700 / (data.labels.length - 1)
            return (
              <text
                key={`label-${index}`}
                x={50 + index * spacing}
                y={310}
                textAnchor="middle"
                fill="rgba(255, 255, 255, 1)"
                fontSize="13"
                fontWeight="500"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Chart Legend - Enhanced with clearer visual indicators */}
      <div className="flex justify-center gap-6 p-3 rounded-2xl border border-white-10" style={{
        backgroundColor: 'rgba(20, 20, 22, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div className="flex items-center gap-2">
          {/* Actual bar representation for Study Sessions */}
          <svg width="16" height="14" viewBox="0 0 16 14">
            <defs>
              <linearGradient id="legendBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(160, 160, 160, 0.4)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(80, 80, 80, 0.6)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="12" height="10" fill="url(#legendBarGradient)" rx="2" />
          </svg>
          <span className="text-caption1 text-white-70 font-medium">Study Sessions (bars)</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Actual line with dot representation for Topics Mastered */}
          <svg width="24" height="14" viewBox="0 0 24 14">
            <line x1="0" y1="7" x2="24" y2="7" stroke="#06B6D4" strokeWidth="2" />
            <circle cx="8" cy="7" r="3" fill="#06B6D4" stroke="#000" strokeWidth="1" />
            <circle cx="16" cy="7" r="3" fill="#06B6D4" stroke="#000" strokeWidth="1" />
          </svg>
          <span className="text-caption1 text-white-70 font-medium">Topics Mastered (line)</span>
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