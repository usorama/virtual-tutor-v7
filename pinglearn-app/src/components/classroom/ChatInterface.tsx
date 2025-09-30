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
  const lastItemCountRef = useRef<number>(0);

  // Check for updates from DisplayBuffer
  const checkForUpdates = useCallback(() => {
    try {
      if (!displayBufferRef.current) {
        setError('Display buffer not initialized');
        return;
      }

      const items = displayBufferRef.current.getItems() as DisplayItem[];
      const currentItemCount = items.length;

      if (currentItemCount !== lastItemCountRef.current) {
        // Filter for teacher/AI messages only
        const teacherMessages = items.filter(item =>
          item.speaker === 'teacher' ||
          item.speaker === 'student'
        );

        setMessages(teacherMessages);
        lastItemCountRef.current = currentItemCount;
        setError(null);
        setIsLoading(false);

        // Auto scroll to bottom
        if (scrollAreaRef.current && teacherMessages.length > 0) {
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
      console.error('Error updating chat interface:', err);
      setError('Failed to update chat interface');
      setIsLoading(false);
    }
  }, []);

  // Initialize display buffer and set up polling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoading(true);

      import('@/protected-core').then(({ getDisplayBuffer }) => {
        try {
          displayBufferRef.current = getDisplayBuffer();

          // Initial check
          checkForUpdates();

          // Poll for updates (100ms for smooth streaming as per FC-002 spec)
          const updateInterval = setInterval(checkForUpdates, 100);

          return () => {
            clearInterval(updateInterval);
          };
        } catch (err) {
          console.error('Failed to initialize display buffer:', err);
          setError('Failed to initialize chat');
          setIsLoading(false);
        }
      });
    }
  }, [sessionId, checkForUpdates]);

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