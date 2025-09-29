'use client'

import * as React from 'react'
import { BaseButtonProps, ButtonVariant } from '@/types/common'

interface AppleButtonProps extends BaseButtonProps {
  readonly variant?: 'primary' | 'secondary' | 'text';
}

export function AppleButton({
  children,
  variant = 'secondary',
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  id,
  testId,
}: AppleButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const getStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isHovered ? '#0077ED' : '#0071E3',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '999px',
          fontWeight: '500',
          fontSize: '17px',
          lineHeight: '1.23536',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.15s ease-in-out',
          transform: isHovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
          boxShadow: isHovered && !disabled
            ? '0 6px 20px rgba(0, 113, 227, 0.3)'
            : '0 2px 10px rgba(0, 113, 227, 0.1)',
        }
      case 'secondary':
        return {
          backgroundColor: isHovered ? '#F5F5F7' : '#FBFBFD',
          color: '#1D1D1F',
          padding: '12px 24px',
          borderRadius: '999px',
          fontWeight: '400',
          fontSize: '17px',
          lineHeight: '1.23536',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          border: '1px solid #D2D2D7',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.15s ease-in-out',
          transform: isHovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
          boxShadow: isHovered && !disabled
            ? '0 4px 15px rgba(0, 0, 0, 0.1)'
            : '0 1px 5px rgba(0, 0, 0, 0.05)',
        }
      case 'text':
        return {
          backgroundColor: 'transparent',
          color: isHovered ? '#0071E3' : '#06C',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: '400',
          fontSize: '17px',
          lineHeight: '1.23536',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.15s ease-in-out',
          textDecoration: 'none',
        }
      default:
        return {}
    }
  }

  return (
    <button
      id={id}
      data-testid={testId}
      type={type}
      onClick={disabled ? undefined : onClick}
      className={className}
      disabled={disabled}
      style={getStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  )
}