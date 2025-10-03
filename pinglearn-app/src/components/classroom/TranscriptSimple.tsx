'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User } from 'lucide-react';
import type { DisplayBuffer } from '@/protected-core';

interface DisplayItem {
  id: string;
  type: 'text' | 'math' | 'code' | 'diagram' | 'image';
  content: string;
  timestamp: number;
  speaker?: 'student' | 'teacher' | 'ai';
  rendered?: string;
  confidence?: number;
}

interface TranscriptSimpleProps {
  sessionId?: string;
  className?: string;
}

export function TranscriptSimple({ sessionId, className = '' }: TranscriptSimpleProps) {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const displayBufferRef = useRef<DisplayBuffer | null>(null);

  // PC-015: Process buffer items with subscription callback
  const processBufferItems = useCallback((allItems: DisplayItem[]) => {
    setItems(allItems);
    setIsLoading(false);

    // Auto scroll to bottom
    if (scrollAreaRef.current) {
      const container = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (container) {
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, []);

  // PC-015: Initialize display buffer with reactive subscription (no polling)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;

    setIsLoading(true);
    console.log('[TranscriptSimple] Initializing display buffer subscription');

    import('@/protected-core')
      .then(({ getDisplayBuffer }) => {
        try {
          const displayBuffer = getDisplayBuffer();
          displayBufferRef.current = displayBuffer;

          // Get initial items
          const initialItems = displayBuffer.getItems() as DisplayItem[];
          console.log('[TranscriptSimple] Initial items:', initialItems.length);
          processBufferItems(initialItems);

          // PC-015: Subscribe to future updates (reactive, no polling)
          unsubscribe = displayBuffer.subscribe((items) => {
            console.log('[TranscriptSimple] Buffer update received:', items.length, 'items');
            processBufferItems(items as DisplayItem[]);
          });

          console.log('[TranscriptSimple] Successfully subscribed to display buffer');
        } catch (err) {
          console.error('[TranscriptSimple] Failed to initialize display buffer:', err);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('[TranscriptSimple] Failed to import protected-core:', err);
        setIsLoading(false);
      });

    // PC-015: Cleanup subscription (no setInterval to clear)
    return () => {
      console.log('[TranscriptSimple] Cleaning up subscription');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [processBufferItems, sessionId]);

  // Format time
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group consecutive items from same speaker into single messages
  const groupedItems = items.reduce((acc, item) => {
    const lastGroup = acc[acc.length - 1];

    if (lastGroup && lastGroup.speaker === item.speaker &&
        item.timestamp - lastGroup.timestamp < 5000) {
      // Add to existing group if same speaker and within 5 seconds
      lastGroup.content += ' ' + item.content;
      lastGroup.timestamp = item.timestamp; // Update to latest timestamp
    } else {
      // Create new group
      acc.push({
        ...item,
        groupId: `${item.speaker}-${item.timestamp}`,
        content: item.content
      });
    }
    return acc;
  }, [] as (DisplayItem & { groupId: string })[]);

  return (
    <div className={`h-full bg-background ${className}`}>
      <div className="px-4 py-2 border-b">
        <h3 className="text-sm font-medium">Transcript</h3>
      </div>

      <ScrollArea ref={scrollAreaRef} className="h-[calc(100%-40px)]">
        <div className="p-3 space-y-2">
          {isLoading && items.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              Conversation will appear here
            </p>
          ) : (
            groupedItems.map(item => (
              <div key={item.groupId} className="text-xs space-y-0.5">
                <div className="flex items-center space-x-1">
                  {item.speaker === 'student' ? (
                    <User className="w-3 h-3 text-green-600" />
                  ) : (
                    <Bot className="w-3 h-3 text-blue-600" />
                  )}
                  <span className="font-medium">
                    {item.speaker === 'student' ? 'You' : 'Teacher'}
                  </span>
                  <span className="text-gray-400 text-[10px]">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 break-words pl-4">
                  {item.content}
                </p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}