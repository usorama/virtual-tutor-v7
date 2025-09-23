'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { DisplayBuffer } from '@/protected-core';

interface LiveDisplayItem {
  id: string;
  type: 'text' | 'math' | 'code' | 'diagram' | 'image';
  content: string;
  timestamp: number;
  speaker?: 'student' | 'teacher' | 'ai';
  rendered?: string;
  confidence?: number;
}

interface TeachingContent {
  id: string;
  type: 'heading' | 'text' | 'math' | 'step' | 'diagram';
  content: string;
  timestamp: number;
  highlight?: boolean;
}

interface TeachingBoardSimpleProps {
  sessionId?: string;
  topic: string;
  className?: string;
}

export function TeachingBoardSimple({ sessionId, topic, className = '' }: TeachingBoardSimpleProps) {
  const [content, setContent] = useState<TeachingContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const displayBufferRef = useRef<DisplayBuffer | null>(null);
  const [highlightTrigger, setHighlightTrigger] = useState(0);

  // Smart math detection
  const isValidMathContent = useCallback((content: string): boolean => {
    const cleanContent = content.trim();

    // Reject concatenated words
    if (/^[a-zA-Z]+$/.test(cleanContent) && cleanContent.length > 3) {
      return false;
    }

    // Reject rushed speech transcription
    if (/^[a-z]+[A-Z][a-z]+/.test(cleanContent)) {
      return false;
    }

    // Must contain actual math
    const mathPatterns = [
      /[\+\-\*\/\=\(\)\[\]\{\}]/,
      /\\[a-zA-Z]+/,
      /\$.*\$/,
      /[∑∏∫∂∇√∞≠≤≥±×÷]/,
      /^\d+[\+\-\*\/\=]/,
      /[a-z]\s*[\+\-\*\/\=]\s*[a-z0-9]/
    ];

    return mathPatterns.some(pattern => pattern.test(cleanContent));
  }, []);

  // Convert display items to teaching content
  const convertToTeachingContent = useCallback((item: LiveDisplayItem): TeachingContent | null => {
    // Only show teacher/AI content
    if (item.speaker !== 'teacher' && item.speaker !== 'ai') {
      return null;
    }

    let contentType: TeachingContent['type'] = 'text';

    if (item.type === 'math' && isValidMathContent(item.content)) {
      contentType = 'math';
    } else if (item.type === 'diagram') {
      contentType = 'diagram';
    } else {
      const content = item.content.trim();
      if (/^(Step \d+|\d+\.|\d+\))/i.test(content)) {
        contentType = 'step';
      }
      // Removed heading detection - everything else is just text
      // This prevents broken chunks from being misclassified as headings
    }

    return {
      id: item.id,
      type: contentType,
      content: item.content,
      timestamp: item.timestamp,
      highlight: Date.now() - item.timestamp < 3000
    };
  }, [isValidMathContent]);

  // Process and update content from buffer - FIXED: Aggregate chunks into paragraphs
  const processBufferItems = useCallback((items: LiveDisplayItem[]) => {
    console.log('[TeachingBoardSimple] Processing buffer update:', items.length, 'items');

    // Group items by speaker and aggregate text chunks into complete paragraphs
    const aggregatedContent: TeachingContent[] = [];

    // Filter for teacher/AI content only
    const teacherItems = items.filter(item =>
      item.speaker === 'teacher' || item.speaker === 'ai'
    );

    if (teacherItems.length === 0) {
      setContent([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Group consecutive text chunks by speaker to form complete paragraphs
    let currentParagraph = '';
    let currentSpeaker = '';
    let paragraphTimestamp = 0;
    let lastChunkTimestamp = 0;
    let paragraphType: TeachingContent['type'] = 'text';

    teacherItems.forEach((item, index) => {
      const itemContent = item.content.trim();

      // Detect significant time gaps indicating new teacher responses
      const timeSinceLastChunk = item.timestamp - lastChunkTimestamp;
      const isSignificantGap = lastChunkTimestamp > 0 && timeSinceLastChunk > 5000; // 5+ second gap

      if (isSignificantGap) {
        console.log('[TeachingBoardSimple] Time gap detected:', timeSinceLastChunk, 'ms - starting new paragraph');
      }

      // Start new paragraph if speaker changes, significant time gap, or special content
      const isNewSpeaker = currentSpeaker !== item.speaker;
      const isMathContent = item.type === 'math' && isValidMathContent(itemContent);
      const isStepContent = /^(Step \d+|\d+\.|\d+\))/i.test(itemContent);
      const isNewResponse = isSignificantGap;

      if (isNewSpeaker || isMathContent || isStepContent || isNewResponse) {
        // Save previous paragraph if it exists
        if (currentParagraph.trim()) {
          aggregatedContent.push({
            id: `paragraph_${paragraphTimestamp}`,
            type: paragraphType,
            content: currentParagraph.trim(),
            timestamp: paragraphTimestamp,
            highlight: Date.now() - paragraphTimestamp < 5000
          });
        }

        // Start new paragraph
        currentParagraph = itemContent;
        currentSpeaker = item.speaker || 'teacher';
        paragraphTimestamp = item.timestamp;

        if (isMathContent) {
          paragraphType = 'math';
        } else if (isStepContent) {
          paragraphType = 'step';
        } else {
          paragraphType = 'text';
        }
      } else {
        // Append to current paragraph with proper spacing
        const needsSpace = currentParagraph && !currentParagraph.endsWith(' ');
        currentParagraph += (needsSpace ? ' ' : '') + itemContent;
      }

      // Update timestamp tracker
      lastChunkTimestamp = item.timestamp;

      // If this is the last item, save the current paragraph
      if (index === teacherItems.length - 1 && currentParagraph.trim()) {
        aggregatedContent.push({
          id: `paragraph_${paragraphTimestamp}`,
          type: paragraphType,
          content: currentParagraph.trim(),
          timestamp: paragraphTimestamp,
          highlight: Date.now() - paragraphTimestamp < 5000
        });
      }
    });

    console.log('[TeachingBoardSimple] Aggregated', teacherItems.length, 'chunks into', aggregatedContent.length, 'paragraphs');

    setContent(aggregatedContent);
    setError(null);
    setIsLoading(false);

    // Auto scroll to latest content
    if (scrollAreaRef.current && aggregatedContent.length > 0) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [convertToTeachingContent]);

  // Initialize display buffer with reactive subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;
    let highlightInterval: NodeJS.Timeout | null = null;

    setIsLoading(true);
    console.log('[TeachingBoardSimple] Initializing display buffer subscription');

    import('@/protected-core')
      .then(({ getDisplayBuffer }) => {
        try {
          const displayBuffer = getDisplayBuffer();
          displayBufferRef.current = displayBuffer;

          // Get initial items
          const initialItems = displayBuffer.getItems() as LiveDisplayItem[];
          console.log('[TeachingBoardSimple] Initial items:', initialItems.length);
          processBufferItems(initialItems);

          // Subscribe to future updates - this is reactive!
          unsubscribe = displayBuffer.subscribe((items) => {
            console.log('[TeachingBoardSimple] Buffer update received:', items.length, 'items');
            processBufferItems(items as LiveDisplayItem[]);
          });

          // Highlight trigger for time-based highlighting
          highlightInterval = setInterval(() => {
            setHighlightTrigger(prev => prev + 1);
          }, 1000);

          console.log('[TeachingBoardSimple] Successfully subscribed to display buffer');
        } catch (err) {
          console.error('[TeachingBoardSimple] Failed to initialize display buffer:', err);
          setError('Failed to initialize teaching board');
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('[TeachingBoardSimple] Failed to import protected-core:', err);
        setError('Failed to load teaching board module');
        setIsLoading(false);
      });

    // Cleanup function - properly returned from useEffect
    return () => {
      console.log('[TeachingBoardSimple] Cleaning up subscription');
      if (unsubscribe) {
        unsubscribe();
      }
      if (highlightInterval) {
        clearInterval(highlightInterval);
      }
    };
  }, [processBufferItems, sessionId]);

  // Render math with KaTeX
  const renderMath = (latex: string) => {
    try {
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return `<span class="text-red-500">[Math Error]</span>`;
    }
  };

  // Render content
  const renderContent = (item: TeachingContent) => {
    const now = Date.now();
    const timeSinceCreation = now - item.timestamp;
    const _ = highlightTrigger; // Force re-render for highlighting
    const isCurrentlySpoken = timeSinceCreation < 5000;

    switch (item.type) {
      case 'heading':
        return (
          <h2 className={`text-2xl font-bold mb-4 text-primary ${
            isCurrentlySpoken ? 'bg-blue-50 dark:bg-blue-950/50 px-3 py-2 rounded-lg' : ''
          }`}>
            {item.content}
          </h2>
        );

      case 'text':
        return (
          <p className={`text-base leading-relaxed mb-3 ${
            isCurrentlySpoken ? 'bg-blue-50 dark:bg-blue-950/50 px-3 py-2 rounded-lg' : ''
          }`}>
            {item.content}
          </p>
        );

      case 'math':
        return (
          <div className={`my-4 py-4 px-6 ${
            isCurrentlySpoken ? 'bg-blue-50 dark:bg-blue-950/50 rounded-lg' : ''
          }`}>
            <div
              className="katex-display text-center text-lg"
              dangerouslySetInnerHTML={{ __html: renderMath(item.content) }}
            />
          </div>
        );

      case 'step':
        return (
          <div className={`flex items-start space-x-3 mb-3 ${
            isCurrentlySpoken ? 'bg-green-50 dark:bg-green-950/50 px-3 py-2 rounded-lg' : ''
          }`}>
            <span className="text-green-600 font-bold">•</span>
            <p className="text-base">{item.content}</p>
          </div>
        );

      default:
        return <p className="text-base mb-3">{item.content}</p>;
    }
  };

  return (
    <div className={`h-full bg-background ${className}`}>
      <ScrollArea ref={scrollAreaRef} className="h-full">
        <div className="p-6 max-w-4xl mx-auto">
          {error ? (
            <div className="text-center text-red-600 py-12">
              <p className="text-lg font-medium mb-2">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : isLoading && content.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Initializing...</p>
            </div>
          ) : content.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Ready for lesson</p>
              <p className="text-sm mt-2 opacity-75">
                Mathematical concepts will appear here as the teacher explains
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {content.map((item) => (
                <div key={item.id} className="animate-in fade-in-0 duration-300">
                  {renderContent(item)}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}