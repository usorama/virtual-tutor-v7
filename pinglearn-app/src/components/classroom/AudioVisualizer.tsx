'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  isActive: boolean;
  type?: 'teacher' | 'student';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AudioVisualizer({
  isActive,
  type = 'teacher',
  className = '',
  size = 'md'
}: AudioVisualizerProps) {
  const barsRef = useRef<HTMLDivElement[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  const sizeClasses = {
    sm: 'h-4 gap-0.5',
    md: 'h-6 gap-1',
    lg: 'h-8 gap-1.5'
  };

  const barHeights = {
    sm: 16,
    md: 24,
    lg: 32
  };

  useEffect(() => {
    if (isActive) {
      const animate = () => {
        barsRef.current.forEach((bar, i) => {
          if (bar) {
            // Create a wave effect
            const scale = Math.random() * 0.8 + 0.2;
            const delay = i * 50;
            setTimeout(() => {
              bar.style.transform = `scaleY(${scale})`;
            }, delay);
          }
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      barsRef.current.forEach(bar => {
        if (bar) {
          bar.style.transform = 'scaleY(0.2)';
        }
      });
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  const barColor = type === 'teacher'
    ? 'bg-gradient-to-t from-purple-500 to-purple-400'
    : 'bg-gradient-to-t from-blue-500 to-blue-400';

  return (
    <div className={cn(
      'flex items-center justify-center',
      sizeClasses[size],
      className
    )}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          ref={el => {
            if (el) barsRef.current[i] = el;
          }}
          className={cn(
            'w-1 rounded-full transition-transform duration-150 origin-bottom',
            barColor,
            isActive ? 'opacity-100' : 'opacity-30'
          )}
          style={{
            height: `${barHeights[size]}px`,
            transform: 'scaleY(0.2)'
          }}
        />
      ))}
    </div>
  );
}