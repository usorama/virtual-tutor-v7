"use client";

import { motion } from "framer-motion";

interface PingLearnLogoProps {
  className?: string;
  variant?: "primary" | "white" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

export default function PingLearnLogo({
  className = "",
  variant = "primary",
  size = "md",
  animated = true
}: PingLearnLogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16"
  };

  const colorClasses = {
    primary: {
      text: "text-blue-700",
      dot: "text-blue-500"
    },
    white: {
      text: "text-white",
      dot: "text-blue-300"
    },
    dark: {
      text: "text-neutral-900",
      dot: "text-blue-600"
    }
  };

  const colors = colorClasses[variant];

  const logoVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  };

  const Component = animated ? motion.div : "div";
  const textProps = animated ? {
    variants: logoVariants,
    initial: "hidden",
    animate: "visible"
  } : {};

  return (
    <Component
      className={`flex items-center ${sizeClasses[size]} ${className}`}
      {...textProps}
    >
      <svg
        viewBox="0 0 320 60"
        className={`${sizeClasses[size]} w-auto`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main wordmark text */}
        <text
          x="10"
          y="42"
          className={`${colors.text} font-semibold fill-current`}
          style={{
            fontSize: "40px",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
            letterSpacing: "-0.02em"
          }}
        >
          PingLearn
        </text>

        {/* Connection dot */}
        {animated ? (
          <motion.circle
            cx="52"
            cy="35"
            r="3"
            className={`${colors.dot} fill-current`}
            variants={dotVariants}
          />
        ) : (
          <circle
            cx="52"
            cy="35"
            r="3"
            className={`${colors.dot} fill-current`}
          />
        )}

        {/* Subtle connection line */}
        <line
          x1="55"
          y1="35"
          x2="70"
          y2="35"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.2"
          className={colors.dot}
        />
      </svg>
    </Component>
  );
}