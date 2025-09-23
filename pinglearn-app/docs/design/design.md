# PingLearn Design System Documentation
Version 1.0 | September 2025

## 🎨 Design Philosophy

### Core Principles
1. **Minimalist Dark Interface**: Pure black (#000000) canvas with selective cyan accents
2. **Liquid Glass Depth**: Apple-inspired glassmorphism with real-time refraction
3. **Depth Through Animation**: Movement and transitions create spatial hierarchy
4. **Subtle Sophistication**: Less is more - every element has purpose
5. **Responsive Fluidity**: Seamless experience across all devices
6. **Performance First**: Optimized animations that don't sacrifice speed

### Visual Identity
- **Dark-First**: Designed primarily for dark environments
- **Cyan Accent**: Single accent color for maximum impact
- **Liquid Glass**: Translucent layers with specular highlights
- **Geometric Precision**: Clean lines, perfect circles, mathematical grids
- **Living Interface**: Subtle animations that breathe life into static elements

## 🎯 Brand Guidelines

### Logo Usage & Assets

#### Logo Files Location
```
/public/logos/
├── logo-transparent.svg (9.9KB)  # Primary - Use this for all web implementations
├── logo-transparent.png (102KB)  # PNG fallback for compatibility
├── logo-colored.png (91KB)       # Alternative colored version
└── logo-original.png (106KB)     # Original design variant
```

#### Implementation Guidelines
- **Primary Logo**: `/public/logos/logo-transparent.svg`
- **Format**: SVG for perfect scalability (9.9KB optimized)
- **Minimum Clear Space**: 1x logo height on all sides
- **Color Variations**: Only use on dark backgrounds
- **Responsive Sizes**:
  - Mobile: h-16 (64px)
  - Tablet: h-20 (80px)
  - Desktop: h-24 (96px)

### Typography Hierarchy

#### Primary Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

#### Type Scale
- **Hero**: 48px-72px (mobile-desktop), Font-weight: 400 (normal)
- **Heading 1**: 36px-56px, Font-weight: 600
- **Heading 2**: 24px-36px, Font-weight: 600
- **Body Large**: 20px, Font-weight: 400
- **Body**: 16px-18px, Font-weight: 400
- **Small**: 14px, Font-weight: 400
- **Caption**: 12px, Font-weight: 400

#### Text Colors
- **Primary**: `#FFFFFF` (white)
- **Secondary**: `rgba(255, 255, 255, 0.6)` (60% white)
- **Tertiary**: `rgba(255, 255, 255, 0.4)` (40% white)
- **Disabled**: `rgba(255, 255, 255, 0.3)` (30% white)
- **Accent**: `#06B6D4` (cyan-500)

## 🎨 Color System

### Primary Palette
```css
/* Core Colors */
--color-black: #000000;
--color-white: #FFFFFF;
--color-cyan: #06B6D4;

/* Cyan Variations */
--cyan-50: #ECFEFF;
--cyan-100: #CFFAFE;
--cyan-200: #A5F3FC;
--cyan-300: #67E8F9;
--cyan-400: #22D3EE;
--cyan-500: #06B6D4; /* Primary */
--cyan-600: #0891B2;
--cyan-700: #0E7490;
--cyan-800: #155E75;
--cyan-900: #164E63;

/* Dark Cyan for Buttons */
--cyan-dark: #035B6A; /* 60% opacity over black */
```

### Opacity Scales
```css
/* White Opacity Scale */
--white-5: rgba(255, 255, 255, 0.05);
--white-10: rgba(255, 255, 255, 0.10);
--white-20: rgba(255, 255, 255, 0.20);
--white-30: rgba(255, 255, 255, 0.30);
--white-40: rgba(255, 255, 255, 0.40);
--white-60: rgba(255, 255, 255, 0.60);
--white-70: rgba(255, 255, 255, 0.70);

/* Cyan Opacity Scale */
--cyan-5: rgba(6, 182, 212, 0.05);
--cyan-10: rgba(6, 182, 212, 0.10);
--cyan-15: rgba(6, 182, 212, 0.15);
--cyan-20: rgba(6, 182, 212, 0.20);
--cyan-30: rgba(6, 182, 212, 0.30);
--cyan-50: rgba(6, 182, 212, 0.50);
--cyan-80: rgba(6, 182, 212, 0.80);
```

## 🌊 Liquid Glass & Glassmorphism System

### Apple-Inspired Liquid Glass (2025)
Inspired by Apple's revolutionary Liquid Glass design language unveiled at WWDC 2025, our implementation brings translucent materials that dynamically reflect and refract their surroundings.

#### Core Glass Properties
```css
/* Base Liquid Glass Effect */
.liquid-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.2);
  transform: translate3d(0, 0, 0); /* GPU acceleration */
}

/* Dark Mode Liquid Glass */
.liquid-glass-dark {
  background: rgba(17, 17, 17, 0.6);
  backdrop-filter: blur(24px) saturate(200%) brightness(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(200%) brightness(1.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Cyan-tinted Glass */
.liquid-glass-cyan {
  background: linear-gradient(
    135deg,
    rgba(6, 182, 212, 0.05) 0%,
    rgba(6, 182, 212, 0.1) 100%
  );
  backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(6, 182, 212, 0.15);
}
```

#### Advanced SVG Liquid Glass Effect
```html
<!-- SVG Filter for Liquid Distortion -->
<svg style="position: absolute; width: 0; height: 0;">
  <defs>
    <filter id="liquid-glass-distortion">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.01"
        numOctaves="2"
        result="turbulence"/>
      <feDisplacementMap
        in="SourceGraphic"
        in2="turbulence"
        scale="5"
        xChannelSelector="R"
        yChannelSelector="G"/>
      <feSpecularLighting
        result="specularLighting"
        surfaceScale="5"
        specularConstant="0.75"
        specularExponent="20"
        lighting-color="white">
        <fePointLight x="-50" y="60" z="200"/>
      </feSpecularLighting>
      <feComposite
        in="specularLighting"
        in2="SourceAlpha"
        operator="in"
        result="specularLightingInner"/>
      <feComposite
        in="specularLightingInner"
        in2="SourceGraphic"
        operator="arithmetic"
        k1="0" k2="1" k3="1" k4="0"/>
    </filter>
  </defs>
</svg>
```

#### Glassmorphism Hierarchy

##### Level 1: Subtle Glass (Background Elements)
```css
.glass-subtle {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

##### Level 2: Standard Glass (Cards, Containers)
```css
.glass-standard {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
    0 4px 24px rgba(0, 0, 0, 0.15);
}
```

##### Level 3: Prominent Glass (Modals, Overlays)
```css
.glass-prominent {
  background: rgba(17, 17, 17, 0.7);
  backdrop-filter: blur(24px) saturate(180%) brightness(1.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 2px 0 0 rgba(255, 255, 255, 0.15),
    0 12px 48px rgba(0, 0, 0, 0.3);
}
```

##### Level 4: Liquid Glass (Interactive Elements)
```css
.glass-liquid {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.07) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  backdrop-filter: blur(20px) saturate(200%) brightness(1.15);
  filter: url(#liquid-glass-distortion);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    inset 0 2px 4px 0 rgba(255, 255, 255, 0.2),
    inset 0 -2px 4px 0 rgba(0, 0, 0, 0.2),
    0 16px 64px rgba(0, 0, 0, 0.25);
}
```

### Performance Optimization

#### GPU Acceleration
```css
.glass-optimized {
  will-change: transform, opacity; /* Use sparingly */
  transform: translate3d(0, 0, 0); /* Force GPU layer */
  backface-visibility: hidden;
  perspective: 1000px;
}
```

#### Performance Thresholds
- **Mobile**: Max blur 12px, limit to 2-3 glass elements
- **Tablet**: Max blur 20px, limit to 4-5 glass elements
- **Desktop**: Max blur 30px, limit to 6-8 glass elements
- **Animation**: Never animate backdrop-filter directly

#### Fallback Strategies
```css
/* Fallback for browsers without backdrop-filter support */
@supports not (backdrop-filter: blur(10px)) {
  .liquid-glass {
    background: rgba(17, 17, 17, 0.85);
    box-shadow:
      inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
      0 8px 32px rgba(0, 0, 0, 0.3);
  }
}
```

### Interactive States

#### Hover Effect
```css
.glass-interactive:hover {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(200%);
  border-color: rgba(6, 182, 212, 0.3);
  transform: translateY(-2px) translate3d(0, 0, 0);
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

#### Active State
```css
.glass-interactive:active {
  background: rgba(255, 255, 255, 0.03);
  transform: translateY(0) translate3d(0, 0, 0);
}
```

#### Focus State
```css
.glass-interactive:focus-visible {
  outline: 2px solid rgba(6, 182, 212, 0.5);
  outline-offset: 2px;
  backdrop-filter: blur(28px) saturate(220%);
}
```

### Accessibility Considerations

#### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .liquid-glass {
    background: rgba(17, 17, 17, 0.9);
    backdrop-filter: blur(8px);
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
}
```

#### Reduced Transparency
```css
@media (prefers-reduced-transparency: reduce) {
  .liquid-glass {
    background: rgba(17, 17, 17, 0.95);
    backdrop-filter: blur(4px);
  }
}
```

#### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  .liquid-glass {
    filter: none;
    transition: none;
  }
}
```

## ✨ Visual Effects

### Glow Effects
```css
/* Text Glow */
.text-glow-cyan {
  text-shadow:
    0 0 40px rgba(6, 182, 212, 0.8),
    0 0 80px rgba(6, 182, 212, 0.5);
}

/* Box Glow */
.box-glow-cyan {
  box-shadow:
    0 0 50px rgba(6, 182, 212, 0.4),
    0 0 100px rgba(6, 182, 212, 0.2);
}

/* Border Glow */
.border-glow-cyan {
  border: 1px solid rgba(6, 182, 212, 0.3);
  box-shadow:
    inset 0 0 30px rgba(6, 182, 212, 0.1),
    0 0 30px rgba(6, 182, 212, 0.1);
}
```

### Gradient Definitions
```css
/* Linear Gradients */
--gradient-cyan: linear-gradient(135deg, #FFFFFF 0%, #06B6D4 100%);
--gradient-dark-cyan: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.25) 100%);

/* Radial Gradients */
--gradient-radial-cyan: radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%);
--gradient-radial-glow: radial-gradient(circle at center, rgba(6, 182, 212, 0.3) 0%, transparent 70%);

/* Conic Gradient (Animated Border) */
--gradient-conic: conic-gradient(
  from 0deg at 50% 50%,
  transparent 0deg,
  #06B6D4 60deg,
  #0891B2 120deg,
  transparent 180deg,
  transparent 360deg
);
```

## 🎬 Animation System

### Timing Functions
```css
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0.0, 0.6, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--linear: linear;
```

### Duration Scale
```css
--duration-instant: 0ms;
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-slower: 1000ms;
--duration-slowest: 2000ms;
```

### Core Animations

#### 1. Rotating Border Animation
```typescript
// Used in ConicGradientButton
animate={{ rotate: 360 }}
transition={{
  duration: 6,
  ease: "linear",
  repeat: Infinity,
}}
```

#### 2. Particle Float Animation
```javascript
// Vertical floating motion
animate={{
  x: [0, 100, 0],
  y: [0, 50, 0],
}}
transition={{
  duration: 20,
  repeat: Infinity,
  ease: "easeInOut",
}}
```

#### 3. Pulse Animation
```css
@keyframes pulse-cyan {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}
```

#### 4. Text Slide Animation
```css
@keyframes text-slide {
  0% { transform: translateX(100%); opacity: 0; }
  20% { transform: translateX(0); opacity: 1; }
  80% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(-100%); opacity: 0; }
}
```

#### 5. Features Carousel Animation
```javascript
// Horizontal scrolling for feature showcase
animate={{
  x: ["0%", "-50%"],
}}
transition={{
  duration: 15, // Increased speed (was 30s)
  repeat: Infinity,
  ease: "linear",
}}

// Feature styling
iconOpacity: 0.8      // Increased from 0.5 for better visibility
textOpacity: 0.7      // Increased from 0.4 for better readability
```

## 🖼️ Background System

### Animated Grid Background
The signature animated background consists of three layers:

1. **Grid Layer**: 50px grid with 3% opacity cyan lines
2. **Particle Layer**: 60 floating particles with connection lines
3. **Gradient Orbs**: 3 animated gradient spheres with blur

#### Grid Configuration
```javascript
const gridSize = 50; // pixels
const gridOpacity = 0.03;
const gridColor = "rgba(6, 182, 212, 0.03)";
```

#### Particle Configuration
```javascript
const particleCount = 60;
const particleSize = 0.5 - 2.5; // radius range
const particleOpacity = 0.2 - 0.7; // opacity range
const particleSpeed = 0.5; // velocity multiplier
const connectionDistance = 150; // pixels
```

### Noise Texture
```css
.noise-bg::before {
  opacity: 0.02;
  background-image: url("data:image/svg+xml,...");
}
```

## 🧩 Component Patterns

### Button Components

#### Primary Button (ConicGradientButton)
- **Background**: Dark cyan with gradient overlay
- **Border**: Animated conic gradient (6s rotation)
- **Hover State**: Radial glow effect
- **Text Color**: White (#FFFFFF)
- **Padding**: 32px horizontal, 12px vertical
- **Border Radius**: Full (rounded-full)

#### Button States
```css
/* Default */
background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.25) 100%);
background-color: rgba(3, 91, 106, 0.6);

/* Hover */
background: radial-gradient(circle at center, rgba(6,182,212,0.3) 0%, transparent 70%);

/* Active */
transform: scale(0.98);

/* Disabled */
opacity: 0.5;
pointer-events: none;
```

### Input Components

#### Email Input Field
```css
/* Container */
background: rgba(255, 255, 255, 0.02);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 9999px; /* Full rounded */

/* Input */
color: #FFFFFF;
placeholder-color: rgba(255, 255, 255, 0.3);

/* Focus State */
border-color: rgba(6, 182, 212, 0.5);
box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
```

### Card Components
```css
/* Standard Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
    0 4px 24px rgba(0, 0, 0, 0.15);
  transform: translate3d(0, 0, 0);
}

/* Hover State */
.glass-card:hover {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(20px) saturate(180%);
  border-color: rgba(6, 182, 212, 0.2);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 0 40px rgba(6, 182, 212, 0.1);
  transform: translateY(-2px) translate3d(0, 0, 0);
}
```

## 📏 Spacing System

### Base Unit: 4px

```css
/* Spacing Scale */
--space-0: 0px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
```

### Container Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
--container-max: 1920px;
```

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
--screen-sm: 640px;   /* Small tablets */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

### Responsive Type Scale
```css
/* Mobile (default) → Desktop */
.text-hero {
  font-size: 48px; /* Mobile */
  @media (min-width: 768px) { font-size: 60px; }
  @media (min-width: 1024px) { font-size: 72px; }
}
```

## ♿ Accessibility Guidelines

### Color Contrast
- **Primary Text on Black**: WCAG AAA (21:1)
- **Secondary Text on Black**: WCAG AA (7:1)
- **Cyan on Black**: WCAG AA Large Text (4.5:1)
- **White on Cyan Button**: WCAG AA (3.5:1)

### Focus States
```css
/* Keyboard Navigation */
:focus-visible {
  outline: 2px solid #06B6D4;
  outline-offset: 2px;
}
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable non-essential animations */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 🚀 Performance Optimization

### Animation Best Practices
1. Use `transform` and `opacity` for animations (GPU accelerated)
2. Avoid animating `width`, `height`, `top`, `left`
3. Use `will-change` sparingly for critical animations
4. Implement `requestAnimationFrame` for complex animations
5. Limit particle count based on device capability

### Image Optimization
- **Logo**: SVG format (9.9KB optimized)
- **Icons**: Inline SVG or icon fonts
- **Background**: CSS gradients instead of images
- **Noise**: Data URI for texture overlay

### CSS Performance
```css
/* Use CSS containment */
.component {
  contain: layout style paint;
}

/* Hardware acceleration */
.animated {
  transform: translateZ(0);
  will-change: transform;
}
```

## 🔧 Implementation Notes

### Required Dependencies
```json
{
  "framer-motion": "^11.0.0",
  "tailwindcss": "^3.4.0",
  "next": "^15.5.0"
}
```

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dark Mode Only
The design system is optimized for dark mode only. Light mode is not supported to maintain visual consistency and reduce complexity.

## 📚 Component Library

### Core Animated Components

#### 1. `ConicGradientButton` - Premium Animated Button
**The signature button with rotating conic gradient border**

```jsx
import ConicGradientButton from '@/components/ConicGradientButton';

<ConicGradientButton onClick={handleAction}>
  Start Learning
</ConicGradientButton>
```

**Features:**
- 360° rotating conic gradient border (6s loop)
- Blur effect on gradient for glow
- Dark cyan fill with gradient overlay
- Radial glow on hover
- Fully accessible with keyboard support

**Implementation Details:**
```jsx
// Key animation
animate={{ rotate: 360 }}
transition={{
  duration: 6,
  ease: "linear",
  repeat: Infinity,
}}

// Gradient definition
background: "conic-gradient(
  from 0deg at 50% 50%,
  transparent 0deg,
  #06b6d4 60deg,
  #0891b2 120deg,
  transparent 180deg
)"
```

#### 2. `TypewriterText` - Dynamic Text Animation
**Auto-typing and deleting text effect with cursor**

```jsx
import TypewriterText from '@/components/TypewriterText';

const words = ["empathetic", "adaptive", "personalized", "mindful"];

<TypewriterText words={words} className="text-cyan-500" />
```

**Features:**
- Smooth typing animation (120ms per character)
- Faster deletion (50ms per character)
- Blinking cursor with cyan color
- 1.5s pause between words
- Infinite loop through word array

#### 3. `AnimatedBackground` - Interactive Particle System
**Grid + floating particles with connections**

```jsx
import AnimatedBackground from '@/components/AnimatedBackground';

<main className="relative">
  <AnimatedBackground />
  <div className="relative z-10">
    {/* Content */}
  </div>
</main>
```

**Features:**
- 50px grid with 3% opacity cyan lines
- 60 floating particles with varying sizes
- Dynamic connection lines (150px proximity)
- Gradient orbs for depth
- GPU-accelerated animations

#### 4. `FadeInSection` - Scroll-Triggered Animation
**Content that fades in when scrolled into view**

```jsx
import FadeInSection from '@/components/FadeInSection';

<FadeInSection delay={0.2} duration={0.6}>
  <Card>Content to animate</Card>
</FadeInSection>
```

**Features:**
- Triggers once when in viewport
- Configurable delay and duration
- Y-axis movement (50px) with fade
- Custom easing curve
- -100px margin for early trigger

#### 5. `MetallicLogo` - 3D Metallic Effect
**Logo with metallic gradient and depth**

```jsx
import MetallicLogo from '@/components/MetallicLogo';

<MetallicLogo className="h-24" />
```

#### 6. `LiquidMetalLogo` - Liquid Animation
**Logo with liquid metal morphing effect**

```jsx
import LiquidMetalLogo from '@/components/LiquidMetalLogo';

<LiquidMetalLogo animated={true} />
```

### Text Animation Patterns

#### Gradient Text Effect
```css
.gradient-text {
  background: linear-gradient(135deg, #FFFFFF 0%, #06B6D4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

#### Glowing Text
```css
.text-glow {
  text-shadow:
    0 0 40px rgba(6, 182, 212, 0.8),
    0 0 80px rgba(6, 182, 212, 0.5);
}
```

#### Pulsing Text
```css
@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.pulse-text {
  animation: pulse-text 2s ease-in-out infinite;
}
```

### Interactive Hover Effects

#### Card Hover Lift
```jsx
const cardVariants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};
```

#### Button Press Effect
```css
.button:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}
```

### Loading & Transition Animations

#### Stagger Children Animation
```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};
```

#### Page Transition
```jsx
const pageVariants = {
  initial: { opacity: 0, x: -200 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 200 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};
```

### Motion Presets

```jsx
// Spring animations
const springConfig = {
  type: "spring",
  stiffness: 260,
  damping: 20
};

// Smooth ease
const smoothEase = [0.43, 0.13, 0.23, 0.96];

// Bounce effect
const bounceConfig = {
  type: "spring",
  stiffness: 600,
  damping: 15
};
```

## 🎯 Design Tokens Export

See `design-tokens.json` for machine-readable design tokens that can be imported into design tools or used programmatically.

## 📱 PingLearn App-Specific Components

### Navigation Bar (Top Bar)
- **Height**: 64px (fixed)
- **Background**: Liquid glass with heavy blur
- **Implementation**:
```css
.nav-bar {
  height: 64px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(24px) saturate(180%) brightness(1.1);
  -webkit-backdrop-filter: blur(24px) saturate(180%) brightness(1.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.nav-item:hover {
  color: #06B6D4;
  text-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
}

.nav-item.active {
  border-bottom: 2px solid #06B6D4;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
}
```
- **Logo Position**: Left side with h-10 (40px)
- **Menu Items**: Right-aligned with 24px spacing
- **Mobile**: Hamburger menu with slide-out glass drawer

### Dashboard Components

#### Stats Cards
```css
.stats-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.1);
}

.stats-card:hover {
  backdrop-filter: blur(20px) saturate(160%);
  border-color: rgba(6, 182, 212, 0.2);
  transform: translateY(-2px) scale(1.01);
}
```
- **Grid Layout**: 1-2-3-4 columns (mobile to 2xl)

#### Progress Rings
- **Size**: 120px diameter
- **Stroke Width**: 8px
- **Background Stroke**: `rgba(255, 255, 255, 0.1)`
- **Progress Stroke**: Gradient from cyan-400 to cyan-600
- **Animation**: 1s ease-out on load

#### Activity Timeline
- **Line Color**: `rgba(6, 182, 212, 0.2)`
- **Dot Size**: 12px
- **Active Dot**: Pulsing cyan with glow
- **Card Spacing**: 16px vertical gap

### Wizard/Onboarding Components

#### Step Progress Bar
- **Height**: 4px
- **Background**: `rgba(255, 255, 255, 0.1)`
- **Active Progress**: Cyan gradient animated
- **Step Indicators**: 32px circles with numbers
- **Completed State**: Checkmark with cyan fill

#### Purpose Selector (New Step)
- **Grid Layout**: 2x2 on desktop, 1 column on mobile
- **Card Size**: min-height 180px
- **Card Background**: Glass-standard with hover to glass-prominent
- **Selected State**: Cyan border glow + gradient overlay
- **Icons**: 48px centered with glass circle background
- **Typography**:
  - Title: 20px semi-bold
  - Description: 14px with 60% opacity
- **Animation**: Scale 1.05 on hover, y: -4px lift
- **Disabled State**: 40% opacity with cursor-not-allowed
- **Coming Soon Badge**: Yellow-500 with 20% opacity background

##### Purpose Options:
1. **New Class** (BookOpen icon) - Regular tutoring mode
2. **Revision** (RefreshCw icon) - Quick review mode
3. **Exam Prep** (GraduationCap icon) - Intensive practice
4. **Memory Test** (Brain icon) - Assessment mode (feature-flagged)

#### Form Fields
- **Input Height**: 48px
- **Background**: `rgba(255, 255, 255, 0.02)`
- **Focus Border**: 2px cyan-500
- **Label Animation**: Float up on focus
- **Error State**: Red-500 border with message below

### Classroom Interface

#### Dual-Panel Layout
- **Left Panel (Chat)**: 40% width, min-width 400px
- **Right Panel (Content)**: 60% width, flex-grow
- **Divider**: 1px with drag-to-resize handle
- **Mobile**: Stacked with tab switcher

#### Message Bubbles
- **AI Messages**: Left-aligned, cyan accent border
- **User Messages**: Right-aligned, white/10 background
- **Max Width**: 80% of container
- **Padding**: 16px horizontal, 12px vertical
- **Avatar Size**: 32px with 8px margin

#### Math Rendering Area
- **Background**: `rgba(0, 0, 0, 0.4)`
- **Border**: Dashed cyan-500/30
- **Font Family**: 'KaTeX_Math' for equations
- **Min Height**: 200px
- **Padding**: 24px

### Learning History Page

#### Session Cards
- **Layout**: Masonry grid on desktop, stack on mobile
- **Thumbnail**: 16:9 aspect ratio with gradient overlay
- **Duration Badge**: Top-right with blur background
- **Date**: Bottom-left with relative time
- **Hover**: Scale(1.02) with shadow expansion

### Notes Interface

#### Editor
- **Min Height**: 400px
- **Background**: `rgba(255, 255, 255, 0.01)`
- **Toolbar**: Sticky top with blur background
- **Font**: 'Monaco' or 'Consolas' for code blocks
- **Line Height**: 1.8 for readability

#### Note Cards Grid
- **Columns**: Auto-fit, minmax(300px, 1fr)
- **Card Height**: Auto with max 400px
- **Overflow**: Fade gradient at bottom
- **Tags**: Inline pills with cyan variants

### Help Chat Widget

#### Floating Button
```css
.chat-floating-button {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);
  backdrop-filter: blur(12px);
  border-radius: 50%;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
    0 8px 32px rgba(6, 182, 212, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2);
  animation: pulse-glow 5s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 8px 32px rgba(6, 182, 212, 0.3); }
  50% { box-shadow: 0 8px 48px rgba(6, 182, 212, 0.5); }
}
```
- **Position**: Bottom-right, 24px offset
- **Icon**: 24px help outline
- **Badge**: Red dot for unread messages

#### Chat Window
```css
.chat-window {
  width: 380px;
  max-height: 600px;
  background: rgba(17, 17, 17, 0.85);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
    0 16px 64px rgba(0, 0, 0, 0.3);
}

