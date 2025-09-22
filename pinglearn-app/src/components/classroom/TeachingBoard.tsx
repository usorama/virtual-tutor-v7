'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronDown } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { DisplayBuffer } from '@/protected-core';

// Local DisplayItem interface that matches the actual DisplayBuffer implementation
// (The contract interface is more restrictive than the actual implementation)
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

interface TeachingBoardProps {
  sessionId?: string;
  topic: string;
  className?: string;
}

export function TeachingBoard({ sessionId, topic, className = '' }: TeachingBoardProps) {
  const [content, setContent] = useState<TeachingContent[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const userScrollingRef = useRef<boolean>(false);
  const displayBufferRef = useRef<DisplayBuffer | null>(null);
  const lastItemCountRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert LiveDisplayItem to TeachingContent with smart type mapping
  const convertDisplayItemToTeachingContent = useCallback((item: LiveDisplayItem): TeachingContent | null => {
    // Only include teacher and AI content (filter out student responses)
    if (item.speaker !== 'teacher' && item.speaker !== 'ai') {
      return null;
    }

    let contentType: TeachingContent['type'] = 'text';

    // Smart type mapping based on content analysis
    if (item.type === 'math') {
      contentType = 'math';
    } else if (item.type === 'diagram') {
      contentType = 'diagram';
    } else {
      // Analyze text content for better categorization
      const content = item.content.trim();

      // Detect steps (starts with "Step" or numbered patterns)
      if (/^(Step \d+|\d+\.|\d+\))/i.test(content)) {
        contentType = 'step';
      }
      // Detect headings (short text, often capitalized, no punctuation at end)
      else if (content.length < 60 && /^[A-Z]/.test(content) && !/[.!?]$/.test(content)) {
        contentType = 'heading';
      }
      // Everything else is text
      else {
        contentType = 'text';
      }
    }

    return {
      id: item.id,
      type: contentType,
      content: item.content,
      timestamp: item.timestamp,
      // Highlight recent items (within last 3 seconds)
      highlight: Date.now() - item.timestamp < 3000
    };
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (!autoScroll || userScrollingRef.current) return;

    const now = Date.now();
    if (now - lastScrollTime.current < 100) return; // Debounce
    lastScrollTime.current = now;

    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        requestAnimationFrame(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        });
      }
    }
  }, [autoScroll]);

  // Smart update function with error handling (following TranscriptionDisplay pattern)
  const checkForUpdates = useCallback(() => {
    try {
      if (!displayBufferRef.current) {
        setError('Display buffer not initialized');
        return;
      }

      const items = displayBufferRef.current.getItems() as LiveDisplayItem[];
      const currentItemCount = items.length;

      // Only update if:
      // 1. Item count changed (new items added)
      // 2. Last item timestamp is newer than our last update
      const shouldUpdate = currentItemCount !== lastItemCountRef.current ||
        (items.length > 0 && items[items.length - 1].timestamp > lastUpdateTimeRef.current);

      if (shouldUpdate) {
        // Convert and filter LiveDisplayItems to TeachingContent
        const teachingContent = items
          .map(convertDisplayItemToTeachingContent)
          .filter((item): item is TeachingContent => item !== null);

        setContent(teachingContent);
        lastItemCountRef.current = currentItemCount;
        lastUpdateTimeRef.current = Date.now();
        setError(null); // Clear any previous errors
        setIsLoading(false);

        // Only scroll if new content was added and auto-scroll is enabled
        if (teachingContent.length > 0) {
          scrollToBottom();
        }
      }
    } catch (err) {
      console.error('Error updating teaching board:', err);
      setError('Failed to update teaching board');
      setIsLoading(false);
    }
  }, [convertDisplayItemToTeachingContent, scrollToBottom]);

  // Handle user scrolling
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;

    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;

    if (!isAtBottom && autoScroll) {
      userScrollingRef.current = true;
      setTimeout(() => {
        userScrollingRef.current = false;
      }, 3000);
    }
  }, [autoScroll]);

  // Initialize display buffer and start polling for live data
  useEffect(() => {
    // Get display buffer instance from protected core
    if (typeof window !== 'undefined') {
      setIsLoading(true);
      import('@/protected-core').then(({ getDisplayBuffer }) => {
        try {
          displayBufferRef.current = getDisplayBuffer();

          // Initial load
          checkForUpdates();

          // Smart polling: 250ms interval (same as TranscriptionDisplay)
          const updateInterval = setInterval(checkForUpdates, 250);

          return () => {
            clearInterval(updateInterval);
            if (updateTimeoutRef.current) {
              clearTimeout(updateTimeoutRef.current);
            }
          };
        } catch (err) {
          console.error('Failed to initialize display buffer:', err);
          setError('Failed to initialize teaching board');
          setIsLoading(false);

          // Fallback to sample content on error
          const sampleContent: TeachingContent[] = [
            {
              id: 'sample-1',
              type: 'heading',
              content: 'Quadratic Equations',
              timestamp: Date.now()
            },
            {
              id: 'sample-2',
              type: 'text',
              content: "Today we'll learn about solving quadratic equations using the quadratic formula.",
              timestamp: Date.now() + 1000
            },
            {
              id: 'sample-3',
              type: 'math',
              content: 'ax^2 + bx + c = 0',
              timestamp: Date.now() + 2000
            },
            {
              id: 'sample-4',
              type: 'text',
              content: 'The quadratic formula is:',
              timestamp: Date.now() + 3000
            },
            {
              id: 'sample-5',
              type: 'math',
              content: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
              timestamp: Date.now() + 4000,
              highlight: true
            }
          ];
          setContent(sampleContent);
        }
      }).catch(err => {
        console.error('Failed to load protected core:', err);
        setError('Failed to load teaching services');
        setIsLoading(false);

        // Fallback to sample content on import error
        const sampleContent: TeachingContent[] = [
          {
            id: 'fallback-1',
            type: 'text',
            content: 'Teaching board initialized with sample content. Voice services may not be available.',
            timestamp: Date.now()
          }
        ];
        setContent(sampleContent);
      });
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [sessionId, checkForUpdates]);

  // Auto-scroll when new content is added
  useEffect(() => {
    if (content.length > 0) {
      scrollToBottom();
    }
  }, [content, scrollToBottom]);

  // Render math with KaTeX
  const renderMath = (latex: string, display: boolean = true) => {
    try {
      return katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        trust: true,
        strict: false,
        macros: {
          "\\pm": "\\pm",
          "\\sqrt": "\\sqrt",
          "\\frac": "\\frac"
        }
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return `<span class="text-red-500">[Math Error: ${latex}]</span>`;
    }
  };

  const renderContent = (item: TeachingContent) => {
    switch (item.type) {
      case 'heading':
        return (
          <h2 className="text-2xl font-bold mb-4 text-primary">{item.content}</h2>
        );

      case 'text':
        return (
          <p className="text-base leading-relaxed mb-3">{item.content}</p>
        );

      case 'math':
        return (
          <div
            className={`my-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 overflow-x-auto ${
              item.highlight ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950' : ''
            }`}
          >
            <div
              className="katex-display text-center"
              dangerouslySetInnerHTML={{ __html: renderMath(item.content) }}
            />
          </div>
        );

      case 'step':
        return (
          <div className="flex items-start space-x-3 mb-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
              ✓
            </div>
            <p className="text-base">{item.content}</p>
          </div>
        );

      case 'diagram':
        return (
          <div className="my-4 p-8 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-gray-500">[Diagram: {item.content}]</p>
          </div>
        );

      default:
        return <div>{item.content}</div>;
    }
  };

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">{topic}</CardTitle>
            <Badge variant="outline" className="text-xs">
              Teaching Board
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAutoScroll(true);
              userScrollingRef.current = false;
              scrollToBottom();
            }}
            className={`text-xs ${autoScroll && !userScrollingRef.current ? 'opacity-50' : ''}`}
          >
            <ChevronDown className="w-4 h-4 mr-1" />
            Scroll to Bottom
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea
          ref={scrollAreaRef}
          className="h-full"
          onScroll={handleScroll}
        >
          <div className="p-6">
            {error ? (
              <div className="text-center text-red-600 py-16">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Teaching Board Error</p>
                <p className="text-sm opacity-75 mb-4">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    checkForUpdates();
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : isLoading && content.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                <BookOpen className="w-12 h-12 mx-auto mb-4 animate-pulse opacity-50" />
                <p className="text-lg font-medium">Connecting to AI teacher...</p>
                <p className="text-sm mt-2 opacity-75">
                  Setting up voice transcription and math rendering
                </p>
              </div>
            ) : content.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Ready for lesson!</p>
                <p className="text-sm mt-2 opacity-75">
                  Mathematical concepts and explanations will appear here when the AI teacher starts speaking
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {content.map((item) => (
                  <div
                    key={item.id}
                    className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                  >
                    {renderContent(item)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}