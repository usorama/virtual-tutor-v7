import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock global objects that are not available in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Canvas API for tldraw testing
HTMLCanvasElement.prototype.getContext = vi.fn()

// Mock WebSocket for Deepgram testing
const mockWebSocketInstance = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}

// @ts-ignore - Mock WebSocket constructor with static constants
global.WebSocket = vi.fn().mockImplementation(() => mockWebSocketInstance) as any
// Add static constants
Object.assign(global.WebSocket, {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
})

// Mock MediaDevices for audio testing
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(),
  },
})

// Mock performance.now for performance testing
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
  },
})

// Extend expect with performance matchers
expect.extend({
  toExecuteWithin(received: () => Promise<any> | any, expectedTime: number) {
    const start = performance.now()

    try {
      const result = typeof received === 'function' ? received() : received

      if (result instanceof Promise) {
        return result.then(() => {
          const duration = performance.now() - start
          return {
            pass: duration <= expectedTime,
            message: () =>
              `Expected execution to complete within ${expectedTime}ms, but took ${duration}ms`
          }
        })
      } else {
        const duration = performance.now() - start
        return {
          pass: duration <= expectedTime,
          message: () =>
            `Expected execution to complete within ${expectedTime}ms, but took ${duration}ms`
        }
      }
    } catch (error) {
      return {
        pass: false,
        message: () => `Execution failed: ${error}`
      }
    }
  }
})

// Type augmentation for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toExecuteWithin(expectedTime: number): T
  }
}