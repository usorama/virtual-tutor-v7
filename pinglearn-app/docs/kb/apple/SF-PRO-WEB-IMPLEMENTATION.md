# SF Pro Font Web Implementation Guide

## The Challenge
Apple's SF Pro fonts are proprietary and only natively available on Apple devices. To achieve consistent typography across all platforms (Windows, Android, Linux), we need to self-host these fonts.

## Apple's Approach
Apple.com uses: `"SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif`
- They rely on system fonts (SF Pro is pre-installed on macOS/iOS)
- They fall back to Helvetica on non-Apple devices
- This creates inconsistent experiences across platforms

## Our Solution: Self-Hosted Web Fonts

### Step 1: Download SF Pro Fonts
Download from Apple Developer site (already have license agreement):
- SF Pro Display: For text 20pt and larger
- SF Pro Text: For text smaller than 20pt
- Include all weights: 100-900

### Step 2: Convert to Web Formats
Convert .otf/.ttf files to WOFF2 for optimal web performance:
```bash
# Using fonttools (Python)
pip install fonttools brotli
pyftsubset "SF-Pro-Display-Regular.otf" \
  --output-file="sf-pro-display-regular.woff2" \
  --flavor=woff2 \
  --layout-features="*" \
  --unicodes="*"
```

### Step 3: Next.js Implementation

#### Option A: Next.js Font Optimization (Recommended)
```typescript
// app/fonts.ts
import localFont from 'next/font/local'

export const sfProDisplay = localFont({
  src: [
    {
      path: '../public/fonts/sf-pro-display-ultralight.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../public/fonts/sf-pro-display-thin.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../public/fonts/sf-pro-display-light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/sf-pro-display-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/sf-pro-display-medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/sf-pro-display-semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/sf-pro-display-bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/sf-pro-display-heavy.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/sf-pro-display-black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-sf-pro-display',
  display: 'swap', // Prevents layout shift
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Arial', 'sans-serif'],
})

export const sfProText = localFont({
  src: [
    // Similar structure for SF Pro Text weights
    {
      path: '../public/fonts/sf-pro-text-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    // ... other weights
  ],
  variable: '--font-sf-pro-text',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Arial', 'sans-serif'],
})
```

#### Option B: CSS @font-face (Manual)
```css
/* globals.css */
@font-face {
  font-family: 'SF Pro Display';
  src: url('/fonts/sf-pro-display-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'SF Pro Display';
  src: url('/fonts/sf-pro-display-medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

/* ... repeat for all weights */
```

### Step 4: Apply to Application

```tsx
// app/layout.tsx
import { sfProDisplay, sfProText } from './fonts'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sfProDisplay.variable} ${sfProText.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Step 5: CSS Variables Integration
```css
/* globals.css */
:root {
  --font-sf-pro: var(--font-sf-pro-text), ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
  --font-sf-pro-display: var(--font-sf-pro-display), ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
}

/* Typography utilities */
.text-largeTitle {
  font-family: var(--font-sf-pro-display);
  font-size: 2.125rem; /* 34pt */
}

.text-title1 {
  font-family: var(--font-sf-pro-display);
  font-size: 1.75rem; /* 28pt */
}

.text-title2 {
  font-family: var(--font-sf-pro-display);
  font-size: 1.375rem; /* 22pt */
}

.text-title3 {
  font-family: var(--font-sf-pro-display);
  font-size: 1.25rem; /* 20pt */
}

.text-headline {
  font-family: var(--font-sf-pro);
  font-size: 1.0625rem; /* 17pt */
  font-weight: 600;
}

.text-body {
  font-family: var(--font-sf-pro);
  font-size: 1.0625rem; /* 17pt */
}

/* ... other sizes */
```

## File Structure
```
pinglearn-app/
├── public/
│   └── fonts/
│       ├── sf-pro-display-ultralight.woff2
│       ├── sf-pro-display-thin.woff2
│       ├── sf-pro-display-light.woff2
│       ├── sf-pro-display-regular.woff2
│       ├── sf-pro-display-medium.woff2
│       ├── sf-pro-display-semibold.woff2
│       ├── sf-pro-display-bold.woff2
│       ├── sf-pro-display-heavy.woff2
│       ├── sf-pro-display-black.woff2
│       ├── sf-pro-text-regular.woff2
│       ├── sf-pro-text-medium.woff2
│       ├── sf-pro-text-semibold.woff2
│       └── sf-pro-text-bold.woff2
├── app/
│   ├── fonts.ts
│   └── layout.tsx
└── styles/
    └── globals.css
```

## Performance Optimizations

### 1. Font Subsetting
Only include characters you need:
```bash
# Latin subset only
pyftsubset "SF-Pro-Display-Regular.otf" \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --output-file="sf-pro-display-regular-latin.woff2" \
  --flavor=woff2
```

### 2. Preloading Critical Fonts
```html
<!-- In <head> -->
<link rel="preload" href="/fonts/sf-pro-text-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/sf-pro-display-semibold.woff2" as="font" type="font/woff2" crossorigin>
```

### 3. Font Display Strategy
- Use `font-display: swap` for immediate text rendering
- Falls back to system fonts while loading
- Swaps in SF Pro when ready (prevents invisible text)

## Browser Compatibility

### WOFF2 Support (Recommended)
- Chrome 36+ ✅
- Firefox 39+ ✅
- Safari 12+ ✅
- Edge 14+ ✅
- Opera 23+ ✅

### Fallback for Older Browsers
```css
@font-face {
  font-family: 'SF Pro Display';
  src: url('/fonts/sf-pro-display-regular.woff2') format('woff2'),
       url('/fonts/sf-pro-display-regular.woff') format('woff'); /* Fallback */
  font-weight: 400;
  font-style: normal;
}
```

## Legal Considerations

### Apple's License (From developer.apple.com/fonts)
- ✅ **Allowed**: Use in software products running on Apple platforms
- ✅ **Allowed**: Show in screenshots, mockups of Apple platform apps
- ⚠️ **Gray Area**: Web usage not explicitly mentioned
- ❌ **Not Allowed**: Embedding in non-Apple platform software

### Alternatives for Full Compliance
1. **Inter**: Open-source, similar metrics to SF Pro
2. **System Font Stack**: Use native fonts on each platform
3. **Geist**: Vercel's font, optimized for interfaces

## Testing Checklist

- [ ] Fonts load on macOS (Safari, Chrome, Firefox)
- [ ] Fonts load on Windows (Chrome, Edge, Firefox)
- [ ] Fonts load on Linux (Chrome, Firefox)
- [ ] Fonts load on iOS (Safari, Chrome)
- [ ] Fonts load on Android (Chrome, Samsung Internet)
- [ ] Fallback fonts work when SF Pro fails
- [ ] No layout shift (CLS) during font loading
- [ ] Font weights render correctly
- [ ] Typography scale is consistent

## Implementation Priority

1. **Phase 1**: Use system font stack (immediate)
   ```css
   font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
   ```

2. **Phase 2**: Implement Inter as open-source alternative
   ```tsx
   import { Inter } from 'next/font/google'
   ```

3. **Phase 3**: Self-host SF Pro (after legal review)
   - Download fonts
   - Convert to WOFF2
   - Implement with Next.js font optimization

---

**Recommendation**: Start with Phase 1 (system fonts) for immediate consistency, then evaluate Phase 2 (Inter) for legal safety while maintaining Apple-like aesthetics.