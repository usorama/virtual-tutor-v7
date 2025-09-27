'use client'

import { useEffect, useRef } from 'react'

interface AppleComboChartProps {
  data: {
    studySessions: number[]
    topicsMastered: number[]
    labels: string[]
  }
  period: 'daily' | 'weekly' | 'monthly'
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void
  className?: string
}

export function AppleComboChart({ data, period, onPeriodChange, className }: AppleComboChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Animate chart on mount
    if (chartRef.current) {
      const bars = chartRef.current.querySelectorAll('.chart-bar')
      const line = chartRef.current.querySelector('.chart-line')
      const lineArea = chartRef.current.querySelector('.chart-line-area')

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
    }
  }, [data])

  const maxStudySessions = Math.max(...data.studySessions)
  const maxTopicsMastered = Math.max(...data.topicsMastered)

  // Create SVG path for line chart
  const createPath = (values: number[], max: number) => {
    const width = 100
    const height = 60
    const step = width / (values.length - 1)

    return values.map((value, index) => {
      const x = index * step
      const y = height - (value / max) * height
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    }).join(' ')
  }

  const pathD = createPath(data.topicsMastered, maxTopicsMastered)

  return (
    <div
      className={`p-6 overflow-hidden flex flex-col h-full ${className || ''}`}
      ref={chartRef}
    >
      <style jsx>{`
        @keyframes growBar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }

        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes fadeInArea {
          from { opacity: 0; }
          to { opacity: 0.1; }
        }

        @keyframes fadeInDots {
          from { opacity: 0; transform: scale(0); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Chart Header - BLACK text */}
      <div className="flex justify-between items-center mb-6">
        <h3
          className="text-2xl font-semibold"
          style={{ color: '#1D1D1F' }}
        >
          Your Study Progress
        </h3>

        {/* Period selector - Apple style */}
        <div
          className="flex rounded-full p-1"
          style={{ backgroundColor: '#F5F5F7' }}
        >
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                period === p ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: period === p ? '#0071E3' : 'transparent',
                color: period === p ? '#FFFFFF' : '#1D1D1F',
              }}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative">
        {/* Background grid - very subtle */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t"
              style={{
                top: `${(i + 1) * 20}%`,
                borderColor: '#E5E5EA',
              }}
            />
          ))}
        </div>

        {/* Main chart area */}
        <div className="relative h-48 flex items-end justify-between px-4">
          {data.labels.map((label, index) => {
            const studySessionHeight = (data.studySessions[index] / maxStudySessions) * 100
            const topicsValue = data.topicsMastered[index]

            return (
              <div key={label} className="flex flex-col items-center flex-1">
                {/* Bar for study sessions */}
                <div className="relative w-8 bg-gray-200 rounded-t-lg mb-2" style={{ height: '120px' }}>
                  <div
                    className="chart-bar absolute bottom-0 w-full rounded-t-lg"
                    style={{
                      height: `${studySessionHeight}%`,
                      background: 'linear-gradient(180deg, #6B7280 0%, #4B5563 100%)',
                    }}
                  />
                </div>

                {/* Label */}
                <span
                  className="text-xs mt-2"
                  style={{ color: '#86868B' }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* SVG overlay for line chart */}
        <svg
          className="absolute inset-0 w-full h-48 pointer-events-none"
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
        >
          {/* Line area fill */}
          <path
            className="chart-line-area"
            d={`${pathD} L 100 60 L 0 60 Z`}
            fill="#1D1D1F"
            opacity="0.04"
          />

          {/* Main line */}
          <path
            className="chart-line"
            d={pathD}
            fill="none"
            stroke="#1D1D1F"
            strokeWidth="0.8"
          />

          {/* Data points */}
          {data.topicsMastered.map((value, index) => {
            const x = (index / (data.topicsMastered.length - 1)) * 100
            const y = 60 - (value / maxTopicsMastered) * 60

            return (
              <circle
                key={index}
                className="chart-dot-line"
                cx={x}
                cy={y}
                r="1"
                fill="#1D1D1F"
                style={{
                  animation: `fadeInDots 0.5s ease-out ${(index + 1) * 0.1}s both`
                }}
              />
            )
          })}
        </svg>
      </div>

      {/* Legend - Apple style */}
      <div
        className="flex justify-center mt-4 p-3 rounded-xl"
        style={{ backgroundColor: '#F5F5F7' }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: '#6B7280' }}
            />
            <span className="text-sm" style={{ color: '#1D1D1F' }}>
              Study Sessions (bars)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-0.5"
              style={{ backgroundColor: '#1D1D1F' }}
            />
            <span className="text-sm" style={{ color: '#1D1D1F' }}>
              Topics Mastered (line)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}