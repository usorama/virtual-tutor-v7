/**
 * Enhanced Generic Query Hook with Advanced TypeScript Patterns
 *
 * This hook demonstrates advanced TypeScript patterns including generic constraints,
 * conditional types, and sophisticated error handling for data fetching operations.
 *
 * Implements: TS-008 enhanced hooks with generic constraints
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  UseQueryOptions,
  UseQueryResult,
  DeepReadonly,
  AsyncResult,
  NonNullable as NonNull
} from '../types/advanced';

// =============================================================================
// QUERY KEY MANAGEMENT
// =============================================================================

/**
 * Query key factory with type safety
 */
export type QueryKeyFactory<TData, TVariables = void> = {
  all: readonly ['query', string];
  lists: (filters?: Partial<TVariables>) => readonly ['query', string, 'list', Partial<TVariables>?];
  list: (filters: Partial<TVariables>) => readonly ['query', string, 'list', Partial<TVariables>];
  details: () => readonly ['query', string, 'detail'];
  detail: (id: string) => readonly ['query', string, 'detail', string];
  mutation: (type: string) => readonly ['query', string, 'mutation', string];
};

/**
 * Create query key factory for a specific resource
 */
export function createQueryKeyFactory<TData, TVariables = void>(
  resource: string
): QueryKeyFactory<TData, TVariables> {
  return {
    all: ['query', resource] as const,
    lists: (filters) => ['query', resource, 'list', filters] as const,
    list: (filters) => ['query', resource, 'list', filters] as const,
    details: () => ['query', resource, 'detail'] as const,
    detail: (id) => ['query', resource, 'detail', id] as const,
    mutation: (type) => ['query', resource, 'mutation', type] as const,
  };
}

// =============================================================================
// ENHANCED QUERY HOOK
// =============================================================================

/**
 * Query function type with generic constraints
 */
export type QueryFunction<TData, TVariables = void> = TVariables extends void
  ? () => Promise<TData>
  : (variables: TVariables) => Promise<TData>;

/**
 * Query configuration with advanced options
 */
export interface QueryConfig<TData, TError = Error, TVariables = void>
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey'> {
  queryKey: readonly unknown[];
  queryFn: QueryFunction<TData, TVariables>;
  variables?: TVariables;
  initialData?: TData;
  placeholderData?: TData;
  keepPreviousData?: boolean;
  refetchOnMount?: boolean | 'always';
  refetchOnWindowFocus?: boolean | 'always';
  refetchOnReconnect?: boolean | 'always';
  refetchInterval?: number | false | ((data: TData | undefined, query: any) => number | false);
  refetchIntervalInBackground?: boolean;
  notifyOnChangeProps?: Array<keyof UseQueryResult<TData, TError>> | 'all';
  notifyOnChangePropsExclusions?: Array<keyof UseQueryResult<TData, TError>>;
  structuralSharing?: boolean | ((oldData: unknown, newData: unknown) => unknown);
}

/**
 * Enhanced query state with additional metadata
 */
interface EnhancedQueryState<TData, TError = Error> extends UseQueryResult<TData, TError> {
  // Additional state properties
  isInitialLoading: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;

  // Enhanced data properties
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  fetchStatus: 'fetching' | 'paused' | 'idle';

  // Query metadata
  queryKey: readonly unknown[];
  queryHash: string;

  // Enhanced methods
  invalidate: () => Promise<void>;
  prefetch: () => Promise<void>;
  cancel: () => void;
}

/**
 * Query cache for managing query state
 */
class QueryCache {
  private cache = new Map<string, any>();
  private subscribers = new Map<string, Set<(data: any) => void>>();

  get<T>(key: string): T | undefined {
    return this.cache.get(key);
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, data);
    this.notifySubscribers(key, data);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.notifySubscribers(key, undefined);
  }

  clear(): void {
    this.cache.clear();
    this.subscribers.clear();
  }

  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    const subscribers = this.subscribers.get(key)!;
    subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(key);
      }
    };
  }

  private notifySubscribers(key: string, data: any): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }
}

// Global query cache instance
const queryCache = new QueryCache();

/**
 * Enhanced generic query hook with advanced TypeScript patterns
 */
export function useGenericQuery<
  TData,
  TError = Error,
  TVariables = void,
  TSelected = TData
