"use client"

import { useEffect, useRef } from 'react'

interface LiquidGlassEngineProps {
  children: React.ReactNode
  className?: string
}

class AppleLiquidGlassEngine {
  private elements: NodeListOf<Element> = {} as NodeListOf<Element>
  private rafId: number | null = null
  private mousePosition = { x: 0, y: 0 }
  private isActive = false

  constructor() {
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseEnter = this.handleMouseEnter.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.updateGlassEffects = this.updateGlassEffects.bind(this)
  }

  init() {
    this.elements = document.querySelectorAll('.liquid-glass, .liquid-glass-card, .liquid-glass-button, .liquid-glass-nav')

    // Add event listeners
    document.addEventListener('mousemove', this.handleMouseMove, { passive: true })

    this.elements.forEach(element => {
      element.addEventListener('mouseenter', this.handleMouseEnter)
      element.addEventListener('mouseleave', this.handleMouseLeave)
      this.setupElement(element as HTMLElement)
    })

    this.startRenderLoop()
  }

  private setupElement(element: HTMLElement) {
    // Initialize CSS custom properties
    element.style.setProperty('--mouse-x', '50%')
    element.style.setProperty('--mouse-y', '50%')
    element.style.setProperty('--highlight-opacity', '0')
    element.style.setProperty('--glass-rotation', '0deg')
    element.style.setProperty('--adaptive-glass-color', 'rgba(255, 255, 255, 0.08)')
  }

  private handleMouseMove(e: MouseEvent) {
    this.mousePosition.x = e.clientX
    this.mousePosition.y = e.clientY
  }

  private handleMouseEnter(e: Event) {
    const element = e.target as HTMLElement
    element.style.setProperty('--highlight-opacity', '1')
    this.isActive = true
  }

  private handleMouseLeave(e: Event) {
    const element = e.target as HTMLElement
    element.style.setProperty('--highlight-opacity', '0')

    // Smooth return to center
    element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    element.style.setProperty('--mouse-x', '50%')
    element.style.setProperty('--mouse-y', '50%')

    setTimeout(() => {
      element.style.transition = ''
    }, 600)
  }

  private startRenderLoop() {
    const render = () => {
      if (this.isActive) {
        this.updateGlassEffects()
      }
      this.rafId = requestAnimationFrame(render)
    }
    render()
  }

  private updateGlassEffects() {
    this.elements.forEach(element => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate relative mouse position
      const deltaX = this.mousePosition.x - centerX
      const deltaY = this.mousePosition.y - centerY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const maxDistance = Math.max(rect.width, rect.height)

      // Only update if mouse is within reasonable distance
      if (distance < maxDistance * 2) {
        const normalizedX = (deltaX / rect.width) * 100
        const normalizedY = (deltaY / rect.height) * 100

        // Constrain to element bounds with some overflow
        const clampedX = Math.max(-50, Math.min(150, normalizedX + 50))
        const clampedY = Math.max(-50, Math.min(150, normalizedY + 50))

        // Apply smooth interpolation
        const currentX = parseFloat((element as HTMLElement).style.getPropertyValue('--mouse-x') || '50')
        const currentY = parseFloat((element as HTMLElement).style.getPropertyValue('--mouse-y') || '50')

        const lerpFactor = 0.1
        const newX = currentX + (clampedX - currentX) * lerpFactor
        const newY = currentY + (clampedY - currentY) * lerpFactor

        // Update CSS custom properties
        ;(element as HTMLElement).style.setProperty('--mouse-x', `${newX}%`)
        ;(element as HTMLElement).style.setProperty('--mouse-y', `${newY}%`)

        // Add subtle rotation based on mouse position
        const rotation = (normalizedX * 0.1) + (normalizedY * 0.05)
        ;(element as HTMLElement).style.setProperty('--glass-rotation', `${rotation}deg`)

        // Content-aware color adaptation
        this.updateAdaptiveColor(element as HTMLElement, this.mousePosition.x, this.mousePosition.y)
      }
    })
  }

  private updateAdaptiveColor(element: HTMLElement, x: number, y: number) {
    // Sample background color at mouse position
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = 1
      canvas.height = 1

      // This is a simplified version - in a real implementation,
      // you'd sample the actual background color
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const time = Date.now() * 0.001

      // Create dynamic color based on position and time
      const hue = (x / window.innerWidth) * 360 + time * 10
      const saturation = 20 + (y / window.innerHeight) * 30
      const lightness = isDark ? 15 : 85

      const adaptiveColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.1)`
      element.style.setProperty('--adaptive-glass-color', adaptiveColor)

    } catch (error) {
      // Fallback to default colors
      console.debug('Color sampling fallback')
    }
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }

    document.removeEventListener('mousemove', this.handleMouseMove)

    this.elements.forEach(element => {
      element.removeEventListener('mouseenter', this.handleMouseEnter)
      element.removeEventListener('mouseleave', this.handleMouseLeave)
    })
  }
}

export const LiquidGlassEngine: React.FC<LiquidGlassEngineProps> = ({
  children,
  className
}) => {
  const engineRef = useRef<AppleLiquidGlassEngine | null>(null)

  useEffect(() => {
    // Initialize the engine after component mounts
    engineRef.current = new AppleLiquidGlassEngine()

    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(() => {
      engineRef.current?.init()
    }, 100)

    return () => {
      clearTimeout(timer)
      engineRef.current?.destroy()
    }
  }, [])

  return (
    <div className={className}>
      {children}
    </div>
  )
}

export default LiquidGlassEngine