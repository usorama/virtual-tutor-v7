'use client';

/**
 * Audio Indicator Component
 * Simple "AI Teacher Speaking" indicator with volume visualization
 * No complex controls - just visual feedback
 */

import React, { useEffect, useState } from 'react';

interface AudioIndicatorProps {
  isActive: boolean;
  label?: string;
  volume?: number; // 0-1 range
  className?: string;
}

export function AudioIndicator({
  isActive,
  label = 'AI Teacher',
  volume = 0,
  className = ''
}: AudioIndicatorProps) {
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setAnimationFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 3);
    }, 300);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Animated dots indicator */}
      <div className="flex items-center space-x-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`
              transition-all duration-300
              ${isActive ? 'bg-green-500' : 'bg-gray-300'}
              rounded-full
            `}
            style={{
              width: '8px',
              height: isActive && animationFrame === index ? '20px' : '8px',
              opacity: isActive ? 1 : 0.3
            }}
          />
        ))}
      </div>

      {/* Label */}
      <span className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
        {label}
        {isActive && ' Speaking...'}
      </span>

      {/* Volume bars (optional) */}
      {isActive && volume > 0 && (
        <div className="flex items-end space-x-1 ml-3">
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, index) => (
            <div
              key={index}
              className={`
                w-1 bg-green-500 rounded-sm transition-all duration-100
                ${volume >= threshold ? 'opacity-100' : 'opacity-20'}
              `}
              style={{
                height: `${8 + index * 3}px`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Simplified Audio Visualizer
 * Shows real-time audio waveform
 */
export function AudioVisualizer({
  isActive,
  audioData,
  className = ''
}: {
  isActive: boolean;
  audioData?: number[]; // Array of amplitude values
  className?: string;
}) {
  const [bars, setBars] = useState<number[]>(new Array(20).fill(0));

  useEffect(() => {
    if (!isActive) {
      setBars(new Array(20).fill(0));
      return;
    }

    // Simulate audio data if not provided
    if (!audioData) {
      const interval = setInterval(() => {
        setBars(prev => prev.map(() => Math.random()));
      }, 100);
      return () => clearInterval(interval);
    }

    // Use real audio data
    if (audioData && audioData.length > 0) {
      const normalized = audioData.slice(0, 20).map(val =>
        Math.max(0, Math.min(1, Math.abs(val)))
      );
      setBars(normalized);
    }
  }, [isActive, audioData]);

  return (
    <div className={`flex items-center justify-center space-x-1 h-8 ${className}`}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={`
            w-1 rounded-full transition-all duration-75
            ${isActive ? 'bg-blue-500' : 'bg-gray-300'}
          `}
          style={{
            height: `${4 + height * 28}px`,
            opacity: isActive ? 0.8 + height * 0.2 : 0.2
          }}
        />
      ))}
    </div>
  );
}