>(
  config: QueryConfig<TData, TError, TVariables> & {
    select?: (data: TData) => TSelected;
  }
): EnhancedQueryState<TSelected, TError> {
  const {
    queryKey,
    queryFn,
    variables,
    select,
    enabled = true,
    staleTime = 0,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retry = 3,
    retryDelay = 1000,
    refetchOnMount = true,
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    refetchInterval = false,
    onSuccess,
    onError,
    onSettled,
    initialData,
    placeholderData,
    keepPreviousData = false,
    suspense = false,
    useErrorBoundary = false,
  } = config;

  // Generate stable query hash
  const queryHash = JSON.stringify(queryKey);

  // State management
  const [state, setState] = useState<{
    data: TSelected | undefined;
    error: TError | null;
    status: 'idle' | 'loading' | 'error' | 'success';
    fetchStatus: 'fetching' | 'paused' | 'idle';
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    isIdle: boolean;
    dataUpdatedAt: number;
    errorUpdatedAt: number;
    failureCount: number;
  }>(() => {
    const cachedData = queryCache.get<TData>(queryHash);
    const processedData = cachedData && select ? select(cachedData) : cachedData;

    return {
      data: (processedData || (initialData && select ? select(initialData) : initialData)) as TSelected | undefined,
      error: null,
      status: cachedData ? 'success' : 'idle',
      fetchStatus: 'idle',
      isLoading: !cachedData && enabled,
      isError: false,
      isSuccess: !!cachedData,
      isIdle: !cachedData && !enabled,
      dataUpdatedAt: cachedData ? Date.now() : 0,
      errorUpdatedAt: 0,
      failureCount: 0,
    };
  });

  // Refs for stable references
  const queryFnRef = useRef(queryFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onSettledRef = useRef(onSettled);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update refs
  queryFnRef.current = queryFn;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onSettledRef.current = onSettled;

  // Execute query function with error handling and retry logic
  const executeQuery = useCallback(async (
    currentVariables?: TVariables,
    options: { isRefetch?: boolean; isRetry?: boolean } = {}
  ): Promise<void> => {
    if (!enabled) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      fetchStatus: 'fetching',
      isLoading: prev.status === 'idle' || !prev.data,
      error: options.isRetry ? prev.error : null,
    }));

    try {
      // Execute query function with proper typing
      const result: TData = await (currentVariables !== undefined
        ? (queryFnRef.current as (vars: TVariables) => Promise<TData>)(currentVariables)
        : (queryFnRef.current as () => Promise<TData>)()
      );

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Process data with selector
      const processedData = select ? select(result) : (result as unknown as TSelected);

      // Update cache
      queryCache.set(queryHash, result);

      // Update state
      const now = Date.now();
      setState(prev => ({
        ...prev,
        data: processedData as TSelected | undefined,
        error: null,
        status: 'success',
        fetchStatus: 'idle',
        isLoading: false,
        isError: false,
        isSuccess: true,
        isIdle: false,
        dataUpdatedAt: now,
        failureCount: 0,
      }));

      // Reset retry count on success
      retryCountRef.current = 0;

      // Call success callback
      if (onSuccessRef.current) {
        onSuccessRef.current(processedData as any);
      }

    } catch (error) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const typedError = error as TError;
      retryCountRef.current += 1;

      // Determine if we should retry
      const shouldRetry = typeof retry === 'boolean'
        ? retry && retryCountRef.current < 3
        : typeof retry === 'number'
        ? retryCountRef.current <= retry
        : retry(retryCountRef.current, typedError);

      if (shouldRetry) {
        // Calculate delay
        const delay = typeof retryDelay === 'number'
          ? retryDelay * Math.pow(2, retryCountRef.current - 1) // Exponential backoff
          : retryDelay(retryCountRef.current, typedError);

        // Retry after delay
        setTimeout(() => {
          executeQuery(currentVariables, { ...options, isRetry: true });
        }, delay);
        return;
      }

      // Update state with error
      const now = Date.now();
      setState(prev => ({
        ...prev,
        error: typedError,
        status: 'error',
        fetchStatus: 'idle',
        isLoading: false,
        isError: true,
        isSuccess: false,
        isIdle: false,
        errorUpdatedAt: now,
        failureCount: retryCountRef.current,
      }));

      // Call error callback
      if (onErrorRef.current) {
        onErrorRef.current(typedError);
      }

      // Throw for error boundary if enabled
      if (useErrorBoundary) {
        throw typedError;
      }
    } finally {
      // Call settled callback
      if (onSettledRef.current) {
        onSettledRef.current(state.data as any, state.error);
      }
    }
  }, [enabled, queryHash, select, retry, retryDelay, useErrorBoundary, state.data, state.error]);

  // Initial query execution
  useEffect(() => {
    executeQuery(variables);
  }, [executeQuery, variables]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || state.status !== 'success') return;

    const interval = typeof refetchInterval === 'number'
      ? refetchInterval
      : refetchInterval(state.data as TData | undefined, { queryKey, queryHash });

    if (!interval) return;

    const intervalId = setInterval(() => {
      executeQuery(variables, { isRefetch: true });
    }, interval);

    return () => clearInterval(intervalId);
  }, [refetchInterval, state.status, state.data, executeQuery, variables, queryKey, queryHash]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        executeQuery(variables, { isRefetch: true });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refetchOnWindowFocus, executeQuery, variables]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Enhanced query methods
  const refetch = useCallback(async () => {
    const result = await executeQuery(variables, { isRefetch: true });
    return { data: state.data, error: state.error } as UseQueryResult<TSelected, TError>;
  }, [executeQuery, variables, state.data, state.error]);

  const invalidate = useCallback(async () => {
    queryCache.delete(queryHash);
    await executeQuery(variables);
  }, [queryHash, executeQuery, variables]);

  const prefetch = useCallback(async () => {
    if (!queryCache.has(queryHash)) {
      await executeQuery(variables);
    }
  }, [queryHash, executeQuery, variables]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const remove = useCallback(() => {
    queryCache.delete(queryHash);
    setState(prev => ({
      ...prev,
      data: undefined,
      status: 'idle',
      isIdle: true,
      isLoading: false,
      isSuccess: false,
      isError: false,
    }));
  }, [queryHash]);

  // Return enhanced query result
  return {
    // Core data
    data: state.data,
    error: state.error,

    // Status flags
    isError: state.isError,
    isIdle: state.isIdle,
    isLoading: state.isLoading,
    isLoadingError: state.isError && !state.data,
    isRefetchError: state.isError && !!state.data,
    isSuccess: state.isSuccess,
    status: state.status,

    // Enhanced status
    isInitialLoading: state.isLoading && !state.data,
    isRefetching: state.fetchStatus === 'fetching' && !!state.data,
    isFetchingNextPage: false, // Placeholder for pagination
    isFetchingPreviousPage: false, // Placeholder for pagination

    // Timestamps
    dataUpdatedAt: state.dataUpdatedAt,
    errorUpdatedAt: state.errorUpdatedAt,

    // Fetch status
    fetchStatus: state.fetchStatus,
    failureCount: state.failureCount,

    // Data state flags
    isFetched: state.dataUpdatedAt > 0 || state.errorUpdatedAt > 0,
    isFetchedAfterMount: state.dataUpdatedAt > 0,
    isFetching: state.fetchStatus === 'fetching',
    isPlaceholderData: false, // Could be enhanced with placeholder logic
    isPreviousData: false, // Could be enhanced with keep previous data logic
    isStale: Date.now() - state.dataUpdatedAt > staleTime,

    // Query metadata
    queryKey,
    queryHash,

    // Methods
    refetch,
    invalidate,
    prefetch,
    cancel,
    remove,
  };
}

