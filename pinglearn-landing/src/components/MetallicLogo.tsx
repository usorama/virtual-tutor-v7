"use client";

import { motion } from "framer-motion";

export default function MetallicLogo({ size = 32 }: { size?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -180 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="relative"
      >
        <defs>
          {/* Metallic gradient - subtle silver to dark */}
          <linearGradient id="topFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0e0e0" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>

          {/* Darker gradient for depth */}
          <linearGradient id="bottomFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="50%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>

          {/* Cyan accent gradient */}
          <linearGradient id="cyanAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>

          {/* Shadow filter */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="2" dy="2" result="offsetblur"/>
            <feFlood floodColor="#000000" floodOpacity="0.3"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Inner shadow for depth */}
          <filter id="inset">
            <feOffset dx="0" dy="1"/>
            <feGaussianBlur stdDeviation="1" result="offset-blur"/>
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
            <feFlood floodColor="black" floodOpacity="0.2" result="color"/>
            <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
            <feMerge>
              <feMergeNode in="shadow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Combined P shape - 3D effect */}
        <g filter="url(#shadow)">
          {/* Bottom/shadow face */}
          <path
            d="M 20 75 L 20 25 L 50 25 Q 65 25 65 40 Q 65 55 50 55 L 35 55 L 35 45 L 48 45 Q 55 45 55 40 Q 55 35 48 35 L 30 35 L 30 75 Z"
            fill="url(#bottomFace)"
            transform="translate(2, 2)"
            opacity="0.7"
          />

          {/* Top face - main P shape */}
          <path
            d="M 20 75 L 20 25 L 50 25 Q 65 25 65 40 Q 65 55 50 55 L 35 55 L 35 45 L 48 45 Q 55 45 55 40 Q 55 35 48 35 L 30 35 L 30 75 Z"
            fill="url(#topFace)"
            filter="url(#inset)"
          />

          {/* Cyan accent line */}
          <rect
            x="20"
            y="70"
            width="35"
            height="2"
            fill="url(#cyanAccent)"
            opacity="0.8"
          />
        </g>

        {/* Subtle highlight for 3D effect */}
        <path
          d="M 20 25 L 50 25 Q 65 25 65 40 L 64 38 Q 62 26 50 26 L 22 26 Z"
          fill="white"
          opacity="0.2"
        />
      </svg>
    </motion.div>
  );
}