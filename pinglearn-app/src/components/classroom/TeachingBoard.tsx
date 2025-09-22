'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronDown } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const userScrollingRef = useRef<boolean>(false);

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

  // Initialize with sample content for now
  useEffect(() => {
    // Sample content to demonstrate the layout
    const sampleContent: TeachingContent[] = [
      {
        id: '1',
        type: 'heading',
        content: 'Quadratic Equations',
        timestamp: Date.now()
      },
      {
        id: '2',
        type: 'text',
        content: "Today we'll learn about solving quadratic equations using the quadratic formula.",
        timestamp: Date.now() + 1000
      },
      {
        id: '3',
        type: 'math',
        content: 'ax^2 + bx + c = 0',
        timestamp: Date.now() + 2000
      },
      {
        id: '4',
        type: 'text',
        content: 'The quadratic formula is:',
        timestamp: Date.now() + 3000
      },
      {
        id: '5',
        type: 'math',
        content: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        timestamp: Date.now() + 4000,
        highlight: true
      },
      {
        id: '6',
        type: 'step',
        content: "Step 1: Identify the coefficients a, b, and c",
        timestamp: Date.now() + 5000
      },
      {
        id: '7',
        type: 'step',
        content: "Step 2: Calculate the discriminant: b² - 4ac",
        timestamp: Date.now() + 6000
      },
      {
        id: '8',
        type: 'step',
        content: "Step 3: Apply the quadratic formula",
        timestamp: Date.now() + 7000
      }
    ];

    setContent(sampleContent);
  }, []);

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
            {content.length === 0 ? (
              <div className="text-center text-gray-500 py-16">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Lesson content will appear here</p>
                <p className="text-sm mt-2 opacity-75">
                  The AI teacher will display mathematical concepts and explanations
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