// =============================================================================
// SPECIALIZED QUERY HOOKS
// =============================================================================

/**
 * Query hook for entities with ID
 */
export function useEntityQuery<T extends { id: string }>(
  id: string,
  queryFn: (id: string) => Promise<T>,
  options?: Omit<QueryConfig<T>, 'queryKey' | 'queryFn' | 'variables'>
) {
  return useGenericQuery({
    queryKey: ['entity', id],
    queryFn: () => queryFn(id),
    enabled: !!id && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * Query hook for lists with filters
 */
export function useListQuery<T, TFilters = Record<string, unknown>>(
  resource: string,
  filters: TFilters,
  queryFn: (filters: TFilters) => Promise<T[]>,
  options?: Omit<QueryConfig<T[]>, 'queryKey' | 'queryFn' | 'variables'>
) {
  return useGenericQuery({
    queryKey: ['list', resource, filters],
    queryFn: (() => queryFn(filters)) as QueryFunction<T[], TFilters>,
    variables: filters,
    ...options,
  });
}

/**
 * Infinite query hook for pagination
 */
export function useInfiniteQuery<T, TPageParam = number>(
  queryKey: readonly unknown[],
  queryFn: (pageParam: TPageParam) => Promise<{ data: T[]; nextPage?: TPageParam }>,
  options?: {
    getNextPageParam?: (lastPage: { data: T[]; nextPage?: TPageParam }) => TPageParam | undefined;
    getPreviousPageParam?: (firstPage: { data: T[]; nextPage?: TPageParam }) => TPageParam | undefined;
    initialPageParam: TPageParam;
  } & Omit<QueryConfig<{ data: T[]; nextPage?: TPageParam }>, 'queryKey' | 'queryFn'>
) {
  // This would be a more complex implementation for infinite queries
  // For now, return a basic structure
  return useGenericQuery({
    queryKey: [...queryKey, 'infinite'],
    queryFn: () => queryFn(options?.initialPageParam as TPageParam),
    ...options,
  });
}

export { queryCache };