'use client';

/**
 * Optimized Display Buffer Hook
 * SAFE ZONE - Performance optimization for DisplayBuffer usage
 *
 * Replaces inefficient polling with subscriber pattern from protected core
 * Provides intelligent buffer management and efficient data access
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { DisplayBuffer } from '@/protected-core';

// Local DisplayItem interface that matches protected core
interface DisplayItem {
  id: string;
  type: 'text' | 'math' | 'code' | 'diagram' | 'image';
  content: string;
  timestamp: number;
  speaker?: 'student' | 'teacher' | 'ai';
  rendered?: string;
  confidence?: number;
}

interface BufferState {
  items: DisplayItem[];
  totalItems: number;
  lastUpdateTime: number;
  hasNewContent: boolean;
  isBufferFull: boolean;
}

interface UseOptimizedDisplayBufferOptions {
  /** Maximum items to keep in local state (for virtual scrolling) */
  maxLocalItems?: number;
  /** Auto-scroll to new content */
  autoScroll?: boolean;
  /** Filter function for items */
  filter?: (item: DisplayItem) => boolean;
  /** Debounce update notifications */
  debounceMs?: number;
  /** Enable virtual scrolling optimization */
  enableVirtualization?: boolean;
  /** Window size for virtualization */
  virtualWindowSize?: number;
}

interface BufferHookReturn {
  /** Current buffer state */
  state: BufferState;
  /** All display items (respects maxLocalItems) */
  items: DisplayItem[];
  /** Add new item to buffer */
  addItem: (item: Omit<DisplayItem, 'id' | 'timestamp'>) => void;
  /** Clear the buffer */
  clearBuffer: () => void;
  /** Get filtered items */
  getFilteredItems: (filter: (item: DisplayItem) => boolean) => DisplayItem[];
  /** Get items by type */
  getItemsByType: (type: DisplayItem['type']) => DisplayItem[];
  /** Get items by speaker */
  getItemsBySpeaker: (speaker: DisplayItem['speaker']) => DisplayItem[];
  /** Get items in time range */
  getItemsInTimeRange: (startTime: number, endTime: number) => DisplayItem[];
  /** Mark content as seen (resets hasNewContent) */
  markContentSeen: () => void;
  /** Get buffer performance metrics */
  getMetrics: () => {
    totalItems: number;
    bufferSize: number;
    updateFrequency: number;
    averageItemAge: number;
  };
  /** Subscribe to real-time updates */
  onUpdate: (callback: (items: DisplayItem[]) => void) => () => void;
}

