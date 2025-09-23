# Change Record: Dark Theme Implementation

**Template Version**: 3.0
**Change ID**: FC-004-B
**Related**: Split from original FC-004
**Status**: READY FOR IMPLEMENTATION
**Risk Level**: MEDIUM ⚠️
**Value**: MEDIUM

---

## 🚨 Pre-Implementation Safety Check

```bash
# Create checkpoint before starting
git add .
git commit -m "checkpoint: Before FC-004-B - Dark Theme

CHECKPOINT: Safety point before dark theme implementation
- Adding dark theme with toggle
- CSS variable updates only
- Feature flag protected
- Can rollback to this point if needed"
```

---

## Section 1: Executive Summary

### What We're Building
Implementing a **dark theme** for PingLearn with user preference toggle. This sets the foundation for better visual aesthetics and reduced eye strain during long study sessions.

### Implementation Strategy
- **Feature flag protected** - Can be disabled instantly
- **CSS variables only** - No component logic changes
- **localStorage preference** - Persists across sessions
- **System preference aware** - Respects OS dark mode

### Success Criteria
✅ Dark theme CSS variables defined
✅ Theme toggle component works
✅ User preference persisted
✅ All text remains readable (WCAG AA)
✅ Can be disabled via feature flag

---

## Section 2: Technical Scope

### Feature Flag Setup
**File**: `/src/config/feature-flags.json`
```json
{
  "enableDarkTheme": false,
  "enablePurposeBasedLearning": true
}
```

### CSS Variable Updates
**File**: `/src/app/globals.css`

```css
/* Keep existing light theme as-is */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

/* Add dark theme */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;

  /* PingLearn specific dark colors */
  --cyan-accent: 186 94% 55%;  /* Cyan-500 */
  --cyan-hover: 186 94% 65%;   /* Cyan-400 */
}

/* Smooth theme transitions */
* {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### Theme Context Provider
**File**: `/src/contexts/ThemeContext.tsx` (NEW)

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { featureFlags } from '@/config/feature-flags';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Check feature flag first
  if (!featureFlags.enableDarkTheme) {
    return <>{children}</>;
  }

  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      setTheme(saved);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
    } else {
      // Use manual selection
      root.classList.add(theme);
      setResolvedTheme(theme);
    }

    // Save preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
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
```

### Theme Toggle Component
**File**: `/src/components/ui/theme-toggle.tsx` (NEW)

```tsx
'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { featureFlags } from '@/config/feature-flags';

export function ThemeToggle() {
  // Don't render if feature flag is off
  if (!featureFlags.enableDarkTheme) {
    return null;
  }

  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {resolvedTheme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Update Root Layout
**File**: `/src/app/layout.tsx`

Add ThemeProvider (modify existing, don't replace entire file):
```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {/* Existing providers */}
          <div className="min-h-screen bg-background text-foreground">
            {/* Add theme toggle to header/nav area */}
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Section 3: Testing & Verification

### Visual Testing
```bash
# 1. Enable feature flag
# Edit /src/config/feature-flags.json
# Set "enableDarkTheme": true

# 2. Start the app
npm run dev

# 3. Test theme toggle
# - Click sun/moon icon
# - Select Light/Dark/System
# - Verify all pages update
# - Check localStorage has 'theme' key

# 4. Test readability
# - All text visible in both themes
# - Forms remain usable
# - Buttons have proper contrast
```

### Accessibility Testing
```bash
# Using Playwright MCP
mcp__playwright__browser_navigate "http://localhost:3006"

# Light theme contrast
mcp__playwright__browser_take_screenshot "light-theme-contrast.png"

# Switch to dark
mcp__playwright__browser_click "theme toggle button"
mcp__playwright__browser_click "Dark option"
mcp__playwright__browser_take_screenshot "dark-theme-contrast.png"

# Check console for errors
mcp__playwright__browser_console_messages
```

### System Preference Testing
```javascript
// Test system preference detection
mcp__playwright__browser_evaluate "() => {
  localStorage.setItem('theme', 'system');
  location.reload();
}"

// Should follow OS dark mode setting
```

---

## Section 4: Rollback Plan

### Quick Disable (No Code Changes)
```json
// Just flip the feature flag
// /src/config/feature-flags.json
{
  "enableDarkTheme": false  // Instantly disables
}
```

### Full Rollback
```bash
# 1. Git rollback
git reset --hard [checkpoint-hash]

# 2. Clear user preferences
localStorage.removeItem('theme');
```

---

## Section 5: Implementation Checklist

### Pre-Implementation
- [ ] Create git checkpoint
- [ ] Test current light theme
- [ ] Document current colors

### Implementation
- [ ] Add feature flag (disabled)
- [ ] Update CSS variables
- [ ] Create ThemeContext
- [ ] Create ThemeToggle component
- [ ] Update root layout
- [ ] Test with flag enabled

### Verification
- [ ] TypeScript: `npm run typecheck` (0 errors)
- [ ] Toggle switches themes
- [ ] Preference persists on reload
- [ ] System preference works
- [ ] All pages readable
- [ ] Feature flag disable works

### Post-Implementation
- [ ] Keep feature flag disabled initially
- [ ] Test with select users
- [ ] Enable gradually
- [ ] Monitor feedback

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|---------|------------|
| Poor contrast in dark mode | Medium | Low | WCAG AA validation |
| User preference not saved | Low | Low | localStorage + testing |
| Flash of wrong theme | Low | Low | suppressHydrationWarning |
| Breaking existing styles | Low | Medium | Feature flag protection |
| Performance impact | Very Low | Low | CSS-only changes |

---

## Why This is Moderate Risk

1. **Visual changes affect all pages** - But CSS-only
2. **Feature flag protected** - Can disable instantly
3. **No logic changes** - Pure styling update
4. **Industry standard approach** - Well-tested pattern
5. **Progressive rollout** - Test before full release

---

**APPROVAL STATUS**: Ready for implementation
**ESTIMATED TIME**: 45-60 minutes
**DEPENDENCIES**: None (but enhances FC-004-A)
**BREAKING CHANGES**: None (feature flag protected)