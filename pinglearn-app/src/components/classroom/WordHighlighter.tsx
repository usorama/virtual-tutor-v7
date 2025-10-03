import React, { useMemo } from 'react';
import { DisplayItem, WordTiming } from '@/protected-core';
import { useWordTiming } from '@/hooks/useWordTiming';

interface WordHighlighterProps {
  item: DisplayItem;
  className?: string;
}

export const WordHighlighter: React.FC<WordHighlighterProps> = ({
  item,
  className = ''
}) => {
  const { currentWordIndex, highlightedWords } = useWordTiming(item);

  const renderedWords = useMemo(() => {
    if (!item.wordTimings) return null;

    return item.wordTimings.map((timing: WordTiming, index: number) => {
      const isActive = index === currentWordIndex;
      const isHighlighted = highlightedWords.has(index);
      const isPending = index > currentWordIndex;

      // Dynamic class names based on timing state
      // REMOVED fade-in animation for ChatGPT-like instant text display
      const wordClasses = [
        'inline-block transition-all duration-300 px-0.5',
        isActive && 'bg-yellow-200 dark:bg-yellow-900 scale-110 font-semibold shadow-md',
        isHighlighted && !isActive && 'text-foreground/80',
        // REMOVED: isPending && 'opacity-0 translate-y-1', // No more invisible text!
        timing.isMath && 'font-mono text-blue-600 dark:text-blue-400'
      ].filter(Boolean).join(' ');

      // No animation delays - text appears instantly
      const animationStyle = undefined;

      return (
        <span
          key={`${item.id}-word-${index}`}
          className={wordClasses}
          style={animationStyle}
          data-word-index={index}
          data-start-time={timing.startTime}
          data-end-time={timing.endTime}
        >
          {timing.word}{' '}
        </span>
      );
    });
  }, [item.wordTimings, item.id, currentWordIndex, highlightedWords]);

  return (
    <div className={`word-highlighter ${className}`}>
      <div className="text-base leading-relaxed">
        {renderedWords}
      </div>

      {/* Add global animation keyframes via style tag */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};