import React, { useState, useEffect, useMemo } from 'react';
import katex from 'katex';
import { MathFragmentData } from '@/protected-core';
import 'katex/dist/katex.min.css';

interface ProgressiveMathProps {
  fragments: MathFragmentData;
  fullLatex: string;
  timingOffset?: number;
  className?: string;
}

export const ProgressiveMath: React.FC<ProgressiveMathProps> = ({
  fragments,
  fullLatex,
  timingOffset = 0,
  className = ''
}) => {
  const [visibleFragments, setVisibleFragments] = useState<number>(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!fragments || !fragments.timings || fragments.timings.length === 0) {
      // If no fragments, show full equation
      setVisibleFragments(fragments?.fragments?.length || 0);
      setIsComplete(true);
      return;
    }

    // Progressive reveal based on timing
    const timers: NodeJS.Timeout[] = [];

    fragments.timings.forEach((timing, index) => {
      const revealTime = timing + timingOffset;

      const timer = setTimeout(() => {
        setVisibleFragments(prev => Math.max(prev, index + 1));

        // Check if this is the last fragment
        if (index === fragments.fragments.length - 1) {
          setIsComplete(true);
        }
      }, Math.max(0, revealTime));

      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [fragments, timingOffset]);

  const currentLatex = useMemo(() => {
    if (!fragments || !fragments.fragments) {
      return fullLatex;
    }

    if (visibleFragments === 0) {
      return '';
    }

    // Join visible fragments
    return fragments.fragments
      .slice(0, visibleFragments)
      .join('');
  }, [fragments, fullLatex, visibleFragments]);

  const mathHtml = useMemo(() => {
    if (!currentLatex) return '';

    try {
      return katex.renderToString(currentLatex || '', {
        throwOnError: false,
        displayMode: true,
        trust: true,
        strict: false
      });
    } catch (error) {
      console.warn('KaTeX rendering error in ProgressiveMath:', error);
      return `<span class="text-red-500">[Math Error: ${currentLatex}]</span>`;
    }
  }, [currentLatex]);

  return (
    <div className={`progressive-math ${className}`}>
      <div className="relative inline-block">
        {/* Math content */}
        <div
          className={`
            transition-all duration-300 ease-out
            ${isComplete ? 'opacity-100' : 'opacity-90'}
          `}
          dangerouslySetInnerHTML={{ __html: mathHtml }}
        />

        {/* Typing cursor effect while revealing */}
        {!isComplete && visibleFragments > 0 && (
          <span className="inline-block ml-1 w-0.5 h-6 bg-blue-500 animate-pulse" />
        )}
      </div>

      {/* Visual indicator of progressive reveal */}
      {!isComplete && (
        <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{
              width: `${(visibleFragments / (fragments?.fragments?.length || 1)) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};