/**
 * Tests for useSecureStorage React Hook
 *
 * Test suites:
 * 1. Basic Hook Tests - Verify core functionality
 * 2. Expiry Tests - Verify TTL enforcement
 * 3. Error Handling Tests - Verify error callbacks
 * 4. Loading State Tests - Verify async loading
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useSecureStorage,
  useSecureLocalStorage,
  useSecureSessionStorage
} from './useSecureStorage';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Clears all storage before each test
 */
function clearAllStorage() {
  localStorage.clear();
  sessionStorage.clear();
}

/**
 * Waits for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// BASIC HOOK TESTS
// ============================================================================

describe('useSecureStorage - Basic Functionality', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  it('should load initial value', () => {
    const { result } = renderHook(() =>
      useSecureStorage('test-key', 'initial-value')
    );

    const [value] = result.current;
    expect(value).toBe('initial-value');
  });

  it('should persist value on change', async () => {
    const { result } = renderHook(() =>
      useSecureStorage('persist-key', 'old-value')
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current[2]).toBe(false); // isLoading
    });

    // Update value
    act(() => {
      const [, setValue] = result.current;
      setValue('new-value');
    });

    // Wait for persistence
    await waitFor(() => {
      const [value] = result.current;
      expect(value).toBe('new-value');
    });

    // Verify persisted in storage
    const { result: result2 } = renderHook(() =>
      useSecureStorage('persist-key', 'default')
    );

    await waitFor(() => {
      const [value] = result2.current;
      expect(value).toBe('new-value');
    });
  });

  it('should support functional updates', async () => {
    const { result } = renderHook(() =>
      useSecureStorage('counter', 0)
    );

    await waitFor(() => {
      expect(result.current[2]).toBe(false);
    });

    // Functional update
    act(() => {
      const [, setValue] = result.current;
      setValue(prev => prev + 1);
    });

    await waitFor(() => {
      const [value] = result.current;
      expect(value).toBe(1);
    });

    // Another functional update
    act(() => {
      const [, setValue] = result.current;
      setValue(prev => prev + 5);
    });

    await waitFor(() => {
      const [value] = result.current;
      expect(value).toBe(6);
    });
  });

  it('should handle different data types', async () => {
    // String
    const { result: stringResult } = renderHook(() =>
      useSecureStorage('string-key', 'hello')
    );
    await waitFor(() => expect(stringResult.current[2]).toBe(false));
    expect(stringResult.current[0]).toBe('hello');

    // Number
    const { result: numberResult } = renderHook(() =>
      useSecureStorage('number-key', 42)
    );
    await waitFor(() => expect(numberResult.current[2]).toBe(false));
    expect(numberResult.current[0]).toBe(42);

    // Boolean
    const { result: boolResult } = renderHook(() =>
      useSecureStorage('bool-key', true)
    );
    await waitFor(() => expect(boolResult.current[2]).toBe(false));
    expect(boolResult.current[0]).toBe(true);

    // Object
    const testObj = { nested: { deep: 'value' } };
    const { result: objResult } = renderHook(() =>
      useSecureStorage('obj-key', testObj)
    );
    await waitFor(() => expect(objResult.current[2]).toBe(false));
    expect(objResult.current[0]).toEqual(testObj);

    // Array
    const testArray = [1, 2, 3, 4, 5];
    const { result: arrayResult } = renderHook(() =>
      useSecureStorage('array-key', testArray)
    );
    await waitFor(() => expect(arrayResult.current[2]).toBe(false));
    expect(arrayResult.current[0]).toEqual(testArray);
  });

  it('should sync across multiple hook instances', async () => {
    const { result: instance1 } = renderHook(() =>
      useSecureStorage('shared-key', 'initial')
    );

    await waitFor(() => {
      expect(instance1.current[2]).toBe(false);
    });

    // Update in instance1
    act(() => {
      const [, setValue] = instance1.current;
      setValue('updated');
    });

    await waitFor(() => {
      const [value] = instance1.current;
      expect(value).toBe('updated');
    });

    // Create second instance - should load updated value
    const { result: instance2 } = renderHook(() =>
      useSecureStorage('shared-key', 'initial')
    );

    await waitFor(() => {
      const [value, , isLoading] = instance2.current;
      expect(isLoading).toBe(false);
      expect(value).toBe('updated');
    });
  });
});

// ============================================================================
// EXPIRY TESTS
// ============================================================================

describe('useSecureStorage - Expiry', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  it('should respect TTL option', async () => {
    const { result } = renderHook(() =>
      useSecureStorage('expiring-key', 'value', { ttl: 1 }) // 1 second
    );

    await waitFor(() => {
      expect(result.current[2]).toBe(false);
    });

    // Should exist immediately
    expect(result.current[0]).toBe('value');

    // Wait for expiry
    await sleep(1100);

    // Create new instance - should return initial value (expired)
    const { result: result2 } = renderHook(() =>
      useSecureStorage('expiring-key', 'default', { ttl: 1 })
    );

    await waitFor(() => {
      const [value, , isLoading] = result2.current;
      expect(isLoading).toBe(false);
      expect(value).toBe('default'); // Falls back to initial
    });
  });

  it('should not expire items without TTL', async () => {
    const { result } = renderHook(() =>
      useSecureStorage('persistent-key', 'persistent')
    );

    await waitFor(() => {
      expect(result.current[2]).toBe(false);
    });

    // Wait some time
    await sleep(500);

    // Create new instance
    const { result: result2 } = renderHook(() =>
      useSecureStorage('persistent-key', 'default')
    );

    await waitFor(() => {
      const [value, , isLoading] = result2.current;
      expect(isLoading).toBe(false);
      expect(value).toBe('persistent'); // Still exists
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('useSecureStorage - Error Handling', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  it('should call onError callback on storage errors', async () => {
    const onError = vi.fn();

    // Mock setItem to throw error
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() =>
      useSecureStorage('error-key', 'value', { onError })
    );

    await waitFor(() => {
      expect(result.current[2]).toBe(false);
    });

    // Try to set value (should trigger error)
    act(() => {
      const [, setValue] = result.current;
      setValue('new-value');
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });

    // Restore original method
    Storage.prototype.setItem = originalSetItem;
  });

  it('should set error state on failures', async () => {
    // Inject corrupt data
    localStorage.setItem('pinglearn-secure:corrupt-key', 'invalid-json-{{{');

    const { result } = renderHook(() =>
      useSecureStorage('corrupt-key', 'default')
    );

    await waitFor(() => {
      const [, , , error] = result.current;
      expect(error).toBeTruthy();
    });
  });

  it('should fallback to initial value on error', async () => {
    localStorage.setItem('pinglearn-secure:corrupt-key', 'invalid-json-{{{');

    const { result } = renderHook(() =>
      useSecureStorage('corrupt-key', 'fallback-value')
    );

    await waitFor(() => {
      const [value, , isLoading] = result.current;
      expect(isLoading).toBe(false);
      expect(value).toBe('fallback-value');
    });
  });
});

// ============================================================================
// LOADING STATE TESTS
// ============================================================================

describe('useSecureStorage - Loading States', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  it('should show loading initially', () => {
    const { result } = renderHook(() =>
      useSecureStorage('loading-key', 'value')
    );

    const [, , isLoading] = result.current;
    expect(isLoading).toBe(true);
  });

  it('should set loading to false after load', async () => {
    const { result } = renderHook(() =>
      useSecureStorage('loading-key', 'value')
    );

    await waitFor(() => {
      const [, , isLoading] = result.current;
      expect(isLoading).toBe(false);
    });
  });

  it('should not block on setValue', async () => {
    const { result } = renderHook(() =>
      useSecureStorage('async-key', 'value')
    );

    await waitFor(() => {
      expect(result.current[2]).toBe(false);
    });

    // setValue should be synchronous
    const startTime = Date.now();
    act(() => {
      const [, setValue] = result.current;
      setValue('new-value');
    });
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(50); // Should be nearly instant
  });
});

// ============================================================================
// CONVENIENCE HOOKS TESTS
// ============================================================================

describe('useSecureStorage - Convenience Hooks', () => {
  beforeEach(() => {
    clearAllStorage();
  });

  it('should provide localStorage convenience hook', async () => {
    const { result } = renderHook(() =>
      useSecureLocalStorage('local-key', 'local-value')
    );

    await waitFor(() => {
      expect(result.current[2]).toBe(false);
    });

    expect(result.current[0]).toBe('local-value');
  });

  it('should provide sessionStorage convenience hook', async () => {
    const { result } = renderHook(() =>
      useSecureSessionStorage('session-key', 'session-value')
    );

    await waitFor(() => {
      expect(result.current[2]).toBe(false);
    });

    expect(result.current[0]).toBe('session-value');
  });

  it('should isolate localStorage and sessionStorage', async () => {
    const { result: localResult } = renderHook(() =>
      useSecureLocalStorage('shared-key', 'local-value')
    );

    const { result: sessionResult } = renderHook(() =>
      useSecureSessionStorage('shared-key', 'session-value')
    );

    await waitFor(() => {
      expect(localResult.current[2]).toBe(false);
      expect(sessionResult.current[2]).toBe(false);
    });

    expect(localResult.current[0]).toBe('local-value');
    expect(sessionResult.current[0]).toBe('session-value');
  });
});

// ============================================================================
// SSR SAFETY TESTS
// ============================================================================

describe('useSecureStorage - SSR Safety', () => {
  it('should not crash on server-side render', () => {
    // Simulate server environment
    const originalWindow = global.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window;

    expect(() => {
      renderHook(() => useSecureStorage('ssr-key', 'value'));
    }).not.toThrow();

    // Restore window
    global.window = originalWindow;
  });

  it('should return initial value on server', () => {
    const originalWindow = global.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window;

    const { result } = renderHook(() =>
      useSecureStorage('ssr-key', 'initial')
    );

    const [value] = result.current;
    expect(value).toBe('initial');

    global.window = originalWindow;
  });
});