import { useState, useEffect, useCallback, useRef } from 'react';
import type { DisplayItem } from '@/protected-core/contracts/transcription.contract';

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
  const lastProcessedRef = useRef<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const processDisplayBuffer = useCallback(() => {
    try {
      if (!displayBufferRef.current) {
        return;
      }

      const items = displayBufferRef.current.getItems() as DisplayItem[];

      if (items.length === 0) {
        setMessages([]);
        setStreamingContent(null);
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

      lastProcessedRef.current = items.length;
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error processing display buffer:', err);
      setError('Failed to process transcription data');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoading(true);

      // Dynamic import to avoid SSR issues
      import('@/protected-core').then(({ getDisplayBuffer }) => {
        try {
          displayBufferRef.current = getDisplayBuffer();

          // Process immediately
          processDisplayBuffer();

          // Set up polling interval for real-time updates
          pollIntervalRef.current = setInterval(processDisplayBuffer, 100);

        } catch (err) {
          console.error('Failed to initialize display buffer:', err);
          setError('Failed to connect to transcription service');
          setIsLoading(false);
        }
      }).catch((err) => {
        console.error('Failed to import protected core:', err);
        setError('Failed to load transcription service');
        setIsLoading(false);
      });
    }

    // Cleanup function
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [sessionId, processDisplayBuffer]);

  return {
    messages,
    streamingContent,
    isLoading,
    error
  };
}