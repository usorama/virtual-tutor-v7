import { useState, useEffect, useCallback, useRef } from 'react';
import type { DisplayItem } from '@/protected-core';

interface UseStreamingTranscriptReturn {
  messages: DisplayItem[];
  streamingContent: Partial<DisplayItem> | null;
  isLoading: boolean;
  error: string | null;
}

export function useStreamingTranscript(sessionId?: string): UseStreamingTranscriptReturn {
  const [messages, setMessages] = useState<DisplayItem[]>([]);
  const [streamingContent, setStreamingContent] = useState<Partial<DisplayItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs for tracking state
  const displayBufferRef = useRef<any>(null);

  // PC-015: Process buffer items with subscription callback
  const processDisplayBuffer = useCallback((items: DisplayItem[]) => {
    if (items.length === 0) {
      setMessages([]);
      setStreamingContent(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Check if last item is still streaming (less than 500ms old)
    const lastItem = items[items.length - 1];
    const isStreaming = Date.now() - lastItem.timestamp < 500;

    if (isStreaming && items.length > 0) {
      // Set as streaming content, exclude from completed messages
      setStreamingContent(lastItem);
      setMessages(items.slice(0, -1));
    } else {
      // All messages are complete
      setStreamingContent(null);
      setMessages(items);
    }

    setError(null);
    setIsLoading(false);
  }, []);

  // PC-015: Initialize display buffer with reactive subscription (no polling)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;

    setIsLoading(true);
    console.log('[useStreamingTranscript] Initializing display buffer subscription');

    import('@/protected-core')
      .then(({ getDisplayBuffer }) => {
        try {
          const displayBuffer = getDisplayBuffer();
          displayBufferRef.current = displayBuffer;

          // Get initial items
          const initialItems = displayBuffer.getItems() as DisplayItem[];
          console.log('[useStreamingTranscript] Initial items:', initialItems.length);
          processDisplayBuffer(initialItems);

          // PC-015: Subscribe to future updates (reactive, no polling)
          unsubscribe = displayBuffer.subscribe((items) => {
            console.log('[useStreamingTranscript] Buffer update received:', items.length, 'items');
            processDisplayBuffer(items as DisplayItem[]);
          });

          console.log('[useStreamingTranscript] Successfully subscribed to display buffer');
        } catch (err) {
          console.error('[useStreamingTranscript] Failed to initialize display buffer:', err);
          setError('Failed to connect to transcription service');
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('[useStreamingTranscript] Failed to import protected core:', err);
        setError('Failed to load transcription service');
        setIsLoading(false);
      });

    // PC-015: Cleanup subscription (no setInterval to clear)
    return () => {
      console.log('[useStreamingTranscript] Cleaning up subscription');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [processDisplayBuffer, sessionId]);

  return {
    messages,
    streamingContent,
    isLoading,
    error
  };
}