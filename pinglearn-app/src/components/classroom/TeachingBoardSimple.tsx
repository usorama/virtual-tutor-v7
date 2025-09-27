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

  // Note: Visual content now displays immediately
  // Audio delay of 400ms is handled in LiveKitRoom for show-then-tell methodology

  // Enhanced math detection for educational content
  const isValidMathContent = useCallback((content: string): boolean => {
    const cleanContent = content.trim().toLowerCase();

    // Reject concatenated words without spaces (transcription errors)
    if (/^[a-zA-Z]+$/.test(cleanContent) && cleanContent.length > 8 && !/\s/.test(cleanContent)) {
      return false;
    }

    // Reject rushed speech transcription patterns
    if (/^[a-z]+[A-Z][a-z]+/.test(content.trim())) {
      return false;
    }

    // Enhanced math patterns for educational content
    const mathPatterns = [
      // Traditional math symbols
      /[\+\-\*\/\=\(\)\[\]\{\}]/,
      /\\[a-zA-Z]+/,  // LaTeX commands
      /\$.*\$/,        // LaTeX delimiters
      /[∑∏∫∂∇√∞≠≤≥±×÷]/,  // Math symbols
      /^\d+[\+\-\*\/\=]/,
      /[a-z]\s*[\+\-\*\/\=]\s*[a-z0-9]/,

      // Natural language math descriptions - THE KEY FIX!
      /\bfraction\s+[a-z0-9]+\s*\/\s*[a-z0-9]+/i,  // "fraction p/q"
      /\b(where|and)\s+[a-z]+\s+(and|are)\s+[a-z]+\s+(are\s+)?(integers?|numbers?)/i,  // "where p and q are integers"
      /\b(rational|irrational)\s+(number|expression)/i,  // "rational number"
      /\b(square\s+root|sqrt)\s+(of\s+)?/i,  // "square root of"
      /\b(equation|formula|expression)\s+/i,  // "equation of"
      /\b(sin|cos|tan|log|ln|exp)\s*\(/i,  // Math functions
      /\b(derivative|integral|limit)\s+(of\s+)?/i,  // Calculus terms
      /\b(is\s+equal\s+to|equals?)\b/i,  // "is equal to"
      /\b(greater\s+than|less\s+than|not\s+equal)\b/i,  // Comparison terms
      /\b(x|y|z|a|b|c|p|q)\s+(is|equals?)\s+/i,  // Variable assignments
      /\blet\s+[a-z]\s+(be|equal)/i,  // "let x be"
      /\b(coefficient|variable|constant)\b/i,  // Math terminology
      /\b(theorem|proof|lemma)\b/i,  // Mathematical concepts
      /\b\d+\s*(degree|percent|%)\b/i,  // Numbers with units

      // LaTeX-like patterns
      /\b[a-z]_\d+\b/i,  // Subscripts like x_1
      /\b[a-z]\^\d+\b/i,  // Superscripts like x^2
      /\\(frac|sqrt|sum|int|lim)/i,  // Common LaTeX commands

      // Mixed content with math elements
      /\b\d+[a-z]\b|\b[a-z]\d+\b/i,  // Mixed alphanumeric like 2x or x1
      /\([^)]*[\+\-\*\/\=][^)]*\)/,  // Math in parentheses
    ];

    // Check if content matches any math pattern
    const hasMatchingPattern = mathPatterns.some(pattern => pattern.test(cleanContent));

    // Also check for mathematical context keywords
    const mathKeywords = [
      'mathematics', 'algebra', 'geometry', 'calculus', 'trigonometry',
      'polynomial', 'quadratic', 'linear', 'exponential', 'logarithmic'
    ];
    const hasMapKeywords = mathKeywords.some(keyword => cleanContent.includes(keyword));

    return hasMatchingPattern || hasMapKeywords;
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
      // ENHANCED: Check for math content in both 'math' type items AND text items with math patterns
      const isMathContent = (item.type === 'math' && isValidMathContent(itemContent)) ||
                           (item.type === 'text' && isValidMathContent(itemContent));
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

    // POST-PROCESSING: Re-evaluate paragraph types after aggregation
    // This catches math content that spans multiple chunks (like "fraction p/q, where p and q are integers")
    aggregatedContent.forEach(paragraph => {
      if (paragraph.type === 'text' && isValidMathContent(paragraph.content)) {
        console.log('[TeachingBoardSimple] Converting text to math:', paragraph.content.substring(0, 50) + '...');
        paragraph.type = 'math';
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

            // SHOW-THEN-TELL: Visual content appears IMMEDIATELY
            // Audio will be delayed by 400ms in LiveKitRoom for proper show-then-tell methodology
            console.log('[TeachingBoardSimple] Processing items immediately for visual display');
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
      // Note: No timeout cleanup needed since visual displays immediately
    };
  }, [processBufferItems, sessionId]);

  // Enhanced math rendering with natural language preprocessing
  const renderMath = (content: string) => {
    try {
      // If content is already LaTeX, render directly
      if (content.includes('\\') || content.includes('$')) {
        return katex.renderToString(content, {
          displayMode: true,
          throwOnError: false,
          trust: true,
          strict: false
        });
      }

      // Convert natural language math to LaTeX
      let processedContent = content;

      // Convert common patterns to LaTeX
      processedContent = processedContent
        // Handle fractions like "fraction p/q" -> "\frac{p}{q}"
        .replace(/\bfraction\s+([a-z0-9]+)\s*\/\s*([a-z0-9]+)/gi, '\\frac{$1}{$2}')
        // Handle "square root of x" -> "\sqrt{x}"
        .replace(/\bsquare\s+root\s+of\s+([a-z0-9]+)/gi, '\\sqrt{$1}')
        // Handle "x squared" -> "x^2"
        .replace(/\b([a-z])\s+squared\b/gi, '$1^2')
        // Handle "x cubed" -> "x^3"
        .replace(/\b([a-z])\s+cubed\b/gi, '$1^3')
        // Handle "is equal to" -> "="
        .replace(/\bis\s+equal\s+to\b/gi, ' = ')
        // Handle "greater than" -> ">"
        .replace(/\bgreater\s+than\b/gi, ' > ')
        // Handle "less than" -> "<"
        .replace(/\bless\s+than\b/gi, ' < ');

      // If still no LaTeX detected after conversion, wrap in text mode
      if (!processedContent.includes('\\') && !processedContent.includes('^')) {
        // For pure text descriptions, render as formatted text with math styling
        return `<span class="font-mono text-lg bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">${processedContent}</span>`;
      }

      // Render the processed LaTeX
      return katex.renderToString(processedContent, {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false
      });
    } catch (error) {
      console.error('KaTeX rendering error for content:', content, error);
      // Fallback to styled text if KaTeX fails
      return `<span class="font-mono text-lg bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded text-blue-700 dark:text-blue-300">${content}</span>`;
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
          <h2 className={`text-2xl font-bold mb-4 text-primary overflow-wrap-anywhere word-break-break-word max-w-full ${
            isCurrentlySpoken ? 'bg-blue-50 dark:bg-blue-950/50 px-3 py-2 rounded-lg' : ''
          }`}>
            {item.content}
          </h2>
        );

      case 'text':
        return (
          <p className={`text-base leading-relaxed mb-3 overflow-wrap-anywhere word-break-break-word hyphens-auto max-w-full ${
            isCurrentlySpoken ? 'bg-blue-50 dark:bg-blue-950/50 px-3 py-2 rounded-lg' : ''
          }`}>
            {item.content}
          </p>
        );

      case 'math':
        return (
          <div className={`my-4 py-4 px-6 overflow-x-auto overflow-y-hidden max-w-full ${
            isCurrentlySpoken ? 'bg-blue-50 dark:bg-blue-950/50 rounded-lg' : ''
          }`}>
            <div
              className="katex-display text-center text-lg min-w-0"
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
            <p className="text-base overflow-wrap-anywhere word-break-break-word max-w-full">{item.content}</p>
          </div>
        );

      default:
        return <p className="text-base mb-3 overflow-wrap-anywhere word-break-break-word max-w-full">{item.content}</p>;
    }
  };

  return (
    <div className={`h-full bg-background ${className}`}>
      <ScrollArea ref={scrollAreaRef} className="h-full">
        <div className="px-6 pt-6 pb-24 max-w-4xl mx-auto overflow-hidden">
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
            <div className="space-y-2 overflow-x-hidden overflow-y-auto">
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