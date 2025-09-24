'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';

/**
 * Shared Theme Provider Component
 *
 * This component wraps the ThemeProvider context so it can be easily
 * imported and used in any route group layout that needs theme support.
 *
 * Usage in layouts:
 * import { SharedThemeProvider } from '@/providers/SharedThemeProvider';
 *
 * Why this approach?
 * - Explicit control over which layouts have theme support
 * - Easy to customize per route group if needed
 * - Follows Next.js 13+ best practices for route groups
 * - Makes dependencies clear and manageable
 */
export function SharedThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}