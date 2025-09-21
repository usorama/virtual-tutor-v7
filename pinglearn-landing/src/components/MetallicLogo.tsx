"use client";

import { motion } from "framer-motion";

export default function MetallicLogo({ size = 40 }: { size?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="relative"
      >
        <defs>
          {/* Top surface gradient - light metallic */}
          <linearGradient id="topSurface" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3f4f6" />
            <stop offset="30%" stopColor="#e5e7eb" />
            <stop offset="60%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>

          {/* Side surface gradient - darker for 3D effect */}
          <linearGradient id="sideSurface" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>

          {/* Bottom surface - darkest */}
          <linearGradient id="bottomSurface" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>

          {/* Glossy overlay */}
          <linearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* P letter in 3D */}
        <g>
          {/* Bottom face (3D depth) */}
          <path
            d="M 25 38 L 55 20 L 75 30 L 75 45 L 65 50 L 65 40 L 75 35 L 75 50 L 45 68 L 25 58 Z"
            fill="url(#bottomSurface)"
            opacity="0.9"
          />

          {/* Side faces for 3D effect */}
          <path
            d="M 25 38 L 25 58 L 45 68 L 45 48 Z"
            fill="url(#sideSurface)"
          />

          <path
            d="M 55 20 L 55 40 L 65 45 L 65 25 Z"
            fill="url(#sideSurface)"
          />

          {/* Top face (main visible surface) */}
          <path
            d="M 20 35 L 50 17 L 70 27 L 70 42 L 60 47 L 60 37 L 70 32 L 70 47 L 40 65 L 20 55 Z"
            fill="url(#topSurface)"
          />

          {/* Glossy overlay on top */}
          <path
            d="M 20 35 L 50 17 L 70 27 L 70 32 L 50 22 L 25 37 Z"
            fill="url(#gloss)"
          />

          {/* Inner cutout for P shape */}
          <path
            d="M 35 42 L 35 52 L 45 47 L 45 37 Z"
            fill="url(#bottomSurface)"
          />
        </g>

        {/* Subtle reflection */}
        <ellipse
          cx="45"
          cy="70"
          rx="20"
          ry="3"
          fill="black"
          opacity="0.1"
        />
      </svg>
    </motion.div>
  );
}