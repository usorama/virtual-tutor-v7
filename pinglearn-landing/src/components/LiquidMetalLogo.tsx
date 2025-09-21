"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}

export default function LiquidMetalLogo({ size = 40 }: { size?: number }) {
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (logoRef.current) {
        const rect = logoRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = (e.clientX - centerX) / rect.width;
        const distY = (e.clientY - centerY) / rect.height;
        setMousePos({ x: distX * 10, y: distY * 10 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={logoRef}
      className="relative"
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
        }}
        transition={{
          type: "spring",
          damping: 15,
          stiffness: 150,
        }}
      >
        {/* Liquid metal effect background */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 30% 30%,
                rgba(6,182,212,0.4) 0%,
                rgba(6,182,212,0.2) 25%,
                rgba(6,182,212,0.1) 50%,
                transparent 70%
              )
            `,
            filter: "blur(8px)",
          }}
        />

        {/* SVG for P and L combined */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="relative"
        >
          <defs>
            {/* Gradient for metallic effect */}
            <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#0891b2" stopOpacity="1" />
              <stop offset="100%" stopColor="#0e7490" stopOpacity="0.9" />
            </linearGradient>

            {/* Filter for liquid metal effect */}
            <filter id="liquid">
              <feTurbulence baseFrequency="0.02" numOctaves="2" result="turbulence" />
              <feColorMatrix in="turbulence" mode="saturate" values="0" />
              <feComponentTransfer>
                <feFuncA type="discrete" tableValues="1 .5 .5 .5 .5 .5 .5 .5" />
              </feComponentTransfer>
              <feGaussianBlur stdDeviation="0.7" />
              <feComposite operator="over" in2="SourceGraphic" />
            </filter>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Combined P and L shape */}
          <motion.g
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* P shape (left side) */}
            <motion.path
              d="M 25 70 L 25 30 L 45 30 Q 55 30 55 40 Q 55 50 45 50 L 35 50"
              stroke="url(#metalGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              animate={{
                pathLength: [0, 1, 1, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                times: [0, 0.25, 0.75, 1],
                ease: "easeInOut",
              }}
            />

            {/* L shape (right side, overlapping) */}
            <motion.path
              d="M 45 30 L 45 70 L 75 70"
              stroke="url(#metalGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              animate={{
                pathLength: [0, 1, 1, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                times: [0, 0.25, 0.75, 1],
                ease: "easeInOut",
                delay: 0.5,
              }}
            />

            {/* Connecting liquid blob */}
            <motion.circle
              cx="45"
              cy="40"
              r="4"
              fill="url(#metalGradient)"
              filter="url(#liquid)"
              animate={{
                r: [4, 6, 4],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.g>

          {/* Liquid drops animation */}
          <motion.circle
            cx="35"
            cy="50"
            r="2"
            fill="#06b6d4"
            animate={{
              cy: [50, 75, 50],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 1,
            }}
          />

          <motion.circle
            cx="55"
            cy="60"
            r="1.5"
            fill="#0891b2"
            animate={{
              cy: [60, 75, 60],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: 2,
            }}
          />
        </svg>

        {/* Shimmer effect overlay */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(
              105deg,
              transparent 40%,
              rgba(6,182,212,0.3) 50%,
              transparent 60%
            )`,
          }}
          animate={{
            transform: ["translateX(-100%)", "translateX(100%)"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
      </motion.div>
    </div>
  );
}