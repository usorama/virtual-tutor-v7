# LiveKit Design System - Complete Specification

## Core Design Philosophy

LiveKit employs a **"Digital Edge"** aesthetic with a developer-first approach, emphasizing performance, accessibility, and minimal visual noise. The design system is built on three core principles:

1. **Dark Mode First**: Primary interface optimized for extended use in development environments
2. **System Font Strategy**: Zero-latency rendering using native OS fonts
3. **Component Isolation**: Context-driven spacing with parent-controlled layouts

## Color System

### Primary Brand Identity
- **Signature Cyan Accent**: `#1f8cf9` - Used consistently across dark and light themes
- **Matrix-lite Aesthetic**: Near-black backgrounds with high-contrast text
- **Semantic Color Strategy**: Clear success (#1ff968), danger (#f91f31), and warning (#f9b11f) states

### Implementation Pattern
All colors use CSS custom properties with the `--lk-` prefix:
```css
--lk-accent-bg: #1f8cf9;
--lk-fg: #ffffff;
--lk-bg: #111111;
```

Colors are programmatically generated using Sass `color.adjust()` functions for consistent variations (4%, 8%, 12%, 16% adjustments).

## Typography System

### Font Stack Architecture
```css
font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Helvetica Neue', 'Helvetica', sans-serif;
```

This deliberate choice eliminates font loading latency and ensures consistent cross-platform rendering.

### Type Scale (rem-based)
- **Display**: 3-3.5rem (48-56px)
- **H1**: 2.5-3rem (40-48px)
- **H2**: 2-2.5rem (32-40px)
- **H3**: 1.5-1.75rem (24-28px)
- **Body**: 1rem (16px)
- **Caption**: 0.75-0.875rem (12-14px)

### Font Weights
- Regular (400): Body text
- Medium (500): UI labels, emphasized text
- Semibold (600): Buttons, section headings
- Bold (700): Primary headings

## Spacing System

### Base Unit
8px grid system with computed multipliers

### Spacing Scale
- xs: 4px (0.5x)
- sm: 8px (1x)
- md: 16px (2x)
- lg: 24px (3x)
- xl: 32px (4x)
- 2xl: 48px (6x)
- 3xl: 64px (8x)
- 4xl: 80px (10x)

### Component Spacing Philosophy
- **No External Margins**: Components don't define their own margins
- **Parent-Controlled**: Spacing handled by layout containers
- **Consistent Rhythm**: 24px between major elements, 16px internal padding

## Visual Effects

### Shadows
- **Small**: `0 2px 4px rgba(0, 0, 0, 0.05)` - Subtle elevation
- **Base**: `0 4px 12px rgba(0, 0, 0, 0.1)` - Cards, dropdowns
- **Medium**: `0 8px 24px rgba(0, 0, 0, 0.15)` - Hover states
- **Large**: `0 24px 48px rgba(0, 0, 0, 0.2)` - Modals

### Border Radius
- Small: 6px - Buttons, inputs
- Base: 8px - Cards, containers
- Large: 12px - Modals, major components
- Full: 9999px - Avatars, pills

## Layout System

### Grid System
- **Container Max Width**: 1280px
- **Grid Columns**: 12-column grid with 24px gaps
- **Breakpoints**: 
  - Mobile: 0-768px
  - Tablet: 768px-1024px
  - Desktop: 1024px+

### Common Patterns
```css
.lk-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

.lk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}
```

## Animation System

### Standard Transitions
```css
/* Fast: 0.1s - Button clicks, immediate feedback */
/* Normal: 0.2s - Most hover states, form interactions */
/* Slow: 0.3s - Cards, modals, larger elements */
/* Slower: 0.6s - Page transitions, scroll reveals */
```

### Keyframe Animations
```css
@keyframes lk-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes lk-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes lk-pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
```

## Implementation Guidelines for AI Agents

### CSS Architecture
1. **Prefix Convention**: All classes use `lk-` prefix
2. **Data Attributes**: State management via `data-lk-*` attributes
3. **CSS Variables**: Theme customization through `--lk-*` properties
4. **PostCSS Processing**: Automatic prefixing during build

### Component Structure
```html
<!-- Example component structure -->
<div class="lk-component" data-lk-theme="default" data-lk-state="active">
  <div class="lk-component-header">
    <h3 class="lk-component-title">Title</h3>
  </div>
  <div class="lk-component-body">
    <!-- Content -->
  </div>
</div>
```

### State Management
```css
/* Use data attributes for states */
[data-lk-state="loading"] { opacity: 0.5; }
[data-lk-state="error"] { border-color: var(--lk-danger); }
[data-lk-state="success"] { border-color: var(--lk-success); }
```

### Responsive Patterns
```css
/* Mobile-first approach */
.lk-component {
  /* Mobile styles */
}

@media (min-width: 768px) {
  .lk-component {
    /* Tablet and up */
  }
}

@media (min-width: 1024px) {
  .lk-component {
    /* Desktop and up */
  }
}
```

### Performance Optimizations
1. **Hardware Acceleration**: Use `transform` and `opacity` for animations
2. **Will-change**: Apply sparingly for animated elements
3. **CSS Containment**: Use `contain: layout style` for isolated components
4. **Variable Fonts**: Not used - system fonts for performance

## Theme Implementation

### Dark Theme (Default)
```css
[data-lk-theme="default"] {
  color-scheme: dark;
  --lk-bg: #111;
  --lk-fg: #fff;
  --lk-accent-bg: #1f8cf9;
  --lk-border-color: rgba(255, 255, 255, 0.1);
}
```

### Light Theme
```css
[data-lk-theme="light"] {
  color-scheme: light;
  --lk-bg: #fff;
  --lk-fg: #111;
  --lk-accent-bg: #1f8cf9;
  --lk-border-color: rgba(0, 0, 0, 0.1);
}
```

## Accessibility Requirements

1. **Color Contrast**: Minimum WCAG AA compliance (4.5:1 for normal text)
2. **Focus Indicators**: Visible focus rings on all interactive elements
3. **Keyboard Navigation**: Full keyboard support for all components
4. **ARIA Labels**: Proper semantic markup and ARIA attributes
5. **Motion Preferences**: Respect `prefers-reduced-motion`

## Component Naming Convention

```
.lk-[component]-[element]-[modifier]

Examples:
.lk-button
.lk-button-primary
.lk-button-icon
.lk-card-header
.lk-card-body
.lk-input-group
.lk-input-error
```

## Build Integration

```scss
// SCSS with PostCSS processing
@import '@livekit/components-styles';

// Custom overrides
.my-app {
  --lk-accent-bg: #custom-color;
  
  .lk-button {
    // Custom button styles
  }
}
```

This comprehensive documentation provides all necessary specifications to recreate LiveKit's exact visual appearance, including precise measurements, color values, component behaviors, and implementation patterns. The design system emphasizes performance, developer experience, and visual consistency while maintaining flexibility for customization.