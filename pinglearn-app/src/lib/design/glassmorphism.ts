/**
 * PingLearn Glassmorphism Design System
 * Apple 2025 Standards - Plug & Play Components
 *
 * This file provides TypeScript utilities for consistent glassmorphism styling
 * across all PingLearn components. All values follow the exact specifications
 * defined in docs/design/glassmorphism-tokens.json
 */

import { CSSProperties } from 'react'

// ==========================================
// CORE GLASSMORPHISM STYLES
// ==========================================

/**
 * Main container glassmorphism style - Apple 2025 standard
 * Use this for all primary dashboard components
 */
export const glassmorphismContainer: CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px) saturate(180%)',
  WebkitBackdropFilter: 'blur(10px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  boxShadow: `
    inset -2px -2px 6px rgba(255,255,255,0.9),
    inset 2px 2px 6px rgba(0,0,0,0.1),
    0 10px 36px -6px rgba(34, 197, 94, 0.06),
    0 6px 24px -4px rgba(0, 0, 0, 0.15)
  `,
  borderRadius: '32px',
  overflow: 'hidden'
}

/**
 * Inner section style - standardized dark background (60% opacity)
 * Use this for all inner components like buttons, cards, etc.
 */
export const innerSection: CSSProperties = {
  backgroundColor: 'rgba(20, 20, 22, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)'
}

/**
 * Icon circle style - standardized darkest background (80% opacity)
 * Use this for ALL icon containers to ensure consistency
 */
export const iconCircle: CSSProperties = {
  backgroundColor: 'rgba(20, 20, 22, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

// ==========================================
// CORNER HIGHLIGHTS
// ==========================================

/**
 * Top-left corner highlight - pure white gradient
 */
export const cornerHighlightTopLeft: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '50px',
  height: '50px',
  background: 'radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 15%, rgba(255, 255, 255, 0.7) 25%, rgba(255, 255, 255, 0.3) 35%, rgba(255, 255, 255, 0.05) 45%, rgba(0, 0, 0, 0) 55%)',
  pointerEvents: 'none' as const,
  opacity: 1,
  mixBlendMode: 'screen' as const,
  filter: 'blur(3px)'
}

/**
 * Bottom-right corner highlight - pure white gradient
 */
export const cornerHighlightBottomRight: CSSProperties = {
  position: 'absolute',
  bottom: 0,
  right: 0,
  width: '60px',
  height: '55px',
  background: 'radial-gradient(ellipse at 100% 100%, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 15%, rgba(255, 255, 255, 0.7) 25%, rgba(255, 255, 255, 0.3) 35%, rgba(255, 255, 255, 0.05) 45%, rgba(0, 0, 0, 0) 55%)',
  pointerEvents: 'none' as const,
  opacity: 1,
  mixBlendMode: 'screen' as const,
  filter: 'blur(3px)'
}

// ==========================================
// COLOR CONSTANTS
// ==========================================

/**
 * Standard colors used across all components
 */
export const glassmorphismColors = {
  /** Standard cyan color for ALL icons */
  iconColor: '#06B6D4',

  /** Primary accent color */
  accent: '#06B6D4',

  /** Text colors */
  textWhite100: 'rgba(255, 255, 255, 1)',
  textWhite70: 'rgba(255, 255, 255, 0.7)',
  textWhite50: 'rgba(255, 255, 255, 0.5)',

  /** Background colors for inner components */
  innerBackground60: 'rgba(20, 20, 22, 0.6)',
  innerBackground80: 'rgba(20, 20, 22, 0.8)', // Darkest - for icon circles
} as const

// ==========================================
// BACKGROUND GRADIENTS
// ==========================================

/**
 * EtheralShadow configuration
 */
export const etherealShadowConfig = {
  color: 'rgba(60, 60, 70, 0.5)',
  animation: { scale: 50, speed: 80 },
  noise: { opacity: 30, scale: 0.5 }
} as const

/**
 * Background gradient styles for pages
 */
export const backgroundGradients = {
  cyan: {
    topCenter: {
      position: 'absolute' as const,
      top: '5%',
      left: '35%',
      width: '350px',
      height: '350px',
      background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(6, 182, 212, 0.15) 30%, transparent 60%)',
      filter: 'blur(40px)',
      zIndex: 0,
      pointerEvents: 'none' as const
    },
    bottomLeft: {
      position: 'absolute' as const,
      bottom: '25%',
      left: '10%',
      width: '250px',
      height: '250px',
      background: 'radial-gradient(circle, rgba(6, 182, 212, 0.28) 0%, transparent 55%)',
      filter: 'blur(45px)',
      zIndex: 0,
      pointerEvents: 'none' as const
    }
  },
  green: {
    leftSide: {
      position: 'absolute' as const,
      top: '20%',
      left: '-5%',
      width: '300px',
      height: '300px',
      background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 40%, transparent 65%)',
      filter: 'blur(50px)',
      zIndex: 0,
      pointerEvents: 'none' as const
    }
  },
  yellow: {
    bottomRight: {
      position: 'absolute' as const,
      bottom: '10%',
      right: '5%',
      width: '400px',
      height: '400px',
      background: 'radial-gradient(circle, rgba(234, 179, 8, 0.25) 0%, rgba(234, 179, 8, 0.1) 35%, transparent 60%)',
      filter: 'blur(60px)',
      zIndex: 0,
      pointerEvents: 'none' as const
    }
  },
  orange: {
    rightSide: {
      position: 'absolute' as const,
      top: '45%',
      right: '15%',
      width: '200px',
      height: '200px',
      background: 'radial-gradient(circle, rgba(251, 146, 60, 0.2) 0%, transparent 55%)',
      filter: 'blur(50px)',
      transform: 'translateY(-50%)',
      zIndex: 0,
      pointerEvents: 'none' as const
    }
  }
} as const

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Creates a complete glassmorphism container style
 * @param className - Additional CSS classes
 * @returns Object with style and className
 */
export function createGlassmorphismContainer(className?: string) {
  return {
    containerStyle: glassmorphismContainer,
    className: `relative overflow-hidden ${className || ''}`,
    cornerHighlights: {
      topLeft: cornerHighlightTopLeft,
      bottomRight: cornerHighlightBottomRight
    }
  }
}

/**
 * Creates an inner section with consistent styling
 * @param additionalStyles - Additional CSS properties
 * @returns Complete style object
 */
export function createInnerSection(additionalStyles?: CSSProperties): CSSProperties {
  return {
    ...innerSection,
    ...additionalStyles
  }
}

/**
 * Creates an icon circle with consistent styling and icon color
 * @param size - Width and height (default: 48px)
 * @param additionalStyles - Additional CSS properties
 * @returns Complete style object
 */
export function createIconCircle(size: number = 48, additionalStyles?: CSSProperties): CSSProperties {
  return {
    ...iconCircle,
    width: `${size}px`,
    height: `${size}px`,
    ...additionalStyles
  }
}

/**
 * Gets the complete background gradient styles for pages
 * @returns Array of gradient styles
 */
export function getBackgroundGradients() {
  return [
    backgroundGradients.cyan.topCenter,
    backgroundGradients.cyan.bottomLeft,
    backgroundGradients.green.leftSide,
    backgroundGradients.yellow.bottomRight,
    backgroundGradients.orange.rightSide
  ]
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type GlassmorphismContainer = ReturnType<typeof createGlassmorphismContainer>

export interface GlassmorphismComponentProps {
  /** Additional CSS classes */
  className?: string
  /** Additional inline styles */
  style?: CSSProperties
  /** Whether to include corner highlights (default: true) */
  includeHighlights?: boolean
}

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validates that a color follows the standardized format
 * @param color - Color string to validate
 * @param expectedOpacity - Expected opacity value
 * @returns Whether the color is valid
 */
export function validateGlassmorphismColor(color: string, expectedOpacity: number): boolean {
  const rgbaPattern = /rgba\(20,\s*20,\s*22,\s*([\d.]+)\)/
  const match = color.match(rgbaPattern)
  return match ? parseFloat(match[1]) === expectedOpacity : false
}

/**
 * Ensures consistent inner component styling
 * @param styles - Style object to validate
 * @returns Whether styles follow standards
 */
export function validateInnerComponentStyles(styles: CSSProperties): boolean {
  return (
    styles.backgroundColor === glassmorphismColors.innerBackground60 ||
    styles.backgroundColor === glassmorphismColors.innerBackground80
  )
}

export default {
  glassmorphismContainer,
  innerSection,
  iconCircle,
  cornerHighlightTopLeft,
  cornerHighlightBottomRight,
  glassmorphismColors,
  etherealShadowConfig,
  backgroundGradients,
  createGlassmorphismContainer,
  createInnerSection,
  createIconCircle,
  getBackgroundGradients,
  validateGlassmorphismColor,
  validateInnerComponentStyles
}