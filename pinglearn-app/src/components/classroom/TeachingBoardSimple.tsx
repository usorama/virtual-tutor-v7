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
  const lastItemCountRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);
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
      } else if (content.length < 60 && /^[A-Z]/.test(content) && !/[.!?]$/.test(content)) {
        contentType = 'heading';
      }
    }

    return {
      id: item.id,
      type: contentType,
      content: item.content,
      timestamp: item.timestamp,
      highlight: Date.now() - item.timestamp < 3000
    };
  }, [isValidMathContent]);

  // Check for updates
  const checkForUpdates = useCallback(() => {
    try {
      if (!displayBufferRef.current) {
        setError('Display buffer not initialized');
        return;
      }

      const items = displayBufferRef.current.getItems() as LiveDisplayItem[];
      const currentItemCount = items.length;

      if (currentItemCount !== lastItemCountRef.current ||
          (items.length > 0 && items[items.length - 1].timestamp > lastUpdateTimeRef.current)) {

        const teachingContent: TeachingContent[] = [];
        items.forEach(item => {
          const converted = convertToTeachingContent(item);
          if (converted) {
            teachingContent.push(converted);
          }
        });

        setContent(teachingContent);
        lastItemCountRef.current = currentItemCount;
        lastUpdateTimeRef.current = Date.now();
        setError(null);
        setIsLoading(false);

        // Auto scroll
        if (scrollAreaRef.current && teachingContent.length > 0) {
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
      }
    } catch (err) {
      console.error('Error updating teaching board:', err);
      setError('Failed to update teaching board');
      setIsLoading(false);
    }
  }, [convertToTeachingContent]);

  // Initialize display buffer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoading(true);
      import('@/protected-core').then(({ getDisplayBuffer }) => {
        try {
          displayBufferRef.current = getDisplayBuffer();
          checkForUpdates();
          const updateInterval = setInterval(checkForUpdates, 250);
          const highlightInterval = setInterval(() => {
            setHighlightTrigger(prev => prev + 1);
          }, 1000);

          return () => {
            clearInterval(updateInterval);
            clearInterval(highlightInterval);
          };
        } catch (err) {
          console.error('Failed to initialize display buffer:', err);
          setError('Failed to initialize teaching board');
          setIsLoading(false);
        }
      });
    }
  }, [sessionId, checkForUpdates]);

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