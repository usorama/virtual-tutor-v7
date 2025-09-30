/**
 * React Hook for Secure Session Storage
 *
 * Provides a useState-like API with automatic persistence to encrypted storage.
 * Handles SSR safety, automatic expiry, and error handling.
 *
 * @module useSecureStorage
 * @example
 * ```typescript
 * function MyComponent() {
 *   const [token, setToken, isLoading, error] = useSecureStorage(
 *     'csrf-token',
 *     null,
 *     { ttl: 3600, storage: 'session' }
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return <button onClick={() => setToken('new-token')}>Set Token</button>;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import {
  secureLocalStorage,
  secureSessionStorage,
  type StorageType
} from '@/lib/security/session-storage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for useSecureStorage hook
 */
export interface UseSecureStorageOptions {
  /** Time-to-live in seconds (optional) */
  readonly ttl?: number;
  /** Storage backend type (default: 'local') */
  readonly storage?: StorageType;
  /** Error callback for handling storage errors */
  readonly onError?: (error: Error) => void;
}

/**
 * Return type for useSecureStorage hook
 * Similar to useState but with loading and error states
 */
export type UseSecureStorageReturn<T> = readonly [
  value: T,
  setValue: (value: T | ((prev: T) => T)) => void,
  isLoading: boolean,
  error: Error | null
];

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * React hook for secure storage with encryption and expiry
 *
 * Features:
 * - Automatic persistence to encrypted storage
 * - SSR-safe (returns initial value on server)
 * - Loading state during initial hydration
 * - Error handling with callback
 * - Automatic expiry enforcement
 *
 * @param key - Storage key (namespaced automatically)
 * @param initialValue - Default value if not in storage
 * @param options - Configuration options
 * @returns [value, setValue, isLoading, error] tuple
 *
 * @example
 * ```typescript
 * // Basic usage
 * const [name, setName] = useSecureStorage('user-name', 'Guest');
 *
 * // With TTL and error handling
 * const [token, setToken, isLoading, error] = useSecureStorage(
 *   'auth-token',
 *   null,
 *   {
 *     ttl: 3600,
 *     storage: 'session',
 *     onError: (err) => console.error('Storage error:', err)
 *   }
 * );
 * ```
 */
export function useSecureStorage<T>(
  key: string,
  initialValue: T,
  options: UseSecureStorageOptions = {}
): UseSecureStorageReturn<T> {
  const {
    ttl,
    storage = 'local',
    onError
  } = options;

  // Select storage instance based on type
  const storageInstance = storage === 'local'
    ? secureLocalStorage
    : secureSessionStorage;

  // State management
  const [state, setState] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial value from storage on mount
  useEffect(() => {
    let mounted = true;

    const loadValue = async () => {
      try {
        const stored = await storageInstance.getItem<T>(key);

        if (mounted) {
          // Use stored value if found, otherwise use initial value
          setState(stored ?? initialValue);
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          const errorObj = err as Error;
          setError(errorObj);
          setState(initialValue); // Fallback to initial value on error
          setIsLoading(false);
          onError?.(errorObj);
        }
      }
    };

    loadValue();

    // Cleanup: prevent state updates after unmount
    return () => {
      mounted = false;
    };
  }, [key, initialValue, storageInstance, onError]);

  // Persist value to storage (with support for function updates)
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Support functional updates like setState
        setState(prevState => {
          const nextState = value instanceof Function ? value(prevState) : value;

          // Async persist (don't block UI)
          storageInstance.setItem(key, nextState, ttl).catch(err => {
            const errorObj = err as Error;
            setError(errorObj);
            onError?.(errorObj);
          });

          return nextState;
        });
      } catch (err) {
        const errorObj = err as Error;
        setError(errorObj);
        onError?.(errorObj);
      }
    },
    [key, ttl, storageInstance, onError]
  );

  return [state, setValue, isLoading, error] as const;
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Convenience hook for secure localStorage
 *
 * @example
 * ```typescript
 * const [theme, setTheme] = useSecureLocalStorage('theme', 'light');
 * ```
 */
export function useSecureLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: Omit<UseSecureStorageOptions, 'storage'>
): UseSecureStorageReturn<T> {
  return useSecureStorage(key, initialValue, {
    ...options,
    storage: 'local'
  });
}

/**
 * Convenience hook for secure sessionStorage
 *
 * @example
 * ```typescript
 * const [token, setToken] = useSecureSessionStorage('csrf-token', null, {
 *   ttl: 3600
 * });
 * ```
 */
export function useSecureSessionStorage<T>(
  key: string,
  initialValue: T,
  options?: Omit<UseSecureStorageOptions, 'storage'>
): UseSecureStorageReturn<T> {
  return useSecureStorage(key, initialValue, {
    ...options,
    storage: 'session'
  });
}

// ============================================================================
// USAGE EXAMPLES (In Comments)
// ============================================================================

/**
 * EXAMPLE 1: Simple user preferences
 *
 * ```typescript
 * function UserSettings() {
 *   const [fontSize, setFontSize] = useSecureLocalStorage('fontSize', 16);
 *
 *   return (
 *     <div>
 *       <p style={{ fontSize: `${fontSize}px` }}>Sample text</p>
 *       <button onClick={() => setFontSize(size => size + 2)}>
 *         Increase Font
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * EXAMPLE 2: CSRF token with expiry
 *
 * ```typescript
 * function ApiClient() {
 *   const [csrfToken, setCsrfToken, isLoading, error] = useSecureSessionStorage(
 *     'csrf-token',
 *     null,
 *     {
 *       ttl: 3600, // 1 hour
 *       onError: (err) => {
 *         console.error('CSRF token error:', err);
 *         // Re-fetch token
 *         fetchNewCsrfToken();
 *       }
 *     }
 *   );
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error loading token</div>;
 *
 *   return (
 *     <button onClick={() => makeApiCall(csrfToken)}>
 *       Make Request
 *     </button>
 *   );
 * }
 * ```
 *
 * EXAMPLE 3: Form state persistence
 *
 * ```typescript
 * function DraftEditor() {
 *   const [draft, setDraft] = useSecureLocalStorage(
 *     'editor-draft',
 *     { title: '', content: '' },
 *     { ttl: 86400 } // 24 hours
 *   );
 *
 *   return (
 *     <form>
 *       <input
 *         value={draft.title}
 *         onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
 *       />
 *       <textarea
 *         value={draft.content}
 *         onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
 *       />
 *     </form>
 *   );
 * }
 * ```
 */