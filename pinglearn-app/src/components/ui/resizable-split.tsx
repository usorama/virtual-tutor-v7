'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ResizableSplitProps {
  children: [React.ReactNode, React.ReactNode];
  defaultSplit?: number; // Percentage (0-100)
  minSplit?: number; // Minimum percentage for left panel
  maxSplit?: number; // Maximum percentage for left panel
  direction?: 'horizontal' | 'vertical';
  className?: string;
  onSplitChange?: (split: number) => void;
}

export function ResizableSplit({
  children,
  defaultSplit = 80,
  minSplit = 20,
  maxSplit = 90,
  direction = 'horizontal',
  className,
  onSplitChange
}: ResizableSplitProps) {
  const [split, setSplit] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    let newSplit: number;
    if (direction === 'horizontal') {
      const mouseX = e.clientX - rect.left;
      newSplit = (mouseX / rect.width) * 100;
    } else {
      const mouseY = e.clientY - rect.top;
      newSplit = (mouseY / rect.height) * 100;
    }

    // Constrain within bounds
    newSplit = Math.max(minSplit, Math.min(maxSplit, newSplit));

    setSplit(newSplit);
    onSplitChange?.(newSplit);
  }, [isDragging, direction, minSplit, maxSplit, onSplitChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  const isHorizontal = direction === 'horizontal';
  const splitStyle = isHorizontal ? { width: `${split}%` } : { height: `${split}%` };
  const remainingSplit = 100 - split;
  const remainingStyle = isHorizontal ? { width: `${remainingSplit}%` } : { height: `${remainingSplit}%` };

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex',
        isHorizontal ? 'flex-row h-full' : 'flex-col w-full',
        className
      )}
    >
      {/* First Panel */}
      <div style={splitStyle} className="overflow-hidden">
        {children[0]}
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          'bg-border hover:bg-border/80 transition-colors flex-shrink-0 group relative',
          isHorizontal
            ? 'w-1 cursor-col-resize hover:w-2'
            : 'h-1 cursor-row-resize hover:h-2',
          isDragging && 'bg-primary'
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <div
          className={cn(
            'absolute bg-muted-foreground/20 group-hover:bg-muted-foreground/40 transition-colors',
            isHorizontal
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8'
              : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1'
          )}
        />
      </div>

      {/* Second Panel */}
      <div style={remainingStyle} className="overflow-hidden">
        {children[1]}
      </div>
    </div>
  );
}