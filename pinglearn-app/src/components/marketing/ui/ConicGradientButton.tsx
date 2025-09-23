"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ConicGradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
}

export default function ConicGradientButton({
  children,
  onClick,
  href,
  className = "",
  variant = 'primary',
  size = 'md',
  disabled = false
}: ConicGradientButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  const baseClasses = `relative rounded-full font-medium overflow-hidden group transition-all duration-300 ${sizeClasses[size]}`;

  const Component = href ? 'a' : 'button';

  if (variant === 'ghost') {
    return (
      <Component
        href={href}
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} text-white border border-white/20 hover:border-cyan-400/50 hover:bg-white/5 ${className}`}
      >
        <span className="relative z-10">{children}</span>
      </Component>
    );
  }

  if (variant === 'secondary') {
    return (
      <Component
        href={href}
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} text-cyan-400 border border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/10 ${className}`}
      >
        <span className="relative z-10">{children}</span>
      </Component>
    );
  }

  // Primary variant with conic gradient
  return (
    <Component
      href={href}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} text-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Animated conic gradient border */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          padding: "2px",
          background: "transparent",
        }}
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 6,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        <div
          className="absolute inset-0 rounded-full blur-md"
          style={{
            background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, #00d4ff 60deg, #00bcd4 120deg, transparent 180deg, transparent 360deg)",
          }}
        />
      </motion.div>

      {/* Button background */}
      <div
        className="absolute inset-[2px] rounded-full backdrop-blur-sm"
        style={{
          background: "linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 188, 212, 0.3) 100%)",
          backgroundColor: "rgba(0, 188, 212, 0.7)",
        }}
      />

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "radial-gradient(circle at center, rgba(0,212,255,0.4) 0%, transparent 70%)",
        }}
      />

      {/* Button content */}
      <span className="relative z-10">{children}</span>
    </Component>
  );
}