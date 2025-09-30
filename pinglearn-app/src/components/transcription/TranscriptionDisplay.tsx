'use client';

/**
 * Enhanced Transcription Display Component
 * Modern, accessible display for AI teacher transcription with enhanced UX
 * Features: Speaker avatars, timestamps, smooth scrolling, accessibility
 * OPTIMIZED: Smart polling, conditional scrolling, change detection
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { DisplayBuffer } from '@/protected-core';
import { MathRenderer } from './MathRenderer';
import { AudioIndicator } from './AudioIndicator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Bot, User, Clock, Pause, Play } from 'lucide-react';
import { sanitizeText, type SanitizationResult } from '@/lib/security/input-sanitization';

// Use local DisplayItem type that matches what DisplayBuffer returns
interface DisplayItem {
  id: string;
  type: 'text' | 'math' | 'code' | 'diagram' | 'image';
  content: string;
  timestamp: number;
  speaker?: 'student' | 'teacher' | 'ai';
  rendered?: string;
  confidence?: number;
}

interface TranscriptionDisplayProps {
  sessionId?: string;
  className?: string;
}

export function TranscriptionDisplay({ sessionId, className = '' }: TranscriptionDisplayProps) {
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const displayBufferRef = useRef<DisplayBuffer | null>(null);
  const lastItemCountRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserScrollingRef = useRef<boolean>(false);

  // Enhanced smooth scroll function with auto-scroll control
  const scrollToBottom = useCallback(() => {
    if (!autoScroll || isUserScrollingRef.current) return;

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }, 100); // Slightly longer debounce for smooth animation
  }, [autoScroll]);

  // Handle manual scrolling to detect user interaction
  const handleScroll = useCallback(() => {
    if (!scrollAreaRef.current) return;

    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;

    // If user scrolled away from bottom, disable auto-scroll temporarily
    if (!isAtBottom && autoScroll) {
      isUserScrollingRef.current = true;
      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 2000); // Re-enable auto-scroll after 2 seconds of no interaction
    }
  }, [autoScroll]);

  // Force scroll to bottom (for manual control)
  const forceScrollToBottom = useCallback(() => {
    setAutoScroll(true);
    isUserScrollingRef.current = false;
    scrollToBottom();
  }, [scrollToBottom]);

  // Enhanced smart update function with error handling
  const checkForUpdates = useCallback(() => {
    try {
      if (!displayBufferRef.current) {
        setError('Display buffer not initialized');
        return;
      }

      const items = displayBufferRef.current.getItems();
      const currentItemCount = items.length;

      // Only update if:
      // 1. Item count changed (new items added)
      // 2. Last item timestamp is newer than our last update
      const shouldUpdate = currentItemCount !== lastItemCountRef.current ||
        (items.length > 0 && items[items.length - 1].timestamp > lastUpdateTimeRef.current);

      if (shouldUpdate) {
        setDisplayItems(items);
        lastItemCountRef.current = currentItemCount;
        lastUpdateTimeRef.current = Date.now();
        setError(null); // Clear any previous errors
        setIsLoading(false);

        // Only scroll if new content was added and auto-scroll is enabled
        if (currentItemCount > 0) {
          scrollToBottom();
        }
      }
    } catch (err) {
      console.error('Error updating transcription display:', err);
      setError('Failed to update transcription display');
      setIsLoading(false);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    // Get display buffer instance from protected core
    if (typeof window !== 'undefined') {
      setIsLoading(true);
      import('@/protected-core').then(({ getDisplayBuffer }) => {
        try {
          displayBufferRef.current = getDisplayBuffer();

          // Initial load
          checkForUpdates();

          // Smart polling: Use longer intervals and smart checking
          const updateInterval = setInterval(checkForUpdates, 250);

          return () => {
            clearInterval(updateInterval);
            if (updateTimeoutRef.current) {
              clearTimeout(updateTimeoutRef.current);
            }
          };
        } catch (err) {
          console.error('Failed to initialize display buffer:', err);
          setError('Failed to initialize transcription display');
          setIsLoading(false);
        }
      }).catch(err => {
        console.error('Failed to load protected core:', err);
        setError('Failed to load transcription services');
        setIsLoading(false);
      });
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [sessionId, checkForUpdates]);

  if (error) {
    return (
      <Card className={`flex flex-col h-full ${className}`}>
        <CardContent className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-red-600">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Transcription Error</p>
            <p className="text-sm opacity-75">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                checkForUpdates();
              }}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col h-full ${className}`} role="log" aria-label="Transcription display">
      {/* Enhanced Header with Audio Indicator and Controls */}
      <CardHeader className="border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <AudioIndicator
            isActive={isTeacherSpeaking}
            label="AI Teacher"
          />
          <div className="flex items-center space-x-2">
            <Badge variant={isTeacherSpeaking ? "default" : "secondary"} className="text-xs">
              {isTeacherSpeaking ? 'Active' : 'Waiting'}
            </Badge>
            {displayItems.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {displayItems.length} message{displayItems.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Session Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTeacherSpeaking(!isTeacherSpeaking)}
              aria-label={isTeacherSpeaking ? 'Pause conversation' : 'Resume conversation'}
            >
              {isTeacherSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="ml-2">{isTeacherSpeaking ? 'Pause' : 'Resume'}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={forceScrollToBottom}
              disabled={autoScroll && !isUserScrollingRef.current}
              aria-label="Scroll to latest message"
              className="text-xs"
            >
              Scroll to Bottom
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Enhanced Main Transcription Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea
          ref={scrollAreaRef}
          className="h-full"
          onScroll={handleScroll}
        >
          <div className="p-6 space-y-4">
            {isLoading && displayItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8" role="status" aria-label="Loading transcription">
                <Bot className="w-12 h-12 mx-auto mb-4 animate-pulse opacity-50" />
                <p className="text-lg font-medium">Initializing transcription...</p>
                <p className="text-sm mt-2 opacity-75">Setting up AI teacher connection</p>
              </div>
            ) : displayItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8" role="status" aria-label="Ready to start">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Ready to start learning!</p>
                <p className="text-sm mt-2 opacity-75">The AI teacher will appear here when the session begins.</p>
              </div>
            ) : (
              <TranscriptionItems items={displayItems} />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Enhanced memoized list of transcription items with accessibility
 */
const TranscriptionItems = React.memo(({ items }: { items: DisplayItem[] }) => {
  return (
    <div role="log" aria-live="polite" aria-label="Conversation transcript">
      {items.map((item, index) => (
        <TranscriptionItem
          key={item.id}
          item={item}
          isLatest={index === items.length - 1}
        />
      ))}
    </div>
  );
});

TranscriptionItems.displayName = 'TranscriptionItems';

/**
 * Enhanced Individual Transcription Item with speaker avatars and timestamps
 */
const TranscriptionItem = React.memo(({ item, isLatest }: { item: DisplayItem; isLatest?: boolean }) => {
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    // Highlight new items briefly based on timestamp
    const isNew = Date.now() - item.timestamp < 500;
    if (isNew) {
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [item.timestamp]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Determine speaker info
  const getSpeakerInfo = (speaker?: string) => {
    switch (speaker) {
      case 'ai':
      case 'teacher':
        return {
          name: 'AI Teacher',
          avatar: <Bot className="w-4 h-4" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          avatarBg: 'bg-blue-500'
        };
      case 'student':
        return {
          name: 'You',
          avatar: <User className="w-4 h-4" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          avatarBg: 'bg-green-500'
        };
      default:
        return {
          name: 'System',
          avatar: <Bot className="w-4 h-4" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          avatarBg: 'bg-gray-500'
        };
    }
  };

  const speakerInfo = getSpeakerInfo(item.speaker);

  const renderContent = () => {
    switch (item.type) {
      case 'text': {
        // Sanitize text content to prevent XSS
        const sanitized = sanitizeText(item.content);

        // Log XSS attempts for security monitoring
        if (!sanitized.isClean) {
          console.warn('XSS attempt detected in transcription text', {
            threats: sanitized.threatsDetected,
            itemId: item.id,
            timestamp: item.timestamp
          });
        }

        return (
          <div className="text-sm leading-relaxed">
            {sanitized.sanitized}
          </div>
        );
      }

      case 'math':
        // Determine if it's inline or block based on content
        const isBlockMath = item.content.includes('\\\\') || item.content.length > 50;
        return (
          <div className={isBlockMath ? 'my-2' : 'inline-block'}>
            <MathRenderer
              latex={item.content}
              display={isBlockMath}
              highlighted={isHighlighted}
            />
          </div>
        );

      case 'code': {
        // Sanitize code content (escape HTML to prevent execution)
        const sanitizedCode = sanitizeText(item.content);

        if (!sanitizedCode.isClean) {
          console.warn('XSS attempt detected in transcription code', {
            threats: sanitizedCode.threatsDetected,
            itemId: item.id
          });
        }

        return (
          <pre className="p-3 bg-gray-900 text-gray-100 rounded-md overflow-x-auto text-xs">
            <code>{sanitizedCode.sanitized}</code>
          </pre>
        );
      }

      case 'diagram':
      case 'image': {
        // Sanitize display text for diagram/image labels
        const sanitizedLabel = sanitizeText(item.content);

        if (!sanitizedLabel.isClean) {
          console.warn('XSS attempt detected in transcription diagram/image', {
            threats: sanitizedLabel.threatsDetected,
            itemId: item.id,
            type: item.type
          });
        }

        return (
          <div className="p-3 bg-gray-100 rounded-md text-center text-gray-600 text-sm">
            <p>[{item.type}: {sanitizedLabel.sanitized}]</p>
          </div>
        );
      }

      default: {
        // Sanitize any fallback content
        const sanitizedDefault = sanitizeText(item.content);

        return (
          <div className="text-sm text-gray-600">
            {sanitizedDefault.sanitized}
          </div>
        );
      }
    }
  };

  return (
    <div
      className={`flex items-start space-x-3 p-4 rounded-lg transition-all duration-300 ${
        isHighlighted ? 'scale-[1.02] shadow-md' : ''
      } ${
        isLatest ? 'ring-2 ring-blue-200 ring-opacity-50' : ''
      } ${
        speakerInfo.bgColor
      } border ${speakerInfo.borderColor}`}
      role="article"
      aria-label={`Message from ${speakerInfo.name} at ${formatTimestamp(item.timestamp)}`}
    >
      {/* Speaker Avatar */}
      <div className={`w-8 h-8 flex-shrink-0 rounded-full ${speakerInfo.avatarBg} flex items-center justify-center text-white`}>
        {speakerInfo.avatar}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Speaker Name and Timestamp */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-700">
              {speakerInfo.name}
            </span>
            <Badge variant="outline" className="text-xs">
              {item.type}
            </Badge>
            {item.confidence && (
              <Badge
                variant={item.confidence > 0.8 ? "default" : "secondary"}
                className="text-xs"
              >
                {Math.round(item.confidence * 100)}%
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <time dateTime={new Date(item.timestamp).toISOString()}>
              {formatTimestamp(item.timestamp)}
            </time>
          </div>
        </div>

        {/* Message Content */}
        <div className="prose prose-sm max-w-none">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if item content, timestamp, or latest status changed
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.content === nextProps.item.content &&
    prevProps.item.timestamp === nextProps.item.timestamp &&
    prevProps.item.type === nextProps.item.type &&
    prevProps.item.speaker === nextProps.item.speaker &&
    prevProps.item.confidence === nextProps.item.confidence &&
    prevProps.isLatest === nextProps.isLatest
  );
});

TranscriptionItem.displayName = 'TranscriptionItem';