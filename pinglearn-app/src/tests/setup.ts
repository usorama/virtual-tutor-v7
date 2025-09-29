import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables for Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Mock Supabase client factory
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    // Mock realtime functionality
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnValue({
              subscribe: vi.fn()
            })
          })
        })
      })
    }),
    removeChannel: vi.fn(),
  })),
}));

// Mock KaTeX
vi.mock('katex', () => ({
  renderToString: vi.fn((tex: string) => `<span class="katex">${tex}</span>`),
}));

// Mock Protected Core - Critical for TEST-002
vi.mock('@/protected-core', async () => {
  const {
    MockLiveKitVoiceService,
    MockTranscriptionService,
    MockSessionOrchestrator,
    MockWebSocketManager,
  } = await import('@/tests/mocks/protected-core');

  // Mock ExponentialBackoff class
  class MockExponentialBackoff {
    private baseDelay: number = 1000;
    private maxDelay: number = 30000;
    private multiplier: number = 2;
    private currentAttempt: number = 0;

    constructor(config?: { baseDelay?: number; maxDelay?: number; multiplier?: number }) {
      if (config?.baseDelay) this.baseDelay = config.baseDelay;
      if (config?.maxDelay) this.maxDelay = config.maxDelay;
      if (config?.multiplier) this.multiplier = config.multiplier;
    }

    calculateDelay(): number {
      const delay = Math.min(
        this.baseDelay * Math.pow(this.multiplier, this.currentAttempt),
        this.maxDelay
      );
      this.currentAttempt++;
      return delay;
    }

    reset(): void {
      this.currentAttempt = 0;
    }

    getAttemptCount(): number {
      return this.currentAttempt;
    }
  }

  return {
    // Mock classes and functions
    WebSocketManager: {
      getInstance: vi.fn(() => MockWebSocketManager.getInstance()),
    },
    ExponentialBackoff: MockExponentialBackoff,
    WebSocketHealthMonitor: vi.fn(),
    LiveKitVoiceService: MockLiveKitVoiceService,
    AudioStreamManager: vi.fn(),
    AudioQualityMonitor: vi.fn(),
    LiveKitSessionManager: vi.fn(),
    AudioPipeline: vi.fn(),
    TextProcessor: vi.fn(),
    TextSegmentation: vi.fn(),
    TextNormalization: vi.fn(),
    BufferManager: vi.fn(),
    getTextProcessor: vi.fn(),
    resetTextProcessor: vi.fn(),
    DisplayBuffer: vi.fn(),
    getDisplayBuffer: vi.fn(() => ({
      getItems: vi.fn(() => []),
      addItem: vi.fn(),
      clear: vi.fn(),
      getSize: vi.fn(() => 0),
    })),
    resetDisplayBuffer: vi.fn(),
    DisplayFormatter: vi.fn(),
    TranscriptionService: MockTranscriptionService,
    SessionOrchestrator: {
      getInstance: vi.fn(() => MockSessionOrchestrator.getInstance()),
    },

    // Mock type exports (these don't need implementations)
    VoiceConfig: {},
    VoiceSession: {},
    VoiceServiceContract: {},
    ProcessedText: {},
    TextSegment: {},
    MathSegment: {},
    DisplayItem: {},
    WordTiming: {},
    MathFragmentData: {},
    TranscriptionContract: {},
    WebSocketConfig: {},
    WebSocketContract: {},
    ConnectionEvent: {},
    RetryConfig: {},
    RetryAttempt: {},
    HealthMetrics: {},
    PingResult: {},
    AudioConfig: {},
    AudioQualityMetrics: {},
    AudioPipelineConfig: {},
    AudioProcessingState: {},
    SessionMetrics: {},
    SessionError: {},
    ParticipantInfo: {},
    RecordingConfig: {},
    FormatterOptions: {},
    FormattedContent: {},
    SessionConfig: {},
    SessionState: {},
    SessionSummaryMetrics: {},
  };
});

// Global test utilities
declare global {
  var TestUtils: {
    createMockSession: () => any;
    createMockDisplayItem: (type?: string) => any;
    wait: (ms: number) => Promise<void>;
  };
}

globalThis.TestUtils = {
  createMockSession: () => ({
    id: 'test-session-' + Math.random().toString(36).substr(2, 9),
    sessionId: 'test-session-' + Math.random().toString(36).substr(2, 9),
    status: 'active',
    startedAt: new Date().toISOString(),
  }),

  createMockDisplayItem: (type = 'text') => ({
    id: Math.random().toString(36).substr(2, 9),
    type,
    content: type === 'math' ? 'x^2 + 5x + 6 = 0' : 'Test message',
    timestamp: Date.now(),
    speaker: 'teacher' as const,
  }),

  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};