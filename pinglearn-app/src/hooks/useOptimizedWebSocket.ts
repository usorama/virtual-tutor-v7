'use client';

/**
 * Optimized WebSocket Hook
 * SAFE ZONE - Performance optimization for WebSocket usage
 *
 * Provides efficient WebSocket connection management using protected core singleton
 * with intelligent connection pooling, message batching, and state optimization
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { WebSocketManager, ConnectionEvent } from '@/protected-core';

interface WebSocketState {
  isConnected: boolean;
  isReconnecting: boolean;
  latency: number;
  connectionAttempts: number;
  lastMessageTime: number;
}

interface UseOptimizedWebSocketOptions {
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Batch messages for better performance */
  enableBatching?: boolean;
  /** Batch interval in ms */
  batchInterval?: number;
  /** Maximum batch size */
  maxBatchSize?: number;
  /** Connection timeout */
  connectionTimeout?: number;
  /** Heartbeat interval */
  heartbeatInterval?: number;
}

interface WebSocketHookReturn {
  /** Current connection state */
  state: WebSocketState;
  /** Connect to WebSocket */
  connect: (url: string, protocols?: string[]) => Promise<void>;
  /** Disconnect from WebSocket */
  disconnect: () => void;
  /** Send message (optimized with batching) */
  sendMessage: (data: unknown) => void;
  /** Send message immediately (bypass batching) */
  sendImmediate: (data: unknown) => void;
  /** Subscribe to messages */
  onMessage: (handler: (data: unknown) => void) => () => void;
  /** Force reconnection */
  reconnect: () => void;
  /** Get connection performance metrics */
  getMetrics: () => {
    latency: number;
    messagesSent: number;
    messagesReceived: number;
    uptime: number;
  };
}

