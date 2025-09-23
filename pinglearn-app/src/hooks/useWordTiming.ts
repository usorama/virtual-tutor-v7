import { useState, useEffect, useRef, useCallback } from 'react';
import { DisplayItem } from '@/protected-core/contracts/transcription.contract';

interface WordTimingState {
  currentWordIndex: number;
  highlightedWords: Set<number>;
}

export function useWordTiming(message: DisplayItem) {
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [highlightedWords, setHighlightedWords] = useState<Set<number>>(new Set());
  const startTimeRef = useRef<number>(0);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const isActiveRef = useRef<boolean>(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
    isActiveRef.current = false;
  }, []);

  useEffect(() => {
    // Only process if we have word timings
    if (!message.wordTimings || message.wordTimings.length === 0) {
      return;
    }

    // Check if this is a recent message (within last 5 seconds)
    const messageAge = Date.now() - message.timestamp;
    const isRecentMessage = messageAge < 5000;

    if (!isRecentMessage) {
      // For old messages, show all words as highlighted
      setHighlightedWords(new Set(Array.from({ length: message.wordTimings.length }, (_, i) => i)));
      setCurrentWordIndex(-1);
      return;
    }

    // Start timing for new messages
    startTimeRef.current = Date.now();
    isActiveRef.current = true;
    setCurrentWordIndex(0);
    setHighlightedWords(new Set());

    // Schedule word highlights based on timing data
    message.wordTimings.forEach((timing, index) => {
      // Calculate when to highlight this word
      const highlightTime = timing.startTime - messageAge;

      if (highlightTime > 0) {
        const timer = setTimeout(() => {
          if (!isActiveRef.current) return;

          // Update current word
          setCurrentWordIndex(index);

          // Add to highlighted set after a brief active period
          setTimeout(() => {
            setHighlightedWords(prev => {
              const newSet = new Set(prev);
              newSet.add(index);
              return newSet;
            });

            // Move to next word or clear current
            if (index === message.wordTimings!.length - 1) {
              setCurrentWordIndex(-1);
            }
          }, timing.endTime - timing.startTime);
        }, highlightTime);

        timersRef.current.push(timer);
      } else {
        // Word should already be highlighted
        setHighlightedWords(prev => {
          const newSet = new Set(prev);
          newSet.add(index);
          return newSet;
        });
      }
    });

    // Cleanup on unmount or message change
    return cleanup;
  }, [message.id, message.wordTimings, message.timestamp, cleanup]);

  return {
    currentWordIndex,
    highlightedWords
  };
}