export function useOptimizedDisplayBuffer(
  options: UseOptimizedDisplayBufferOptions = {}
): BufferHookReturn {
  const {
    maxLocalItems = 100, // Limit local state for performance
    autoScroll = true,
    filter,
    debounceMs = 16, // ~60fps updates
    enableVirtualization = true,
    virtualWindowSize = 50
  } = options;

  // State management
  const [state, setState] = useState<BufferState>({
    items: [],
    totalItems: 0,
    lastUpdateTime: 0,
    hasNewContent: false,
    isBufferFull: false
  });

  // Refs for optimization
  const displayBufferRef = useRef<DisplayBuffer | null>(null);
  const subscribersRef = useRef<Set<(items: DisplayItem[]) => void>>(new Set());
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastItemCountRef = useRef<number>(0);
  const lastSeenTimestampRef = useRef<number>(0);
  const metricsRef = useRef({
    totalUpdates: 0,
    updateTimes: [] as number[],
    firstItemTime: 0
  });

  // Memoized filter function
  const memoizedFilter = useMemo(() => {
    return filter || (() => true);
  }, [filter]);

  // Initialize DisplayBuffer and set up subscriber
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/protected-core').then(({ getDisplayBuffer }) => {
        displayBufferRef.current = getDisplayBuffer();
        setupSubscription();
        // Initial load
        updateFromBuffer();
      });
    }

    return () => {
      cleanup();
    };
  }, []);

  // Set up real-time subscription to DisplayBuffer
  const setupSubscription = useCallback(() => {
    if (!displayBufferRef.current) return;

    // Use DisplayBuffer's built-in subscriber pattern instead of polling!
    const unsubscribe = displayBufferRef.current.subscribe((items: DisplayItem[]) => {
      debouncedUpdate(items);
    });

    return unsubscribe;
  }, []);

  // Debounced update function for smooth performance
  const debouncedUpdate = useCallback((items: DisplayItem[]) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      updateLocalState(items);
      notifySubscribers(items);
    }, debounceMs);
  }, [debounceMs]);

  // Efficient local state update
  const updateLocalState = useCallback((items: DisplayItem[]) => {
    const filteredItems = items.filter(memoizedFilter);
    const currentTime = Date.now();

    // Optimize for virtual scrolling - keep only recent items in state
    const localItems = enableVirtualization
      ? filteredItems.slice(-maxLocalItems)
      : filteredItems;

    // Check for new content
    const hasNewItems = items.length > lastItemCountRef.current;
    const latestItem = items[items.length - 1];
    const hasNewContent = hasNewItems &&
      latestItem &&
      latestItem.timestamp > lastSeenTimestampRef.current;

    setState(prev => ({
      ...prev,
      items: localItems,
      totalItems: items.length,
      lastUpdateTime: currentTime,
      hasNewContent: hasNewContent || prev.hasNewContent,
      isBufferFull: items.length >= 1000 // DisplayBuffer limit
    }));

    lastItemCountRef.current = items.length;

    // Update metrics
    metricsRef.current.totalUpdates++;
    metricsRef.current.updateTimes.push(currentTime);

    // Keep only recent update times for frequency calculation
    if (metricsRef.current.updateTimes.length > 100) {
      metricsRef.current.updateTimes = metricsRef.current.updateTimes.slice(-50);
    }

    if (items.length > 0 && metricsRef.current.firstItemTime === 0) {
      metricsRef.current.firstItemTime = items[0].timestamp;
    }
  }, [memoizedFilter, enableVirtualization, maxLocalItems]);

  // Update from buffer (for initial load and manual refresh)
  const updateFromBuffer = useCallback(() => {
    if (!displayBufferRef.current) return;

    const items = displayBufferRef.current.getItems();
    updateLocalState(items);
  }, [updateLocalState]);

  // Notify all subscribers
  const notifySubscribers = useCallback((items: DisplayItem[]) => {
    subscribersRef.current.forEach(callback => {
      try {
        callback(items);
      } catch (error) {
        console.error('DisplayBuffer subscriber error:', error);
      }
    });
  }, []);

  // Add new item to buffer
  const addItem = useCallback((item: Omit<DisplayItem, 'id' | 'timestamp'>) => {
    if (!displayBufferRef.current) return;

    displayBufferRef.current.addItem(item);
    // No need to manually update - subscription will handle it
  }, []);

  // Clear buffer
  const clearBuffer = useCallback(() => {
    if (!displayBufferRef.current) return;

    displayBufferRef.current.clearBuffer();
    lastSeenTimestampRef.current = Date.now();
  }, []);

  // Get filtered items (optimized with memoization)
  const getFilteredItems = useCallback((filterFn: (item: DisplayItem) => boolean) => {
    if (!displayBufferRef.current) return [];

    const allItems = displayBufferRef.current.getItems();
    return allItems.filter(filterFn);
  }, []);

  // Get items by type (using DisplayBuffer's optimized method)
  const getItemsByType = useCallback((type: DisplayItem['type']) => {
    if (!displayBufferRef.current) return [];

    return displayBufferRef.current.getItemsByType(type);
  }, []);

  // Get items by speaker (using DisplayBuffer's optimized method)
  const getItemsBySpeaker = useCallback((speaker: DisplayItem['speaker']) => {
    if (!displayBufferRef.current) return [];

    return displayBufferRef.current.getItemsBySpeaker(speaker);
  }, []);

  // Get items in time range (using DisplayBuffer's optimized method)
  const getItemsInTimeRange = useCallback((startTime: number, endTime: number) => {
    if (!displayBufferRef.current) return [];

    return displayBufferRef.current.getItemsInTimeRange(startTime, endTime);
  }, []);

  // Mark content as seen
  const markContentSeen = useCallback(() => {
    lastSeenTimestampRef.current = Date.now();
    setState(prev => ({
      ...prev,
      hasNewContent: false
    }));
  }, []);

  // Get performance metrics
  const getMetrics = useCallback(() => {
    const bufferSize = displayBufferRef.current?.getBufferSize() || 0;
    const updateTimes = metricsRef.current.updateTimes;

    let updateFrequency = 0;
    if (updateTimes.length > 1) {
      const timeSpan = updateTimes[updateTimes.length - 1] - updateTimes[0];
      updateFrequency = timeSpan > 0 ? (updateTimes.length - 1) / (timeSpan / 1000) : 0;
    }

    let averageItemAge = 0;
    if (state.items.length > 0 && metricsRef.current.firstItemTime > 0) {
      const totalAge = state.items.reduce((sum, item) => {
        return sum + (Date.now() - item.timestamp);
      }, 0);
      averageItemAge = totalAge / state.items.length;
    }

    return {
      totalItems: state.totalItems,
      bufferSize,
      updateFrequency: Math.round(updateFrequency * 100) / 100, // Round to 2 decimals
      averageItemAge: Math.round(averageItemAge / 1000) // Convert to seconds
    };
  }, [state.items, state.totalItems]);

  // Subscribe to real-time updates
  const onUpdate = useCallback((callback: (items: DisplayItem[]) => void): () => void => {
    subscribersRef.current.add(callback);

    // Send current items immediately
    callback(state.items);

    return () => {
      subscribersRef.current.delete(callback);
    };
  }, [state.items]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    subscribersRef.current.clear();
  }, []);

  return {
    state,
    items: state.items,
    addItem,
    clearBuffer,
    getFilteredItems,
    getItemsByType,
    getItemsBySpeaker,
    getItemsInTimeRange,
    markContentSeen,
    getMetrics,
    onUpdate
  };
}

