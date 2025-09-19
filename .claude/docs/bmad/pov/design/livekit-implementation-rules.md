# LiveKit Design System - Implementation Rules for AI Agents

## CRITICAL: Read This First

This document contains STRICT RULES that must be followed exactly. No exceptions. No assumptions. No improvisation.

## Rule Priority System

🔴 **NEVER** - Absolute prohibition  
🟡 **ALWAYS** - Mandatory requirement  
🟢 **PREFER** - Strong recommendation  

---

## 🔴 NEVER Rules (Violations = Incorrect Implementation)

### Colors
- **NEVER** use any blue color other than `#1f8cf9` for primary accent
- **NEVER** use pure black `#000000` - use `#111111` minimum
- **NEVER** use colors not in the design-tokens.json file
- **NEVER** mix light and dark theme colors in the same component

### Typography
- **NEVER** use custom fonts - only system fonts
- **NEVER** use font sizes outside the defined scale
- **NEVER** use font-weight below 400 or above 700
- **NEVER** use serif fonts anywhere

### Spacing
- **NEVER** use arbitrary pixel values - only use spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 80)
- **NEVER** add margins to component root elements
- **NEVER** use percentage-based padding on buttons or inputs

### Components
- **NEVER** create rounded corners larger than 16px (except full circles)
- **NEVER** use drop shadows in light theme
- **NEVER** make clickable areas smaller than 44x44px (accessibility)
- **NEVER** use opacity below 0.5 for disabled states

### Layout
- **NEVER** exceed 1280px container width
- **NEVER** use flexbox for grids - use CSS Grid
- **NEVER** use inline styles for responsive behavior

---

## 🟡 ALWAYS Rules (Mandatory Requirements)

### Colors
- **ALWAYS** use `#1f8cf9` for primary actions and accent color
- **ALWAYS** use `rgba(255, 255, 255, 0.1)` for borders in dark theme
- **ALWAYS** maintain minimum 4.5:1 contrast ratio for text

### Typography
- **ALWAYS** use this exact font stack:
  ```css
  font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Helvetica Neue', 'Helvetica', sans-serif;
  ```
- **ALWAYS** use 16px (1rem) as base font size
- **ALWAYS** use font-weight 500 for buttons and labels
- **ALWAYS** use line-height between 1.1 and 1.6

### Spacing
- **ALWAYS** use 8px as the base spacing unit
- **ALWAYS** use 24px gap between major sections
- **ALWAYS** use 16px padding inside cards and containers
- **ALWAYS** use 12px padding for buttons (vertical) and 24px (horizontal)

### Components
- **ALWAYS** add the `lk-` prefix to all classes
- **ALWAYS** use `data-` attributes for component state
- **ALWAYS** include hover and focus states for interactive elements
- **ALWAYS** use 8px border-radius for buttons and inputs
- **ALWAYS** use 12px border-radius for cards and modals
- **ALWAYS** include transitions on interactive elements (0.2s ease-in-out)

### Dark Theme (Default)
- **ALWAYS** use these exact background colors:
  - Primary: `#111111`
  - Secondary: `#1a1a1a`
  - Tertiary: `#242424`
- **ALWAYS** use white (`#ffffff`) for primary text
- **ALWAYS** use `rgba(255, 255, 255, 0.8)` for secondary text

### Animations
- **ALWAYS** use `transform` and `opacity` for animations (performance)
- **ALWAYS** respect `prefers-reduced-motion` media query
- **ALWAYS** use these exact transition durations:
  - Fast: 0.1s
  - Normal: 0.2s
  - Slow: 0.3s

---

## 🟢 PREFER Rules (Strong Recommendations)

### Layout
- **PREFER** CSS Grid over Flexbox for 2D layouts
- **PREFER** `min-height` over `height` for content containers
- **PREFER** `rem` units over `px` for typography
- **PREFER** CSS custom properties over hard-coded values

### Performance
- **PREFER** CSS transforms over position changes
- **PREFER** `will-change` on frequently animated elements
- **PREFER** CSS containment for isolated components

### Code Structure
- **PREFER** BEM-like naming: `.lk-component__element--modifier`
- **PREFER** grouping related CSS properties
- **PREFER** mobile-first media queries

---

## Component Assembly Instructions

### Button Creation
```css
/* CORRECT - Follow this exactly */
.lk-button {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  /* Spacing - ALWAYS use these exact values */
  padding: 12px 24px;
  gap: 8px;
  
  /* Typography - NEVER change these */
  font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Helvetica Neue', 'Helvetica', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  
  /* Visual - Use exact colors from tokens */
  background: #1f8cf9;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  
  /* Behavior */
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  user-select: none;
}

/* ALWAYS include hover state */
.lk-button:hover {
  background: #2f96fa; /* 8% lighter */
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(31, 140, 249, 0.25);
}

/* ALWAYS include active state */
.lk-button:active {
  transform: translateY(0) scale(0.98);
}

/* ALWAYS include disabled state */
.lk-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Card Creation
```css
/* CORRECT - Follow this pattern */
.lk-card {
  /* ALWAYS use this exact background */
  background: #1a1a1a;
  
  /* ALWAYS use this exact border */
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  /* ALWAYS use 12px for cards */
  border-radius: 12px;
  
  /* ALWAYS use 24px padding for cards */
  padding: 24px;
  
  /* NEVER add margin to root element */
  /* margin: 0; <- DON'T DO THIS */
  
  /* ALWAYS include transition */
  transition: all 0.3s ease;
}
```

---

## Validation Checklist

Before considering implementation complete, verify:

### Colors
- [ ] Primary accent is exactly `#1f8cf9`
- [ ] Dark background is exactly `#111111`
- [ ] All colors exist in design-tokens.json

### Typography
- [ ] Using system font stack exactly as specified
- [ ] Font sizes match the scale (12, 14, 16, 18, 20, 24, 32, 40, 48, 56)
- [ ] Font weights are 400, 500, 600, or 700 only

### Spacing
- [ ] All spacing values are multiples of 4px
- [ ] Using 8px base unit consistently
- [ ] No arbitrary pixel values

### Components
- [ ] All classes have `lk-` prefix
- [ ] All interactive elements have hover states
- [ ] All buttons are minimum 44px tall
- [ ] Border radius values are 6px, 8px, 12px, or full only

### Accessibility
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus states are visible
- [ ] Click targets are minimum 44x44px
- [ ] Reduced motion is respected

---

## Error Patterns to Avoid

### ❌ WRONG
```css
.button {  /* Missing lk- prefix */
  background: #0066cc;  /* Wrong color */
  padding: 10px 20px;  /* Not using spacing scale */
  font-family: Arial;  /* Wrong font */
  border-radius: 20px;  /* Too large */
}
```

### ✅ CORRECT
```css
.lk-button {
  background: #1f8cf9;
  padding: 12px 24px;
  font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Helvetica Neue', 'Helvetica', sans-serif;
  border-radius: 8px;
}
```

---

## Final Implementation Instruction

**When in doubt, check these files in order:**
1. implementation-rules.md (this file) - for what NOT to do
2. components.json - for exact values
3. design-tokens.json - for system values
4. design.md - for context only

**Remember:** LiveKit's design is minimal, dark, and performance-focused. Every decision should support these principles.