.chat-header {
  height: 56px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px 20px 0 0;
}
```
- **Position**: Above floating button
- **Animation**: Slide up with fade
- **Input Area**: Bottom-fixed with attachment button

### Loading States

#### Skeleton Screens
- **Background**: Shimmer animation
- **Base Color**: `rgba(255, 255, 255, 0.05)`
- **Highlight**: `rgba(255, 255, 255, 0.1)`
- **Animation Duration**: 1.5s infinite

#### Spinners
- **Size Variants**: sm(16px), md(24px), lg(32px), xl(48px)
- **Border Width**: 2-4px based on size
- **Color**: Cyan-500 with transparent sides
- **Animation**: 0.75s linear infinite rotation

### Empty States

#### Illustrations
- **Size**: 200px height
- **Style**: Geometric line art with cyan accent
- **Opacity**: 0.6 for subtlety
- **Animation**: Gentle float on hover

#### Messages
- **Title**: text-xl, white/80
- **Description**: text-base, white/50
- **CTA Button**: Primary style with icon

### Toast Notifications

- **Position**: Top-right, 24px offset
- **Width**: 360px max
- **Padding**: 16px
- **Animation**: Slide in from right
- **Auto-dismiss**: 5s default
- **Types**: Success (green), Error (red), Info (cyan), Warning (yellow)

### Modal Overlays

```css
.modal-backdrop {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.modal-content {
  background: rgba(17, 17, 17, 0.8);
  backdrop-filter: blur(32px) saturate(200%) brightness(1.1);
  -webkit-backdrop-filter: blur(32px) saturate(200%) brightness(1.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  box-shadow:
    inset 0 2px 0 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 0 rgba(255, 255, 255, 0.05),
    0 24px 80px rgba(0, 0, 0, 0.4);
}
```
- **Content Max Width**: 600px (default), 900px (large)
- **Animation**: Fade backdrop, scale content
- **Close Button**: Top-right, 16px offset

---

**Last Updated**: September 23, 2025
**Version**: 2.0.0
**Maintainer**: PingLearn Design Team