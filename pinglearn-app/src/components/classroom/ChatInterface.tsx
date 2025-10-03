'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import type { DisplayBuffer } from '@/protected-core';
import type { DisplayItem } from '@/protected-core';

interface ChatInterfaceProps {
  sessionId?: string;
  className?: string;
}

export function ChatInterface({ sessionId, className = '' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<DisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const displayBufferRef = useRef<DisplayBuffer | null>(null);

  // PC-015: Process buffer items with subscription callback
  const processBufferItems = useCallback((items: DisplayItem[]) => {
    // Filter for teacher/AI and student messages
    const chatMessages = items.filter(item =>
      item.speaker === 'teacher' ||
      item.speaker === 'student'
    );

    setMessages(chatMessages);
    setError(null);
    setIsLoading(false);

    // Auto scroll to bottom
    if (scrollAreaRef.current && chatMessages.length > 0) {
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
  }, []);

  // PC-015: Initialize display buffer with reactive subscription (no polling)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;

    setIsLoading(true);
    console.log('[ChatInterface] Initializing display buffer subscription');

    import('@/protected-core')
      .then(({ getDisplayBuffer }) => {
        try {
          const displayBuffer = getDisplayBuffer();
          displayBufferRef.current = displayBuffer;

          // Get initial items
          const initialItems = displayBuffer.getItems() as DisplayItem[];
          console.log('[ChatInterface] Initial items:', initialItems.length);
          processBufferItems(initialItems);

          // PC-015: Subscribe to future updates (reactive, no polling)
          unsubscribe = displayBuffer.subscribe((items) => {
            console.log('[ChatInterface] Buffer update received:', items.length, 'items');
            processBufferItems(items as DisplayItem[]);
          });

          console.log('[ChatInterface] Successfully subscribed to display buffer');
        } catch (err) {
          console.error('[ChatInterface] Failed to initialize display buffer:', err);
          setError('Failed to initialize chat');
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('[ChatInterface] Failed to import protected-core:', err);
        setError('Failed to load chat module');
        setIsLoading(false);
      });

    // PC-015: Cleanup subscription (no setInterval to clear)
    return () => {
      console.log('[ChatInterface] Cleaning up subscription');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [processBufferItems, sessionId]);

  return (
    <div className={`h-full bg-background flex flex-col ${className}`}>
      <ScrollArea ref={scrollAreaRef} className="flex-1 mt-2">
        <div className="p-6 space-y-4 max-w-4xl mx-auto">
          {error ? (
            <div className="text-center text-red-600 py-12">
              <p className="text-lg font-medium mb-2">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : isLoading && messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <Bot className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <p className="text-lg">Connecting to your AI teacher...</p>
              <p className="text-sm mt-2 opacity-75">
                Your conversation will appear here
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <Bot className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <p className="text-lg">Ready to start learning! 👋</p>
              <p className="text-sm mt-2 opacity-75">
                Begin speaking to start your interactive lesson
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  enableWordTiming={!!message.wordTimings && message.wordTimings.length > 0}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}