/**
 * Specialized hook for math transcription optimization
 */
export function useMathTranscriptionBuffer(options: UseOptimizedDisplayBufferOptions = {}) {
  const bufferHook = useOptimizedDisplayBuffer({
    maxLocalItems: 50, // Math content is typically shorter
    debounceMs: 8, // Lower latency for math detection
    enableVirtualization: true,
    ...options
  });

  // Math-specific helpers
  const getMathItems = useCallback(() => {
    return bufferHook.getItemsByType('math');
  }, [bufferHook]);

  const getRecentMath = useCallback((timeWindowMs: number = 30000) => {
    const cutoffTime = Date.now() - timeWindowMs;
    return bufferHook.getItemsInTimeRange(cutoffTime, Date.now())
      .filter(item => item.type === 'math');
  }, [bufferHook]);

  const addMathItem = useCallback((latex: string, confidence: number = 1.0, speaker: DisplayItem['speaker'] = 'ai') => {
    bufferHook.addItem({
      type: 'math',
      content: latex,
      confidence,
      speaker
    });
  }, [bufferHook]);

  return {
    ...bufferHook,
    getMathItems,
    getRecentMath,
    addMathItem
  };
}

/**
 * Specialized hook for text transcription optimization
 */
export function useTextTranscriptionBuffer(options: UseOptimizedDisplayBufferOptions = {}) {
  const bufferHook = useOptimizedDisplayBuffer({
    maxLocalItems: 200, // Text content can be longer
    debounceMs: 16, // Standard 60fps updates
    enableVirtualization: true,
    ...options
  });

  // Text-specific helpers
  const getTextItems = useCallback(() => {
    return bufferHook.getItemsByType('text');
  }, [bufferHook]);

  const getTeacherContent = useCallback(() => {
    return bufferHook.getItemsBySpeaker('ai');
  }, [bufferHook]);

  const getStudentContent = useCallback(() => {
    return bufferHook.getItemsBySpeaker('student');
  }, [bufferHook]);

  const addTextItem = useCallback((content: string, speaker: DisplayItem['speaker'] = 'ai', confidence?: number) => {
    bufferHook.addItem({
      type: 'text',
      content,
      speaker,
      confidence
    });
  }, [bufferHook]);

  return {
    ...bufferHook,
    getTextItems,
    getTeacherContent,
    getStudentContent,
    addTextItem
  };
}