'use client';

/**
 * Feature Flag Provider
 * Provides feature flag functionality with real-time updates and TypeScript safety
 * Following 2025 best practices for educational platforms
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Feature flag type definitions
export interface FeatureFlags {
  voice_session_enabled: boolean;
  gemini_live_api: boolean;
  math_rendering: boolean;
  transcription_service: boolean;
  websocket_optimization: boolean;
  performance_monitoring: boolean;
  debug_mode: boolean;
  experimental_features: boolean;
  livekit_integration: boolean;
  auto_reconnect: boolean;
  error_logging: boolean;
  session_analytics: boolean;
}

// Default feature flags (safe defaults)
const DEFAULT_FLAGS: FeatureFlags = {
  voice_session_enabled: false,
  gemini_live_api: false,
  math_rendering: true,
  transcription_service: true,
  websocket_optimization: false,
  performance_monitoring: true,
  debug_mode: false,
  experimental_features: false,
  livekit_integration: false,
  auto_reconnect: true,
  error_logging: true,
  session_analytics: false,
};

// Context type
interface FeatureFlagContextType {
  flags: FeatureFlags;
  isLoading: boolean;
  error: string | null;
  toggleFlag: (flag: keyof FeatureFlags) => void;
  refreshFlags: () => Promise<void>;
}

// Create context
const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

// Provider props
interface FeatureFlagProviderProps {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlags>;
}

/**
 * Feature Flag Provider Component
 * Manages feature flags with persistence and real-time updates
 */
export function FeatureFlagProvider({ children, initialFlags = {} }: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>({ ...DEFAULT_FLAGS, ...initialFlags });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load flags from multiple sources
  const loadFlags = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to load from external JSON file first
      let loadedFlags: Partial<FeatureFlags> = {};

      try {
        const response = await fetch('/feature-flags.json');
        if (response.ok) {
          loadedFlags = await response.json();
        }
      } catch (fetchError) {
        console.warn('Could not load feature-flags.json, using defaults:', fetchError);
      }

      // Load from localStorage (user preferences)
      let localFlags: Partial<FeatureFlags> = {};
      try {
        const stored = localStorage.getItem('pinglearn-feature-flags');
        if (stored) {
          localFlags = JSON.parse(stored);
        }
      } catch (parseError) {
        console.warn('Could not parse stored feature flags:', parseError);
      }

      // Merge flags: defaults < external config < localStorage < initialFlags
      const mergedFlags: FeatureFlags = {
        ...DEFAULT_FLAGS,
        ...loadedFlags,
        ...localFlags,
        ...initialFlags,
      };

      setFlags(mergedFlags);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feature flags';
      setError(errorMessage);
      console.error('Feature flag loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle a specific flag
  const toggleFlag = (flag: keyof FeatureFlags): void => {
    setFlags(prev => {
      const newFlags = { ...prev, [flag]: !prev[flag] };

      // Persist to localStorage
      try {
        localStorage.setItem('pinglearn-feature-flags', JSON.stringify(newFlags));
      } catch (storageError) {
        console.warn('Could not save feature flags to localStorage:', storageError);
      }

      return newFlags;
    });
  };

  // Refresh flags from external sources
  const refreshFlags = async (): Promise<void> => {
    await loadFlags();
  };

  // Load flags on mount
  useEffect(() => {
    loadFlags();
  }, []);

  // Performance monitoring integration
  useEffect(() => {
    if (flags.performance_monitoring) {
      console.log('Performance monitoring enabled');
      // Add performance tracking here if needed
    }
  }, [flags.performance_monitoring]);

  // Debug mode integration
  useEffect(() => {
    if (flags.debug_mode) {
      console.log('Current feature flags:', flags);
    }
  }, [flags, flags.debug_mode]);

  const contextValue: FeatureFlagContextType = {
    flags,
    isLoading,
    error,
    toggleFlag,
    refreshFlags,
  };

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to use feature flags
 * Provides type-safe access to feature flags and controls
 */
export function useFeatureFlags(): FeatureFlagContextType {
  const context = useContext(FeatureFlagContext);

  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }

  return context;
}

/**
 * Hook to check if a specific feature is enabled
 * Simplified hook for checking individual flags
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const { flags } = useFeatureFlags();
  return flags[flag];
}

/**
 * Higher-order component for conditional feature rendering
 * Wraps components to only render when a feature is enabled
 */
interface FeatureGateProps {
  flag: keyof FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const isEnabled = useFeatureFlag(flag);

  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Export types for external use
export type { FeatureFlagContextType };