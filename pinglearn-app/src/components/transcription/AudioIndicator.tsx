'use client';

/**
 * Audio Indicator Component
 * Simple "AI Teacher Speaking" indicator with volume visualization
 * No complex controls - just visual feedback
 * OPTIMIZED: Memoization and reduced re-renders
 */

import React, { useEffect, useState, useMemo } from 'react';

interface AudioIndicatorProps {
  isActive: boolean;
  label?: string;
  volume?: number; // 0-1 range
  className?: string;
}

export const AudioIndicator = React.memo(({
  isActive,
  label = 'AI Teacher',
  volume = 0,
  className = ''
}: AudioIndicatorProps) => {
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

  // Memoize dots to prevent re-rendering when animation frame doesn't affect them
  const animatedDots = useMemo(() => {
    return [0, 1, 2].map((index) => (
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
    ));
  }, [isActive, animationFrame]);

  // Memoize volume bars to prevent re-rendering when volume doesn't change
  const volumeBars = useMemo(() => {
    if (!isActive || volume <= 0) return null;

    return (
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
    );
  }, [isActive, volume]);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Animated dots indicator */}
      <div className="flex items-center space-x-1">
        {animatedDots}
      </div>

      {/* Label */}
      <span className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
        {label}
        {isActive && ' Speaking...'}
      </span>

      {/* Volume bars (optional) */}
      {volumeBars}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if props actually changed
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.label === nextProps.label &&
    prevProps.volume === nextProps.volume &&
    prevProps.className === nextProps.className
  );
});

AudioIndicator.displayName = 'AudioIndicator';

/**
 * Simplified Audio Visualizer
 * Shows real-time audio waveform
 * OPTIMIZED: Memoization and reduced updates
 */
export const AudioVisualizer = React.memo(({
  isActive,
  audioData,
  className = ''
}: {
  isActive: boolean;
  audioData?: number[]; // Array of amplitude values
  className?: string;
}) => {
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
      }, 150); // Reduced frequency from 100ms to 150ms
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

  // Memoize bars rendering
  const barElements = useMemo(() => {
    return bars.map((height, index) => (
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
    ));
  }, [bars, isActive]);

  return (
    <div className={`flex items-center justify-center space-x-1 h-8 ${className}`}>
      {barElements}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if props actually changed
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.audioData) === JSON.stringify(nextProps.audioData)
  );
});

AudioVisualizer.displayName = 'AudioVisualizer';