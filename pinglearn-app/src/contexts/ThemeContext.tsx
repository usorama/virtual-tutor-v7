'use client';

import { createContext, useContext, useEffect, useMemo, useCallback, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme from localStorage or default to system
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(theme)
  );

  // Optimized theme setter with localStorage persistence
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);

    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
  }, []);

  // Handle system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolvedTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newResolvedTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply theme on mount and changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme
  }), [theme, resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return mock if provider not available (feature flag off)
    return {
      theme: 'light' as Theme,
      setTheme: () => {},
      resolvedTheme: 'light' as const
    };
  }
  return context;
};