'use client'

import * as React from 'react'

interface AppleButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'text'
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export function AppleButton({
  children,
  variant = 'secondary',
  onClick,
  type = 'button',
  className = '',
}: AppleButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const getStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isHovered ? '#0077ED' : '#0071E3',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '999px',
          fontWeight: '500',
        }
      case 'secondary':
        return {
          backgroundColor: isHovered ? '#E8E8ED' : '#F5F5F7',
          color: '#1D1D1F',
          padding: '8px 20px',
          borderRadius: '999px',
          fontWeight: '400',
        }
      case 'text':
        return {
          color: '#0071E3',
          fontWeight: '400',
          textDecoration: isHovered ? 'underline' : 'none',
        }
      default:
        return {}
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`transition-all ${className}`}
      style={getStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  )
}

export function AppleIconButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${className}`}
      style={{
        backgroundColor: isHovered ? '#E8E8ED' : '#F5F5F7',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ color: '#1D1D1F' }}>
        {children}
      </div>
    </button>
  )
}