'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User } from 'lucide-react';
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

interface ChatMessage {
  id: string;
  type: 'text' | 'math' | 'heading' | 'step';
  content: string;
  timestamp: number;
  speaker: 'student' | 'teacher' | 'ai';
  isCurrentlySpoken?: boolean;
}

interface ChatInterfaceProps {
  sessionId?: string;
  className?: string;
}

export function ChatInterface({ sessionId, className = '' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  // Convert display items to chat messages
  const convertToChatMessage = useCallback((item: LiveDisplayItem): ChatMessage | null => {
    let messageType: ChatMessage['type'] = 'text';

    if (item.type === 'math' && isValidMathContent(item.content)) {
      messageType = 'math';
    } else if (item.speaker === 'teacher' || item.speaker === 'ai') {
      const content = item.content.trim();
      if (/^(Step \d+|\d+\.|\d+\))/i.test(content)) {
        messageType = 'step';
      } else if (content.length < 60 && /^[A-Z]/.test(content) && !/[.!?]$/.test(content)) {
        messageType = 'heading';
      }
    }

    return {
      id: item.id,
      type: messageType,
      content: item.content,
      timestamp: item.timestamp,
      speaker: item.speaker || 'ai',
      isCurrentlySpoken: Date.now() - item.timestamp < 5000
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

        const chatMessages: ChatMessage[] = [];
        items.forEach(item => {
          const converted = convertToChatMessage(item);
          if (converted) {
            chatMessages.push(converted);
          }
        });

        setMessages(chatMessages);
        lastItemCountRef.current = currentItemCount;
        lastUpdateTimeRef.current = Date.now();
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
      }
    } catch (err) {
      console.error('Error updating chat interface:', err);
      setError('Failed to update chat interface');
      setIsLoading(false);
    }
  }, [convertToChatMessage]);

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
          setError('Failed to initialize chat interface');
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

  // Format time
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group consecutive messages from same speaker
  const groupedMessages = messages.reduce((acc, message) => {
    const lastGroup = acc[acc.length - 1];

    if (lastGroup &&
        lastGroup.speaker === message.speaker &&
        message.timestamp - lastGroup.timestamp < 5000 &&
        lastGroup.type === 'text' && message.type === 'text') {
      // Add to existing group if same speaker and within 5 seconds
      lastGroup.content += ' ' + message.content;
      lastGroup.timestamp = message.timestamp; // Update to latest timestamp
    } else {
      // Create new group
      acc.push({
        ...message,
        groupId: `${message.speaker}-${message.timestamp}`,
      });
    }
    return acc;
  }, [] as (ChatMessage & { groupId: string })[]);

  // Render message content based on type
  const renderMessageContent = (message: ChatMessage) => {
    const now = Date.now();
    const timeSinceCreation = now - message.timestamp;
    const _ = highlightTrigger; // Force re-render for highlighting
    const isCurrentlySpoken = timeSinceCreation < 5000;

    switch (message.type) {
      case 'heading':
        return (
          <div className={`text-lg font-bold text-primary ${
            isCurrentlySpoken ? 'bg-blue-50 dark:bg-blue-950/50 px-3 py-2 rounded-lg' : ''
          }`}>
            {message.content}
          </div>
        );

      case 'math':
        return (
          <div className={`my-2 py-3 px-4 bg-gray-50 dark:bg-gray-900 rounded-lg ${
            isCurrentlySpoken ? 'ring-2 ring-blue-300 dark:ring-blue-700' : ''
          }`}>
            <div
              className="katex-display text-center"
              dangerouslySetInnerHTML={{ __html: renderMath(message.content) }}
            />
          </div>
        );

      case 'step':
        return (
          <div className={`flex items-start space-x-2 ${
            isCurrentlySpoken ? 'bg-green-50 dark:bg-green-950/50 px-3 py-2 rounded-lg' : ''
          }`}>
            <span className="text-green-600 font-bold mt-1">•</span>
            <div className="flex-1">{message.content}</div>
          </div>
        );

      default:
        return (
          <div className={`${
            isCurrentlySpoken ? 'bg-blue-50 dark:bg-blue-950/50 px-3 py-2 rounded-lg' : ''
          }`}>
            {message.content}
          </div>
        );
    }
  };

  return (
    <div className={`h-full bg-background flex flex-col ${className}`}>
      <div className="px-6 py-4 border-b bg-background/95 backdrop-blur">
        <h2 className="text-lg font-semibold">AI Learning Session</h2>
        <p className="text-sm text-muted-foreground">
          Interactive conversation with your AI math teacher
        </p>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1">
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
              {groupedMessages.map((message) => (
                <div
                  key={message.groupId || message.id}
                  className={`flex items-start space-x-3 animate-in fade-in-0 duration-300 ${
                    message.speaker === 'student' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.speaker === 'student'
                      ? 'bg-green-100 dark:bg-green-900'
                      : 'bg-blue-100 dark:bg-blue-900'
                  }`}>
                    {message.speaker === 'student' ? (
                      <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 max-w-[80%] ${
                    message.speaker === 'student' ? 'text-right' : 'text-left'
                  }`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {message.speaker === 'student' ? 'You' : 'AI Teacher'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>

                    <div className={`rounded-lg p-3 ${
                      message.speaker === 'student'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}>
                      {renderMessageContent(message)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}