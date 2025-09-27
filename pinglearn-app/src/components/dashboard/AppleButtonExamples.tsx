'use client'

import * as React from 'react'
import { ArrowRight, Play, Download, Settings, Share, Heart } from 'lucide-react'

/**
 * Apple-authentic button examples
 * Demonstrating the proper button hierarchy
 */
export function AppleButtonExamples() {
  return (
    <div className="space-y-8 p-8 bg-white">

      {/* Primary Buttons - ONLY for main CTAs */}
      <div>
        <h3 className="text-sm font-normal text-[#86868B] mb-4">
          Primary Actions (Use Sparingly)
        </h3>
        <div className="flex gap-3 flex-wrap">
          <button
            className="px-6 py-2.5 rounded-full font-medium text-white transition-colors"
            style={{
              backgroundColor: '#0071E3',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0077ED'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0071E3'}
          >
            Start Session
          </button>

          <button
            className="px-6 py-2.5 rounded-full font-medium text-white flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: '#0071E3',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0077ED'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0071E3'}
          >
            <Play className="w-4 h-4" />
            Play Lesson
          </button>
        </div>
      </div>

      {/* Secondary Buttons - Most common */}
      <div>
        <h3 className="text-sm font-normal text-[#86868B] mb-4">
          Secondary Actions (Most Common)
        </h3>
        <div className="flex gap-3 flex-wrap">
          <button
            className="px-5 py-2 rounded-full font-normal transition-colors"
            style={{
              backgroundColor: '#F5F5F7',
              color: '#1D1D1F',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8E8ED'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F7'}
          >
            View Details
          </button>

          <button
            className="px-5 py-2 rounded-full font-normal flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: '#F5F5F7',
              color: '#1D1D1F',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8E8ED'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F7'}
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <button
            className="px-5 py-2 rounded-full font-normal flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: '#F5F5F7',
              color: '#1D1D1F',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8E8ED'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F7'}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Tertiary Buttons - Text only */}
      <div>
        <h3 className="text-sm font-normal text-[#86868B] mb-4">
          Tertiary Actions (Links)
        </h3>
        <div className="flex gap-4 flex-wrap">
          <button
            className="font-normal transition-all"
            style={{ color: '#0071E3' }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Learn More
          </button>

          <button
            className="font-normal flex items-center gap-1 transition-all"
            style={{ color: '#0071E3' }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            View All
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Icon Buttons - Apple Style */}
      <div>
        <h3 className="text-sm font-normal text-[#86868B] mb-4">
          Icon Buttons (No Color Backgrounds)
        </h3>
        <div className="flex gap-3">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: '#F5F5F7',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8E8ED'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F7'}
          >
            <Share className="w-4 h-4" style={{ color: '#1D1D1F' }} />
          </button>

          <button
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: '#F5F5F7',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8E8ED'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F7'}
          >
            <Heart className="w-4 h-4" style={{ color: '#1D1D1F' }} />
          </button>

          <button
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: '#F5F5F7',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8E8ED'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F7'}
          >
            <Settings className="w-4 h-4" style={{ color: '#1D1D1F' }} />
          </button>
        </div>
      </div>

      {/* Wrong Examples - What NOT to do */}
      <div className="pt-8 border-t border-[#D2D2D7]">
        <h3 className="text-sm font-normal text-[#86868B] mb-4">
          ❌ Wrong (Current Implementation)
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <button className="px-6 py-2.5 rounded-full font-medium bg-cyan-600 text-white">
              Wrong - Too Much Color
            </button>
            <span className="text-xs text-[#86868B]">
              Don't use cyan/teal everywhere
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
              <Heart className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs text-[#86868B]">
              Don't use black backgrounds with colored icons
            </span>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-cyan-700">Colored Heading</h1>
            <span className="text-xs text-[#86868B]">
              Don't use color for headings
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}