/**
 * Test Utilities - Helper Functions for Testing
 * TEST-001: Comprehensive test foundation
 */

import { vi } from 'vitest';
import type { MockedFunction } from 'vitest';

/**
 * Async wait utility for testing delays and timers
 */
export const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wait for next tick (useful for React state updates)
 */
export const waitForNextTick = (): Promise<void> =>
  new Promise(resolve => process.nextTick(resolve));

/**
 * Mock console methods with cleanup
 */
export function mockConsole() {
  const originalConsole = { ...console };
  const mockLog = vi.fn();
  const mockWarn = vi.fn();
  const mockError = vi.fn();

  console.log = mockLog;
  console.warn = mockWarn;
  console.error = mockError;

  return {
    log: mockLog,
    warn: mockWarn,
    error: mockError,
    restore: () => {
      Object.assign(console, originalConsole);
    }
  };
}

/**
 * Mock fetch with customizable responses
 */
export function mockFetch(response: any, status: number = 200) {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
    headers: new Headers(),
    statusText: status === 200 ? 'OK' : 'Error'
  });

  global.fetch = mockFetch;
  return mockFetch;
}

/**
 * Mock localStorage for browser API tests
 */
export function mockLocalStorage() {
  const storage: Record<string, string> = {};

  const mockStorage = {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    length: 0,
    key: vi.fn()
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true
  });

  return mockStorage;
}

/**
 * Mock WebSocket for connection tests
 */
export function mockWebSocket() {
  const mockWS = {
    readyState: WebSocket.CONNECTING,
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null
  };

  // Create a proper WebSocket constructor mock with correct typing
  const WebSocketMock = vi.fn().mockImplementation(() => mockWS) as unknown as {
    new (url: string | URL, protocols?: string | string[]): WebSocket;
    prototype: WebSocket;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSING: 2;
    readonly CLOSED: 3;
  };

  // Add static properties
  (WebSocketMock as any).CONNECTING = 0;
  (WebSocketMock as any).OPEN = 1;
  (WebSocketMock as any).CLOSING = 2;
  (WebSocketMock as any).CLOSED = 3;

  global.WebSocket = WebSocketMock;

  return mockWS;
}

/**
 * Mock Audio API for voice tests
 */
export function mockAudioAPI() {
  const mockAudioContext = {
    createMediaStreamSource: vi.fn(),
    createAnalyser: vi.fn(),
    createGain: vi.fn(),
    close: vi.fn(),
    state: 'running',
    sampleRate: 44100
  };

  const mockMediaRecorder = {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    state: 'inactive' as RecordingState,
    ondataavailable: null,
    onstop: null,
    onerror: null
  };

  // Create proper MediaRecorder constructor mock with correct typing
  const MediaRecorderMock = vi.fn().mockImplementation(() => mockMediaRecorder) as unknown as {
    new (stream: MediaStream, options?: MediaRecorderOptions): MediaRecorder;
    prototype: MediaRecorder;
    isTypeSupported(type: string): boolean;
  };

  // Add static method
  (MediaRecorderMock as any).isTypeSupported = vi.fn().mockReturnValue(true);

  global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext);
  global.MediaRecorder = MediaRecorderMock;

  return { mockAudioContext, mockMediaRecorder };
}

/**
 * Mock DOM APIs for component tests
 */
export function mockDOMAPIs() {
  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // Mock scrollTo
  window.scrollTo = vi.fn();

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Enhanced error boundary test helper
 */
export function triggerErrorBoundary(component: any, error: Error) {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

  try {
    throw error;
  } catch (e) {
    // Simulate React error boundary trigger
    component.componentDidCatch?.(e, { componentStack: 'test-stack' });
  } finally {
    spy.mockRestore();
  }
}

/**
 * Mock protected core services for integration tests
 */
export function mockProtectedCoreServices() {
  const mockVoiceService = {
    initialize: vi.fn().mockResolvedValue(undefined),
    startSession: vi.fn().mockResolvedValue('test-session-id'),
    endSession: vi.fn().mockResolvedValue(undefined),
    sendAudio: vi.fn().mockResolvedValue(undefined),
    getConnectionState: vi.fn().mockReturnValue('connected'),
    getSession: vi.fn().mockReturnValue(null),
    cleanup: vi.fn().mockResolvedValue(undefined)
  };

  const mockTranscriptionService = {
    processTranscription: vi.fn(),
    renderMath: vi.fn().mockReturnValue('<span class="katex">test</span>'),
    detectMath: vi.fn().mockReturnValue([]),
    getDisplayBuffer: vi.fn().mockReturnValue([]),
    clearBuffer: vi.fn(),
    addToBuffer: vi.fn(),
    getBufferSize: vi.fn().mockReturnValue(0)
  };

  const mockSessionOrchestrator = {
    getInstance: vi.fn().mockReturnValue({
      startSession: vi.fn().mockResolvedValue('test-session'),
      endSession: vi.fn().mockResolvedValue(undefined),
      getSessionState: vi.fn().mockReturnValue(null)
    })
  };

  return {
    mockVoiceService,
    mockTranscriptionService,
    mockSessionOrchestrator
  };
}

/**
 * Create a test environment with common mocks
 */
export function createTestEnvironment() {
  const mocks = {
    console: mockConsole(),
    localStorage: mockLocalStorage(),
    webSocket: mockWebSocket(),
    audio: mockAudioAPI(),
    protectedCore: mockProtectedCoreServices()
  };

  mockDOMAPIs();

  return {
    ...mocks,
    cleanup: () => {
      mocks.console.restore();
      vi.restoreAllMocks();
    }
  };
}

/**
 * Type-safe mock helper for functions
 */
export function mockFunction<T extends (...args: any[]) => any>(
  implementation?: T
): MockedFunction<T> {
  return vi.fn(implementation) as MockedFunction<T>;
}

/**
 * Advanced timer utilities for async testing
 */
export const timerUtils = {
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
  runAllTimers: () => vi.runAllTimers(),
  runOnlyPendingTimers: () => vi.runOnlyPendingTimers(),
  useFakeTimers: () => vi.useFakeTimers(),
  useRealTimers: () => vi.useRealTimers()
};

/**
 * File system mock for upload tests
 */
export function mockFileSystem() {
  const files: Record<string, string> = {};

  const mockFile = (name: string, content: string, type: string = 'text/plain') =>
    new File([content], name, { type });

  const mockFileList = (fileArray: File[]) => {
    const fileList = {
      length: fileArray.length,
      item: (index: number) => fileArray[index] || null,
      [Symbol.iterator]: () => fileArray[Symbol.iterator]()
    };

    // Add numeric indices
    fileArray.forEach((file, index) => {
      (fileList as any)[index] = file;
    });

    return fileList as FileList;
  };

  return { mockFile, mockFileList, files };
}