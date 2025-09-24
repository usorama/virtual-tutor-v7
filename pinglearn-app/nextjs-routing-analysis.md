# Next.js 15+ Route Groups and Layout Inheritance Analysis

## 📋 Research Findings (September 24, 2025)

### Current Problem Summary
- **Issue**: ThemeProvider only exists in root layout.tsx, but route groups have isolated layouts that don't inherit from root
- **Affected Routes**: (auth), (marketing), wizard route groups
- **Symptom**: Dark theme CSS variables work on root pages but not within route groups
- **Root Cause**: Next.js 13+ route groups are intentionally isolated from root layout

## 🔍 Technical Analysis

### Why Route Groups Don't Inherit Root Layout (Next.js 13+)
Route groups in Next.js 13+ are **intentionally isolated** by design:
1. **Nested Layouts Only**: Route groups only inherit from their direct parent layout, not the root
2. **Isolation by Design**: This allows different sections to have completely different layouts
3. **Explicit Provider Management**: Providers must be explicitly included where needed

### Current Architecture Issues
```
Root Layout (has ThemeProvider)
├── Regular pages ✅ - Inherit ThemeProvider
└── Route Groups ❌ - Isolated, no ThemeProvider
    ├── (auth)/layout.tsx - Missing ThemeProvider
    ├── (marketing)/layout.tsx - Hardcoded bg-black, missing ThemeProvider
    └── wizard/layout.tsx - Missing ThemeProvider
```

## 💡 Solution Approaches

### 1. **Shared Provider Component (RECOMMENDED)**
Extract ThemeProvider to a shared component and import it in each layout.

**Pros:**
- Clean separation of concerns
- Each route group explicitly manages its providers
- Easy to customize providers per route group
- Follows Next.js 13+ best practices

**Cons:**
- Requires updating multiple layouts
- Slightly more boilerplate

### 2. **Template-Based Approach**
Use Next.js `template.tsx` files to wrap route groups.

**Pros:**
- Automatic provider inheritance
- Less repetitive code

**Cons:**
- Less explicit control
- Template behavior differs from layouts

### 3. **Context Bridge Pattern**
Create a context bridge that spans across layouts.

**Pros:**
- Maintains single source of truth

**Cons:**
- Complex implementation
- Potential hydration issues

## 🎯 Recommended Implementation

### Step 1: Create Shared Theme Provider Component
```typescript
// src/providers/ThemeProvider.tsx
'use client';

import { ThemeProvider as ThemeContext } from '@/contexts/ThemeContext';

export function SharedThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext>
      {children}
    </ThemeContext>
  );
}
```

### Step 2: Update Each Route Group Layout
- Import and wrap with SharedThemeProvider
- Remove hardcoded styles
- Use theme-aware classes

### Step 3: CSS Variables Strategy
Ensure CSS variables are available at the document level, not just within provider.

## 🚨 Marketing Layout Issues
The (marketing)/layout.tsx has hardcoded `bg-black text-white` which:
- Overrides theme system
- Prevents dark/light mode switching
- Creates inconsistent user experience

**Solution**: Replace with theme-aware classes like `bg-background text-foreground`

## 📊 Implementation Priority
1. **High**: Fix marketing layout hardcoded styles
2. **High**: Add ThemeProvider to all route group layouts
3. **Medium**: Verify CSS variables work at document level
4. **Low**: Consider template.tsx approach for future routes

## 🔧 Testing Strategy
1. Verify theme toggle works on all route groups
2. Test theme persistence across navigation
3. Ensure no hydration mismatches
4. Check SSR compatibility

## 🎓 Educational Context
This is a common Next.js 13+ gotcha where developers expect automatic inheritance but need explicit provider management in route groups. The isolation is actually a feature that allows flexible layout composition.