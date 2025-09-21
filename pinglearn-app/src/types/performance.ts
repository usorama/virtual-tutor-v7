/**
 * Performance & Memory Type Definitions
 * Following 2025 TypeScript best practices - eliminating 'any' types
 * Based on research: Context7 + Web Search + Performance patterns
 */

export interface DisplayBufferItem {
  id: string;
  content: string;
  timestamp: number;
  type: 'text' | 'math' | 'audio';
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface MemoryEntry {
  key: string;
  data: unknown;
  size: number;
  accessed: number;
}

export interface BufferSubscription {
  id: string;
  callback: (items: DisplayBufferItem[]) => void;
  active: boolean;
}

export interface OptimizedBuffer {
  items: DisplayBufferItem[];
  maxSize: number;
  subscriptions: BufferSubscription[];
}

export interface TestPerformanceBuffer {
  items: DisplayBufferItem[];
  addItem(item: DisplayBufferItem): void;
  getItems(): DisplayBufferItem[];
  clear(): void;
  subscribe(callback: (items: DisplayBufferItem[]) => void): () => void;
}