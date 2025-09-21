"use client";

import { motion } from "framer-motion";

export default function LiquidMetalP({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))"
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main gradient - silver/white metallic */}
          <linearGradient id="metalTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#f3f4f6" />
            <stop offset="50%" stopColor="#e5e7eb" />
            <stop offset="80%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>

          {/* Dark side gradient */}
          <linearGradient id="metalDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>

          {/* Medium gradient for sides */}
          <linearGradient id="metalSide" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9ca3af" />
            <stop offset="50%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>

          {/* Chromatic aberration effect edges */}
          <filter id="chromatic">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
            <feOffset in="blur" dx="-1" dy="0" result="red" />
            <feOffset in="blur" dx="1" dy="0" result="blue" />
            <feComposite in="red" in2="SourceGraphic" operator="arithmetic" k1="0" k2="1" k3="0" k4="0" result="redComposite">
              <animate attributeName="k2" values="1;0.8;1" dur="4s" repeatCount="indefinite" />
            </feComposite>
            <feComposite in="blue" in2="redComposite" operator="screen" />
          </filter>

          {/* Glossy overlay */}
          <linearGradient id="gloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="30%" stopColor="white" stopOpacity="0.2" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* P shape in 3D layers */}

        {/* Bottom shadow/depth -->
        <path
          d="M 25 70 L 25 25 L 55 15 L 65 20 L 65 35 L 55 40 L 40 35 L 40 45 L 50 40 L 60 45 L 60 30 L 55 20 L 30 30 L 30 70 Z"
          fill="url(#metalDark)"
          opacity="0.7"
          transform="translate(2, 3)"
        />

        {/* Side face (right) - darker for depth */}
        <path
          d="M 50 20 L 70 30 L 70 45 L 50 55 L 50 40 L 60 35 L 60 40 L 50 45 L 50 20 Z"
          fill="url(#metalSide)"
        />

        {/* Side face (bottom) */}
        <path
          d="M 25 65 L 25 70 L 50 60 L 50 55 Z"
          fill="url(#metalSide)"
        />

        {/* Main top face - P shape */}
        <path
          d="M 25 65 L 25 20 L 50 10 L 70 20 L 70 40 L 50 50 L 35 45 L 35 40 L 50 35 L 60 30 L 60 25 L 50 20 L 35 25 L 35 65 Z"
          fill="url(#metalTop)"
          filter="url(#chromatic)"
        />

        {/* Inner cut-out for P hole */}
        <path
          d="M 42 32 L 42 38 L 52 34 L 52 28 Z"
          fill="url(#metalDark)"
          opacity="0.5"
        />

        {/* Glossy highlight on top surface */}
        <path
          d="M 25 20 L 50 10 L 70 20 L 68 22 L 50 13 L 27 22 Z"
          fill="url(#gloss)"
        />

        {/* Subtle reflection line */}
        <path
          d="M 30 25 L 45 20 L 45 22 L 30 27 Z"
          fill="white"
          opacity="0.3"
        />

        {/* Chromatic edge effects for that liquid metal look */}
        <path
          d="M 25 65 L 25 20 L 50 10"
          stroke="cyan"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M 25 65 L 25 20 L 50 10"
          stroke="magenta"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
          transform="translate(0.5, 0)"
        />
      </svg>
    </div>
  );
}