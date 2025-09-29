/**
 * Active Button Component
 *
 * A simple button component with active state styling.
 * This component provides consistent button styling across the application.
 */

import React from 'react';

interface ActiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const ActiveButton: React.FC<ActiveButtonProps> = ({
  children,
  onClick,
  active = false,
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'md'
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: active
      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    secondary: active
      ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    danger: active
      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      : 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500'
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? disabledClasses : ''}
        ${className}
      `.trim()}
    >
      {children}
    </button>
  );
};

export default ActiveButton;