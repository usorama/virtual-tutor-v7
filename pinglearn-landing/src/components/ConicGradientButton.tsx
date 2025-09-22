"use client";

import { motion } from "framer-motion";

interface ConicGradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function ConicGradientButton({
  children,
  onClick,
  className = ""
}: ConicGradientButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative px-8 py-3 rounded-full font-medium text-white overflow-hidden group ${className}`}
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
            background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, #06b6d4 60deg, #0891b2 120deg, transparent 180deg, transparent 360deg)",
          }}
        />
      </motion.div>

      {/* Button background - darker cyan color */}
      <div
        className="absolute inset-[2px] rounded-full backdrop-blur-sm"
        style={{
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.25) 100%)",
          backgroundColor: "rgba(3, 91, 106, 0.6)",
        }}
      />

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "radial-gradient(circle at center, rgba(6,182,212,0.3) 0%, transparent 70%)",
        }}
      />

      {/* Button content */}
      <span className="relative z-10">{children}</span>
    </button>
  );
}