export function useOptimizedWebSocket(
  options: UseOptimizedWebSocketOptions = {}
): WebSocketHookReturn {
  const {
    autoConnect = false,
    enableBatching = true,
    batchInterval = 16, // ~60fps for smooth performance
    maxBatchSize = 10,
    connectionTimeout = 5000,
    heartbeatInterval = 30000
  } = options;

  // State management
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isReconnecting: false,
    latency: 0,
    connectionAttempts: 0,
    lastMessageTime: 0
  });

  // Refs for optimization
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const messageHandlersRef = useRef<Set<(data: unknown) => void>>(new Set());
  const messageBatchRef = useRef<unknown[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionStartTimeRef = useRef<number>(0);
  const metricsRef = useRef({
    messagesSent: 0,
    messagesReceived: 0,
    totalLatency: 0,
    latencyMeasurements: 0
  });

  // Memoized connection configuration
  const connectionConfig = useMemo(() => ({
    autoConnect,
    enableBatching,
    batchInterval,
    maxBatchSize,
    connectionTimeout,
    heartbeatInterval
  }), [autoConnect, enableBatching, batchInterval, maxBatchSize, connectionTimeout, heartbeatInterval]);

  // Initialize WebSocket manager
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/protected-core').then(({ WebSocketManager }) => {
        wsManagerRef.current = WebSocketManager.getInstance();
        setupEventListeners();
      });
    }

    return () => {
      cleanup();
    };
  }, []);

  // Setup event listeners for WebSocket events
  const setupEventListeners = useCallback(() => {
    if (!wsManagerRef.current) return;

    const manager = wsManagerRef.current;

    // Connection established
    const handleConnected = (event: ConnectionEvent) => {
      connectionStartTimeRef.current = Date.now();
      setState(prev => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        connectionAttempts: 0
      }));
      startHeartbeat();
    };

    // Connection lost
    const handleDisconnected = (event: ConnectionEvent) => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        lastMessageTime: Date.now()
      }));
      stopHeartbeat();
    };

    // Reconnection attempt
    const handleError = (event: ConnectionEvent) => {
      setState(prev => ({
        ...prev,
        isReconnecting: true,
        connectionAttempts: prev.connectionAttempts + 1
      }));
    };

    // Message received
    const handleMessage = (event: ConnectionEvent) => {
      setState(prev => ({
        ...prev,
        lastMessageTime: Date.now(),
        latency: manager.getLatency()
      }));

      metricsRef.current.messagesReceived++;

      // Update latency metrics
      const currentLatency = manager.getLatency();
      if (currentLatency > 0) {
        metricsRef.current.totalLatency += currentLatency;
        metricsRef.current.latencyMeasurements++;
      }

      // Notify all message handlers
      messageHandlersRef.current.forEach(handler => {
        try {
          handler(event.data);
        } catch (error) {
          console.error('WebSocket message handler error:', error);
        }
      });
    };

    // Attach event listeners
    manager.on('connected', handleConnected);
    manager.on('disconnected', handleDisconnected);
    manager.on('error', handleError);
    manager.on('message', handleMessage);

    return () => {
      manager.off('connected', handleConnected);
      manager.off('disconnected', handleDisconnected);
      manager.off('error', handleError);
      manager.off('message', handleMessage);
    };
  }, []);

  // Optimized connect function
  const connect = useCallback(async (url: string, protocols?: string[]) => {
    if (!wsManagerRef.current) {
      throw new Error('WebSocket manager not initialized');
    }

    setState(prev => ({ ...prev, isReconnecting: true }));

    try {
      await wsManagerRef.current.connect(url, protocols);
    } catch (error) {
      setState(prev => ({ ...prev, isReconnecting: false }));
      throw error;
    }
  }, []);

  // Optimized disconnect function
  const disconnect = useCallback(() => {
    if (wsManagerRef.current) {
      wsManagerRef.current.disconnect();
    }
    stopHeartbeat();
    flushMessageBatch(); // Send any pending messages before disconnect
  }, []);

  // Batch message processing for performance
  const processBatch = useCallback(() => {
    if (messageBatchRef.current.length === 0 || !wsManagerRef.current?.isConnected()) {
      return;
    }

    try {
      // Send batched messages as array for efficiency
      const batch = [...messageBatchRef.current];
      messageBatchRef.current = [];

      wsManagerRef.current.send({
        type: 'batch',
        messages: batch,
        timestamp: Date.now()
      });

      metricsRef.current.messagesSent += batch.length;
    } catch (error) {
      console.error('Failed to send message batch:', error);
    }

    batchTimeoutRef.current = null;
  }, []);

  // Flush batch immediately
  const flushMessageBatch = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    processBatch();
  }, [processBatch]);

  // Optimized send message with batching
  const sendMessage = useCallback((data: unknown) => {
    if (!wsManagerRef.current?.isConnected()) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    if (enableBatching) {
      messageBatchRef.current.push(data);

      // Auto-flush if batch is full
      if (messageBatchRef.current.length >= maxBatchSize) {
        flushMessageBatch();
        return;
      }

      // Schedule batch processing
      if (!batchTimeoutRef.current) {
        batchTimeoutRef.current = setTimeout(processBatch, batchInterval);
      }
    } else {
      // Send immediately without batching
      sendImmediate(data);
    }
  }, [enableBatching, maxBatchSize, batchInterval, processBatch, flushMessageBatch]);

  // Send message immediately (bypass batching)
  const sendImmediate = useCallback((data: unknown) => {
    if (!wsManagerRef.current?.isConnected()) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    try {
      wsManagerRef.current.send(data);
      metricsRef.current.messagesSent++;
    } catch (error) {
      console.error('Failed to send immediate message:', error);
    }
  }, []);

  // Subscribe to messages
  const onMessage = useCallback((handler: (data: unknown) => void): () => void => {
    messageHandlersRef.current.add(handler);

    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Force reconnection
  const reconnect = useCallback(() => {
    if (wsManagerRef.current) {
      wsManagerRef.current.forceReconnect();
    }
  }, []);

  // Get performance metrics
  const getMetrics = useCallback(() => {
    const uptime = connectionStartTimeRef.current > 0
      ? Date.now() - connectionStartTimeRef.current
      : 0;

    const averageLatency = metricsRef.current.latencyMeasurements > 0
      ? metricsRef.current.totalLatency / metricsRef.current.latencyMeasurements
      : 0;

    return {
      latency: averageLatency,
      messagesSent: metricsRef.current.messagesSent,
      messagesReceived: metricsRef.current.messagesReceived,
      uptime
    };
  }, []);

  // Heartbeat management
  const startHeartbeat = useCallback(() => {
    stopHeartbeat();

    heartbeatTimeoutRef.current = setInterval(() => {
      if (wsManagerRef.current?.isConnected()) {
        sendImmediate({ type: 'heartbeat', timestamp: Date.now() });
      }
    }, heartbeatInterval);
  }, [heartbeatInterval, sendImmediate]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    stopHeartbeat();
    flushMessageBatch();
    messageHandlersRef.current.clear();

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, [stopHeartbeat, flushMessageBatch]);

  return {
    state,
    connect,
    disconnect,
    sendMessage,
    sendImmediate,
    onMessage,
    reconnect,
    getMetrics
  };
}

/**
 * Hook for optimized WebSocket connection with DisplayBuffer integration
 * Specifically designed for transcription systems
 */
export function useTranscriptionWebSocket(options: UseOptimizedWebSocketOptions = {}) {
  const webSocket = useOptimizedWebSocket({
    enableBatching: true,
    batchInterval: 16, // 60fps for smooth transcription
    maxBatchSize: 5, // Small batches for low latency
    heartbeatInterval: 30000,
    ...options
  });

  // Transcription-specific message handling
  const sendTranscriptionUpdate = useCallback((text: string, type: 'interim' | 'final' = 'interim') => {
    webSocket.sendMessage({
      type: 'transcription',
      content: text,
      transcriptionType: type,
      timestamp: Date.now()
    });
  }, [webSocket]);

  const sendMathDetection = useCallback((latex: string, confidence: number) => {
    webSocket.sendMessage({
      type: 'math',
      content: latex,
      confidence,
      timestamp: Date.now()
    });
  }, [webSocket]);

  return {
    ...webSocket,
    sendTranscriptionUpdate,
    sendMathDetection
  };
}