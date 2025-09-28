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