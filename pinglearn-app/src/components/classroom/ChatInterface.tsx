'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';
import { useStreamingTranscript } from '@/hooks/useStreamingTranscript';
import type { DisplayItem } from '@/protected-core/contracts/transcription.contract';

interface ChatInterfaceProps {
  sessionId?: string;
  className?: string;
}

export const ChatInterface = React.memo(function ChatInterface({
  sessionId,
  className
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<DisplayItem[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Partial<DisplayItem> | null>(null);

  // Hook to handle streaming updates from DisplayBuffer
  const { messages: liveMessages, streamingContent } = useStreamingTranscript(sessionId);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  useEffect(() => {
    setMessages(liveMessages);
    scrollToBottom();
  }, [liveMessages, scrollToBottom]);

  useEffect(() => {
    setStreamingMessage(streamingContent);
  }, [streamingContent]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="p-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && !streamingMessage && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">Welcome to your AI Mathematics lesson! 👋</h2>
                <p className="text-base">I'm ready to help you learn. Feel free to ask questions anytime.</p>
              </div>
            </div>
          )}

          {/* Render completed messages */}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              enableWordTiming={!!message.wordTimings}
            />
          ))}

          {/* Render streaming message if exists */}
          {streamingMessage && (
            <StreamingMessage
              content={streamingMessage.content || ''}
              speaker={streamingMessage.speaker || 'teacher'}
              mathFragments={streamingMessage.mathFragments}
            />
          )}

          {/* Invisible anchor for auto-scroll */}
          <div />
        </div>
      </ScrollArea>
    </div>
  );
});